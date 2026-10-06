import { Meteor } from 'meteor/meteor';
import { Matches } from './MatchesCollection';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';

// Enough of every team to draw a scoreboard — never riddles, answers, letters
// or hints, because rival phones subscribe to this too.
const TEAM_FIELDS = {
  joinCode: 1,
  groupName: 1,
  status: 1,
  mode: 1,
  matchId: 1,
  capacity: 1,
  currentRound: 1,
  totalRounds: 1,
  timerMinutes: 1,
  timePenaltyMs: 1,
  difficulty: 1,
  riddlesReady: 1,
  startedAt: 1,
  endedAt: 1,
};

// A match's teams are fixed at creation, so resolving gameIds once is enough.
Meteor.publish('matches.byId', async function (matchId) {
  if (typeof matchId !== 'string') return this.ready();
  const match = await Matches.findOneAsync(matchId);
  if (!match) return this.ready();

  const gameId = { $in: match.gameIds };
  return [
    Matches.find({ _id: matchId }),
    Games.find({ _id: gameId }, { fields: TEAM_FIELDS }),
    Players.find({ gameId }, { fields: { gameId: 1, name: 1, joinedAt: 1 } }),
    Rounds.find(
      { gameId },
      { fields: { gameId: 1, playerId: 1, roundNumber: 1, status: 1 } }
    ),
  ];
});
