import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../../../../api/games/GamesCollection';
import { Rounds } from '../../../../api/rounds/RoundsCollection';
import { Players } from '../../../../api/players/PlayersCollection';
import { GameEvents } from '../../../../api/events/GameEventsCollection';
import SidebarLayout from '/imports/ui/host/layouts/SidebarLayout.jsx';
import { remainingGameMs } from '/imports/lib/gameClock';
import { useT } from '../../../../languages/LanguageProvider';
import { useGameUiTheme } from '../../../shared/components/theme/UiThemeProvider';
import { useMatch } from '/imports/ui/shared/hooks/useMatch';
import TeamScoreCard from '../../components/match/TeamScoreCard';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';

// Online versus: the rival team's live standing, above our own manifest.
const RivalPanel = ({ gameId, matchId }) => {
  const t = useT();
  const { match, teams, players, rounds } = useMatch(matchId);
  const rival = teams.find((team) => team._id !== gameId);
  if (!match || !rival) return null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="es-title text-2xl text-ink">{t('host.match.rival')}</h2>
      <TeamScoreCard team={rival} players={players} rounds={rounds} compact />
    </div>
  );
};

// Event types drawn in the accent colour — the moments the host most wants to spot.
const HIGHLIGHTED_EVENTS = ['roundSolved', 'gameWon'];

const formatClock = (date) =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');


const CheckIcon = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
    <path d="M1 6L6 11L15 1" style={{ stroke: 'rgb(var(--es-correct))' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 1L13 13M13 1L1 13" style={{ stroke: 'rgb(var(--es-incorrect))' }} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FORCE_CONFIRM_MS = 5000;

const ForceAdvanceButton = ({ gameId, pendingCount }) => {
  const t = useT();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), FORCE_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const advance = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await Meteor.callAsync('games.advanceRound', gameId);
    } catch (err) {
      console.error('[games.advanceRound] failed:', err.reason || err.message);
      setFailed(true);
    } finally {
      setBusy(false);
      setArmed(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {failed && (
        <span className="text-sm text-incorrect">{t('host.progress.forceAdvanceFailed')}</span>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={armed ? advance : () => setArmed(true)}
        className={`es-btn es-btn-sm ${armed ? 'es-btn-primary' : 'es-btn-ghost'}`}
      >
        {busy
          ? t('host.progress.forceAdvancing')
          : armed
            ? t('host.progress.forceAdvanceConfirm', { n: pendingCount })
            : t('host.progress.forceAdvance')}
      </button>
    </div>
  );
};

const ProgressPage = () => {
  const { gameId } = useParams();
  useGameUiTheme(gameId);
  const t = useT();
  const [timeLeft, setTimeLeft] = useState(null);

  const { game, rounds, players, events, loading } = useTracker(() => {
    const gameSub = Meteor.subscribe('games.current', gameId);
    const roundsSub = Meteor.subscribe('rounds.forGame', gameId);
    const playersSub = Meteor.subscribe('players.inGame', gameId);
    const eventsSub = Meteor.subscribe('gameEvents.forGame', gameId);
    return {
      loading: !gameSub.ready() || !roundsSub.ready() || !playersSub.ready() || !eventsSub.ready(),
      game: Games.findOne(gameId),
      rounds: Rounds.find({ gameId }).fetch(),
      players: Players.find({ gameId }, { sort: { joinedAt: 1 } }).fetch(),
      events: GameEvents.find({ gameId }, { sort: { createdAt: -1 } }).fetch(),
    };
  }, [gameId]);

  useEffect(() => {
    if (!game?.startedAt || !game?.timerMinutes) {
      setTimeLeft(null);
      return;
    }
    const tick = () => setTimeLeft(remainingGameMs(game));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game?.startedAt, game?.timerMinutes, game?.timePenaltyMs]);

  // The game can end while this screen is up — the clock running out, an
  // admin ending it, a rival escaping first — so follow it to the end screen.
  // Only on the change itself, so the board can still be reopened afterwards.
  const navigate = useNavigate();
  const lastStatus = useRef(null);
  useEffect(() => {
    const status = game?.status;
    if (
      lastStatus.current === 'in_progress' &&
      (status === 'won' || status === 'lost')
    ) {
      navigate(`/game/${gameId}/final-riddle`, { replace: true });
    }
    lastStatus.current = status ?? null;
  }, [game?.status, gameId]);

  if (loading) {
    return (
      <div className="es-room flex items-center justify-center">
        <p className="pulse-text font-display text-lg text-muted">{t('host.progress.loading')}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="es-room flex items-center justify-center">
        <p className="font-display text-lg text-brand-bright">{t('host.progress.gameNotFound')}</p>
      </div>
    );
  }

  const formatTime = (ms) => {
    if (ms === null) return '--:--';
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;

  // SCRUM-110: calculate team progress from real round data
  const totalRoundDocs = rounds.length;
  const solvedRounds = rounds.filter(r => r.status === 'correct').length;
  const teamProgress = totalRoundDocs > 0 ? Math.round((solvedRounds / totalRoundDocs) * 100) : 0;
  const pendingThisRound = rounds.filter(r => r.roundNumber === game.currentRound && r.status === 'pending').length;

  // The room's clock reads like the keypad's display; the rest sit beside it.
  return (
    <SidebarLayout gameId={gameId} activePage="progress">
      <RoomBar home={null} />

      <div className="flex flex-1 flex-col gap-8 px-6 py-8 lg:px-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="es-plate flex flex-col gap-3 px-5 pb-5 pt-4">
            <h2 className="es-label flex items-center justify-between">
              {t('host.progress.timeRemaining')}
              <span className="es-led" data-state={isExpired ? 'off' : game.startedAt ? 'busy' : 'off'} aria-hidden="true" />
            </h2>
            <p className={`es-lcd px-4 py-2 text-center text-7xl leading-none tabular-nums ${isExpired ? 'font-display font-semibold text-dim' : 'es-lcd-text'}`}>
              {game.startedAt ? formatTime(timeLeft) : '--:--'}
            </p>
            {!game.startedAt && <p className="text-sm text-muted">{t('host.progress.gameNotStarted')}</p>}
            {game.startedAt && game.timePenaltyMs > 0 && (
              <p className="text-sm text-incorrect">
                {t('host.progress.hintPenalty', { time: formatTime(game.timePenaltyMs) })}
              </p>
            )}
          </div>

          {/* SCRUM-110: wire team progress to real round data */}
          <div className="es-plate flex flex-col justify-between gap-4 px-5 pb-5 pt-4">
            <h2 className="es-label">{t('host.progress.teamProgress')}</h2>
            <p className="es-title text-6xl tabular-nums text-ink">
              {teamProgress}<span className="text-3xl text-muted">%</span>
            </p>
            <div className="es-lcd h-2 overflow-hidden !rounded-full">
              <div className="h-full bg-brand-bright shadow-[0_0_10px_rgb(var(--es-brand-bright))]" style={{ width: `${teamProgress}%` }} />
            </div>
          </div>

          {/* SCRUM-110: wire round counter to real game state */}
          <div className="es-plate flex flex-col justify-between gap-4 px-5 pb-5 pt-4">
            <h2 className="es-label">{t('host.progress.currentRound')}</h2>
            <p className="es-title text-6xl tabular-nums text-ink">
              {String(game.currentRound).padStart(2, '0')}
              <span className="text-3xl text-muted"> / {String(game.totalRounds).padStart(2, '0')}</span>
            </p>
            <p className="text-sm text-muted">
              {t('host.progress.remainingPuzzles', { n: Math.max(0, game.totalRounds - game.currentRound) })}
            </p>
          </div>
        </div>

        {game.matchId && <RivalPanel gameId={gameId} matchId={game.matchId} />}

        {/* Operative Manifest */}
        <section className="es-plate overflow-x-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 className="es-title text-2xl text-ink">{t('host.progress.operativeManifest')}</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5"><CheckIcon />{t('host.progress.correct')}</span>
              <span className="flex items-center gap-1.5"><CrossIcon />{t('host.progress.incorrect')}</span>
              <span>{t('host.progress.pending')}</span>
              {game.status === 'in_progress' && pendingThisRound > 0 && (
                <ForceAdvanceButton gameId={gameId} pendingCount={pendingThisRound} />
              )}
            </div>
          </div>

          <div className="es-label flex min-w-[640px] items-center px-6 py-3">
            <div style={{ width: 180 }}>{t('host.progress.player')}</div>
            {Array.from({ length: game.totalRounds }, (_, i) => (
              <div
                key={i}
                className={`flex flex-1 items-center justify-center gap-1.5 ${(i + 1) === game.currentRound ? 'text-ink' : ''}`}
              >
                {t('host.progress.round', { n: i + 1 })}
                {(i + 1) === game.currentRound && <span className="es-led" data-state="ready" aria-hidden="true" />}
              </div>
            ))}
            <div className="text-right" style={{ width: 130 }}>{t('host.progress.status')}</div>
          </div>

          {players.length === 0 && (
            <p className="px-6 pb-6 text-muted">{t('host.progress.noPlayersJoined')}</p>
          )}

          {players.map((player) => {
            const playerRounds = rounds.filter(r => r.playerId === player._id);
            const hasAnyWrong = playerRounds.some(r => r.status === 'wrong' || r.status === 'timeout');
            const allDone = playerRounds.filter(r => r.status !== 'pending').length === game.totalRounds;
            const allCorrect = playerRounds.every(r => r.status === 'correct');
            const offline = !!player.disconnectedAt;

            let statusLabel, statusClass;
            if (offline) {
              statusLabel = t('host.progress.offline'); statusClass = 'border-line text-muted';
            } else if (allDone && allCorrect) {
              statusLabel = t('host.progress.completed'); statusClass = 'border-line bg-line text-ink';
            } else if (hasAnyWrong) {
              statusLabel = t('host.progress.needsHelp'); statusClass = 'border-brand bg-brand text-on-brand';
            } else {
              statusLabel = t('host.progress.inProgress'); statusClass = 'border-correct/40 bg-correct/15 text-correct';
            }

            return (
              <div key={player._id} className="flex min-w-[640px] items-center border-t border-line/70 px-6 py-4">
                <div
                  className={`truncate font-display text-lg font-semibold tracking-[0.02em] ${offline ? 'text-muted' : 'text-ink'}`}
                  style={{ width: 180 }}
                >
                  {player.name.toUpperCase()}
                </div>

                {Array.from({ length: game.totalRounds }, (_, ri) => {
                  const roundNum = ri + 1;
                  const round = playerRounds.find(r => r.roundNumber === roundNum);
                  const isFuture = roundNum > game.currentRound;

                  let cell;
                  if (isFuture) {
                    cell = <span className="text-dim">—</span>;
                  } else if (!round || round.status === 'pending') {
                    cell = <span className="font-display text-lg font-semibold text-muted">?</span>;
                  } else if (round.status === 'correct') {
                    cell = <CheckIcon />;
                  } else {
                    cell = <CrossIcon />;
                  }

                  return (
                    <div key={roundNum} className="flex flex-1 items-center justify-center">
                      {cell}
                    </div>
                  );
                })}

                <div className="flex justify-end" style={{ width: 130 }}>
                  <span className={`rounded-sm border px-2 py-0.5 font-display text-sm tracking-[0.03em] ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Event Log: typed up as it happens. */}
        <section className="es-well px-6 py-5">
          <h2 className="es-title mb-4 text-2xl text-ink">{t('host.progress.eventLog')}</h2>
          {events.length === 0 && <p className="text-muted">{t('host.progress.noEvents')}</p>}
          <ol className="flex flex-col gap-2">
            {events.map((event) => {
              const highlight = HIGHLIGHTED_EVENTS.includes(event.type);
              const message = t(`host.progress.events.${event.type}`, {
                name: event.playerName?.toUpperCase() ?? '',
                n: event.roundNumber,
              });
              return (
                <li key={event._id} className="flex items-start gap-4 text-sm leading-6">
                  <span className="whitespace-nowrap tabular-nums text-dim">{formatClock(event.createdAt)}</span>
                  <span className={highlight ? 'text-brand-bright' : 'text-muted'}>{message}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </SidebarLayout>
  );
};

export default ProgressPage;