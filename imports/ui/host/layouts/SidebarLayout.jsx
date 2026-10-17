import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useT } from '../../../languages/LanguageProvider';

const HamburgerIcon = () => (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" style={{ flexShrink: 0 }}>
    <line x1="0" y1="1" x2="18" y2="1" style={{ stroke: 'rgb(var(--es-muted))' }} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="0" y1="7" x2="18" y2="7" style={{ stroke: 'rgb(var(--es-muted))' }} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="0" y1="13" x2="18" y2="13" style={{ stroke: 'rgb(var(--es-muted))' }} strokeWidth="1.5" strokeLinecap="round" />
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

const DebriefIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <line x1="1" y1="17" x2="17" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <rect x="2" y="9" width="3.5" height="6" stroke={color} strokeWidth="1.5" />
    <rect x="7.25" y="5" width="3.5" height="10" stroke={color} strokeWidth="1.5" />
    <rect x="12.5" y="1" width="3.5" height="14" stroke={color} strokeWidth="1.5" />
  </svg>
);

const NAV_ITEMS = [
  { labelKey: 'operatives', Icon: OperativesIcon, page: 'progress', path: (id) => `/game/${id}/progress` },
  { labelKey: 'finalRiddle', Icon: RiddleIcon, page: 'final-riddle', path: (id) => `/game/${id}/final-riddle` },
  { labelKey: 'debrief', Icon: DebriefIcon, page: 'summary', path: (id) => `/game/${id}/summary` },
];

const SUBTITLE_KEYS = {
  progress: 'lobby',
  'final-riddle': 'finalRiddle',
  summary: 'debrief',
};

const Sidebar = ({ gameId, activePage, expanded, onToggle }) => {
  const navigate = useNavigate();
  const t = useT();
  const subtitle = t(`host.sidebar.${SUBTITLE_KEYS[activePage] ?? 'game'}`);

  // A metal rail down the side of the room, its buttons lit like the
  // landing page's keypad when they're the screen in use.
  return (
    <aside
      className="es-dark flex flex-shrink-0 flex-col overflow-hidden border-r border-line transition-[width] duration-200"
      style={{
        width: expanded ? 216 : 64,
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--es-metal) 34%, black), color-mix(in srgb, var(--es-metal) 18%, black))',
      }}
    >
      <div
        className={`flex min-h-[64px] items-center border-b border-line ${expanded ? 'justify-between pl-5 pr-3' : 'justify-center'}`}
      >
        {expanded && (
          <div className="min-w-0">
            <div className="es-title truncate text-xl text-ink">{t('host.sidebar.game')}</div>
            <div className="mt-1 truncate font-display text-sm tracking-[0.03em] text-brand-bright">{subtitle}</div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={expanded ? t('host.sidebar.collapseSidebar') : t('host.sidebar.expandSidebar')}
          aria-label={expanded ? t('host.sidebar.collapseSidebar') : t('host.sidebar.expandSidebar')}
          className="flex h-11 w-11 items-center justify-center rounded-full opacity-70 transition hover:opacity-100"
        >
          <HamburgerIcon />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ labelKey, Icon, page, path }) => {
          const active = page === activePage;
          const label = t(`host.sidebar.${labelKey}`);
          const color = active ? 'rgb(var(--es-ink))' : 'rgb(var(--es-muted))';
          return (
            <button
              key={labelKey}
              type="button"
              onClick={() => navigate(path(gameId))}
              title={!expanded ? label : undefined}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[48px] w-full items-center rounded-md transition ${
                expanded ? 'gap-4 px-4' : 'justify-center'
              } ${active ? 'es-lcd' : 'hover:bg-white/5'}`}
            >
              <Icon color={active ? 'rgb(var(--es-brand-bright))' : color} />
              {expanded && (
                <span
                  className="whitespace-nowrap font-display text-lg font-medium tracking-[0.03em]"
                  style={{ color }}
                >
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
    <main className="es-room flex min-h-screen">
      <Sidebar
        gameId={gameId}
        activePage={activePage}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(v => !v)}
      />
      <section className="flex min-w-0 flex-1 flex-col">
        {children}
      </section>
    </main>
  );
};

export default SidebarLayout;
