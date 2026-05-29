import React from 'react';

export function PlayerWinScreen() {
  return (
    <div
      className="h-screen flex flex-col items-center justify-center px-8 gap-6 text-center"
      style={{ background: '#0e0e0e' }}
    >
      <div style={{ width: 64, height: 3, background: '#4ade80' }} />
      <h1
        className="font-black uppercase tracking-widest"
        style={{ fontSize: 40, color: '#4ade80', lineHeight: 1.2 }}
      >
        Mission<br />Complete
      </h1>
      <p className="text-sm leading-7" style={{ color: '#6b7280' }}>
        Your team cracked the code.<br />The escape is complete.
      </p>
    </div>
  );
}
