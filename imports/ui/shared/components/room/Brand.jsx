import React from 'react';
import { Link, useInRouterContext } from 'react-router-dom';

// The ESCAPESNAP mark from the landing page's top bar, with its recording
// light. Always links back to the home page. Inside the router it navigates
// client-side; outside it (tests) it falls back to a plain link.
export function Brand({ to = '/', className = '', label = 'EscapeSnap' }) {
  const inRouter = useInRouterContext();
  const props = { className: `es-brand ${className}`, 'aria-label': label };
  const mark = (
    <>
      <span className="es-rec-dot" aria-hidden="true" />
      <span>
        ESCAPE<span className="es-brand-snap">SNAP</span>
      </span>
    </>
  );
  return inRouter ? (
    <Link to={to} {...props}>
      {mark}
    </Link>
  ) : (
    <a href={to} {...props}>
      {mark}
    </a>
  );
}
