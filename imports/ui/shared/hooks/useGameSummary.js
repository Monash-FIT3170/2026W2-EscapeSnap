import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '/imports/api/games/GamesCollection';
import { Players } from '/imports/api/players/PlayersCollection';
import { Rounds } from '/imports/api/rounds/RoundsCollection';
import { Submissions, PHOTO_TTL_MS } from '/imports/api/submissions/SubmissionsCollection';
import { gameBudgetMs } from '/imports/lib/gameClock';

const ENDED = ['won', 'lost'];

function toMs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

// null rather than 0 when there is nothing to divide by, so the UI can print
// a dash instead of a misleading 0%.
function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function durationOf(round) {
  const started = toMs(round.startedAt);
  const submitted = toMs(round.submittedAt);
  if (started === null || submitted === null) return null;
  const ms = submitted - started;
  return ms >= 0 ? ms : null;
}

function totalTimeFor(game, rounds) {
  const started = toMs(game.startedAt);
  if (started === null) return { totalTimeMs: null, approximate: false };

  let totalTimeMs = null;
  let approximate = false;

  const ended = toMs(game.endedAt);
  if (ended !== null) {
    totalTimeMs = ended - started;
  } else {
    // A game that ran out of time never gets endedAt, so fall back to the last
    // thing that happened in it.
    const submissions = rounds.map(toSubmittedMs).filter((ms) => ms !== null);
    if (submissions.length > 0) {
      totalTimeMs = Math.max(...submissions) - started;
      approximate = true;
    }
  }

  if (totalTimeMs === null) return { totalTimeMs: null, approximate: false };

  // Never report longer than the game was ever allowed to run — hint penalties
  // included, since they shortened that allowance.
  const limitMs = gameBudgetMs(game);
  const capped = limitMs > 0 ? Math.min(totalTimeMs, limitMs) : totalTimeMs;
  return { totalTimeMs: Math.max(0, capped), approximate };
}

function toSubmittedMs(round) {
  return toMs(round.submittedAt);
}

export function deriveSummary({ game, players, rounds, submissions, now = Date.now() }) {
  const empty = {
    outcome: null,
    team: null,
    players: [],
    photos: [],
  };
  if (!game) return empty;

  const attemptsByRound = new Map();
  const photosByPlayer = new Map();
  for (const sub of submissions) {
    attemptsByRound.set(sub.roundId, (attemptsByRound.get(sub.roundId) ?? 0) + 1);
    photosByPlayer.set(sub.playerId, (photosByPlayer.get(sub.playerId) ?? 0) + 1);
  }

  const nameById = new Map(players.map((p) => [p._id, p.name]));

  const playerStats = players.map((player) => {
    const own = rounds
      .filter((r) => r.playerId === player._id)
      .sort((a, b) => a.roundNumber - b.roundNumber);

    const perRound = own.map((round) => ({
      roundId: round._id,
      roundNumber: round.roundNumber,
      status: round.status,
      riddleText: round.riddleText,
      answer: round.answer ?? null,
      letter: round.letter ?? null,
      durationMs: durationOf(round),
      attempts: attemptsByRound.get(round._id) ?? 0,
      startedAt: round.startedAt ?? null,
      submittedAt: round.submittedAt ?? null,
    }));

    const correct = perRound.filter((r) => r.status === 'correct').length;
    // 'timeout' is a distinct status but counts as a miss for scoring.
    const incorrect = perRound.filter((r) => r.status === 'wrong' || r.status === 'timeout').length;
    const unattempted = perRound.filter((r) => r.status === 'pending').length;
    const timed = perRound.map((r) => r.durationMs).filter((ms) => ms !== null);

    return {
      playerId: player._id,
      name: player.name,
      correct,
      incorrect,
      unattempted,
      attempted: correct + incorrect,
      accuracy: ratio(correct, correct + incorrect),
      photoCount: photosByPlayer.get(player._id) ?? 0,
      avgRoundMs: mean(timed),
      fastestRoundMs: timed.length > 0 ? Math.min(...timed) : null,
      slowestRoundMs: timed.length > 0 ? Math.max(...timed) : null,
      untimedRounds: perRound.length - timed.length,
      rounds: perRound,
    };
  });

  const correct = playerStats.reduce((sum, p) => sum + p.correct, 0);
  const incorrect = playerStats.reduce((sum, p) => sum + p.incorrect, 0);
  const unattempted = playerStats.reduce((sum, p) => sum + p.unattempted, 0);
  const { totalTimeMs, approximate } = totalTimeFor(game, rounds);

  // Once the TTL has swept the photos the stats still render, so the gallery
  // needs to tell "expired" apart from "never had any".
  const reference = toMs(game.endedAt) ?? toMs(game.startedAt);
  const pastTtl = reference !== null && now - reference > PHOTO_TTL_MS;

  const photos = submissions
    .map((sub) => ({ ...sub, playerName: nameById.get(sub.playerId) ?? 'UNKNOWN' }))
    .sort(
      (a, b) =>
        a.roundNumber - b.roundNumber ||
        String(a.playerName).localeCompare(String(b.playerName)) ||
        a.attemptNumber - b.attemptNumber
    );

  return {
    outcome: game.status === 'won' || game.status === 'lost' ? game.status : null,
    team: {
      totalTimeMs,
      totalTimeApproximate: approximate,
      timeLimitMs: gameBudgetMs(game),
      hintPenaltyMs: game.timePenaltyMs ?? 0,
      roundsSolved: correct,
      roundsDealt: rounds.length,
      correct,
      incorrect,
      unattempted,
      accuracy: ratio(correct, correct + incorrect),
      totalPhotos: submissions.length,
      photosExpired: submissions.length === 0 && pastTtl,
      finalRiddleAttempts: game.finalRiddleAttempts ?? 0,
      playerCount: players.length,
      totalRounds: game.totalRounds ?? 0,
    },
    players: playerStats,
    photos,
  };
}

export function useGameSummary(gameId) {
  return useTracker(() => {
    const subs = [
      Meteor.subscribe('games.current', gameId),
      Meteor.subscribe('players.inGame', gameId),
      Meteor.subscribe('games.summary', gameId),
    ];
    const loading = subs.some((s) => !s.ready());

    const game = Games.findOne(gameId);
    const ended = !!game && ENDED.includes(game.status);

    if (loading || !game) {
      return {
        loading,
        gameFound: !!game,
        ended: false,
        outcome: null,
        team: null,
        players: [],
        photos: [],
      };
    }

    const derived = deriveSummary({
      game,
      players: Players.find({ gameId }, { sort: { joinedAt: 1 } }).fetch(),
      // The summary publication only sends these once the game has ended.
      rounds: ended ? Rounds.find({ gameId }).fetch() : [],
      submissions: ended ? Submissions.find({ gameId }).fetch() : [],
    });

    return { loading: false, gameFound: true, ended, ...derived };
  }, [gameId]);
}
