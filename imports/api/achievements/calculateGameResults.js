import { BADGE_IDS } from './badgeDefinitions.js';

function toTimestamp(value) {
  if (!value) return null;
  const timestamp =
    value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getSolveDuration(round) {
  if (Number.isFinite(round.solveDurationMs) && round.solveDurationMs >= 0) {
    return round.solveDurationMs;
  }

  const startedAt = toTimestamp(round.startedAt);
  const submittedAt = toTimestamp(round.submittedAt);
  if (startedAt === null || submittedAt === null || submittedAt < startedAt)
    return null;

  return submittedAt - startedAt;
}

function addBadge(result, id, metricValue) {
  const badge = { id };
  if (Number.isFinite(metricValue)) badge.metricValue = Math.round(metricValue);
  result.badges.push(badge);
}

function buildPlayerResult({ game, player, rounds, outcome, generatedAt }) {
  const playerRounds = rounds.filter((round) => round.playerId === player._id);
  const correctRounds = playerRounds.filter(
    (round) => round.status === 'correct'
  );
  const solveDurations = correctRounds
    .map(getSolveDuration)
    .filter(Number.isFinite);
  const submittedCorrectTimes = correctRounds
    .map((round) => toTimestamp(round.submittedAt))
    .filter(Number.isFinite);
  const totalRounds = game.totalRounds ?? playerRounds.length;
  const correctCount = correctRounds.length;
  const stats = {
    correctCount,
    wrongCount: playerRounds.filter((round) => round.status === 'wrong').length,
    timeoutCount: playerRounds.filter((round) => round.status === 'timeout')
      .length,
    completedCount: playerRounds.filter((round) => round.status !== 'pending')
      .length,
    totalRounds,
    accuracyPercent:
      totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 0,
  };

  if (solveDurations.length > 0) {
    stats.fastestSolveMs = Math.min(...solveDurations);
    stats.averageSolveMs = Math.round(
      solveDurations.reduce((sum, duration) => sum + duration, 0) /
        solveDurations.length
    );
  }

  return {
    gameId: game._id,
    playerId: player._id,
    playerName: player.name,
    outcome,
    rank: 1,
    stats,
    badges: [],
    generatedAt,
    firstCorrectAt:
      submittedCorrectTimes.length > 0
        ? Math.min(...submittedCorrectTimes)
        : null,
    clutchRemainingMs: null,
  };
}

function compareResults(left, right) {
  if (left.stats.correctCount !== right.stats.correctCount) {
    return right.stats.correctCount - left.stats.correctCount;
  }
  if (left.stats.accuracyPercent !== right.stats.accuracyPercent) {
    return right.stats.accuracyPercent - left.stats.accuracyPercent;
  }

  const leftAverage = left.stats.averageSolveMs ?? Number.POSITIVE_INFINITY;
  const rightAverage = right.stats.averageSolveMs ?? Number.POSITIVE_INFINITY;
  if (leftAverage !== rightAverage) return leftAverage - rightAverage;

  return left.playerName.localeCompare(right.playerName);
}

function hasSameRank(left, right) {
  return (
    left.stats.correctCount === right.stats.correctCount &&
    left.stats.accuracyPercent === right.stats.accuracyPercent &&
    (left.stats.averageSolveMs ?? null) === (right.stats.averageSolveMs ?? null)
  );
}

export function calculateGameResults({
  game,
  players,
  rounds,
  outcome,
  generatedAt,
}) {
  const results = players.map((player) =>
    buildPlayerResult({ game, player, rounds, outcome, generatedAt })
  );

  results.forEach((result) => {
    addBadge(result, BADGE_IDS.FIELD_OPERATIVE, result.stats.completedCount);
  });

  const timedResults = results.filter((result) =>
    Number.isFinite(result.stats.fastestSolveMs)
  );
  if (timedResults.length > 0) {
    const fastestSolve = Math.min(
      ...timedResults.map((result) => result.stats.fastestSolveMs)
    );
    timedResults
      .filter((result) => result.stats.fastestSolveMs === fastestSolve)
      .forEach((result) =>
        addBadge(result, BADGE_IDS.LIGHTNING_SOLVER, fastestSolve)
      );
  }

  const mostCorrect = Math.max(
    0,
    ...results.map((result) => result.stats.correctCount)
  );
  if (mostCorrect > 0) {
    results
      .filter((result) => result.stats.correctCount === mostCorrect)
      .forEach((result) =>
        addBadge(result, BADGE_IDS.RIDDLE_MASTER, mostCorrect)
      );
  }

  results
    .filter(
      (result) =>
        result.stats.totalRounds > 0 &&
        result.stats.correctCount === result.stats.totalRounds &&
        result.stats.wrongCount === 0 &&
        result.stats.timeoutCount === 0
    )
    .forEach((result) => addBadge(result, BADGE_IDS.FLAWLESS_AGENT, 100));

  const firstCorrectAt = Math.min(
    ...results.map((result) => result.firstCorrectAt).filter(Number.isFinite)
  );
  const gameStartedAt = toTimestamp(game.startedAt);
  if (Number.isFinite(firstCorrectAt)) {
    results
      .filter((result) => result.firstCorrectAt === firstCorrectAt)
      .forEach((result) => {
        const elapsed =
          gameStartedAt === null
            ? null
            : Math.max(0, firstCorrectAt - gameStartedAt);
        addBadge(result, BADGE_IDS.FIRST_BREAKTHROUGH, elapsed);
      });
  }

  const timerDurationMs = (game.timerMinutes ?? 0) * 60 * 1000;
  const timerEndsAt =
    gameStartedAt === null ? null : gameStartedAt + timerDurationMs;
  const clutchWindowMs = timerDurationMs * 0.1;
  if (timerEndsAt !== null && clutchWindowMs > 0) {
    results.forEach((result) => {
      const qualifyingTimes = rounds
        .filter(
          (round) =>
            round.playerId === result.playerId && round.status === 'correct'
        )
        .map((round) => toTimestamp(round.submittedAt))
        .filter(Number.isFinite)
        .map((submittedAt) => timerEndsAt - submittedAt)
        .filter(
          (remainingMs) => remainingMs >= 0 && remainingMs <= clutchWindowMs
        );

      if (qualifyingTimes.length > 0) {
        result.clutchRemainingMs = Math.min(...qualifyingTimes);
        addBadge(result, BADGE_IDS.CLUTCH_SPECIALIST, result.clutchRemainingMs);
      }
    });
  }

  results.sort(compareResults);
  results.forEach((result, index) => {
    result.rank =
      index > 0 && hasSameRank(result, results[index - 1])
        ? results[index - 1].rank
        : index + 1;
    delete result.firstCorrectAt;
    delete result.clutchRemainingMs;
  });

  return results;
}
