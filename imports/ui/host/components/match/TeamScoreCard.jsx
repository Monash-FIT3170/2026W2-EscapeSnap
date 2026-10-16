import React, { useEffect, useState } from 'react';
import { remainingGameMs } from '/imports/lib/gameClock';
import { teamPhase, teamProgressPercent } from '/imports/lib/teamStatus';
import { useT } from '../../../../languages/LanguageProvider';

const PHASE_STYLE = {
  waiting: { key: 'statusWaiting', bg: 'rgb(var(--es-panel))', color: 'rgb(var(--es-muted))' },
  playing: { key: 'statusPlaying', bg: 'rgb(var(--es-correct) / 0.15)', color: 'rgb(var(--es-correct))' },
  final: { key: 'statusFinal', bg: 'rgb(var(--es-warn) / 0.18)', color: 'rgb(var(--es-warn))' },
  escaped: { key: 'statusEscaped', bg: 'rgb(var(--es-correct) / 0.25)', color: 'rgb(var(--es-correct))' },
  failed: { key: 'statusFailed', bg: 'rgb(var(--es-brand))', color: 'rgb(var(--es-on-brand))' },
};

export function formatClock(ms) {
  if (ms === null || ms === undefined) return '--:--';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Re-renders every second while the team's clock is running.
function useRemainingMs(team) {
  const [remaining, setRemaining] = useState(() => remainingGameMs(team));
  const live = team?.status === 'in_progress';
  useEffect(() => {
    setRemaining(remainingGameMs(team));
    if (!live) return;
    const interval = setInterval(() => setRemaining(remainingGameMs(team)), 1000);
    return () => clearInterval(interval);
  }, [team?.startedAt, team?.timerMinutes, team?.timePenaltyMs, live]);
  return remaining;
}

const RoundCell = ({ round, isFuture }) => {
  if (isFuture) return <span style={{ color: 'rgb(var(--es-dim))', fontSize: 12 }}>—</span>;
  if (!round || round.status === 'pending') {
    return <span style={{ color: 'rgb(var(--es-muted))', fontSize: 14, fontWeight: 700 }}>?</span>;
  }
  return round.status === 'correct' ? (
    <span style={{ color: 'rgb(var(--es-correct))', fontSize: 14, fontWeight: 700 }}>✓</span>
  ) : (
    <span style={{ color: 'rgb(var(--es-incorrect))', fontSize: 14, fontWeight: 700 }}>✕</span>
  );
};

// One team's column on the scoreboard. `compact` drops the per-player grid,
// for the rival panel on an online team's own progress screen.
const TeamScoreCard = ({ team, players = [], rounds = [], compact = false, highlight = false }) => {
  const t = useT();
  const remaining = useRemainingMs(team);
  if (!team) return null;

  const phase = PHASE_STYLE[teamPhase(team, rounds)];
  const progress = teamProgressPercent(team, rounds);
  const teamPlayers = players.filter((p) => p.gameId === team._id);
  const teamRounds = rounds.filter((r) => r.gameId === team._id);
  const ended = team.status === 'won' || team.status === 'lost';
  // A finished team's clock freezes at the moment it finished.
  const shownMs = ended && team.endedAt
    ? remainingGameMs(team, new Date(team.endedAt).getTime())
    : remaining;

  return (
    <div
      className="flex flex-col"
      style={{
        background: 'rgb(var(--es-ground))',
        border: highlight ? '1px solid rgb(var(--es-correct))' : '1px solid rgb(var(--es-panel))',
        minWidth: 0,
      }}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgb(var(--es-panel))' }}>
        <span
          className="truncate"
          style={{ fontWeight: 700, fontSize: compact ? 14 : 20, letterSpacing: '1.5px', color: 'rgb(var(--es-ink))' }}
        >
          {team.groupName?.toUpperCase()}
        </span>
        <span style={{ fontSize: 9, padding: '3px 8px', letterSpacing: '1px', background: phase.bg, color: phase.color, whiteSpace: 'nowrap' }}>
          {t(`host.match.${phase.key}`)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-px" style={{ background: 'rgb(var(--es-panel))' }}>
        <div className="flex flex-col gap-2 p-4" style={{ background: 'rgb(var(--es-panel))' }}>
          <span style={{ fontSize: 9, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.match.timeRemaining')}</span>
          <span
            style={{
              fontWeight: 300,
              fontSize: compact ? 24 : 36,
              lineHeight: 1,
              color: remaining === 0 ? 'rgb(var(--es-incorrect))' : 'rgb(var(--es-ink))',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatClock(shownMs)}
          </span>
          {team.timePenaltyMs > 0 && (
            <span style={{ fontSize: 9, color: 'rgb(var(--es-incorrect))' }}>
              {t('host.progress.hintPenalty', { time: formatClock(team.timePenaltyMs) })}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4" style={{ background: 'rgb(var(--es-panel))' }}>
          <span style={{ fontSize: 9, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.match.progress')}</span>
          <span style={{ fontWeight: 700, fontSize: compact ? 24 : 36, lineHeight: 1, color: 'rgb(var(--es-ink))' }}>
            {progress}
            <span style={{ fontSize: 14, color: 'rgb(var(--es-muted))' }}>%</span>
          </span>
          <div style={{ height: 3, background: 'rgb(var(--es-line))' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'rgb(var(--es-brand))' }} />
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4" style={{ background: 'rgb(var(--es-panel))' }}>
          <span style={{ fontSize: 9, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.match.round')}</span>
          <span style={{ fontWeight: 700, fontSize: compact ? 24 : 36, lineHeight: 1, color: 'rgb(var(--es-ink))' }}>
            {String(team.currentRound ?? 1).padStart(2, '0')}
            <span style={{ fontSize: 14, color: 'rgb(var(--es-muted))' }}> / {String(team.totalRounds).padStart(2, '0')}</span>
          </span>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col">
          {teamPlayers.map((player) => (
            <div
              key={player._id}
              className="flex items-center px-5 py-3"
              style={{ borderTop: '1px solid rgb(var(--es-panel))' }}
            >
              <span className="truncate" style={{ flex: '0 0 40%', fontWeight: 700, fontSize: 12, color: 'rgb(var(--es-ink))' }}>
                {player.name?.toUpperCase()}
              </span>
              {Array.from({ length: team.totalRounds }, (_, i) => {
                const roundNumber = i + 1;
                return (
                  <div key={roundNumber} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <RoundCell
                      round={teamRounds.find((r) => r.playerId === player._id && r.roundNumber === roundNumber)}
                      isFuture={team.status === 'lobby' || roundNumber > team.currentRound}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamScoreCard;
