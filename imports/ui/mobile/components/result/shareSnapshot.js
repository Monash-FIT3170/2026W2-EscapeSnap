const DIFFICULTY_MULTIPLIER = {
  easy: 1,
  medium: 1.15,
  hard: 1.3,
};

function asTime(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPlayerStats({ game, player, rounds }) {
  const ownRounds = rounds
    .filter((round) => round.playerId === player._id)
    .sort((a, b) => a.roundNumber - b.roundNumber);
  const correct = ownRounds.filter(
    (round) => round.status === 'correct'
  ).length;
  const missed = ownRounds.filter((round) =>
    ['wrong', 'timeout'].includes(round.status)
  ).length;
  const submittedTimes = ownRounds
    .map((round) => asTime(round.submittedAt))
    .filter((timestamp) => timestamp !== null);
  const completedAt =
    submittedTimes.length > 0 ? Math.max(...submittedTimes) : null;
  const totalRounds = Math.max(game.totalRounds ?? 0, ownRounds.length);
  const accuracy =
    totalRounds > 0 ? Math.round((correct / totalRounds) * 100) : 0;

  return {
    playerId: player._id,
    name: player.name,
    correct,
    missed,
    totalRounds,
    accuracy,
    completedAt,
    joinedAt: asTime(player.joinedAt),
    revealedLetters: Array.from({ length: totalRounds }, (_, index) => {
      const letter = player.revealedLetters?.[index];
      return letter && letter !== '?' ? letter : '?';
    }),
  };
}

export function calculateMissionScore({
  outcome,
  correct,
  totalRounds,
  missed,
  timeRemainingSeconds,
  difficulty,
  finalRiddleMisses,
}) {
  const objectivePoints = correct * 900;
  const evidenceBonus =
    totalRounds > 0 ? Math.round((correct / totalRounds) * 800) : 0;
  const escapeBonus = outcome === 'won' ? 1800 : 0;
  const timeBonus =
    outcome === 'won'
      ? clamp(Math.floor(timeRemainingSeconds) * 3, 0, 1500)
      : 0;
  const penalties = missed * 180 + finalRiddleMisses * 250;
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1;
  const total = Math.max(
    0,
    Math.round(
      ((objectivePoints + evidenceBonus + escapeBonus + timeBonus - penalties) *
        multiplier) /
        10
    ) * 10
  );

  return {
    total,
    objectivePoints,
    evidenceBonus,
    escapeBonus,
    timeBonus,
    penalties,
    multiplier,
  };
}

export function buildEndgameShareSnapshot({
  game,
  playerId,
  playerName,
  players = [],
  rounds = [],
  leaderboardEntry = null,
}) {
  if (!game) return null;

  const startedAt = asTime(game.startedAt);
  const endedAt = asTime(game.endedAt);
  const timeLimitSeconds = (game.timerMinutes ?? 0) * 60;
  const timeUsedSeconds =
    startedAt === null || endedAt === null
      ? null
      : clamp(Math.round((endedAt - startedAt) / 1000), 0, timeLimitSeconds);
  const timeRemainingSeconds = Math.max(
    0,
    timeLimitSeconds - (timeUsedSeconds ?? timeLimitSeconds)
  );
  const finalRiddleMisses = game.finalRiddleAttempts ?? 0;

  const currentPlayer = players.find((player) => player._id === playerId) ?? {
    _id: playerId,
    name: playerName || 'OPERATIVE',
    revealedLetters: [],
  };
  const roster = players.length > 0 ? players : [currentPlayer];

  const rankedPlayers = roster
    .map((player) => {
      const stats = getPlayerStats({ game, player, rounds });
      const score = calculateMissionScore({
        outcome: game.status,
        correct: stats.correct,
        totalRounds: stats.totalRounds,
        missed: stats.missed,
        timeRemainingSeconds,
        difficulty: game.difficulty,
        finalRiddleMisses,
      });
      return { ...stats, score: score.total, scoreBreakdown: score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.correct - a.correct ||
        (a.completedAt ?? Number.MAX_SAFE_INTEGER) -
          (b.completedAt ?? Number.MAX_SAFE_INTEGER) ||
        (a.joinedAt ?? Number.MAX_SAFE_INTEGER) -
          (b.joinedAt ?? Number.MAX_SAFE_INTEGER) ||
        a.name.localeCompare(b.name)
    );

  const ownIndex = Math.max(
    0,
    rankedPlayers.findIndex((player) => player.playerId === playerId)
  );
  const own = rankedPlayers[ownIndex] ?? rankedPlayers[0];
  const recovered = own.revealedLetters.filter(
    (letter) => letter !== '?'
  ).length;
  const missionSeed = String(endedAt ?? startedAt ?? Date.now())
    .toString(36)
    .toUpperCase();

  return {
    outcome: game.status === 'won' ? 'won' : 'lost',
    operativeName: own.name,
    missionRef: `ES-${missionSeed.slice(-5)}`,
    difficulty: (game.difficulty ?? 'medium').toUpperCase(),
    score: own.score,
    scoreBreakdown: own.scoreBreakdown,
    correct: own.correct,
    missed: own.missed,
    totalRounds: own.totalRounds,
    accuracy: own.accuracy,
    recoveredLetters: own.revealedLetters,
    recoveredCount: recovered,
    timeUsedSeconds,
    timeRemainingSeconds,
    finalRiddleAttempts:
      game.status === 'won' ? Math.min(3, finalRiddleMisses + 1) : 3,
    squadRank: ownIndex + 1,
    squadSize: rankedPlayers.length,
    squadBoard: rankedPlayers.slice(0, 4).map((player, index) => ({
      rank: index + 1,
      name: player.name,
      score: player.score,
      isCurrent: player.playerId === playerId,
    })),
    globalLeaderboard: leaderboardEntry
      ? { available: true, ...leaderboardEntry }
      : { available: false },
  };
}
