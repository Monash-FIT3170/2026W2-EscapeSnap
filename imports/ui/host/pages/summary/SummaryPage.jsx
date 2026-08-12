import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useGameSummary } from '/imports/ui/shared/hooks/useGameSummary.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import SidebarLayout from '/imports/ui/host/layouts/SidebarLayout.jsx';

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

const STATUS_LABEL = {
  correct: 'SOLVED',
  wrong: 'FAILED',
  timeout: 'TIMED OUT',
  pending: 'NOT ATTEMPTED',
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

const Shell = ({ gameId, children }) => (
  <SidebarLayout gameId={gameId} activePage="summary">
    <header className="flex items-center justify-between px-6 py-4" style={{ background: BG, borderBottom: `2px solid ${PANEL}` }}>
      <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: TEXT }}>ESCAPESNAP</span>
      <span style={{ fontSize: 10, letterSpacing: '1px', color: MUTED }}>MISSION DEBRIEF</span>
    </header>
    {children}
  </SidebarLayout>
);

const SummaryPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { loading, gameFound, ended, outcome, team, players } = useGameSummary(gameId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p style={{ color: MUTED, fontSize: 10, letterSpacing: '1px' }}>LOADING...</p>
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
            MISSION STILL ACTIVE
          </h1>
          <p style={{ fontSize: 12, letterSpacing: '1px', color: MUTED, textAlign: 'center', maxWidth: 460, lineHeight: 1.7 }}>
            THE DEBRIEF UNLOCKS WHEN THE MISSION ENDS. PHOTOS AND RIDDLE ANSWERS STAY SEALED
            WHILE OPERATIVES ARE STILL IN THE FIELD.
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
              BACK TO OPERATIVES
            </button>
            <button
              onClick={() => navigate(`/game/${gameId}/final-riddle`)}
              style={{
                background: 'transparent', color: MUTED, fontSize: 12, fontWeight: 700,
                letterSpacing: '1.5px', padding: '14px 32px', border: `1px solid ${BORDER}`, cursor: 'pointer',
              }}
            >
              FINAL RIDDLE
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
              {won ? 'MISSION SUCCESS' : 'MISSION FAILED'}
            </p>
            <h1 style={{ fontWeight: 700, fontSize: 28, letterSpacing: '2px', color: TEXT, lineHeight: 1.2 }}>
              {won ? 'YOU ' : 'NO '}
              <span style={{ color: ACCENT }}>{won ? 'ESCAPED' : 'ESCAPE'}</span>
            </h1>
          </div>
        </div>

        {/* Team tiles */}
        <div>
          <SectionHeader label="TEAM PERFORMANCE" />
          <div className="flex gap-4">
            <StatTile
              label="TOTAL TIME"
              value={`${team.totalTimeApproximate ? '~' : ''}${formatClock(team.totalTimeMs)}`}
              hint={
                team.totalTimeMs === null
                  ? 'UNRECORDED'
                  : team.totalTimeApproximate
                    ? 'APPROXIMATE — NO END TIMESTAMP'
                    : `LIMIT ${formatClock(team.timeLimitMs)}`
              }
            />
            <StatTile
              label="ROUNDS SOLVED"
              value={`${team.roundsSolved}/${team.roundsDealt}`}
              hint={`${team.playerCount} OPERATIVES × ${team.totalRounds} ROUNDS`}
            />
            <StatTile
              label="TEAM ACCURACY"
              value={formatPercent(team.accuracy)}
              hint={
                team.accuracy === null
                  ? 'NO ROUNDS ATTEMPTED'
                  : `${team.correct} CORRECT / ${team.incorrect} INCORRECT`
              }
            />
            <StatTile
              label="FINAL RIDDLE"
              value={`${team.finalRiddleAttempts}/3`}
              hint="ATTEMPTS USED"
            />
          </div>
        </div>

        {/* Per-player table */}
        <div style={{ background: PANEL, padding: 24 }}>
          <SectionHeader label="OPERATIVE_MANIFEST" />
          {players.length === 0 ? (
            <p style={{ fontSize: 11, color: MUTED, opacity: 0.6 }}>NO OPERATIVES ON RECORD</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    <Th>OPERATIVE</Th>
                    <Th align="right">CORRECT</Th>
                    <Th align="right">INCORRECT</Th>
                    <Th align="right">UNATTEMPTED</Th>
                    <Th align="right">ACCURACY</Th>
                    <Th align="right">PHOTOS</Th>
                    <Th align="right">AVG</Th>
                    <Th align="right">FASTEST</Th>
                    <Th align="right">SLOWEST</Th>
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
              SOME ROUNDS HAVE NO TIMING DATA AND ARE EXCLUDED FROM THE AVERAGES.
            </p>
          )}
        </div>

        {/* Per-round timing */}
        <div style={{ background: PANEL, padding: 24 }}>
          <SectionHeader label="ROUND_TIMING" />
          {roundNumbers.length === 0 ? (
            <p style={{ fontSize: 11, color: MUTED, opacity: 0.6 }}>NO ROUNDS ON RECORD</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <Th>OPERATIVE</Th>
                    {roundNumbers.map((n) => (
                      <Th key={n} align="center">ROUND {n}</Th>
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
                                {STATUS_LABEL[round?.status] ?? DASH}
                              </p>
                              {round?.attempts > 1 && (
                                <p style={{ fontSize: 9, letterSpacing: '0.5px', color: DIM, marginTop: 4 }}>
                                  {round.attempts} ATTEMPTS
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

        {/* Gallery — Stage 6 */}
        <div style={{ background: PANEL, padding: 24 }}>
          <SectionHeader label="PHOTO_ARCHIVE" />
          <div style={{ background: INNER, border: `1px dashed ${BORDER}`, padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: '1px', color: MUTED }}>
              {team.photosExpired
                ? 'PHOTO ARCHIVE PURGED — IMAGES ARE RETAINED FOR 6 HOURS'
                : `${team.totalPhotos} PHOTO${team.totalPhotos === 1 ? '' : 'S'} ON RECORD`}
            </p>
            <p style={{ fontSize: 10, letterSpacing: '0.5px', color: DIM, marginTop: 8 }}>
              GALLERY PENDING
            </p>
          </div>
        </div>

      </div>
    </Shell>
  );
};

export default SummaryPage;
