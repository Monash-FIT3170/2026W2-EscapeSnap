import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';

Meteor.publish('games.current', function (gameId) {
  return Games.find({ _id: gameId });
});
