import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useGameSummary } from '/imports/ui/shared/hooks/useGameSummary.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import SidebarLayout from '/imports/ui/host/layouts/SidebarLayout.jsx';
import PhotoGallery from '/imports/ui/host/components/summary/PhotoGallery.jsx';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';
import { useT } from '../../../../languages/LanguageProvider';
import { useGameUiTheme } from '../../../shared/components/theme/UiThemeProvider';

const TEXT = 'rgb(var(--es-ink))';
const MUTED = 'rgb(var(--es-muted))';
const DIM = 'rgb(var(--es-dim))';
const CORRECT = 'rgb(var(--es-correct))';
const INCORRECT = 'rgb(var(--es-incorrect))';

const DASH = '—';

function formatClock(ms) {
  if (ms === null || ms === undefined) return DASH;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(ms) {
  if (ms === null || ms === undefined) return DASH;
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return DASH;
  return `${Math.round(value * 100)}%`;
}

const STATUS_COLOR = {
  correct: CORRECT,
  wrong: INCORRECT,
  timeout: INCORRECT,
  pending: DIM,
};

const STATUS_LABEL_KEYS = {
  correct: 'statusSolved',
  wrong: 'statusFailed',
  timeout: 'statusTimedOut',
  pending: 'statusNotAttempted',
};

const SectionHeader = ({ label }) => (
  <h2 className="es-title mb-4 text-2xl text-ink">{label}</h2>
);

const StatTile = ({ label, value, hint, subHint }) => (
  <div className="es-plate min-w-0 flex-1 px-5 pb-5 pt-4">
    <p className="es-label whitespace-nowrap">{label}</p>
    <p className="es-title mt-3 text-5xl tabular-nums text-ink">{value}</p>
    {hint && <p className="mt-3 text-sm text-muted">{hint}</p>}
    {subHint && <p className="mt-1 text-sm text-incorrect">{subHint}</p>}
  </div>
);

const Th = ({ children, align = 'left' }) => (
  <th
    className="es-label whitespace-nowrap border-b border-line px-3 py-2.5 font-medium"
    style={{ textAlign: align }}
  >
    {children}
  </th>
);

const Td = ({ children, align = 'left', color = TEXT }) => (
  <td
    className="whitespace-nowrap border-b border-line/50 px-3 py-3 font-display text-lg tabular-nums"
    style={{ textAlign: align, color }}
  >
    {children}
  </td>
);

const Shell = ({ gameId, children }) => {
  const t = useT();
  return (
    <SidebarLayout gameId={gameId} activePage="summary">
      <RoomBar>
        <span className="font-display text-base tracking-[0.04em] text-muted">{t('host.summary.missionDebrief')}</span>
      </RoomBar>
      {children}
    </SidebarLayout>
  );
};

const SummaryPage = () => {
  const { gameId } = useParams();
  useGameUiTheme(gameId);
  const navigate = useNavigate();
  const t = useT();
  const { loading, gameFound, ended, outcome, team, players, photos } = useGameSummary(gameId);

  if (loading) {
    return (
      <div className="es-room flex items-center justify-center">
        <p className="pulse-text font-display text-lg text-muted">{t('host.summary.loading')}</p>
      </div>
    );
  }

  if (!gameFound) return <GameNotFound />;

  // Navigating here mid-game: the publication sends nothing until the game
  // ends, so say so rather than render a shell full of dashes.
  if (!ended) {
    return (
      <Shell gameId={gameId}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <p className="es-tape -rotate-2 px-10 text-lg">{t('host.summary.missionStillActive')}</p>
          <p className="mt-4 max-w-[46ch] leading-7 text-muted">{t('host.summary.debriefLockedBody')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => navigate(`/game/${gameId}/progress`)} className="es-btn es-btn-primary">
              {t('host.summary.backToOperatives')}
            </button>
            <button type="button" onClick={() => navigate(`/game/${gameId}/final-riddle`)} className="es-btn es-btn-ghost">
              {t('host.summary.finalRiddle')}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const won = outcome === 'won';
  const roundNumbers = Array.from(
    new Set(players.flatMap((p) => p.rounds.map((r) => r.roundNumber)))
  ).sort((a, b) => a - b);
  const anyUntimed = players.some((p) => p.untimedRounds > 0);

  return (
    <Shell gameId={gameId}>
      <div className="flex flex-1 flex-col gap-10 px-6 py-8 lg:px-10">

        {/* Outcome: the case file closed, stamped with how it ended. */}
        <header className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <h1 className="es-title text-6xl text-ink lg:text-7xl">
            {won ? t('host.summary.you') : t('host.summary.no')}{' '}
            {won ? t('host.summary.escaped') : t('host.summary.escape')}
          </h1>
          <span className={`es-stamp mb-2 !text-xl ${won ? 'text-correct' : 'text-brand-bright'}`}>
            {won ? t('host.summary.missionSuccess') : t('host.summary.missionFailed')}
          </span>
        </header>

        {/* Team tiles */}
        <div>
          <SectionHeader label={t('host.summary.teamPerformance')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label={t('host.summary.totalTime')}
              value={`${team.totalTimeApproximate ? '~' : ''}${formatClock(team.totalTimeMs)}`}
              hint={
                team.totalTimeMs === null
                  ? t('host.summary.unrecorded')
                  : team.totalTimeApproximate
                    ? t('host.summary.approximateNoEndTimestamp')
                    : t('host.summary.limitLabel', { time: formatClock(team.timeLimitMs) })
              }
              // The limit above is already net of penalties, so spell out where
              // the missing minutes went.
              subHint={
                team.hintPenaltyMs > 0
                  ? t('host.summary.hintPenaltyLabel', { time: formatClock(team.hintPenaltyMs) })
                  : null
              }
            />
            <StatTile
              label={t('host.summary.roundsSolved')}
              value={`${team.roundsSolved}/${team.roundsDealt}`}
              hint={t('host.summary.operativesRoundsHint', { count: team.playerCount, rounds: team.totalRounds })}
            />
            <StatTile
              label={t('host.summary.teamAccuracy')}
              value={formatPercent(team.accuracy)}
              hint={
                team.accuracy === null
                  ? t('host.summary.noRoundsAttempted')
                  : t('host.summary.correctIncorrectHint', { correct: team.correct, incorrect: team.incorrect })
              }
            />
            <StatTile
              label={t('host.summary.finalRiddle')}
              value={`${team.finalRiddleAttempts}/3`}
              hint={t('host.summary.attemptsUsed')}
            />
          </div>
        </div>

        {/* Per-player table */}
        <section className="es-plate px-6 pb-6 pt-5">
          <SectionHeader label={t('host.summary.operativeManifest')} />
          {players.length === 0 ? (
            <p className="text-muted">{t('host.summary.noOperativesOnRecord')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    <Th>{t('host.summary.operative')}</Th>
                    <Th align="right">{t('host.summary.correctCol')}</Th>
                    <Th align="right">{t('host.summary.incorrectCol')}</Th>
                    <Th align="right">{t('host.summary.unattempted')}</Th>
                    <Th align="right">{t('host.summary.accuracy')}</Th>
                    <Th align="right">{t('host.summary.photos')}</Th>
                    <Th align="right">{t('host.summary.avg')}</Th>
                    <Th align="right">{t('host.summary.fastest')}</Th>
                    <Th align="right">{t('host.summary.slowest')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.playerId}>
                      <Td>
                        <span className="font-display text-lg font-semibold tracking-[0.02em]">{p.name.toUpperCase()}</span>
                      </Td>
                      <Td align="right" color={p.correct > 0 ? CORRECT : DIM}>{p.correct}</Td>
                      <Td align="right" color={p.incorrect > 0 ? INCORRECT : DIM}>{p.incorrect}</Td>
                      <Td align="right" color={p.unattempted > 0 ? MUTED : DIM}>{p.unattempted}</Td>
                      <Td align="right">{formatPercent(p.accuracy)}</Td>
                      <Td align="right" color={MUTED}>{p.photoCount}</Td>
                      <Td align="right" color={MUTED}>{formatDuration(p.avgRoundMs)}</Td>
                      <Td align="right" color={MUTED}>{formatDuration(p.fastestRoundMs)}</Td>
                      <Td align="right" color={MUTED}>{formatDuration(p.slowestRoundMs)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {anyUntimed && (
            <p className="mt-3 text-sm text-dim">{t('host.summary.untimedNote')}</p>
          )}
        </section>

        {/* Per-round timing */}
        <section className="es-plate px-6 pb-6 pt-5">
          <SectionHeader label={t('host.summary.roundTiming')} />
          {roundNumbers.length === 0 ? (
            <p className="text-muted">{t('host.summary.noRoundsOnRecord')}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <Th>{t('host.summary.operative')}</Th>
                    {roundNumbers.map((n) => (
                      <Th key={n} align="center">{t('host.summary.round', { n })}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.playerId}>
                      <Td><span className="font-display text-lg font-semibold tracking-[0.02em]">{p.name.toUpperCase()}</span></Td>
                      {roundNumbers.map((n) => {
                        const round = p.rounds.find((r) => r.roundNumber === n);
                        const color = STATUS_COLOR[round?.status] ?? DIM;
                        return (
                          <td key={n} className="border-b border-line/50 p-2">
                            <div className="es-well px-2 py-3 text-center" style={{ borderBottom: `2px solid ${color}` }}>
                              <p className="font-display text-2xl font-semibold leading-none tabular-nums text-ink">
                                {formatDuration(round?.durationMs)}
                              </p>
                              <p className="mt-2 font-display text-sm tracking-[0.03em]" style={{ color }}>
                                {STATUS_LABEL_KEYS[round?.status] ? t(`host.summary.${STATUS_LABEL_KEYS[round.status]}`) : DASH}
                              </p>
                              {round?.attempts > 1 && (
                                <p className="mt-1 text-xs text-dim">
                                  {t('host.summary.attemptsCount', { n: round.attempts })}
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <PhotoGallery photos={photos} players={players} photosExpired={team.photosExpired} />

      </div>
    </Shell>
  );
};

export default SummaryPage;
