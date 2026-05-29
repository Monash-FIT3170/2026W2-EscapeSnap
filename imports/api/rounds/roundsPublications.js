import { Meteor } from 'meteor/meteor';
import { Rounds } from './RoundsCollection';

// Mobile: player's round — includes answer (for camera detection) but not the letter reward
Meteor.publish('rounds.forPlayer', function (playerId, roundNumber) {
  return Rounds.find(
    { playerId, roundNumber },
    { fields: { letter: 0 } }
  );
});

// Host: all rounds for the game (for progress screen)
Meteor.publish('rounds.forGame', function (gameId) {
  return Rounds.find(
    { gameId },
    { fields: { answer: 0 } }
  );
});
