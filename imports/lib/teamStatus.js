// Where one team stands in a match, derived from its game doc and its rounds.
// Shared by the host scoreboard and the rival strip on players' phones.

// An online team that has been searching this long without a rival drops out
// of the queue — most likely its host closed the tab.
export const SEARCH_TTL_MS = 10 * 60 * 1000;

export const isVersusGame = (game) =>
  !!game && (!!game.matchId || (!!game.mode && game.mode !== 'solo'));

// 'waiting' | 'playing' | 'final' | 'escaped' | 'failed'
export function teamPhase(game, rounds) {
  if (!game) return 'waiting';
  if (game.status === 'won') return 'escaped';
  if (game.status === 'lost') return 'failed';
  if (game.status !== 'in_progress') return 'waiting';

  const onLastRound = game.currentRound >= game.totalRounds;
  const lastRoundPending = rounds.some(
    (r) =>
      r.gameId === game._id &&
      r.roundNumber === game.currentRound &&
      r.status === 'pending'
  );
  return onLastRound && !lastRoundPending ? 'final' : 'playing';
}

export function teamProgressPercent(game, rounds) {
  const own = rounds.filter((r) => r.gameId === game?._id);
  if (own.length === 0) return 0;
  const solved = own.filter((r) => r.status === 'correct').length;
  return Math.round((solved / own.length) * 100);
}
