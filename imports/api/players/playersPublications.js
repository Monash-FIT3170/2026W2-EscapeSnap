import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { attachPlayer, findReconnectablePlayer } from './presence';

// Host uses this to see all players in the lobby and progress screen
Meteor.publish('players.inGame', function (gameId) {
  return Players.find({ gameId });
});

// Mobile player uses this to subscribe to their own data only. It also tracks
// which connection the player is on, so a dropped player can reconnect.
Meteor.publish('player.self', async function (playerId) {
  await findReconnectablePlayer(playerId);
  if (this.connection) await attachPlayer(playerId, this.connection);
  return Players.find({ _id: playerId });
});
