import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useGameSummary } from '/imports/ui/shared/hooks/useGameSummary.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import SidebarLayout from '/imports/ui/host/layouts/SidebarLayout.jsx';
import PhotoGallery from '/imports/ui/host/components/summary/PhotoGallery.jsx';
import { useT } from '../../../../languages/LanguageProvider';

const BG = '#131313';
const PANEL = '#1c1b1b';
const INNER = '#0e0e0e';
const BORDER = '#353534';
const ACCENT = '#8b0000';
const TEXT = '#e5e2e1';
const MUTED = '#aa8984';
const DIM = '#555';
const CORRECT = '#4ade80';
const INCORRECT = '#ef4444';

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
  <div className="flex items-center gap-3 mb-4">
    <div style={{ width: 4, height: 16, background: ACCENT }} />
    <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: TEXT }}>{label}</span>
  </div>
);

const StatTile = ({ label, value, hint }) => (
  <div style={{ background: INNER, border: `1px solid ${BORDER}`, padding: '20px 24px', flex: 1, minWidth: 0 }}>
    <p style={{ fontSize: 10, letterSpacing: '1px', color: MUTED, whiteSpace: 'nowrap' }}>{label}</p>
    <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '1px', color: TEXT, marginTop: 8, lineHeight: 1 }}>
      {value}
    </p>
    {hint && <p style={{ fontSize: 10, letterSpacing: '0.5px', color: DIM, marginTop: 8 }}>{hint}</p>}
  </div>
);

const Th = ({ children, align = 'left' }) => (
  <th style={{
    textAlign: align, padding: '10px 12px', fontSize: 10, fontWeight: 600,
    letterSpacing: '1px', color: MUTED, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap',
  }}>
    {children}
  </th>
);

const Td = ({ children, align = 'left', color = TEXT }) => (
  <td style={{
    textAlign: align, padding: '12px', fontSize: 13, color,
    borderBottom: `1px solid ${PANEL}`, whiteSpace: 'nowrap',
  }}>
    {children}
  </td>
);

const Shell = ({ gameId, children }) => {
  const t = useT();
  return (
    <SidebarLayout gameId={gameId} activePage="summary">
      <header className="flex items-center justify-between px-6 py-4" style={{ background: BG, borderBottom: `2px solid ${PANEL}` }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: TEXT }}>ESCAPESNAP</span>
        <span style={{ fontSize: 10, letterSpacing: '1px', color: MUTED }}>{t('host.summary.missionDebrief')}</span>
      </header>
      {children}
    </SidebarLayout>
  );
};

const SummaryPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const { loading, gameFound, ended, outcome, team, players, photos } = useGameSummary(gameId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p style={{ color: MUTED, fontSize: 10, letterSpacing: '1px' }}>{t('host.summary.loading')}</p>
      </div>
    );
  }

  if (!gameFound) return <GameNotFound />;

  // Navigating here mid-game: the publication sends nothing until the game
  // ends, so say so rather than render a shell full of dashes.
  if (!ended) {
    return (
      <Shell gameId={gameId}>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div style={{ width: 4, height: 40, background: ACCENT }} />
          <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '2px', color: TEXT, textAlign: 'center' }}>
            {t('host.summary.missionStillActive')}
          </h1>
          <p style={{ fontSize: 12, letterSpacing: '1px', color: MUTED, textAlign: 'center', maxWidth: 460, lineHeight: 1.7 }}>
            {t('host.summary.debriefLockedBody')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/game/${gameId}/progress`)}
              style={{
                background: ACCENT, color: TEXT, fontSize: 12, fontWeight: 700,
                letterSpacing: '1.5px', padding: '14px 32px', border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#a50000')}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              {t('host.summary.backToOperatives')}
            </button>
            <button
              onClick={() => navigate(`/game/${gameId}/final-riddle`)}
              style={{
                background: 'transparent', color: MUTED, fontSize: 12, fontWeight: 700,
                letterSpacing: '1.5px', padding: '14px 32px', border: `1px solid ${BORDER}`, cursor: 'pointer',
              }}
            >
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
      <div className="flex-1 p-8 flex flex-col gap-6">

        {/* Outcome */}
        <div className="flex items-center gap-3">
          <div style={{ width: 4, height: 32, background: ACCENT }} />
          <div>
            <p style={{ fontSize: 10, letterSpacing: '1px', color: MUTED }}>
              {won ? t('host.summary.missionSuccess') : t('host.summary.missionFailed')}
            </p>
            <h1 style={{ fontWeight: 700, fontSize: 28, letterSpacing: '2px', color: TEXT, lineHeight: 1.2 }}>
              {won ? t('host.summary.you') : t('host.summary.no')}{' '}
              <span style={{ color: ACCENT }}>{won ? t('host.summary.escaped') : t('host.summary.escape')}</span>
            </h1>
          </div>
        </div>

        {/* Team tiles */}
        <div>
          <SectionHeader label={t('host.summary.teamPerformance')} />
          <div className="flex gap-4">
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
        <div style={{ background: PANEL, padding: 24 }}>
          <SectionHeader label={t('host.summary.operativeManifest')} />
          {players.length === 0 ? (
            <p style={{ fontSize: 11, color: MUTED, opacity: 0.6 }}>{t('host.summary.noOperativesOnRecord')}</p>
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
                        <span style={{ fontWeight: 700, letterSpacing: '1px' }}>{p.name.toUpperCase()}</span>
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
            <p style={{ fontSize: 10, letterSpacing: '0.5px', color: DIM, marginTop: 12 }}>
              {t('host.summary.untimedNote')}
            </p>
          )}
        </div>

        {/* Per-round timing */}
        <div style={{ background: PANEL, padding: 24 }}>
          <SectionHeader label={t('host.summary.roundTiming')} />
          {roundNumbers.length === 0 ? (
            <p style={{ fontSize: 11, color: MUTED, opacity: 0.6 }}>{t('host.summary.noRoundsOnRecord')}</p>
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
                      <Td><span style={{ fontWeight: 700, letterSpacing: '1px' }}>{p.name.toUpperCase()}</span></Td>
                      {roundNumbers.map((n) => {
                        const round = p.rounds.find((r) => r.roundNumber === n);
                        const color = STATUS_COLOR[round?.status] ?? DIM;
                        return (
                          <td key={n} style={{ padding: 8, borderBottom: `1px solid ${PANEL}` }}>
                            <div style={{ background: INNER, border: `1px solid ${BORDER}`, borderBottom: `2px solid ${color}`, padding: '12px 8px', textAlign: 'center' }}>
                              <p style={{ fontSize: 18, fontWeight: 700, color: TEXT, lineHeight: 1 }}>
                                {formatDuration(round?.durationMs)}
                              </p>
                              <p style={{ fontSize: 9, letterSpacing: '0.8px', color, marginTop: 6 }}>
                                {STATUS_LABEL_KEYS[round?.status] ? t(`host.summary.${STATUS_LABEL_KEYS[round.status]}`) : DASH}
                              </p>
                              {round?.attempts > 1 && (
                                <p style={{ fontSize: 9, letterSpacing: '0.5px', color: DIM, marginTop: 4 }}>
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
        </div>

        <PhotoGallery photos={photos} players={players} photosExpired={team.photosExpired} />

      </div>
    </Shell>
  );
};

export default SummaryPage;
