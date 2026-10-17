// Meteor's JSX transform still requires React in module scope.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Rounds } from '/imports/api/rounds/RoundsCollection';
import { Players } from '/imports/api/players/PlayersCollection';
import { Games } from '/imports/api/games/GamesCollection';
import MobileRiddlePage from './gameplay/MobileRiddlePage';
import MobileDrawingPage from './gameplay/MobileDrawingPage';
import { normalizeAnswerMode } from '/imports/lib/answerModes';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { RoundTimer } from '../components/gameplay/RoundTimer';
import { ThemePicker } from '../../shared/components/theme/ThemePicker';
import { PlayerWinScreen } from './result/PlayerWinScreen';
import { PlayerLoseScreen } from './result/PlayerLoseScreen';
import { buildEndgameShareSnapshot } from '../components/result/shareSnapshot';
import {
  HINT_PENALTY_MINUTES,
  gameBudgetMs,
  remainingGameMs,
} from '/imports/lib/gameClock';
import { useT } from '../../../languages/LanguageProvider';
import { useMatch } from '/imports/ui/shared/hooks/useMatch';
import { isVersusGame, teamPhase } from '/imports/lib/teamStatus';
import { MobileFinalRiddle } from '../components/gameplay/MobileFinalRiddle';

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
        <p className="es-label">{t('mobile.dashboard.lettersCollected')}</p>
        <h2 className="es-title mt-2 text-3xl text-ink">
          {t('mobile.dashboard.roundsComplete', {
            n: revealedLetters.filter((l) => l && l !== '?').length,
            total: totalRounds,
          })}
        </h2>
      </div>
      {/* totalRounds runs 1-10, so the tiles wrap instead of overflowing
          a narrow phone the way a single flex row would. */}
      <div
        className="mt-2 grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))' }}
      >
        {Array.from({ length: totalRounds }, (_, i) => {
          const letter = revealedLetters[i];
          const hasLetter = letter && letter !== '?';
          return (
            <div
              key={i}
              className="es-plate min-w-0 px-2 pb-3 pt-3 text-center"
            >
              <p className="es-label mb-2 text-sm">
                {t('mobile.dashboard.roundLabel', { n: i + 1 })}
              </p>
              <p
                className={`es-lcd py-2 text-4xl ${
                  hasLetter ? 'es-lcd-text' : 'font-display font-semibold text-brand-bright/10'
                }`}
              >
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
      className={`es-btn es-btn-sm w-full ${
        armed ? 'border-incorrect bg-incorrect/10 text-incorrect' : 'es-btn-ghost'
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
      <div className="es-well px-5 py-6 text-center">
        <p className="pulse-text font-display text-base tracking-[0.04em] text-muted">
          {t('mobile.dashboard.nextRoundStarting')}
        </p>
      </div>
    );
  }

  return (
    <div className="es-well px-5 py-6 text-center">
      <p className="es-label flex items-center justify-center gap-2">
        {!finished && <span className="es-led" data-state="busy" aria-hidden="true" />}
        {finished
          ? t('mobile.dashboard.allRoundsCompleted')
          : t('mobile.dashboard.awaitingTeam')}
      </p>
      {!finished && total > 0 && (
        <p className="mt-3 font-display text-3xl font-bold text-ink">
          {t('mobile.dashboard.operativesReady', { ready, total })}
        </p>
      )}
      <p className="mt-3 text-sm leading-6 text-muted">
        {finished
          ? t('mobile.dashboard.reportToTerminal')
          : t('mobile.dashboard.waitingBody')}
      </p>
    </div>
  );
}

// One line under the header in a versus match: who the rival is and how far
// along they are.
function RivalStrip({ rival, phase }) {
  const t = useT();
  const label =
    phase === 'escaped'
      ? t('mobile.versus.rivalEscaped')
      : phase === 'failed'
        ? t('mobile.versus.rivalFailed')
        : phase === 'final'
          ? t('mobile.versus.rivalFinal')
          : t('mobile.versus.rivalRound', {
              n: rival.currentRound ?? 1,
              total: rival.totalRounds,
            });
  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-line bg-panel/80 px-4 py-2">
      <span className="font-display text-xs font-bold uppercase tracking-[0.06em] text-brand-bright">
        {t('mobile.versus.vs')}
      </span>
      <span className="min-w-0 flex-1 truncate font-display text-[13px] font-bold uppercase tracking-[0.06em] text-ink">
        {rival.groupName}
      </span>
      <span
        className={`font-display text-xs uppercase tracking-[0.06em] ${
          phase === 'final' || phase === 'escaped' ? 'text-brand-bright' : 'text-muted'
        }`}
      >
        {label}
      </span>
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
  onNext,
  finalRiddleSlot,
}) {
  const t = useT();
  // A solved riddle with another one queued behind it (covering for a
  // teammate) banks its letter like a settled round, then moves on.
  const banked = settled || !!onNext;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
      <section className="flex flex-col gap-5 pt-5">
        <h1 className={`es-title text-6xl ${answerCorrect ? 'text-correct' : 'text-brand-bright'}`}>
          {answerCorrect
            ? t('mobile.dashboard.correctBang')
            : settled
              ? t('mobile.dashboard.roundSkipped')
              : t('mobile.dashboard.incorrectBang')}
        </h1>

        {/* Only a settled round has actually banked (or forfeited) a letter —
            a failed scan can still be retried, so nothing is revealed yet. */}
        {banked && (
          <div className="es-plate px-6 pb-6 pt-5 text-center">
            <p className="es-label flex items-center justify-center gap-2">
              <span className="es-led" data-state={answerCorrect ? 'ok' : 'off'} aria-hidden="true" />
              {t('mobile.dashboard.dataRecoveryActive')}
            </p>
            <p className="es-lcd es-lcd-text mx-auto mt-5 w-28 py-3 text-7xl leading-none">
              {revealedLetter ?? '?'}
            </p>
            <p className="es-label mt-5">
              {t('mobile.dashboard.letterRevealed')}
            </p>
          </div>
        )}

        <div className="es-well px-5 py-5">
          <h2 className="es-title text-2xl text-ink">
            {answerCorrect
              ? t('mobile.dashboard.puzzleSolved')
              : settled
                ? t('mobile.dashboard.letterForfeited')
                : t('mobile.dashboard.wrongObjectDetected')}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {answerCorrect
              ? t('mobile.dashboard.correctBody')
              : settled
                ? t('mobile.dashboard.incorrectBody')
                : t('mobile.dashboard.retryOrSkipBody')}
          </p>
        </div>

        {onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="es-btn es-btn-primary w-full"
          >
            {t('mobile.dashboard.nextRiddle')}
          </button>
        ) : settled && finalRiddleSlot ? (
          finalRiddleSlot
        ) : settled ? (
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
              className="es-btn es-btn-primary w-full"
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
  // { roundId, letter, correct } from the last scan. Keyed by round because a
  // player covering for a teammate can be handed a new riddle mid-round.
  const [answered, setAnswered] = useState(null);
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
    taskIds,
    roundSettled,
    coveringFor,
    revealedLetters,
    game,
    currentRound,
    teamReady,
    teamTotal,
    sharePlayers,
    shareRounds,
    shareLoading,
  } = useTracker(() => {
    // player.self is held by PlayerFlow for the whole session — it doubles as
    // the server's presence signal, so it must not drop with this screen.
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

    // This player's own riddle unless a teammate holds it, then any riddles
    // they are covering for teammates who left — own first.
    const ownRound = teamRounds.find((r) => r.playerId === playerId);
    const tasks = teamRounds
      .filter((r) =>
        r.coveredBy ? r.coveredBy === playerId : r.playerId === playerId
      )
      .sort((a, b) => (a.playerId === playerId ? -1 : b.playerId === playerId ? 1 : 0));
    const nextTask = tasks.find((r) => r.status === 'pending');
    const shownTask = nextTask ?? ownRound;
    const coveredPlayer =
      shownTask && shownTask.playerId !== playerId
        ? Players.findOne(shownTask.playerId)
        : null;
    return {
      round: shownTask,
      taskIds: tasks.map((r) => r._id),
      roundSettled: !!shownTask && !nextTask,
      coveringFor: coveredPlayer?.name ?? null,
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

  const versus = isVersusGame(game);
  const {
    match,
    teams: matchTeams,
    rounds: matchRounds,
  } = useMatch(versus ? game?.matchId : null);
  const rival = matchTeams.find((team) => team._id !== gameId) ?? null;
  const rivalPhase = rival ? teamPhase(rival, matchRounds) : null;

  let versusLine = null;
  if (match?.status === 'finished' && rival) {
    const team = rival.groupName;
    if (!match.winnerGameId) versusLine = t('mobile.versus.draw');
    else if (match.winnerGameId === gameId)
      versusLine = t('mobile.versus.wonMatch', { team });
    else versusLine = t('mobile.versus.rivalEscapedFirst', { team });
  }

  const revealedLetter = answered?.letter ?? null;
  const answerCorrect = answered?.correct ?? null;
  // The riddle just solved was settled and the next covered riddle took its
  // place — the result stays up until the player moves on to it. Only a riddle
  // from this round counts: the last player's submit can advance the round
  // before its own result arrives, and that late result must not paint
  // CORRECT! (with NEXT RIDDLE) over the next round's riddle.
  const handedOn =
    !!answered?.correct &&
    !!round &&
    answered.roundId !== round._id &&
    taskIds.includes(answered.roundId) &&
    !roundSettled;

  const totalRounds = game?.totalRounds ?? 1;
  // Old games have no `mode`; normalizeAnswerMode treats that as camera.
  const answerMode = normalizeAnswerMode(game?.mode);
  // 'correct', 'wrong' (skipped) and 'timeout' all mean the same thing here:
  // this player has nothing left to solve this round and is waiting on the
  // others. `roundSettled` comes from the tracker, which knows about riddles
  // covered for teammates too.
  const isFinalRound = currentRound >= totalRounds;
  // The team has rolled on, but this player's result is still doing its dwell.
  const holding = !!resultLock && currentRound > resultLock.roundNumber;
  const shownRound = holding ? resultLock.roundNumber : currentRound;
  const settled = roundSettled || holding;
  const showResult =
    settled || handedOn || (!!answered && answered.roundId === round?._id);
  // rounds.forPlayer withholds `letter`, so the banked letter comes from the
  // player's own tally — one entry is pushed per settled round, in order.
  const bankedLetter = revealedLetters[shownRound - 1];
  const displayLetter = settled
    ? (holding ? bankedLetter : (revealedLetter ?? bankedLetter)) ?? '?'
    : revealedLetter;
  const displayCorrect = settled
    ? holding
      ? bankedLetter !== '?'
      : (answerCorrect ?? round.status === 'correct')
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
    setAnswered(null);
    setHint(null);
    setHintArmed(false);
    setSkipArmed(false);
    setSkipError(false);
    setActiveTab('scanner');
  }, [currentRound]);

  // Settling one riddle can hand this player the next one they are covering
  // for a teammate, within the same round. Its hint and skip start fresh.
  useEffect(() => {
    setHint(null);
    setHintArmed(false);
    setSkipArmed(false);
    setSkipError(false);
  }, [round?._id]);

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

  const handleCorrectAnswer = useCallback((letter, isCorrect, roundId) => {
    setAnswered({ roundId, letter, correct: isCorrect });
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
    setAnswered(null);
    setSkipArmed(false);
    setActiveTab('scanner');
  };

  if (game?.status === 'won') {
    return (
      <PlayerWinScreen
        versusLine={versusLine}
        playerId={playerId}
        snapshot={shareSnapshot}
        loading={shareLoading}
      />
    );
  }
  if (game?.status === 'lost') {
    return (
      <PlayerLoseScreen
        versusLine={versusLine}
        playerId={playerId}
        snapshot={shareSnapshot}
        loading={shareLoading}
      />
    );
  }

  return (
    <div className="es-room flex h-[100dvh] flex-col overflow-hidden">
      <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-line px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="es-rec-dot" aria-hidden="true" />
          <span className="truncate font-display text-lg font-semibold tracking-[0.03em] text-ink">
            {t('mobile.dashboard.roundHeader', { n: shownRound })}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <RoundTimer
            timeLeft={timeLeft ?? totalGameSeconds}
            totalTime={totalGameSeconds}
          />
          <ThemePicker compact />
          <button
            type="button"
            onClick={onExit}
            className="es-chip"
          >
            {t('mobile.dashboard.lobbyButton')}
          </button>
        </div>
      </header>

      {rival && <RivalStrip rival={rival} phase={rivalPhase} />}

      {!showResult && activeTab === 'scanner' && (
        // The riddle is handed over as a case file, like the landing page's.
        <div className="es-paper mx-3 mt-3 flex flex-shrink-0 -rotate-[0.6deg] items-start gap-3 px-4 py-3">
          <span className="es-stamp flex-shrink-0 !text-sm text-[#a3150e]">
            {t('mobile.dashboard.roundBadge', { n: currentRound })}
          </span>
          <div className="min-w-0">
            {coveringFor && (
              <p className="es-hand mb-1 text-xs text-[#a3150e]">
                {t('mobile.dashboard.coveringFor', { name: coveringFor })}
              </p>
            )}
            <p className="text-[15px] leading-6">
              {round?.riddleText ?? t('mobile.dashboard.loadingRiddle')}
            </p>
          </div>
        </div>
      )}

      {!showResult && activeTab === 'scanner' && round?._id && (
        <div className="flex-shrink-0 px-4 py-1">
          {hint ? (
            <p className="py-2 text-sm leading-6 text-muted">💡 {hint}</p>
          ) : (
            <button
              type="button"
              disabled={hintLoading}
              onClick={hintArmed ? handleRevealHint : () => setHintArmed(true)}
              className={`es-link min-h-[44px] text-base disabled:opacity-40 ${
                hintArmed ? 'text-incorrect' : 'text-muted'
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
        <div className="es-tape flex-shrink-0 text-sm">
          <p>
            {t('mobile.dashboard.timeExpired')}
          </p>
        </div>
      )}

      {skipError && (
        <div className="flex-shrink-0 border-b border-line bg-panel px-4 py-2 text-center">
          <p className="font-display text-[13px] uppercase tracking-[0.06em] text-incorrect">
            {t('mobile.dashboard.skipFailed')}
          </p>
        </div>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col ${showResult ? '' : 'pb-[calc(4rem+env(safe-area-inset-bottom))]'}`}
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
            onNext={handedOn ? () => setAnswered(null) : null}
            finalRiddleSlot={
              versus &&
              isFinalRound &&
              !holding &&
              teamTotal > 0 &&
              teamReady >= teamTotal ? (
                <MobileFinalRiddle
                  gameId={gameId}
                  attemptsUsed={game?.finalRiddleAttempts ?? 0}
                  rivalName={rival?.groupName}
                />
              ) : null
            }
          />
        ) : (
          <>
            {activeTab === 'letters' && (
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
                <LettersScreen
                  revealedLetters={revealedLetters}
                  totalRounds={totalRounds}
                />
              </div>
            )}

            {activeTab === 'scanner' && (
              <>
                {answerMode === 'drawing' ? (
                  // Keyed by round so the next riddle starts on a blank canvas.
                  <MobileDrawingPage
                    key={round?._id}
                    roundId={round?._id}
                    targetObject={round?.answer}
                    isExpired={isExpired}
                    onCorrect={handleCorrectAnswer}
                  />
                ) : (
                  <MobileRiddlePage
                    roundId={round?._id}
                    targetObject={round?.answer}
                    isExpired={isExpired}
                    onCorrect={handleCorrectAnswer}
                  />
                )}
                {round?._id && (
                  <div className="flex-shrink-0 border-t border-line bg-ground/80 px-5 pb-4 pt-3">
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
