import React, { useState } from 'react';
import { useNavigate } from 'react-router';

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

const NAV_ITEMS = [
  { label: 'OPERATIVES', Icon: OperativesIcon, page: 'progress', path: (id) => `/game/${id}/progress` },
  { label: 'FINAL RIDDLE', Icon: RiddleIcon, page: 'final-riddle', path: (id) => `/game/${id}/final-riddle` },
];

const SUBTITLES = {
  progress: 'LOBBY',
  'final-riddle': 'FINAL RIDDLE',
};

const Sidebar = ({ gameId, activePage, expanded, onToggle }) => {
  const navigate = useNavigate();
  const subtitle = SUBTITLES[activePage] ?? 'GAME';

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
      <div style={{
        borderBottom: '1px solid #1c1b1b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        padding: expanded ? '20px 16px 20px 24px' : '20px 0',
      }}>
        {expanded && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1', whiteSpace: 'nowrap' }}>GAME</div>
            <div style={{ fontWeight: 500, fontSize: 10, letterSpacing: '0.5px', color: '#8b0000', marginTop: 2, whiteSpace: 'nowrap' }}>{subtitle}</div>
          </div>
        )}
        <button
          onClick={onToggle}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{ background: 'transparent', cursor: 'pointer', opacity: 0.5, padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <HamburgerIcon />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {NAV_ITEMS.map(({ label, Icon, page, path }) => {
          const active = page === activePage;
          return (
            <button
              key={label}
              onClick={() => navigate(path(gameId))}
              title={!expanded ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: expanded ? 16 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '16px 24px' : '16px 0',
                background: active ? '#1c1b1b' : 'transparent',
                borderLeft: active ? '2px solid #8b0000' : '2px solid transparent',
                cursor: 'pointer',
                opacity: active ? 1 : 0.7,
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <Icon color={active ? '#e5e2e1' : '#aa8984'} />
              {expanded && (
                <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '0.8px', color: active ? '#e5e2e1' : '#aa8984', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

const SidebarLayout = ({ gameId, activePage, children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <main className="flex min-h-screen" style={{ background: '#131313', color: '#e5e2e1', fontFamily: "'Space Grotesk', Helvetica, sans-serif" }}>
      <Sidebar
        gameId={gameId}
        activePage={activePage}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(v => !v)}
      />
      <section className="flex flex-col flex-1" style={{ minWidth: 0 }}>
        {children}
      </section>
    </main>
  );
};

export default SidebarLayout;
