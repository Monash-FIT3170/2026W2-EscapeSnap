import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from './RoundsCollection';

// How long a dropped player keeps their slot before the team stops waiting on
// them. Phones lock while players hunt for objects, and a locked phone drops
// its socket, so this has to outlast a pocketed phone, not just a network blip.
export const PRESENCE_GRACE_MS = 60 * 1000;

// Mark every still-pending round matching `selector` as wrong.
// The status is part of the update selector, so a round can only make the
// pending -> wrong transition once and can never push a duplicate '?'.
export async function resolvePendingRounds(selector) {
  const pending = await Rounds.find({
    ...selector,
    status: 'pending',
  }).fetchAsync();
  let resolved = 0;

  for (const round of pending) {
    const updated = await Rounds.updateAsync(
      { _id: round._id, status: 'pending' },
      { $set: { status: 'wrong', submittedAt: new Date() } }
    );
    if (updated === 1) {
      await Players.updateAsync(round.playerId, {
        $push: { revealedLetters: '?' },
      });
      resolved++;
    }
  }

  return resolved;
}

export async function advanceGameRound(
  gameId,
  expectedRound,
  nextRoundStartedAt = new Date()
) {
  const game = await Games.findOneAsync(gameId);
  if (!game || expectedRound >= game.totalRounds) return false;

  const updatedGames = await Games.updateAsync(
    { _id: gameId, currentRound: expectedRound },
    { $set: { currentRound: expectedRound + 1 } }
  );
  if (updatedGames === 0) return false;

  await Rounds.updateAsync(
    { gameId, roundNumber: expectedRound + 1 },
    { $set: { startedAt: nextRoundStartedAt } },
    { multi: true }
  );

  return true;
}

// A round is settled once its player either solved it or skipped out of it.
// The whole team moves on together: the first player to finish waits on the
// stragglers instead of dragging them into a round they never saw.
//
// Players gone for longer than PRESENCE_GRACE_MS don't count as stragglers —
// otherwise one closed tab freezes everyone else. Their rounds are forfeited
// with a '?' once the present players are done. This runs before
// advanceGameRound's last-round guard, so the final round is settled too.
export async function advanceIfRoundSettled(
  gameId,
  roundNumber,
  now = Date.now()
) {
  const game = await Games.findOneAsync(gameId);
  if (!game || game.currentRound !== roundNumber) return false;

  const absent = await Players.find(
    { gameId, disconnectedAt: { $lte: new Date(now - PRESENCE_GRACE_MS) } },
    { fields: { _id: 1 } }
  ).fetchAsync();

  const stillScanning = await Rounds.find({
    gameId,
    roundNumber,
    status: 'pending',
    playerId: { $nin: absent.map((p) => p._id) },
  }).countAsync();
  if (stillScanning > 0) return false;

  await resolvePendingRounds({ gameId, roundNumber });
  return advanceGameRound(gameId, roundNumber);
}
