import React from 'react';
import { Brand } from './Brand';

// The top bar every host screen shares, like the landing page's: the brand
// mark on the left, the screen's own controls on the right. `home` is where
// the mark links (null mid-game, so a stray click can't abandon the room).
export function RoomBar({ home = '/', children }) {
  return (
    <header className="es-bar sticky top-0 z-40">
      <Brand to={home} />
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
