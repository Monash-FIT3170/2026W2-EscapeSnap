import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import {
  PRESENCE_GRACE_MS,
  advanceIfRoundSettled,
} from '../rounds/roundProgression';

// Host uses this to see all players in the lobby and progress screen
Meteor.publish('players.inGame', function (gameId) {
  return Players.find({ gameId });
});

// Mobile player uses this to subscribe to their own data only
Meteor.publish('player.self', function (playerId) {
  return Players.find({ _id: playerId });
});

async function markDisconnected(playerId, connectionId) {
  const marked = await Players.updateAsync(
    { _id: playerId, connectionId },
    { $set: { disconnectedAt: new Date() } }
  );
  if (!marked) return;

  Meteor.setTimeout(async () => {
    try {
      const player = await Players.findOneAsync(playerId);
      const game = player && (await Games.findOneAsync(player.gameId));
      if (game) await advanceIfRoundSettled(game._id, game.currentRound);
    } catch (err) {
      console.error('[players.presence] grace re-check failed:', err);
    }
  }, PRESENCE_GRACE_MS + 1000);
}

Meteor.publish('players.presence', async function (playerId) {
  if (typeof playerId !== 'string') return this.ready();

  const connectionId = this.connection.id;
  await Players.updateAsync(playerId, {
    $set: { connectionId },
    $unset: { disconnectedAt: '' },
  });

  this.onStop(() => {
    markDisconnected(playerId, connectionId).catch((err) =>
      console.error('[players.presence] failed to mark disconnect:', err)
    );
  });
  this.ready();
});
