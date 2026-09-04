import { Meteor } from 'meteor/meteor';
import { Rounds } from './RoundsCollection';

// Mobile: player's round — includes answer (for camera detection) but not the letter reward
Meteor.publish('rounds.forPlayer', function (playerId, roundNumber) {
  return Rounds.find(
    { playerId, roundNumber },
    { fields: { letter: 0, hint: 0 } }
  );
});

// Mobile: just enough of the team's rounds to show who is still scanning.
Meteor.publish('rounds.progress', function (gameId, roundNumber) {
  return Rounds.find(
    { gameId, roundNumber },
    { fields: { gameId: 1, playerId: 1, roundNumber: 1, status: 1 } }
  );
});

// Host: all rounds for the game (for progress screen)
Meteor.publish('rounds.forGame', function (gameId) {
  return Rounds.find(
    { gameId },
    { fields: { answer: 0 } }
  );
});
