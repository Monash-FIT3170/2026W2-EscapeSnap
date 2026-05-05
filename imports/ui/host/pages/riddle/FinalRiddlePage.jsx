import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useFinalRiddle } from '/imports/ui/shared/hooks/useFinalRiddle.js';
import { useRevealedLetters } from '/imports/ui/shared/hooks/useRevealedLetters.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import WinScreen from '/imports/ui/host/pages/game-completion/WinScreen.jsx';
import FinalRiddleInput from '/imports/ui/host/components/riddle/FinalRiddleInput.jsx';

const HamburgerIcon = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" style={{ flexShrink: 0 }}>
    <line x1="0" y1="1" x2="18" y2="1" stroke="#aa8984" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="0" y1="7" x2="18" y2="7" stroke="#aa8984" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="0" y1="13" x2="18" y2="13" stroke="#aa8984" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const OperativesIcon = ({ color }) => (
  <svg width="19" height="20" viewBox="0 0 19 20" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="9.5" cy="10" r="8" stroke={color} strokeWidth="1.5" />
    <circle cx="9.5" cy="10" r="3" stroke={color} strokeWidth="1.5" />
    <line x1="9.5" y1="1" x2="9.5" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9.5" y1="16" x2="9.5" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1" y1="10" x2="4" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="15" y1="10" x2="18" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RiddleIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <path d="M9 1L11.5 6.5L17 7.3L13 11.2L14 17L9 14.3L4 17L5 11.2L1 7.3L6.5 6.5L9 1Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const Sidebar = ({ gameId, expanded, onToggle }) => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'OPERATIVES', Icon: OperativesIcon, route: `/game/${gameId}/progress`, active: false },
    { label: 'FINAL RIDDLE', Icon: RiddleIcon, route: `/game/${gameId}/final-riddle`, active: true },
  ];

  return (
    <aside style={{
      width: expanded ? 200 : 60,
      minHeight: '100vh',
      background: '#0e0e0e',
      borderRight: '1px solid #1c1b1b',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ borderBottom: '1px solid #1c1b1b', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', padding: expanded ? '20px 16px 20px 24px' : '20px 0' }}>
        {expanded && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1', whiteSpace: 'nowrap' }}>GAME</div>
            <div style={{ fontWeight: 500, fontSize: 10, letterSpacing: '0.5px', color: '#8b0000', marginTop: 2, whiteSpace: 'nowrap' }}>FINAL RIDDLE</div>
          </div>
        )}
        <button onClick={onToggle} title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{ background: 'transparent', cursor: 'pointer', opacity: 0.5, padding: 4, display: 'flex', alignItems: 'center' }}>
          <HamburgerIcon />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {navItems.map(({ label, Icon, route, active }) => (
          <button key={label} onClick={() => route && navigate(route)} title={!expanded ? label : undefined}
            style={{
              display: 'flex', alignItems: 'center',
              gap: expanded ? 16 : 0,
              justifyContent: expanded ? 'flex-start' : 'center',
              padding: expanded ? '16px 24px' : '16px 0',
              background: active ? '#1c1b1b' : 'transparent',
              borderLeft: active ? '2px solid #8b0000' : '2px solid transparent',
              cursor: 'pointer', opacity: active ? 1 : 0.7,
              width: '100%', textAlign: 'left', transition: 'background 0.15s',
            }}>
            <Icon color={active ? '#e5e2e1' : '#aa8984'} />
            {expanded && (
              <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.8px', color: active ? '#e5e2e1' : '#aa8984', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

const FinalRiddlePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [hasWon, setHasWon] = useState(false);

  const { loading, finalRiddle } = useFinalRiddle(gameId);
  const { lettersLoading, letters } = useRevealedLetters(gameId);

  if (loading || lettersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#131313' }}>
        <p style={{ color: '#aa8984', fontSize: 10, letterSpacing: '1px' }}>LOADING...</p>
      </div>
    );
  }

  if (!finalRiddle) return <GameNotFound />;

  if (hasWon) return <WinScreen onPlayAgain={() => navigate('/game/create')} />;

  return (
    <main className="flex min-h-screen" style={{ background: '#131313', color: '#e5e2e1', fontFamily: "'Space Grotesk', Helvetica, sans-serif" }}>

      <Sidebar gameId={gameId} expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(v => !v)} />

      <section className="flex flex-col flex-1" style={{ minWidth: 0 }}>

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4" style={{ background: '#131313', borderBottom: '2px solid #1c1b1b' }}>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1' }}>ESCAPESNAP</span>
        </header>

        {/* Body */}
        <div className="flex-1 p-8 flex flex-col gap-6">

          {/* Title */}
          <div className="flex items-center gap-3">
            <div style={{ width: 4, height: 32, background: '#8b0000' }} />
            <div>
              <p style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>MISSION CRITICAL</p>
              <h1 style={{ fontWeight: 700, fontSize: 28, letterSpacing: '2px', color: '#e5e2e1', lineHeight: 1.2 }}>
                THE FINAL <span style={{ color: '#8b0000' }}>RIDDLE</span>
              </h1>
            </div>
          </div>

          {/* Riddle card */}
          <div style={{ background: '#0e0e0e', borderLeft: '4px solid #8b0000', padding: '32px' }}>
            <p style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984', marginBottom: 12 }}>DECRYPT THE CLUE</p>
            <p style={{ fontSize: 22, fontWeight: 600, color: '#e5e2e1', lineHeight: 1.6, letterSpacing: '0.5px' }}>
              "{finalRiddle}"
            </p>
          </div>

          {/* Revealed Letters */}
          <div style={{ background: '#1c1b1b', padding: '24px' }}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 4, height: 16, background: '#8b0000' }} />
              <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: '#e5e2e1' }}>REVEALED LETTERS</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {letters.map((letter, i) => (
                <div key={i} style={{
                  width: 64, height: 64,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#0e0e0e',
                  borderBottom: '2px solid #8b0000',
                  fontWeight: 700, fontSize: 24,
                  color: '#e5e2e1', letterSpacing: '2px',
                }}>
                  {letter}
                </div>
              ))}
              {letters.length === 0 && (
                <p style={{ fontSize: 11, color: '#aa8984', opacity: 0.6 }}>NO LETTERS REVEALED YET</p>
              )}
            </div>
          </div>

          {/* Input */}
          <div style={{ background: '#0e0e0e', padding: '24px' }}>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 4, height: 16, background: '#8b0000' }} />
              <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: '#e5e2e1' }}>SUBMIT ANSWER</span>
            </div>
            <FinalRiddleInput gameId={gameId} onCorrect={() => setHasWon(true)} />
          </div>

        </div>
      </section>
    </main>
  );
};

export default FinalRiddlePage;
