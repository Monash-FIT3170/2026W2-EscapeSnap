import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
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
        <span style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-incorrect))' }}>{t('host.progress.forceAdvanceFailed')}</span>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={armed ? advance : () => setArmed(true)}
        style={{
          minHeight: 44, padding: '0 16px', fontSize: 10, fontWeight: 700, letterSpacing: '1px',
          color: armed ? 'rgb(var(--es-on-brand))' : 'rgb(var(--es-ink))', background: armed ? 'rgb(var(--es-brand))' : 'transparent', border: '1px solid rgb(var(--es-brand))',
          cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
        }}
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--es-ground))' }}>
        <p style={{ color: 'rgb(var(--es-muted))', fontSize: 10, letterSpacing: '1px' }}>{t('host.progress.loading')}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--es-ground))' }}>
        <p style={{ color: 'rgb(var(--es-brand))', fontSize: 10, letterSpacing: '1px' }}>{t('host.progress.gameNotFound')}</p>
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

  return (
    <SidebarLayout gameId={gameId} activePage="progress">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ background: 'rgb(var(--es-ground))', borderBottom: '2px solid rgb(var(--es-panel))' }}>
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-black tracking-wide text-brand">ESCAPESNAP</span>
          <div style={{ width: 1, height: 16, background: 'rgb(var(--es-line))', opacity: 0.3 }} />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 p-8 flex flex-col gap-8">

        {/* Stats row */}
        <div className="grid grid-cols-4" style={{ height: 160 }}>
          <div className="flex flex-col justify-between p-6" style={{ background: 'rgb(var(--es-ground))', borderLeft: `2px solid ${isExpired ? 'rgb(var(--es-incorrect))' : 'rgb(var(--es-brand))'}` }}>
            <span style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.progress.timeRemaining')}</span>
            <span style={{ fontWeight: 300, fontSize: 60, letterSpacing: '-3px', lineHeight: '60px', color: isExpired ? 'rgb(var(--es-incorrect))' : 'rgb(var(--es-ink))' }}>
              {game.startedAt ? formatTime(timeLeft) : '--:--'}
            </span>
            {!game.startedAt && (
              <span style={{ fontSize: 9, color: 'rgb(var(--es-muted))', opacity: 0.6, letterSpacing: '0.5px' }}>{t('host.progress.gameNotStarted')}</span>
            )}
            {game.startedAt && game.timePenaltyMs > 0 && (
              <span style={{ fontSize: 9, color: 'rgb(var(--es-incorrect))', letterSpacing: '0.5px' }}>
                {t('host.progress.hintPenalty', { time: formatTime(game.timePenaltyMs) })}
              </span>
            )}
          </div>

          {/* SCRUM-110: wire team progress to real round data */}
          <div className="flex flex-col justify-between p-6" style={{ background: 'rgb(var(--es-panel))' }}>
            <span style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.progress.teamProgress')}</span>
            <div className="flex items-end gap-2">
              <span style={{ fontWeight: 700, fontSize: 48, lineHeight: '48px', color: 'rgb(var(--es-ink))' }}>{teamProgress}</span>
              <span style={{ fontSize: 24, color: 'rgb(var(--es-muted))', paddingBottom: 4 }}>%</span>
            </div>
            <div style={{ height: 4, background: 'rgb(var(--es-line))' }}>
              <div style={{ height: '100%', width: `${teamProgress}%`, background: 'rgb(var(--es-brand))' }} />
            </div>
          </div>

          {/* SCRUM-110: wire round counter to real game state */}
          <div className="flex flex-col justify-between p-6" style={{ background: 'rgb(var(--es-panel))' }}>
            <span style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.progress.currentRound')}</span>
            <div className="flex items-end gap-2">
              <span style={{ fontWeight: 700, fontSize: 48, lineHeight: '48px', color: 'rgb(var(--es-ink))' }}>
                {String(game.currentRound).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 18, color: 'rgb(var(--es-muted))', paddingBottom: 6 }}>
                / {String(game.totalRounds).padStart(2, '0')}
              </span>
            </div>
            <span style={{ fontSize: 10, color: 'rgb(var(--es-muted))', opacity: 0.6 }}>
              {t('host.progress.remainingPuzzles', { n: Math.max(0, game.totalRounds - game.currentRound) })}
            </span>
          </div>

          <div className="flex items-center justify-center p-6 relative" style={{ background: 'rgb(var(--es-ground))' }}>
            <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, color: 'rgb(var(--es-muted))', opacity: 0.4 }}>{t('host.progress.authQrScan')}</span>
            <div style={{ width: 96, height: 96, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>

        {/* Operative Manifest */}
        <div style={{ background: 'rgb(var(--es-panel))' }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgb(var(--es-line))' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 4, height: 16, background: 'rgb(var(--es-brand))' }} />
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '1.4px', color: 'rgb(var(--es-ink))' }}>{t('host.progress.operativeManifest')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckIcon />
                <span style={{ fontSize: 10, color: 'rgb(var(--es-muted))' }}>{t('host.progress.correct')}</span>
              </div>
              <div className="flex items-center gap-1">
                <CrossIcon />
                <span style={{ fontSize: 10, color: 'rgb(var(--es-muted))' }}>{t('host.progress.incorrect')}</span>
              </div>
              <span style={{ fontSize: 10, color: 'rgb(var(--es-muted))' }}>{t('host.progress.pending')}</span>
              {game.status === 'in_progress' && pendingThisRound > 0 && (
                <ForceAdvanceButton gameId={gameId} pendingCount={pendingThisRound} />
              )}
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center px-6 py-3" style={{ background: 'rgb(var(--es-ground))', borderBottom: '1px solid rgb(var(--es-line))' }}>
            <div style={{ width: 160, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.progress.player')}</div>
            {Array.from({ length: game.totalRounds }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: '1px',
                  color: (i + 1) === game.currentRound ? 'rgb(var(--es-ink))' : 'rgb(var(--es-muted))',
                  textAlign: 'center',
                }}
              >
                {t('host.progress.round', { n: i + 1 })}{(i + 1) === game.currentRound ? ' ●' : ''}
              </div>
            ))}
            <div style={{ width: 120, fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'rgb(var(--es-muted))', textAlign: 'right' }}>{t('host.progress.status')}</div>
          </div>

          {players.length === 0 && (
            <div className="px-6 py-6" style={{ color: 'rgb(var(--es-dim))', fontSize: 11, letterSpacing: '1px' }}>
              {t('host.progress.noPlayersJoined')}
            </div>
          )}

          {players.map((player, i) => {
            const playerRounds = rounds.filter(r => r.playerId === player._id);
            const hasAnyWrong = playerRounds.some(r => r.status === 'wrong' || r.status === 'timeout');
            const allDone = playerRounds.filter(r => r.status !== 'pending').length === game.totalRounds;
            const allCorrect = playerRounds.every(r => r.status === 'correct');
            const offline = !!player.disconnectedAt;

            let statusLabel, statusBg, statusColor;
            if (offline) {
              statusLabel = t('host.progress.offline'); statusBg = 'transparent'; statusColor = 'rgb(var(--es-muted))';
            } else if (allDone && allCorrect) {
              statusLabel = t('host.progress.completed'); statusBg = 'rgb(var(--es-line))'; statusColor = 'rgb(var(--es-ink))';
            } else if (hasAnyWrong) {
              statusLabel = t('host.progress.needsHelp'); statusBg = 'rgb(var(--es-brand))'; statusColor = 'rgb(var(--es-on-brand))';
            } else {
              statusLabel = t('host.progress.inProgress'); statusBg = 'rgb(var(--es-correct) / 0.2)'; statusColor = 'rgb(var(--es-correct))';
            }

            return (
              <div key={player._id} className="flex items-center px-6 py-4" style={{ borderTop: i > 0 ? '1px solid rgb(var(--es-line))' : 'none' }}>
                <div style={{ width: 160, fontWeight: 700, fontSize: 12, color: offline ? 'rgb(var(--es-muted))' : 'rgb(var(--es-ink))' }}>
                  {player.name.toUpperCase()}
                </div>

                {Array.from({ length: game.totalRounds }, (_, ri) => {
                  const roundNum = ri + 1;
                  const round = playerRounds.find(r => r.roundNumber === roundNum);
                  const isFuture = roundNum > game.currentRound;

                  let cell;
                  if (isFuture) {
                    cell = <span style={{ color: 'rgb(var(--es-dim))', fontSize: 12 }}>—</span>;
                  } else if (!round || round.status === 'pending') {
                    cell = <span style={{ color: 'rgb(var(--es-muted))', fontSize: 16, fontWeight: 700 }}>?</span>;
                  } else if (round.status === 'correct') {
                    cell = <CheckIcon />;
                  } else {
                    cell = <CrossIcon />;
                  }

                  return (
                    <div key={roundNum} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {cell}
                    </div>
                  );
                })}

                <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, padding: '2px 8px', background: statusBg, color: statusColor, border: `1px solid ${offline ? 'rgb(var(--es-muted))' : statusBg}` }}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Event Log */}
      <div className="p-6" style={{ background: 'rgb(var(--es-ground))', borderLeft: '1px solid rgb(var(--es-line) / 0.4)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 4, height: 16, background: 'rgb(var(--es-brand))' }} />
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: 'rgb(var(--es-ink))' }}>{t('host.progress.eventLog')}</span>
          </div>
          {events.length === 0 && (
            <div style={{ color: '#555', fontSize: 11, letterSpacing: '1px' }}>
              {t('host.progress.noEvents')}
            </div>
          )}
          <div className="flex flex-col gap-4">
            {events.map((event) => {
              const highlight = HIGHLIGHTED_EVENTS.includes(event.type);
              const message = t(`host.progress.events.${event.type}`, {
                name: event.playerName?.toUpperCase() ?? '',
                n: event.roundNumber,
              });
              return (
                <div key={event._id} className="flex items-start gap-4 pl-3 py-1" style={{ borderLeft: `1px solid ${highlight ? 'rgb(var(--es-brand))' : 'rgb(var(--es-line) / 0.6)'}` }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgb(var(--es-muted))', whiteSpace: 'nowrap' }}>[ {formatClock(event.createdAt)} ]</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: highlight ? 'rgb(var(--es-ink))' : 'rgb(var(--es-muted))' }}>{message}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </SidebarLayout>
  );
};

export default ProgressPage;