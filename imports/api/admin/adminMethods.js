import { Meteor } from 'meteor/meteor';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Matches } from '../matches/MatchesCollection';
import { endGame } from '../games/gameLifecycle';
import { playerLeft } from '../players/presence';
import { leaveMatchmaking, settleMatchIfOver } from '../matches/matchService';
import { assertAdmin } from './adminAuth';

function assertId(value, name) {
  if (typeof value !== 'string' || !value) {
    throw new Meteor.Error('invalid-argument', `${name} is required`);
  }
}

// Drops the phone's live connection. Without its token the phone can't
// subscribe as the player again, so it lands back on the join screen.
function disconnect(connectionId) {
  if (!connectionId) return;
  try {
    Meteor.server.sessions.get(connectionId)?.connectionHandle.close();
  } catch (err) {
    console.error(`[admin] closing connection ${connectionId} failed:`, err);
  }
}

// Removes a player for good. Clearing the token is what makes it stick: a
// plain leave can be undone by reconnecting, a kick can't.
export async function kickPlayer(player) {
  await Players.updateAsync(player._id, { $unset: { sessionToken: '' } });
  await playerLeft(player);
  disconnect(player.connectionId);
}

export async function forceEndGame(game, endedAt = new Date()) {
  if (game.status === 'in_progress') {
    // Players see the normal "you lost" screen; results are recorded as usual.
    if (!(await endGame(game._id, 'lost', endedAt))) return false;
    if (game.matchId) await settleMatchIfOver(game.matchId, endedAt);
    return true;
  }

  if (game.status === 'lobby') {
    await leaveMatchmaking(game._id);
    const closed = await Games.updateAsync(
      { _id: game._id, status: 'lobby' },
      { $set: { status: 'lost', endedAt } }
    );
    if (closed === 0) return false;
    if (game.matchId) {
      await Matches.updateAsync(
        { _id: game.matchId, status: 'lobby' },
        { $set: { status: 'finished', endedAt } }
      );
    }
    // A lobby has no end screen, so send everyone back to the join screen.
    const players = await Players.find({ gameId: game._id }).fetchAsync();
    for (const player of players) await kickPlayer(player);
    return true;
  }

  return false;
}

Meteor.methods({
  async 'admin.endGame'(adminKey, gameId) {
    assertAdmin(adminKey);
    assertId(gameId, 'gameId');
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (!(await forceEndGame(game))) {
      throw new Meteor.Error('invalid-state', 'Game has already ended');
    }
    console.log(`[admin] ended game ${gameId} (${game.groupName})`);
  },

  async 'admin.kickPlayer'(adminKey, playerId) {
    assertAdmin(adminKey);
    assertId(playerId, 'playerId');
    const player = await Players.findOneAsync(playerId);
    if (!player) throw new Meteor.Error('not-found', 'Player not found');
    if (player.leftAt)
      throw new Meteor.Error('invalid-state', 'Player already left');
    await kickPlayer(player);
    console.log(
      `[admin] kicked ${player.name} (${playerId}) from game ${player.gameId}`
    );
  },
});
