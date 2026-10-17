import React, { useEffect, useState } from 'react';
import { remainingGameMs } from '/imports/lib/gameClock';
import { teamPhase, teamProgressPercent } from '/imports/lib/teamStatus';
import { useT } from '../../../../languages/LanguageProvider';

const PHASE_STYLE = {
  waiting: { key: 'statusWaiting', className: 'border-line text-muted' },
  playing: { key: 'statusPlaying', className: 'border-correct/40 bg-correct/15 text-correct' },
  final: { key: 'statusFinal', className: 'border-warn/40 bg-warn/15 text-warn' },
  escaped: { key: 'statusEscaped', className: 'border-correct/50 bg-correct/25 text-correct' },
  failed: { key: 'statusFailed', className: 'border-brand bg-brand text-on-brand' },
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
  if (isFuture) return <span className="text-dim">—</span>;
  if (!round || round.status === 'pending') {
    return <span className="font-display text-lg font-semibold text-muted">?</span>;
  }
  return round.status === 'correct' ? (
    <span className="font-display text-lg font-semibold text-correct">✓</span>
  ) : (
    <span className="font-display text-lg font-semibold text-incorrect">✕</span>
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

  const big = compact ? 'text-3xl' : 'text-5xl';

  return (
    <div className={`es-plate flex min-w-0 flex-col ${highlight ? 'ring-2 ring-correct' : ''}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <span className={`es-title truncate text-ink ${compact ? 'text-xl' : 'text-3xl'}`}>
          {team.groupName?.toUpperCase()}
        </span>
        <span className={`flex items-center gap-2 whitespace-nowrap rounded-sm border px-2 py-0.5 font-display text-sm tracking-[0.03em] ${phase.className}`}>
          {t(`host.match.${phase.key}`)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 px-5 py-4">
        <div className="flex flex-col gap-2">
          <span className="es-label">{t('host.match.timeRemaining')}</span>
          <span
            className={`es-lcd px-2 py-1 text-center leading-none tabular-nums ${big} ${
              remaining === 0 ? 'font-display font-semibold text-dim' : 'es-lcd-text'
            }`}
          >
            {formatClock(shownMs)}
          </span>
          {team.timePenaltyMs > 0 && (
            <span className="text-xs text-incorrect">
              {t('host.progress.hintPenalty', { time: formatClock(team.timePenaltyMs) })}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="es-label">{t('host.match.progress')}</span>
          <span className={`es-title tabular-nums text-ink ${big}`}>
            {progress}
            <span className="text-lg text-muted">%</span>
          </span>
          <div className="es-lcd h-1.5 overflow-hidden !rounded-full">
            <div className="h-full bg-brand-bright" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="es-label">{t('host.match.round')}</span>
          <span className={`es-title tabular-nums text-ink ${big}`}>
            {String(team.currentRound ?? 1).padStart(2, '0')}
            <span className="text-lg text-muted"> / {String(team.totalRounds).padStart(2, '0')}</span>
          </span>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col">
          {teamPlayers.map((player) => (
            <div key={player._id} className="flex items-center border-t border-line/70 px-5 py-3">
              <span className="truncate font-display text-lg font-semibold tracking-[0.02em] text-ink" style={{ flex: '0 0 40%' }}>
                {player.name?.toUpperCase()}
              </span>
              {Array.from({ length: team.totalRounds }, (_, i) => {
                const roundNumber = i + 1;
                return (
                  <div key={roundNumber} className="flex flex-1 justify-center">
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
