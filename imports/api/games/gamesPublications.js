import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';

Meteor.publish('games.current', function (gameId) {
  return Games.find({ _id: gameId }, { fields: { 'finalRiddle.answer': 0 } });
});

Meteor.publish('games.byJoinCode', function (joinCode) {
  return Games.find({ joinCode, status: 'lobby' }, { fields: { 'finalRiddle.answer': 0 } });
});

Meteor.publish('games.leaderboard', function () {
  return Games.find(
    { status: 'won', groupName: { $exists: true } },
    { fields: { groupName: 1, status: 1, difficulty: 1, startedAt: 1, endedAt: 1 } }
  );
});