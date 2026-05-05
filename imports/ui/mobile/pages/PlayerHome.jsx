import React, { useState } from 'react';

export function PlayerHome({ onStart }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Player name required'); return; }
    if (!code.trim()) { setError('Game code required'); return; }
    setError('');
    onStart(name.trim(), code.trim().toUpperCase());
  }

  return (
    <div
      className="min-h-screen bg-black text-white flex items-center justify-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <div className="relative w-full max-w-sm px-8 py-14">

        <span className="pointer-events-none absolute -left-0.5 -top-0.5 h-10 w-10 border-l-2 border-t-2 border-red-500/70" />
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-10 w-10 border-r-2 border-t-2 border-red-500/70" />
        <span className="pointer-events-none absolute -bottom-0.5 -left-0.5 h-10 w-10 border-b-2 border-l-2 border-red-500/70" />
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-10 w-10 border-b-2 border-r-2 border-red-500/70" />

        <div className="mb-6 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-white">System Online</span>
        </div>

        <h1
          className="text-center font-display text-5xl font-black leading-tight tracking-wide text-red-500"
          style={{ textShadow: '0 0 40px rgba(239,68,68,0.45), 0 0 80px rgba(239,68,68,0.15)' }}
        >
          ESCAPE<br />SNAP
        </h1>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
          <span className="font-mono text-xs uppercase tracking-widest text-white">Player Terminal</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <label className="font-mono text-sm font-medium text-white">
              Player Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoComplete="off"
              className="w-full border border-slate-700 bg-slate-950 px-4 py-3.5 font-mono text-base text-white placeholder:text-white focus:border-red-500/70 focus:outline-none transition-colors duration-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-sm font-medium text-white">
              Game Code
            </label>
            <input
              type="text"
              placeholder="e.g. ALPHA-7"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={12}
              autoComplete="off"
              className="w-full border border-slate-700 bg-slate-950 px-4 py-3.5 font-mono text-base tracking-widest text-white placeholder:text-white focus:border-red-500/70 focus:outline-none transition-colors duration-200"
            />
          </div>

          {error && (
            <p className="font-mono text-sm text-red-400">⚠ {error}</p>
          )}

          <button
            type="submit"
            className="group relative mt-2 w-full overflow-hidden border border-red-600/60 px-5 py-4 font-mono text-base font-semibold uppercase tracking-wider text-red-400 transition-colors duration-300 hover:text-white focus:outline-none"
          >
            <span className="absolute inset-0 -translate-x-full bg-red-600 transition-transform duration-300 ease-out group-hover:translate-x-0" />
            <span className="relative">Enter Game →</span>
          </button>

        </form>

      </div>
    </div>
  );
}
