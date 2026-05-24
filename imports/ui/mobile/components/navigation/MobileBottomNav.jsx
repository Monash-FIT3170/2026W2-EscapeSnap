import React from 'react';

const navItems = [
  {
    key: 'scanner',
    label: 'Scanner',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2M3 12h18" />
      </svg>
    ),
  },
  {
    key: 'letters',
    label: 'Letters',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
];

export function MobileBottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-black/95 px-4 pb-3 pt-2 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md justify-between">
        {navItems.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex flex-1 flex-col items-center gap-1 px-2 py-2 font-mono text-[11px] tracking-widest transition ${
              active === key ? 'text-red-500' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {icon}
            <span className="font-semibold uppercase">{label}</span>
            {active === key && (
              <span className="absolute -top-2 left-1/2 h-0.5 w-10 -translate-x-1/2 bg-red-500" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
