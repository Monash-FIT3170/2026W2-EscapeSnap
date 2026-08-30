import { Games } from '../games/GamesCollection';
import { Rounds } from './RoundsCollection';

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
export async function advanceIfRoundSettled(gameId, roundNumber) {
  const game = await Games.findOneAsync(gameId);
  if (!game || game.currentRound !== roundNumber) return false;

  const stillScanning = await Rounds.find({
    gameId,
    roundNumber,
    status: 'pending',
  }).countAsync();
  if (stillScanning > 0) return false;

  return advanceGameRound(gameId, roundNumber);
}
