// The whole-game clock. `timerMinutes` sets the budget; revealing a riddle's
// hint burns a fixed slice of it. The cost lands on the shared clock rather
// than on the player who asked, which is what makes a hint a team decision.
export const HINT_PENALTY_MINUTES = 1;
export const HINT_PENALTY_MS = HINT_PENALTY_MINUTES * 60 * 1000;

// How long the game is allowed to run, net of penalties already incurred.
export function gameBudgetMs(game) {
  if (!game?.timerMinutes) return 0;
  return Math.max(0, game.timerMinutes * 60 * 1000 - (game.timePenaltyMs ?? 0));
}

// Milliseconds left on the clock, or null while the game hasn't started.
// Every countdown in the app derives from this so a hint penalty applies
// everywhere at once — host screen, player screen and the server's own
// submission cut-off.
export function remainingGameMs(game, now = Date.now()) {
  if (!game?.startedAt || !game?.timerMinutes) return null;
  const elapsed = now - new Date(game.startedAt).getTime();
  return Math.max(0, gameBudgetMs(game) - elapsed);
}
