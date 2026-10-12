import { Meteor } from 'meteor/meteor';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { Matches } from '../matches/MatchesCollection';
import { assertAdmin } from './adminAuth';

// Operational fields only — still no riddles, answers or letters, so an
// admin screen left open on a projector gives nothing away.
const GAME_FIELDS = {
  joinCode: 1,
  groupName: 1,
  status: 1,
  mode: 1,
  matchId: 1,
  matchmakingSince: 1,
  capacity: 1,
  currentRound: 1,
  totalRounds: 1,
  timerMinutes: 1,
  timePenaltyMs: 1,
  finalRiddleAttempts: 1,
  difficulty: 1,
  theme: 1,
  riddlesReady: 1,
  createdAt: 1,
  startedAt: 1,
};

// A lobby nobody started is never cleaned up, so past this age it counts as
// abandoned rather than running. The page applies the same cut-off live.
export const LOBBY_MAX_AGE_MS = 60 * 60 * 1000;

// Games being played right now, plus the matches tying them together. Started
// games drop out on their own: the expiry sweep ends them when time runs out.
Meteor.publish('admin.liveGames', function (adminKey) {
  assertAdmin(adminKey);
  const lobbyCutoff = new Date(Date.now() - LOBBY_MAX_AGE_MS);
  return [
    Games.find(
      {
        $or: [
          { status: { $in: ['in_progress', 'final_riddle'] } },
          { status: 'lobby', createdAt: { $gte: lobbyCutoff } },
        ],
      },
      { fields: GAME_FIELDS }
    ),
    Matches.find({
      $or: [
        { status: 'in_progress' },
        { status: 'lobby', createdAt: { $gte: lobbyCutoff } },
      ],
    }),
  ];
});

// Players and round progress for the games the page is showing. The client
// resubscribes as games come and go, since Meteor has no reactive joins.
Meteor.publish('admin.gameDetails', function (adminKey, gameIds) {
  assertAdmin(adminKey);
  if (
    !Array.isArray(gameIds) ||
    !gameIds.every((id) => typeof id === 'string')
  ) {
    throw new Meteor.Error('invalid-argument', 'gameIds must be a list of ids');
  }
  const gameId = { $in: gameIds };
  return [
    Players.find(
      { gameId },
      {
        fields: {
          gameId: 1,
          name: 1,
          joinedAt: 1,
          disconnectedAt: 1,
          leftAt: 1,
        },
      }
    ),
    Rounds.find(
      { gameId },
      {
        fields: {
          gameId: 1,
          playerId: 1,
          roundNumber: 1,
          status: 1,
          hintRevealedAt: 1,
          coveredBy: 1,
        },
      }
    ),
  ];
});
