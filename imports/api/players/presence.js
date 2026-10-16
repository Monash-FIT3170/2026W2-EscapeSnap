import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import {
  PRESENCE_GRACE_MS,
  advanceIfRoundSettled,
  resolvePendingRounds,
} from '../rounds/roundProgression';

export const RECONNECT_WINDOW_MS = 3 * 60 * 1000;

export function reconnectExpired(player, now = Date.now()) {
  return (
    !!player?.disconnectedAt &&
    now - player.disconnectedAt.getTime() >= RECONNECT_WINDOW_MS
  );
}

// Takes a player out of their game, for good: a lobby frees their slot, a
// game in progress forfeits their remaining rounds so the team never waits
// on them. Used when the reconnect window runs out and when they leave.
export async function dropPlayer(player) {
  const game = await Games.findOneAsync(player.gameId);
  if (game?.status === 'lobby') {
    await Players.removeAsync({
      _id: player._id,
      connectionId: player.connectionId,
    });
  } else if (game?.status === 'in_progress') {
    if (await resolvePendingRounds({ playerId: player._id })) {
      await advanceIfRoundSettled(game._id, game.currentRound);
    }
  }
}

export async function findReconnectablePlayer(playerId) {
  const player =
    typeof playerId === 'string' && (await Players.findOneAsync(playerId));
  if (!player) throw new Meteor.Error('not-found', 'Player not found');
  if (reconnectExpired(player)) {
    await dropPlayer(player);
    throw new Meteor.Error('expired', 'Reconnect window has closed');
  }
  return player;
}

async function markDisconnected(playerId, connectionId) {
  const marked = await Players.updateAsync(
    { _id: playerId, connectionId },
    { $set: { disconnectedAt: new Date() } }
  );
  if (!marked) return;

  // After the grace period the team stops waiting on this player (see
  // advanceIfRoundSettled), so re-check whether their round can now move on.
  Meteor.setTimeout(async () => {
    try {
      const player = await Players.findOneAsync(playerId);
      const game = player && (await Games.findOneAsync(player.gameId));
      if (game) await advanceIfRoundSettled(game._id, game.currentRound);
    } catch (err) {
      console.error('[presence] grace re-check failed:', err);
    }
  }, PRESENCE_GRACE_MS + 1000);

  // After the reconnect window the player can no longer rejoin.
  Meteor.setTimeout(async () => {
    try {
      const player = await Players.findOneAsync({
        _id: playerId,
        connectionId,
        disconnectedAt: { $exists: true },
      });
      if (player) await dropPlayer(player);
    } catch (err) {
      console.error('[presence] expiry failed:', err);
    }
  }, RECONNECT_WINDOW_MS);
}

// Binds the player to the DDP connection they are playing on.
export async function attachPlayer(playerId, connection) {
  const connectionId = connection.id;
  await Players.updateAsync(playerId, {
    $set: { connectionId },
    $unset: { disconnectedAt: '' },
  });
  connection.onClose(() => {
    markDisconnected(playerId, connectionId).catch((err) =>
      console.error('[presence] markDisconnected failed:', err)
    );
  });
}
