import React from 'react';
import { Brand } from './Brand';

// The top bar every host screen shares, like the landing page's: the brand
// mark on the left (linking home), the screen's own controls on the right.
export function RoomBar({ children }) {
  return (
    <header className="es-bar sticky top-0 z-40">
      <Brand />
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
