import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import {
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

async function expirePlayer(player) {
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
    await expirePlayer(player);
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

  Meteor.setTimeout(async () => {
    try {
      const player = await Players.findOneAsync({
        _id: playerId,
        connectionId,
        disconnectedAt: { $exists: true },
      });
      if (player) await expirePlayer(player);
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
