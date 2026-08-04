import { Meteor } from 'meteor/meteor';
import { Rounds } from './RoundsCollection';
import { Players } from '../players/PlayersCollection';
import { Games } from '../games/GamesCollection';
import { RIDDLE_BANK } from '../../lib/riddleBank';
import { getFallbackFinalRiddle } from '../../lib/finalRiddle';
import {
  generateFinalRiddle,
  generateRoundRiddles,
} from '../riddles/geminiClient';

// Tops a (possibly short, possibly empty) AI-generated pool up to `needed` entries
// using the offline fallback bank, so a Gemini failure or partial response never
// blocks round creation.
function ensureEnoughRiddles(pool, needed) {
  const combined = [...(pool || [])];
  if (combined.length < needed) {
    const fallback = [...RIDDLE_BANK].sort(() => Math.random() - 0.5);
    let i = 0;
    while (combined.length < needed) {
      combined.push(fallback[i % fallback.length]);
      i++;
    }
  }
  return combined.slice(0, needed);
}

function assignLetters(answer, totalRounds, playerCount) {
  const letters = answer.toUpperCase().split('');
  const pool = [];
  for (let r = 0; r < totalRounds; r++) {
    for (let p = 0; p < playerCount; p++) {
      pool.push(letters[(r * playerCount + p) % letters.length]);
    }
  }
  return pool;
}

Meteor.methods({
  async 'rounds.createForGame'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');

    const players = await Players.find({ gameId }).fetchAsync();
    // if (players.length === 0)
    //   throw new Meteor.Error('no-players', 'No players in game');

    const totalRounds = game.totalRounds;
    const needed = totalRounds * players.length;
    // Every letter a player can earn must map to a real position in the final
    // answer, so the answer's length has to exactly equal the total number of
    // letters that CAN be revealed across the whole game — totalRounds * playerCount.
    // Only known now, once players have actually joined the lobby.
    const letterCount = Math.max(1, needed);

    // Run both Gemini calls in parallel — round-riddle generation doesn't depend on
    // the final answer, only the local letter-assignment math below does.
    const [finalRiddleResult, roundPoolResult] = await Promise.allSettled([
      generateFinalRiddle({ difficulty: game.difficulty, letterCount }),
      generateRoundRiddles({ count: needed, difficulty: game.difficulty }),
    ]);

    let finalRiddle;
    if (finalRiddleResult.status === 'fulfilled') {
      finalRiddle = finalRiddleResult.value;
      console.log(
        `[rounds.createForGame] Gemini generated the final riddle live (${finalRiddle.answer.length} letters, matches ${letterCount} needed).`
      );
    } else {
      console.error(
        '[rounds.createForGame] Gemini final riddle generation failed, using fallback:',
        finalRiddleResult.reason
      );
      finalRiddle = getFallbackFinalRiddle(letterCount);
    }
    await Games.updateAsync(gameId, { $set: { finalRiddle } });

    const letterPool = assignLetters(
      finalRiddle.answer,
      totalRounds,
      players.length
    );

    let pool;
    if (roundPoolResult.status === 'fulfilled') {
      pool = roundPoolResult.value;
      console.log(
        `[rounds.createForGame] Gemini generated ${pool.length}/${needed} round riddles live.`
      );
    } else {
      console.error(
        '[rounds.createForGame] Gemini round riddle generation failed, using fallback bank:',
        roundPoolResult.reason
      );
      pool = null;
    }
    const shuffled = ensureEnoughRiddles(pool, needed);
    const fromFallbackCount = pool ? Math.max(0, needed - pool.length) : needed;
    if (fromFallbackCount > 0) {
      console.warn(
        `[rounds.createForGame] ${fromFallbackCount}/${needed} riddles came from the offline fallback bank, not Gemini.`
      );
    }

    const inserts = [];
    let riddleIndex = 0;

    for (let round = 1; round <= totalRounds; round++) {
      for (let p = 0; p < players.length; p++) {
        const riddle = shuffled[riddleIndex];
        const letter = letterPool[riddleIndex];
        riddleIndex++;
        inserts.push(
          Rounds.insertAsync({
            gameId,
            playerId: players[p]._id,
            roundNumber: round,
            riddleText: riddle.text,
            answer: riddle.answer,
            letter,
            status: 'pending',
            photoUrl: null,
            submittedAt: null,
          })
        );
      }
    }

    await Promise.all(inserts);
  },

  async 'rounds.submit'(roundId, photoUrl, isCorrect = true) {
    const round = await Rounds.findOneAsync(roundId);
    if (!round) throw new Meteor.Error('not-found', 'Round not found');
    if (round.status !== 'pending')
      throw new Meteor.Error('invalid-state', 'Round already submitted');

    const game = await Games.findOneAsync(round.gameId);
    const expired =
      game?.startedAt &&
      Date.now() - game.startedAt.getTime() > game.timerMinutes * 60 * 1000;

    if (expired) {
      await Rounds.updateAsync(roundId, {
        $set: { status: 'timeout', photoUrl, submittedAt: new Date() },
      });
      await Players.updateAsync(round.playerId, {
        $push: { revealedLetters: '?' },
      });
      throw new Meteor.Error('timeout', 'Round timer expired');
    }

    const letter = isCorrect ? round.letter : '?';

    await Rounds.updateAsync(roundId, {
      $set: {
        status: isCorrect ? 'correct' : 'wrong',
        photoUrl,
        submittedAt: new Date(),
      },
    });

    await Players.updateAsync(round.playerId, {
      $push: { revealedLetters: letter },
    });

    // Advance currentRound when all players have submitted for this round
    const submittedCount = await Rounds.find({
      gameId: round.gameId,
      roundNumber: round.roundNumber,
      status: { $ne: 'pending' },
    }).countAsync();
    const playerCount = await Players.find({
      gameId: round.gameId,
    }).countAsync();

    if (
      submittedCount >= playerCount &&
      game.currentRound === round.roundNumber &&
      round.roundNumber < game.totalRounds
    ) {
      await Games.updateAsync(round.gameId, {
        $set: { currentRound: round.roundNumber + 1 },
      });
    }

    return letter;
  },
});
