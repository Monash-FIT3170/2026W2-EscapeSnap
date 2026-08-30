import { Meteor } from 'meteor/meteor';
import { Rounds } from './RoundsCollection';
import { Players } from '../players/PlayersCollection';
import { Games } from '../games/GamesCollection';
import { advanceIfRoundSettled } from './roundProgression';

// Moves a pending round to its final status and awards its letter. The
// `status: 'pending'` guard lives in the selector, so two racing calls for the
// same round can never push two letters onto the player.
async function settleRound(round, status, letter, settledAt) {
  const $set = { status, submittedAt: settledAt };
  if (round.startedAt) {
    $set.solveDurationMs = Math.max(
      0,
      settledAt.getTime() - round.startedAt.getTime()
    );
  }

  const updated = await Rounds.updateAsync(
    { _id: round._id, status: 'pending' },
    { $set }
  );
  if (updated === 0) return false;

  await Players.updateAsync(round.playerId, {
    $push: { revealedLetters: letter },
  });
  return true;
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
  // Reads the riddles games.start already prepared — no Gemini calls here.
  async 'rounds.createForGame'(gameId, firstRoundStartedAt = new Date()) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');

    const players = await Players.find({ gameId }).fetchAsync();
    if (players.length === 0)
      throw new Meteor.Error('no-players', 'No players in game');

    const totalRounds = game.totalRounds;
    const letterPool = assignLetters(
      game.finalRiddle.answer,
      totalRounds,
      players.length
    );
    const pool = game.pregeneratedRoundRiddles;
    if (!pool || pool.length === 0) {
      throw new Meteor.Error(
        'riddles-not-ready',
        'Game has no pre-generated riddles — try starting the game again'
      );
    }

    const inserts = [];
    let riddleIndex = 0;

    for (let round = 1; round <= totalRounds; round++) {
      for (let p = 0; p < players.length; p++) {
        // The bank is smaller than totalRounds × playerCount for large games,
        // so wrap rather than deal `undefined`.
        const riddle = pool[riddleIndex % pool.length];
        const letter = letterPool[riddleIndex];
        riddleIndex++;
        inserts.push(
          Rounds.insertAsync({
            gameId,
            playerId: players[p]._id,
            roundNumber: round,
            riddleText: riddle.text,
            hint: riddle.hint,
            answer: riddle.answer,
            letter,
            status: 'pending',
            // Only round 1 is live at creation; advanceGameRound stamps the
            // rest as they open.
            ...(round === 1 ? { startedAt: firstRoundStartedAt } : {}),
          })
        );
      }
    }

    await Promise.all(inserts);
  },

  // Idempotent — the selector only matches while startedAt is unset, so a
  // remount or refresh cannot restart the clock.
  async 'rounds.markStarted'(roundId) {
    if (!roundId) return;
    await Rounds.updateAsync(
      { _id: roundId, startedAt: null },
      { $set: { startedAt: new Date() } }
    );
  },

  async 'rounds.submit'(roundId, isCorrect = true) {
    const round = await Rounds.findOneAsync(roundId);
    if (!round) throw new Meteor.Error('not-found', 'Round not found');
    if (round.status !== 'pending')
      throw new Meteor.Error('invalid-state', 'Round already submitted');

    const game = await Games.findOneAsync(round.gameId);
    const expired =
      game?.startedAt &&
      Date.now() - game.startedAt.getTime() > game.timerMinutes * 60 * 1000;

    const submittedAt = new Date();

    if (expired) {
      await settleRound(round, 'timeout', '?', submittedAt);
      await advanceIfRoundSettled(round.gameId, round.roundNumber);
      throw new Meteor.Error('timeout', 'Round timer expired');
    }

    const letter = isCorrect ? round.letter : '?';

    const settled = await settleRound(
      round,
      isCorrect ? 'correct' : 'wrong',
      letter,
      submittedAt
    );
    if (settled) {
      await advanceIfRoundSettled(round.gameId, round.roundNumber);
    }

    return letter;
  },

  // A player who can't find their object can skip the round and get a '?' instead of their letter.
  async 'rounds.skip'(roundId) {
    const round = await Rounds.findOneAsync(roundId);
    if (!round) throw new Meteor.Error('not-found', 'Round not found');
    if (round.status !== 'pending')
      throw new Meteor.Error('invalid-state', 'Round already submitted');

    // Deliberately no game-timer check: skipping only ever awards '?', and it
    // is the one action that can still unstick a round after time runs out.
    if (await settleRound(round, 'wrong', '?', new Date())) {
      await advanceIfRoundSettled(round.gameId, round.roundNumber);
    }

    return '?';
  },
});
