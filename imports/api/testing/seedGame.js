import { Meteor } from 'meteor/meteor';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { GameResults } from '../achievements/GameResultsCollection';
import { SEEDED_RIDDLE, SEEDED_FINAL_RIDDLE } from './seededScenario';

// Imported only by tests. No client-callable seed method or production bypass.
export async function seedGame() {
  if (!Meteor.isTest) throw new Error('Seed fixtures require meteor test');
  await GameResults.removeAsync({});
  await Rounds.removeAsync({});
  await Players.removeAsync({});
  await Games.removeAsync({});
  const startedAt = new Date();
  const gameId = await Games.insertAsync({
    _id: 'seed-game',
    joinCode: '4242',
    groupName: 'Seed Team',
    status: 'in_progress',
    currentRound: 1,
    totalRounds: 3,
    capacity: 2,
    timerMinutes: 10,
    difficulty: 'easy',
    theme: 'classroom',
    createdAt: startedAt,
    startedAt,
    finalRiddle: { ...SEEDED_FINAL_RIDDLE },
    riddlesReady: true,
    pregeneratedRoundRiddles: [{ ...SEEDED_RIDDLE }],
  });
  for (const [id, name] of [
    ['seed-ada', 'Ada'],
    ['seed-grace', 'Grace'],
  ]) {
    await Players.insertAsync({
      _id: id,
      gameId,
      name,
      joinedAt: startedAt,
      revealedLetters: [],
    });
  }
  await Meteor.callAsync('rounds.createForGame', gameId, startedAt);
  return {
    gameId,
    startedAt,
    adaId: 'seed-ada',
    graceId: 'seed-grace',
    round: (playerId = 'seed-ada', roundNumber = 1) =>
      Rounds.findOneAsync({ gameId, playerId, roundNumber }),
  };
}
