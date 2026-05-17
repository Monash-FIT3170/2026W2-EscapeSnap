import React from 'react';

export function AwaitingGameCard() {
  return (
    <section className="relative mt-5 w-full overflow-hidden border border-red-500/20 bg-red-950/10 px-6 py-8 text-center">

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse" />

      <div className="mx-auto flex h-14 w-14 items-center justify-center border border-red-500/50 bg-black text-red-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 animate-pulse">
          <path d="M6 3h12M6 21h12" />
          <path d="M7 3v3a5 5 0 0 0 2.5 4.33L12 12l-2.5 1.67A5 5 0 0 0 7 18v3" />
          <path d="M17 3v3a5 5 0 0 1-2.5 4.33L12 12l2.5 1.67A5 5 0 0 1 17 18v3" />
        </svg>
      </div>

      <h3 className="mt-6 font-mono text-base font-semibold tracking-widest text-white">
        AWAITING HOST
      </h3>

      <p className="mx-auto mt-3 max-w-[34ch] font-mono text-xs leading-6 text-slate-500">
        Stand by while the host prepares the game. Stay sharp — it begins soon.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Standby</span>
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0.8s' }} />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
    </section>
  );
}
