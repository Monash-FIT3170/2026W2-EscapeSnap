import React from 'react';
import { INK, RED } from './theme';

// The 4px red bar beside an uppercase label, the section-header pattern the
// other host screens use.
export default function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div style={{ width: 4, height: 16, background: RED }} />
      <h2
        className="font-mono text-xs uppercase"
        style={{ fontWeight: 700, letterSpacing: '1.4px', color: INK }}
      >
        {children}
      </h2>
    </div>
  );
}
