import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { RoundSessions } from '/imports/api/rounds/RoundSessions';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';
import { advanceGameRound } from '../rounds/roundProgression';
import {
  endGame,
  ensureRiddlesReady,
  generateJoinCode,
  pregenerateRiddlesOnce,
  startGame,
} from './gameLifecycle';
import { claimMatchVictory, settleMatchIfOver } from '../matches/matchService';

const ROUND_DURATION_MS = 60 * 1000;
const MAX_FINAL_ATTEMPTS = 3;
const GAME_MODES = ['solo', 'online'];

// Mark every still-pending round matching `selector` as wrong.
// The status is part of the update selector, so a round can only make the
// pending -> wrong transition once and can never push a duplicate '?'.
async function resolvePendingRounds(selector) {
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

Meteor.methods({
  async 'games.create'({
    groupName,
    timerMinutes = 30,
    totalRounds = 3,
    capacity = 4,
    difficulty = 'medium',
    theme = 'classroom',
    mode = 'solo',
  } = {}) {
    if (!groupName || !groupName.trim()) {
      throw new Meteor.Error('invalid-group-name', 'Group name is required');
    }
    // Same-room matches create both teams at once through matches.createLocal.
    if (!GAME_MODES.includes(mode)) {
      throw new Meteor.Error('invalid-mode', 'Unknown game mode');
    }
    const joinCode = await generateJoinCode();

    const gameId = await Games.insertAsync({
      joinCode,
      groupName: groupName.trim(),
      status: 'lobby',
      currentRound: 1,
      totalRounds,
      timerMinutes,
      capacity,
      difficulty,
      theme,
      mode,
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      // Placeholder — overwritten by pregenerateRiddles below.
      finalRiddle: FINAL_RIDDLE,
    });

    // Fire-and-forget — runs while players join, so START MISSION is instant.
    pregenerateRiddlesOnce(gameId, {
      totalRounds,
      capacity,
      difficulty,
      theme,
    });

    return gameId;
  },

  async 'games.start'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'lobby')
      throw new Meteor.Error('invalid-state', 'Game is not in lobby state');
    // Versus games start together with their rival — matches.start for a
    // same-room match, matchmaking for an online one.
    if (game.matchId || (game.mode && game.mode !== 'solo'))
      throw new Meteor.Error('invalid-state', 'Versus games start as a match');

    const playerCount = await Players.find({ gameId }).countAsync();
    if (playerCount !== game.capacity) {
      throw new Meteor.Error(
        'lobby-not-full',
        'All player slots must be filled before starting'
      );
    }

    await ensureRiddlesReady(game);
    await startGame(gameId);
  },

  async 'games.startRound'(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Meteor.Error('invalid', 'sessionId required');
    }
    await RoundSessions.upsertAsync(
      { sessionId },
      { $set: { sessionId, startedAt: new Date() } }
    );
  },

  async 'games.submitRiddle'(sessionId, playerId) {
    const session = await RoundSessions.findOneAsync({ sessionId });
    if (!session) {
      throw new Meteor.Error(
        'no-session',
        'Round session not found — cannot verify timing'
      );
    }

    const elapsed = Date.now() - session.startedAt.getTime();
    if (elapsed > ROUND_DURATION_MS) {
      throw new Meteor.Error(
        'expired',
        'Round timer has expired — submission rejected by server'
      );
    }

    const riddle = HARDCODED_RIDDLES.find((r) => r.playerId === playerId);
    if (!riddle)
      throw new Meteor.Error('no-riddle', 'No riddle found for this player');

    return riddle.revealedLetter;
  },

  async 'games.advanceRound'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.currentRound >= game.totalRounds) return;

    await resolvePendingRounds({ gameId, roundNumber: game.currentRound });

    await advanceGameRound(gameId, game.currentRound);
  },

  async 'games.submitFinalAnswer'(gameId, guess) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'in_progress')
      throw new Meteor.Error('invalid-state', 'Game is not in progress');

    const attempts = (game.finalRiddleAttempts ?? 0) + 1;

    const isCorrect =
      guess.trim().toLowerCase() === game.finalRiddle.answer.toLowerCase();

    let outcome = null;
    if (isCorrect) outcome = 'won';
    else if (attempts >= MAX_FINAL_ATTEMPTS) outcome = 'lost';

    const endedAt = new Date();
    // In a match only the first team to crack its code wins. A correct answer
    // that lands after a rival already claimed the match still loses.
    let rivalWonFirst = false;
    if (outcome === 'won' && game.matchId) {
      rivalWonFirst = !(await claimMatchVictory(game.matchId, gameId, endedAt));
      if (rivalWonFirst) outcome = 'lost';
    }

    if (outcome) {
      await endGame(gameId, outcome, endedAt, {
        finalRiddleAttempts: attempts,
      });
      if (game.matchId && outcome === 'lost') {
        await settleMatchIfOver(game.matchId, endedAt);
      }
    } else {
      await Games.updateAsync(gameId, {
        $set: { finalRiddleAttempts: attempts },
      });
    }

    return {
      isCorrect,
      attemptsLeft: isCorrect ? 0 : MAX_FINAL_ATTEMPTS - attempts,
      outcome,
      rivalWonFirst,
    };
  },
});
