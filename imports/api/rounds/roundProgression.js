import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from './RoundsCollection';
import { logGameEvent } from '../events/gameEventLog';

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
  await logGameEvent({
    gameId,
    type: 'roundStarted',
    roundNumber: expectedRound + 1,
  });

  return true;
}

// A round is settled once each of its riddles was solved or skipped. A player
// who left doesn't hold the team up: presence.js hands their riddles to the
// teammates still playing (coveredBy), who settle them like their own.
export async function advanceIfRoundSettled(gameId, roundNumber) {
  const game = await Games.findOneAsync(gameId);
  if (game?.status !== 'in_progress' || game.currentRound !== roundNumber) {
    return false;
  }

  const stillScanning = await Rounds.find({
    gameId,
    roundNumber,
    status: 'pending',
  }).countAsync();
  if (stillScanning > 0) return false;

  return advanceGameRound(gameId, roundNumber);
}
