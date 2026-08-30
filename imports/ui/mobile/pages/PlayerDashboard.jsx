// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Rounds } from '/imports/api/rounds/RoundsCollection';
import { Players } from '/imports/api/players/PlayersCollection';
import { Games } from '/imports/api/games/GamesCollection';
import MobileRiddlePage from './gameplay/MobileRiddlePage';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { RoundTimer } from '../components/gameplay/RoundTimer';
import { PlayerWinScreen } from './result/PlayerWinScreen';
import { PlayerLoseScreen } from './result/PlayerLoseScreen';
import { buildEndgameShareSnapshot } from '../components/result/shareSnapshot';
import {
  HINT_PENALTY_MINUTES,
  gameBudgetMs,
  remainingGameMs,
} from '/imports/lib/gameClock';
import { useT } from '../../../languages/LanguageProvider';

// How long the armed skip button waits for the confirming tap before it
// disarms itself again.
const SKIP_CONFIRM_MS = 5000;

// Minimum time a settled round's result stays on screen. The round advances
// the instant the last player settles, so without this the player who finishes
// last would never see the letter they just earned.
const RESULT_DWELL_MS = 2500;

function LettersScreen({ revealedLetters, totalRounds }) {
  const t = useT();
  return (
    <section className="flex flex-col gap-5 pt-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-red-500">
          {t('mobile.dashboard.lettersCollected')}
        </p>
        <h2 className="mt-1 font-mono text-xl font-bold tracking-wide text-white">
          {t('mobile.dashboard.roundsComplete', {
            n: revealedLetters.filter((l) => l && l !== '?').length,
            total: totalRounds,
          })}
        </h2>
      </div>
      <div className="flex gap-3 mt-2">
        {Array.from({ length: totalRounds }, (_, i) => {
          const letter = revealedLetters[i];
          const hasLetter = letter && letter !== '?';
          return (
            <div
              key={i}
              className={`flex-1 border py-6 text-center ${
                hasLetter
                  ? 'border-red-900/60 bg-red-950/20'
                  : 'border-slate-800 bg-slate-950/40'
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
                {t('mobile.dashboard.roundLabel', { n: i + 1 })}
              </p>
              <p className="font-display text-4xl font-black text-white">
                {letter ?? '?'}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Two-tap forfeit. Skipping is irreversible and costs the round's letter, so a
// stray thumb on the scanner shouldn't be enough to trigger it.
function SkipRoundButton({ armed, pending, onArm, onConfirm }) {
  const t = useT();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={armed ? onConfirm : onArm}
      className={`w-full border px-5 py-4 font-mono text-sm font-semibold uppercase tracking-[0.3em] transition disabled:opacity-40 disabled:cursor-not-allowed ${
        armed
          ? 'border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
          : 'border-slate-700 bg-transparent text-slate-500 hover:border-slate-500 hover:text-slate-300'
      }`}
    >
      {pending
        ? t('mobile.dashboard.skipping')
        : armed
          ? t('mobile.dashboard.skipConfirm')
          : t('mobile.dashboard.skipRound')}
    </button>
  );
}

// Shown once this player's round is settled — solved or skipped — while the
// rest of the team is still scanning.
function TeamWaitScreen({ ready, total, isFinalRound, holding }) {
  const t = useT();
  const everyoneDone = total > 0 && ready >= total;
  const finished = isFinalRound && everyoneDone;

  // `holding` means the team is already through and the next round is about to
  // take over the screen — the ready counter below now belongs to that round,
  // so it would read 0 / N and look like a regression.
  if (holding) {
    return (
      <div className="mt-2 border border-slate-700 bg-slate-950/70 px-6 py-6 text-center">
        <p className="pulse-text font-mono text-sm uppercase tracking-[0.3em] text-red-500">
          {t('mobile.dashboard.nextRoundStarting')}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 border border-slate-700 bg-slate-950/70 px-6 py-6 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-red-500">
        {finished
          ? t('mobile.dashboard.allRoundsCompleted')
          : t('mobile.dashboard.awaitingTeam')}
      </p>
      {!finished && total > 0 && (
        <p className="mt-4 font-display text-3xl font-black text-white">
          {t('mobile.dashboard.operativesReady', { ready, total })}
        </p>
      )}
      <p className="mt-4 text-sm leading-6 text-slate-400">
        {finished
          ? t('mobile.dashboard.reportToTerminal')
          : t('mobile.dashboard.waitingBody')}
      </p>
    </div>
  );
}

function ResultScreen({
  revealedLetter,
  answerCorrect,
  settled,
  holding,
  teamReady,
  teamTotal,
  isFinalRound,
  skipArmed,
  skipping,
  onArmSkip,
  onSkip,
  onRetry,
}) {
  const t = useT();
  return (
    <div className="flex-1 overflow-y-auto px-5">
      <section className="flex flex-col gap-6 pt-5">
        <h1 className="font-display text-6xl font-black text-red-700">
          {answerCorrect
            ? t('mobile.dashboard.correctBang')
            : settled
              ? t('mobile.dashboard.roundSkipped')
              : t('mobile.dashboard.incorrectBang')}
        </h1>

        {/* Only a settled round has actually banked (or forfeited) a letter —
            a failed scan can still be retried, so nothing is revealed yet. */}
        {settled && (
          <div className="border border-slate-700 bg-slate-950/70 px-6 py-10 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">
              {t('mobile.dashboard.dataRecoveryActive')}
            </p>
            <p className="mt-8 font-display text-8xl font-black text-white">
              {revealedLetter ?? '?'}
            </p>
            <p className="mt-6 font-mono text-sm uppercase tracking-[0.35em] text-slate-400">
              {t('mobile.dashboard.letterRevealed')}
            </p>
          </div>
        )}

        <div className="border-l-4 border-red-600 bg-slate-900/80 px-6 py-6">
          <h2 className="font-display text-xl font-bold tracking-widest text-white">
            {answerCorrect
              ? t('mobile.dashboard.puzzleSolved')
              : settled
                ? t('mobile.dashboard.letterForfeited')
                : t('mobile.dashboard.wrongObjectDetected')}
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {answerCorrect
              ? t('mobile.dashboard.correctBody')
              : settled
                ? t('mobile.dashboard.incorrectBody')
                : t('mobile.dashboard.retryOrSkipBody')}
          </p>
        </div>

        {settled ? (
          <TeamWaitScreen
            ready={teamReady}
            total={teamTotal}
            isFinalRound={isFinalRound}
            holding={holding}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={onRetry}
              className="w-full border border-slate-600 bg-transparent px-5 py-4 font-mono text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 hover:border-slate-400 hover:text-slate-200 transition"
            >
              {t('mobile.dashboard.retry')}
            </button>
            <SkipRoundButton
              armed={skipArmed}
              pending={skipping}
              onArm={onArmSkip}
              onConfirm={onSkip}
            />
          </>
        )}
      </section>
    </div>
  );
}

export function PlayerDashboard({ playerName, playerId, gameId, onExit }) {
  const t = useT();
  const [activeTab, setActiveTab] = useState('scanner');
  const [revealedLetter, setRevealedLetter] = useState(null);
  const [answerCorrect, setAnswerCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  // The hint text only exists on the client once it has been paid for.
  const [hint, setHint] = useState(null);
  const [hintArmed, setHintArmed] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [skipError, setSkipError] = useState(false);
  const [skipArmed, setSkipArmed] = useState(false);
  const [skipping, setSkipping] = useState(false);
  // { roundNumber, since } for the round whose result is currently on screen.
  const [resultLock, setResultLock] = useState(null);

  const {
    round,
    revealedLetters,
    game,
    currentRound,
    teamReady,
    teamTotal,
    sharePlayers,
    shareRounds,
    shareLoading,
  } = useTracker(() => {
    Meteor.subscribe('player.self', playerId);
    const gameSubscription = Meteor.subscribe('games.current', gameId);
    const trackedGame = Games.findOne(gameId);

    // The round the player is on is whatever round the *game* is on — the
    // server advances it only once every player has settled, so the team can
    // never drift apart the way a client-side counter let it.
    const activeRound = trackedGame?.currentRound ?? 1;
    Meteor.subscribe('rounds.forPlayer', playerId, activeRound);
    Meteor.subscribe('rounds.progress', gameId, activeRound);
    const teamRounds = Rounds.find({
      gameId,
      roundNumber: activeRound,
    }).fetch();

    const gameEnded = ['won', 'lost'].includes(trackedGame?.status);
    const playersSubscription = gameEnded
      ? Meteor.subscribe('players.inGame', gameId)
      : null;
    const roundsSubscription = gameEnded
      ? Meteor.subscribe('rounds.forGame', gameId)
      : null;
    return {
      round: Rounds.findOne({ playerId, roundNumber: activeRound }),
      revealedLetters: Players.findOne(playerId)?.revealedLetters ?? [],
      game: trackedGame,
      currentRound: activeRound,
      teamReady: teamRounds.filter((r) => r.status !== 'pending').length,
      teamTotal: teamRounds.length,
      sharePlayers: gameEnded ? Players.find({ gameId }).fetch() : [],
      shareRounds: gameEnded ? Rounds.find({ gameId }).fetch() : [],
      shareLoading:
        gameEnded &&
        (!gameSubscription.ready() ||
          !playersSubscription?.ready() ||
          !roundsSubscription?.ready()),
    };
  }, [playerId, gameId]);

  const totalRounds = game?.totalRounds ?? 1;
  // 'correct', 'wrong' (skipped) and 'timeout' all mean the same thing here:
  // this player is done with the round and is waiting on the others.
  const roundSettled = !!round && round.status !== 'pending';
  const isFinalRound = currentRound >= totalRounds;
  // The team has rolled on, but this player's result is still doing its dwell.
  const holding = !!resultLock && currentRound > resultLock.roundNumber;
  const shownRound = holding ? resultLock.roundNumber : currentRound;
  const settled = roundSettled || holding;
  const showResult = settled || revealedLetter !== null;
  // rounds.forPlayer withholds `letter`, so the banked letter comes from the
  // player's own tally — one entry is pushed per settled round, in order.
  const bankedLetter = revealedLetters[shownRound - 1];
  const displayLetter = settled
    ? (holding ? bankedLetter : (revealedLetter ?? bankedLetter)) ?? '?'
    : revealedLetter;
  const displayCorrect = settled
    ? holding
      ? bankedLetter !== '?'
      : round.status === 'correct'
    : answerCorrect;

  const shareSnapshot = useMemo(
    () =>
      buildEndgameShareSnapshot({
        game,
        playerId,
        playerName,
        players: sharePlayers,
        rounds: shareRounds,
      }),
    [game, playerId, playerName, sharePlayers, shareRounds]
  );

  // Fresh round, fresh screen — the previous round's result must not leak into
  // it. `resultLock` is deliberately left alone: it is what keeps the outgoing
  // round's letter on screen for its dwell.
  useEffect(() => {
    setRevealedLetter(null);
    setAnswerCorrect(null);
    setHint(null);
    setHintArmed(false);
    setSkipArmed(false);
    setSkipError(false);
    setActiveTab('scanner');
  }, [currentRound]);

  useEffect(() => {
    if (!round?._id || !round.hintRevealedAt || hint) return;
    let cancelled = false;
    Meteor.callAsync('rounds.revealHint', round._id)
      .then((res) => {
        if (!cancelled) setHint(res.hint);
      })
      .catch((err) =>
        console.error(
          '[rounds.revealHint] restore failed:',
          err.error || err.reason || err.message
        )
      );
    return () => {
      cancelled = true;
    };
  }, [round?._id, round?.hintRevealedAt, hint]);

  useEffect(() => {
    if (!hintArmed) return;
    const timer = setTimeout(() => setHintArmed(false), SKIP_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [hintArmed]);

  // Settling pins the result to the screen...
  useEffect(() => {
    if (!roundSettled) return;
    setResultLock((prev) =>
      prev?.roundNumber === currentRound
        ? prev
        : { roundNumber: currentRound, since: Date.now() }
    );
  }, [roundSettled, currentRound]);

  // ...and it stays pinned until the round has moved on *and* the result has
  // been readable for long enough.
  useEffect(() => {
    if (!resultLock || currentRound <= resultLock.roundNumber) return;
    const remaining = Math.max(
      0,
      RESULT_DWELL_MS - (Date.now() - resultLock.since)
    );
    const timer = setTimeout(() => setResultLock(null), remaining);
    return () => clearTimeout(timer);
  }, [resultLock, currentRound]);

  useEffect(() => {
    if (!skipArmed) return;
    const timer = setTimeout(() => setSkipArmed(false), SKIP_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [skipArmed]);

  // Start the per-round clock the first time the riddle is on screen. The
  // method is idempotent, so retries and remounts don't reset it.
  useEffect(() => {
    if (!round?._id || roundSettled) return;
    Meteor.call('rounds.markStarted', round._id);
  }, [round?._id, roundSettled]);

  // Depends on timePenaltyMs too, so a hint bought by any player shortens
  // everyone's countdown the moment it lands.
  useEffect(() => {
    if (!game?.startedAt || !game?.timerMinutes) return;
    const tick = () => {
      const remaining = remainingGameMs(game);
      setTimeLeft(remaining === null ? null : Math.floor(remaining / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game?.startedAt, game?.timerMinutes, game?.timePenaltyMs]);

  const isExpired = timeLeft !== null && timeLeft <= 0;
  const totalGameSeconds = game
    ? Math.round(gameBudgetMs(game) / 1000)
    : 30 * 60;

  const handleCorrectAnswer = useCallback((letter, isCorrect) => {
    setRevealedLetter(letter);
    setAnswerCorrect(isCorrect);
  }, []);

  const handleRevealHint = useCallback(async () => {
    if (!round?._id || hintLoading) return;
    setHintLoading(true);
    try {
      const res = await Meteor.callAsync('rounds.revealHint', round._id);
      setHint(res.hint);
    } catch (err) {
      console.error(
        '[rounds.revealHint] failed:',
        err.error || err.reason || err.message
      );
    } finally {
      setHintLoading(false);
      setHintArmed(false);
    }
  }, [round?._id, hintLoading]);

  const handleSkip = useCallback(async () => {
    if (!round?._id || skipping) return;
    setSkipping(true);
    setSkipError(false);
    try {
      await Meteor.callAsync('rounds.skip', round._id);
      // No local screen change needed: settling the round server-side flips
      // `roundSettled` through the subscription.
    } catch (err) {
      console.error(
        '[rounds.skip] failed:',
        err.error || err.reason || err.message
      );
      setSkipError(true);
    } finally {
      setSkipping(false);
      setSkipArmed(false);
    }
  }, [round?._id, skipping]);

  const handleRetry = () => {
    setRevealedLetter(null);
    setAnswerCorrect(null);
    setSkipArmed(false);
    setActiveTab('scanner');
  };

  if (game?.status === 'won') {
    return (
      <PlayerWinScreen
        playerId={playerId}
        snapshot={shareSnapshot}
        loading={shareLoading}
      />
    );
  }
  if (game?.status === 'lost') {
    return (
      <PlayerLoseScreen
        playerId={playerId}
        snapshot={shareSnapshot}
        loading={shareLoading}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black text-slate-100 overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex flex-1 items-center justify-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
            {t('mobile.dashboard.roundHeader', { n: shownRound })}
          </span>
          <RoundTimer
            timeLeft={timeLeft ?? totalGameSeconds}
            totalTime={totalGameSeconds}
            compact
          />
        </div>
        <button
          type="button"
          onClick={onExit}
          className="flex-shrink-0 border border-red-600 bg-red-600/10 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-red-400 transition hover:bg-red-600 hover:text-white"
        >
          {t('mobile.dashboard.lobbyButton')}
        </button>
      </header>

      {!showResult && activeTab === 'scanner' && (
        <div className="flex-shrink-0 flex items-start gap-3 border-b border-slate-800 px-5 py-3">
          <span className="flex-shrink-0 bg-red-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
            {t('mobile.dashboard.roundBadge', { n: currentRound })}
          </span>
          <p className="font-mono text-xs leading-5 text-slate-300">
            {round?.riddleText ?? t('mobile.dashboard.loadingRiddle')}
          </p>
        </div>
      )}

      {!showResult && activeTab === 'scanner' && round?._id && (
        <div className="flex-shrink-0 border-b border-slate-800 px-5 py-2">
          {hint ? (
            <p className="font-mono text-xs text-amber-400">💡 {hint}</p>
          ) : (
            <button
              type="button"
              disabled={hintLoading}
              onClick={hintArmed ? handleRevealHint : () => setHintArmed(true)}
              className={`font-mono text-[10px] uppercase tracking-widest transition disabled:opacity-40 ${
                hintArmed
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-amber-500 hover:text-amber-300'
              }`}
            >
              💡{' '}
              {hintLoading
                ? t('mobile.dashboard.revealingHint')
                : hintArmed
                  ? t('mobile.dashboard.hintConfirm', {
                      n: HINT_PENALTY_MINUTES,
                    })
                  : t('mobile.dashboard.revealHint', {
                      n: HINT_PENALTY_MINUTES,
                    })}
            </button>
          )}
        </div>
      )}

      {!showResult && activeTab === 'scanner' && isExpired && (
        <div className="flex-shrink-0 border-b border-red-900/60 bg-red-950/40 px-5 py-2 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-red-400">
            {t('mobile.dashboard.timeExpired')}
          </p>
        </div>
      )}

      {skipError && (
        <div className="flex-shrink-0 border-b border-red-900/60 bg-red-950/40 px-5 py-2 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-red-400">
            {t('mobile.dashboard.skipFailed')}
          </p>
        </div>
      )}

      <div
        className={`flex-1 min-h-0 flex flex-col ${showResult ? '' : 'pb-16'}`}
      >

        {showResult ? (
          <ResultScreen
            revealedLetter={displayLetter}
            answerCorrect={displayCorrect}
            settled={settled}
            holding={holding}
            teamReady={teamReady}
            teamTotal={teamTotal}
            isFinalRound={isFinalRound}
            skipArmed={skipArmed}
            skipping={skipping}
            onArmSkip={() => setSkipArmed(true)}
            onSkip={handleSkip}
            onRetry={handleRetry}
          />
        ) : (
          <>
            {activeTab === 'letters' && (
              <div className="flex-1 overflow-y-auto px-5">
                <LettersScreen
                  revealedLetters={revealedLetters}
                  totalRounds={totalRounds}
                />
              </div>
            )}

            {activeTab === 'scanner' && (
              <>
                <MobileRiddlePage
                  roundId={round?._id}
                  riddleText={round?.riddleText}
                  targetObject={round?.answer}
                  isExpired={isExpired}
                  onCorrect={handleCorrectAnswer}
                />
                {round?._id && (
                  <div className="flex-shrink-0 border-t border-slate-900 bg-black px-5 pb-4">
                    <SkipRoundButton
                      armed={skipArmed}
                      pending={skipping}
                      onArm={() => setSkipArmed(true)}
                      onConfirm={handleSkip}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {!showResult && (
        <MobileBottomNav active={activeTab} onChange={setActiveTab} />
      )}
    </div>
  );
}
