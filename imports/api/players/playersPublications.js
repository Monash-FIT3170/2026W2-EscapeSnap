import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';

// Host uses this to see all players in the lobby and progress screen
Meteor.publish('players.inGame', function (gameId) {
  return Players.find({ gameId });
});

// Mobile player uses this to subscribe to their own data only
Meteor.publish('player.self', function (playerId) {
  return Players.find({ _id: playerId });
});
