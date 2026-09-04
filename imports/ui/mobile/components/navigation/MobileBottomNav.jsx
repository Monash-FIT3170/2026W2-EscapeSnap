// Meteor's JSX transform still requires React in module scope.
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useT } from '../../../../languages/LanguageProvider';

const NAV_ITEMS = [
  {
    key: 'scanner',
    labelKey: 'mobile.nav.scanner',
    path: 'M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2M3 12h18',
  },
  {
    key: 'letters',
    labelKey: 'mobile.nav.letters',
    path: 'M4 5h16v14H4zM4 7l8 6 8-6',
  },
];

export function MobileBottomNav({ active, onChange }) {
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-[#353534] bg-[#0e0e0e] pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ key, labelKey, path }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 px-2 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                isActive ? 'text-[#e5e2e1]' : 'text-[#555]'
              }`}
            >
              {isActive && <span className="absolute top-0 h-0.5 w-10 bg-[#8b0000]" />}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d={path} />
              </svg>
              <span className="font-semibold">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
