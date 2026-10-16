import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { Players } from '../players/PlayersCollection';
import { RoundSessions } from '/imports/api/rounds/RoundSessions';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';
import { UI_THEMES, DEFAULT_UI_THEME } from '../../lib/uiThemes';
import { DEFAULT_ANSWER_MODE } from '../../lib/answerModes';
import { CUSTOM_THEME, normalizeCustomTheme } from '../../lib/customTheme';
import {
  advanceGameRound,
  resolvePendingRounds,
} from '../rounds/roundProgression';
import { logGameEvent } from '../events/gameEventLog';
import {
  endGame,
  ensureRiddlesReady,
  insertGameWithJoinCode,
  pregenerateRiddlesOnce,
  startGame,
} from './gameLifecycle';
import { claimMatchVictory, settleMatchIfOver } from '../matches/matchService';
import { expireGame } from './gameExpiry';
import { remainingGameMs } from '../../lib/gameClock';

const ROUND_DURATION_MS = 60 * 1000;
const MAX_FINAL_ATTEMPTS = 3;
const PLAY_MODES = ['solo', 'online'];

// Tests reach the join-code source through this module.
export { joinCodeSource } from './gameLifecycle';

Meteor.methods({
  async 'games.create'({
    groupName,
    timerMinutes = 30,
    totalRounds = 3,
    capacity = 4,
    difficulty = 'medium',
    theme = 'classroom',
    uiTheme = DEFAULT_UI_THEME,
    mode = DEFAULT_ANSWER_MODE,
    customTheme,
    playMode = 'solo',
  } = {}) {
    if (!groupName || !groupName.trim()) {
      throw new Meteor.Error('invalid-group-name', 'Group name is required');
    }
    // Same-room matches create both teams at once through matches.createLocal.
    if (!PLAY_MODES.includes(playMode)) {
      throw new Meteor.Error('invalid-mode', 'Unknown game mode');
    }
    // Only kept for the custom theme; a preset theme ignores any stray text.
    const cleanCustomTheme =
      theme === CUSTOM_THEME ? normalizeCustomTheme(customTheme) : '';
    if (theme === CUSTOM_THEME && !cleanCustomTheme) {
      throw new Meteor.Error(
        'invalid-custom-theme',
        'Custom theme text is required'
      );
    }
    const gameId = await insertGameWithJoinCode({
      groupName: groupName.trim(),
      status: 'lobby',
      currentRound: 1,
      totalRounds,
      timerMinutes,
      capacity,
      difficulty,
      theme,
      uiTheme,
      ...(cleanCustomTheme && { customTheme: cleanCustomTheme }),
      mode,
      playMode,
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
      customTheme: cleanCustomTheme,
      mode,
    });

    return gameId;
  },

  // Callable by the host and by any player: the skin is shared by the whole
  // game, so whoever changes it changes it for everyone.
  async 'games.setUiTheme'(gameId, uiTheme) {
    // A non-string id would be read as a Mongo selector and could match
    // some other game.
    if (typeof gameId !== 'string') {
      throw new Meteor.Error('not-found', 'Game not found');
    }
    if (!UI_THEMES.includes(uiTheme)) {
      throw new Meteor.Error('invalid-ui-theme', 'Unknown UI theme');
    }
    const updated = await Games.updateAsync(gameId, { $set: { uiTheme } });
    if (!updated) throw new Meteor.Error('not-found', 'Game not found');
  },

  async 'games.start'(gameId) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'lobby')
      throw new Meteor.Error('invalid-state', 'Game is not in lobby state');
    // Versus games start together with their rival — matches.start for a
    // same-room match, matchmaking for an online one.
    if (game.matchId || (game.playMode && game.playMode !== 'solo'))
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
    if (game.status !== 'in_progress')
      throw new Meteor.Error('invalid-state', 'Game is not in progress');

    await resolvePendingRounds({ gameId, roundNumber: game.currentRound });

    await advanceGameRound(gameId, game.currentRound);
  },

  async 'games.submitFinalAnswer'(gameId, guess) {
    const game = await Games.findOneAsync(gameId);
    if (!game) throw new Meteor.Error('not-found', 'Game not found');
    if (game.status !== 'in_progress')
      throw new Meteor.Error('invalid-state', 'Game is not in progress');

    // An answer after the clock ran out loses, even a correct one.
    if (remainingGameMs(game) === 0) {
      await expireGame(game);
      return {
        isCorrect: false,
        attemptsLeft: 0,
        outcome: 'lost',
        rivalWonFirst: false,
      };
    }

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
      await logGameEvent({ gameId, type: 'finalAnswerWrong' });
    }

    return {
      isCorrect,
      attemptsLeft: isCorrect ? 0 : MAX_FINAL_ATTEMPTS - attempts,
      outcome,
      rivalWonFirst,
    };
  },
});
