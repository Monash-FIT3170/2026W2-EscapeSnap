import React from 'react';

function CornerBrackets() {
  return (
    <>
      <span className="pointer-events-none absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-red-500" />
      <span className="pointer-events-none absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-red-500" />
      <span className="pointer-events-none absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-red-500" />
      <span className="pointer-events-none absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-red-500" />
    </>
  );
}

function PlayerPlaceholder() {
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <rect width="200" height="200" fill="#0d0d10" />
      <circle cx="100" cy="80" r="32" fill="#2a2a30" />
      <path d="M40 200 C 40 140, 160 140, 160 200 Z" fill="#1e1e24" />
    </svg>
  );
}

export function SurvivorIdCard({ photoUrl, callSign = 'PLAYER', refCode = 'REF_SEC_U012_X', zoneCode = 'C_SECTOR_X', duration = '0:00MS', status = 'AWAITING GUIDANCE' }) {
  return (
    <section className="flex flex-col items-center px-2 pb-1 pt-4">
      <div className="relative aspect-[4/5] w-full max-w-[260px]">
        <CornerBrackets />

        <div className="absolute inset-0 overflow-hidden bg-slate-900">
          {photoUrl
            ? <img src={photoUrl} alt={callSign} className="h-full w-full object-cover" />
            : <PlayerPlaceholder />
          }
        </div>

        <div className="pointer-events-none absolute right-2 top-2 text-right font-mono text-[10px] leading-tight tracking-[0.15em] text-slate-300/80">
          <p>{refCode}</p>
          <p>{zoneCode}</p>
        </div>

        <div className="pointer-events-none absolute bottom-2 right-2 font-mono text-[10px] tracking-[0.15em] text-slate-300/90">
          ⏱ {duration}
        </div>
      </div>

      <h2 className="mt-5 font-display text-2xl font-bold tracking-wide text-white">
        {callSign}
      </h2>

      <div className="mt-2 flex w-full items-center justify-center gap-3">
        <span className="h-px flex-1 bg-slate-700/70" />
        <p className="font-mono text-[11px] tracking-[0.32em] text-slate-400">{status}</p>
        <span className="h-px flex-1 bg-slate-700/70" />
      </div>
    </section>
  );
}
