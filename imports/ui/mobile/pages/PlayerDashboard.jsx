import React, { useState } from 'react';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';

export function PlayerDashboard({ playerName = 'PLAYER', onExit }) {
  const [activeTab, setActiveTab] = useState('status');

  const clues = [
    'Red emergency kit holds the first digit.',
    'The scanner reveals the second code when close.',
    'Blueprint edge hides the final pair.',
  ];

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-24 pt-4">

        <header className="flex items-center justify-between border-b border-slate-800/80 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-500">ESCAPESNAP // ACTIVE MISSION</p>
            <h1 className="mt-1 font-display text-xl font-bold tracking-wide text-white">{playerName.toUpperCase()}</h1>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="border border-slate-800/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 transition hover:border-red-500/60 hover:text-red-400 focus:outline-none"
          >
            Exit
          </button>
        </header>

        {activeTab === 'status' && (
          <section className="flex flex-col gap-4 pt-5">
            <div className="border border-slate-800/80 bg-slate-950/60 px-4 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">Code Progress</p>
              <div className="mt-3 flex gap-3">
                {[4, 2, 7, 1].map((digit, i) => (
                  <div key={i} className="flex h-12 w-12 items-center justify-center border border-red-500/50 bg-slate-950 font-mono text-lg font-semibold text-red-400">
                    {digit}
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-800/80 bg-slate-950/60 px-4 py-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">Mission Status</p>
              <div className="flex items-center justify-between border-b border-slate-800/50 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">Remaining time</span>
                <span className="font-mono text-sm text-white">09:35</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">Clues completed</span>
                <span className="font-mono text-sm text-white">3/5</span>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'clues' && (
          <section className="flex flex-col gap-3 pt-5">
            {clues.map((clue, i) => (
              <div key={i} className="border border-slate-800/80 bg-slate-950/60 px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">Clue {i + 1}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{clue}</p>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'scanner' && (
          <section className="flex flex-col gap-4 pt-5">
            <div className="flex items-center justify-center border border-slate-800/80 bg-slate-950/60" style={{ aspectRatio: '4/3' }}>
              <div className="text-center">
                <p className="font-mono text-sm font-semibold tracking-[0.15em] text-white">SCANNER READY</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Point at clue marker</p>
              </div>
            </div>
            <button type="button" className="w-full border border-red-600 bg-red-600/10 px-5 py-4 font-mono text-sm font-semibold uppercase tracking-[0.3em] text-red-400 transition hover:bg-red-600 hover:text-white focus:outline-none">
              Activate Scanner
            </button>
          </section>
        )}

      </div>

      <MobileBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
