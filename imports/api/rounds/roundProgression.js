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
