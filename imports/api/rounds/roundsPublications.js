import { Meteor } from 'meteor/meteor';
import { Rounds } from './RoundsCollection';

// Mobile: player's round for the current round number
Meteor.publish('rounds.forPlayer', function (playerId, roundNumber) {
  return Rounds.find(
    { playerId, roundNumber },
    { fields: { answer: 0 } }
  );
});

// Host: all rounds for the game (for progress screen)
Meteor.publish('rounds.forGame', function (gameId) {
  return Rounds.find(
    { gameId },
    { fields: { answer: 0 } }
  );
});
