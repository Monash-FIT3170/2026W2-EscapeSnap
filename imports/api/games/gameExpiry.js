import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { endGame } from './gameLifecycle';
import { settleMatchIfOver } from '../matches/matchService';
import { remainingGameMs } from '../../lib/gameClock';

// Server-only. The clock is otherwise only checked when someone acts — a late
// photo is refused, a screen shows "time's up" — so a team that runs out of
// time and walks away would sit 'in_progress' forever. This sweep is what
// actually ends it.

const SWEEP_INTERVAL_MS = 15 * 1000;
// A little slack so an answer sent in the last second isn't beaten to the
// game by the sweep.
const GRACE_MS = 5 * 1000;

// Ends a timed-out game as lost. In a match the rival plays on; once nobody
// is left playing the match closes, as a draw if nobody escaped.
export async function expireGame(game, endedAt = new Date()) {
  if (!(await endGame(game._id, 'lost', endedAt))) return false;
  console.log(`[expiry] game ${game._id} (${game.groupName}) ran out of time`);
  if (game.matchId) await settleMatchIfOver(game.matchId, endedAt);
  return true;
}

export async function sweepExpiredGames(now = new Date()) {
  const live = await Games.find(
    { status: 'in_progress', startedAt: { $exists: true } },
    {
      fields: {
        groupName: 1,
        matchId: 1,
        startedAt: 1,
        timerMinutes: 1,
        timePenaltyMs: 1,
      },
    }
  ).fetchAsync();

  const nowMs = now.getTime();
  for (const game of live) {
    if (remainingGameMs(game, nowMs - GRACE_MS) > 0) continue;
    try {
      await expireGame(game, now);
    } catch (err) {
      console.error(`[expiry] ending game ${game._id} failed:`, err);
    }
  }
}

export async function startGameExpiry() {
  // Catch up on anything that ran out while the server was down.
  await sweepExpiredGames();
  Meteor.setInterval(() => {
    sweepExpiredGames().catch((err) =>
      console.error('[expiry] sweep failed:', err)
    );
  }, SWEEP_INTERVAL_MS);
}
