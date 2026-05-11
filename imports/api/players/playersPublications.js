import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';

Meteor.publish('players.inGame', function (gameId) {
  return Players.find({ gameId });
});
