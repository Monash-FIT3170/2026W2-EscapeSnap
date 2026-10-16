import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { attachPlayer, findReconnectablePlayer } from './presence';

// Which connection a player is on, and their session secret's hash, are the
// server's business only.
const PRIVATE_FIELDS = { fields: { connectionId: 0, sessionTokenHash: 0 } };

// Host uses this to see all players in the lobby and progress screen
Meteor.publish('players.inGame', function (gameId) {
  return Players.find({ gameId }, PRIVATE_FIELDS);
});

// Mobile player uses this to subscribe to their own data only. It also tracks
// which connection the player is on (see presence.js), so the team stops
// waiting on a dropped player and the player can reconnect.
// Needs the session token from players.join: anyone who could bind a player
// to their own connection could mark them offline or make them leave.
Meteor.publish('player.self', async function (playerId, sessionToken) {
  await findReconnectablePlayer(playerId, sessionToken);
  if (this.connection) await attachPlayer(playerId, this.connection);
  return Players.find({ _id: playerId }, PRIVATE_FIELDS);
});
