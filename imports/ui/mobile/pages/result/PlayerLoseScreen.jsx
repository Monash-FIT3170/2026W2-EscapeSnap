import React from 'react';

export function PlayerLoseScreen() {
  return (
    <div
      className="h-screen flex flex-col items-center justify-center px-8 gap-6 text-center"
      style={{ background: '#0e0e0e' }}
    >
      <div style={{ width: 64, height: 3, background: '#8b0000' }} />
      <h1
        className="font-black uppercase tracking-widest"
        style={{ fontSize: 40, color: '#8b0000', lineHeight: 1.2 }}
      >
        Mission<br />Failed
      </h1>
      <p className="text-sm leading-7" style={{ color: '#6b7280' }}>
        Your team ran out of attempts.<br />The escape has failed.
      </p>
    </div>
  );
}
