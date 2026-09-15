import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from './RoundsCollection';

export const PRESENCE_GRACE_MS = 60 * 1000;

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

export async function advanceIfRoundSettled(
  gameId,
  roundNumber,
  now = Date.now()
) {
  const game = await Games.findOneAsync(gameId);
  if (game?.status !== 'in_progress' || game.currentRound !== roundNumber) {
    return false;
  }

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
