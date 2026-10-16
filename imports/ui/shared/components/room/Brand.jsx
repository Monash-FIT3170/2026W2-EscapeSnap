import React from 'react';

// The ESCAPESNAP mark from the landing page's top bar, with its recording
// light. Links home unless `to` is null (mid-game, where leaving by accident
// would hurt). A plain link, so it also works outside the router (tests).
export function Brand({ to = '/', className = '', label = 'EscapeSnap' }) {
  const mark = (
    <>
      <span className="es-rec-dot" aria-hidden="true" />
      <span>
        ESCAPE<span className="es-brand-snap">SNAP</span>
      </span>
    </>
  );
  if (to === null) {
    return (
      <span className={`es-brand ${className}`} aria-label={label}>
        {mark}
      </span>
    );
  }
  return (
    <a href={to} className={`es-brand ${className}`} aria-label={label}>
      {mark}
    </a>
  );
}
