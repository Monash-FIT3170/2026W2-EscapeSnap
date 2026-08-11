import { PlayerAvatar } from '../../../shared/components/PlayerAvatar';

export function SurvivorIdCard({
  photoUrl,
  callSign = 'PLAYER',
  status = 'AWAITING GUIDANCE',
}) {
  return (
    <section className="flex w-full flex-col items-center px-2 py-1">
      <PlayerAvatar
        photoUrl={photoUrl}
        playerName={callSign}
        size="min(280px, 68vw, 36vh)"
        className="rounded-full border-4 border-red-700 shadow-[0_0_45px_rgba(185,28,28,0.28)]"
      />

      <h2 className="mt-5 text-center font-display text-3xl font-bold tracking-wide text-white">
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
