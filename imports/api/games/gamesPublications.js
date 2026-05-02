import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';

Meteor.publish('games.current', function (status) {
  return Games.find({ status: status });
});
