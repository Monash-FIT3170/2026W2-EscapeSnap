import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { GameResults } from './GameResultsCollection';
import { calculateGameResults } from './calculateGameResults';

export async function finalizeGameResults(
  gameId,
  outcome,
  generatedAt = new Date()
) {
  const game = await Games.findOneAsync(gameId);
  if (!game)
    throw new Error(`Cannot generate results for missing game ${gameId}`);

  const [players, rounds] = await Promise.all([
    Players.find({ gameId }).fetchAsync(),
    Rounds.find({ gameId }).fetchAsync(),
  ]);
  const results = calculateGameResults({
    game,
    players,
    rounds,
    outcome,
    generatedAt,
  });

  await Promise.all(
    results.map((result) =>
      GameResults.upsertAsync(
        { gameId: result.gameId, playerId: result.playerId },
        { $set: result }
      )
    )
  );

  return results;
}
