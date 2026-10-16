import { Meteor } from 'meteor/meteor';
import { Rounds } from './RoundsCollection';

// Mobile: player's round — includes answer (for camera detection) but not the letter reward.
// Also any rounds they are covering for a teammate who left the game.
Meteor.publish('rounds.forPlayer', function (playerId, roundNumber) {
  return Rounds.find(
    { roundNumber, $or: [{ playerId }, { coveredBy: playerId }] },
    { fields: { letter: 0, hint: 0 } }
  );
});

// Mobile: just enough of the team's rounds to show who is still scanning.
Meteor.publish('rounds.progress', function (gameId, roundNumber) {
  return Rounds.find(
    { gameId, roundNumber },
    {
      fields: {
        gameId: 1,
        playerId: 1,
        roundNumber: 1,
        status: 1,
        coveredBy: 1,
      },
    }
  );
});

// Host: all rounds for the game (for progress screen)
Meteor.publish('rounds.forGame', function (gameId) {
  return Rounds.find(
    { gameId },
    { fields: { answer: 0 } }
  );
});
