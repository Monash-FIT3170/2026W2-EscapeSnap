import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { attachPlayer, detachPlayer, findOwnedPlayer } from './presence';

// The token is the only thing that proves who a phone is playing as.
const HIDDEN_FIELDS = { sessionToken: 0, connectionId: 0 };

// Host uses this to see all players in the lobby and progress screen
Meteor.publish('players.inGame', function (gameId) {
  return Players.find({ gameId }, { fields: HIDDEN_FIELDS });
});

// Mobile player uses this to subscribe to their own data only. Holding it open
// is also what tells the server the player is still here: when it stops — the
// connection dropped or the phone left — the reconnect window starts.
Meteor.publish('player.self', async function (playerId, sessionToken) {
  const player = await findOwnedPlayer(playerId, sessionToken);
  if (this.connection) {
    const connectionId = this.connection.id;
    await attachPlayer(player, connectionId);
    this.onStop(() => {
      detachPlayer(playerId, connectionId).catch((err) =>
        console.error('[presence] detach failed:', err)
      );
    });
  }
  return Players.find({ _id: playerId }, { fields: HIDDEN_FIELDS });
});
