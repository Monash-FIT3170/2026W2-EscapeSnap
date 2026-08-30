import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';

// Excludes the final answer and the whole pre-generated round pool — both
// contain answers players shouldn't see before they're revealed.
const HIDDEN_FIELDS = { 'finalRiddle.answer': 0, pregeneratedRoundRiddles: 0 };

Meteor.publish('games.current', function (gameId) {
  return Games.find({ _id: gameId }, { fields: HIDDEN_FIELDS });
});

Meteor.publish('games.byJoinCode', function (joinCode) {
  return Games.find({ joinCode, status: 'lobby' }, { fields: HIDDEN_FIELDS });
});

Meteor.publish('games.leaderboard', function () {
  return Games.find(
    { status: 'won', groupName: { $exists: true } },
    {
      fields: {
        groupName: 1,
        status: 1,
        difficulty: 1,
        startedAt: 1,
        endedAt: 1,
      },
    }
  );
});
