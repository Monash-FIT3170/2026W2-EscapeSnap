import { useState } from 'react';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';

const playerData = {
  name: 'SURVIVOR_714',
  region: 'SECTOR_G',
  fearLevel: 88,
  focusPercent: 24,
  activeClue: 'Find the hidden device under the red emergency kit.',
  clueCount: 3,
  codeDigits: [4, 2, 7, 1],
};

const clueList = [
  'Red emergency kit holds the first digit.',
  'The scanner reveals the second code when close.',
  'Blueprint edge hides the final pair.',
];

export function PlayerDashboard() {
  const [activeTab, setActiveTab] = useState('status');

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-6">
        <section className="rounded-[32px] border border-slate-800/70 bg-slate-950/90 p-5 shadow-xl shadow-slate-950/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/80 text-3xl font-bold text-cyan-300">
              {playerData.name.slice(-3)}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Operational Unit</p>
              <h1 className="text-2xl font-semibold text-white">{playerData.name}</h1>
              <p className="mt-1 text-sm text-slate-400">{playerData.region} · AWAITING GUIDANCE</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-900/85 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
              <span>Fear level</span>
              <span>{playerData.fearLevel}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-rose-500" style={{ width: `${playerData.fearLevel}%` }} />
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-3xl bg-slate-900/85 p-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Active clue</span>
              <span className="font-semibold text-white">#{playerData.clueCount}</span>
            </div>
            <p className="text-base leading-6 text-slate-200">{playerData.activeClue}</p>
          </div>
        </section>

        <section className="mt-5 flex-1 rounded-[32px] border border-slate-800/70 bg-slate-950/90 p-5 shadow-xl shadow-slate-950/30 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Player view</p>
              <h2 className="text-xl font-semibold text-white">{activeTab === 'clues' ? 'Clue Log' : activeTab === 'scanner' ? 'Scanner Ready' : 'Player Status'}</h2>
            </div>
            <div className="rounded-3xl bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.3em] text-cyan-300">{activeTab}</div>
          </div>

          {activeTab === 'clues' && (
            <div className="space-y-4">
              {clueList.map((clue, index) => (
                <div key={clue} className="rounded-3xl border border-slate-800/80 bg-slate-900 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Clue {index + 1}</p>
                  <p className="mt-2 text-base leading-6 text-slate-200">{clue}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'scanner' && (
            <div className="space-y-5">
              <div className="aspect-[4/3] rounded-[28px] border border-slate-800/80 bg-slate-900/70 p-4 text-center text-slate-400">
                <p className="mt-12 text-lg font-semibold text-white">Scanner ready</p>
                <p className="mt-3 text-sm">Point your camera at the clue marker to reveal a code digit.</p>
              </div>
              <button className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-400">
                Activate scanner
              </button>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-5">
              <div className="space-y-3 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Code progress</span>
                  <span className="font-semibold text-white">{playerData.codeDigits.length}/4 digits</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {playerData.codeDigits.map((digit, index) => (
                    <div key={index} className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950 text-lg font-semibold text-cyan-300">
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mission status</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Remaining time</span>
                    <span className="text-white">09:35</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Clues completed</span>
                    <span className="text-white">{playerData.clueCount}/5</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <MobileBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
