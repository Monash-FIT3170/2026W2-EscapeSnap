import { Meteor } from 'meteor/meteor';
import { GameResults } from './GameResultsCollection';

Meteor.publish('gameResults.forGame', function (gameId) {
  return GameResults.find({ gameId });
});

Meteor.publish('gameResults.forPlayer', function (playerId) {
  return GameResults.find({ playerId });
});
