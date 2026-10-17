import React from 'react';
import { useT } from '/imports/languages/LanguageProvider';
import { RoomBar } from './room/RoomBar';

// Taped off, like the landing page's caution tape.
const GameNotFound = () => {
  const t = useT();

  return (
    <div className="es-room flex flex-col overflow-x-hidden">
      <RoomBar />
      <div className="flex flex-1 items-center justify-center py-16">
        <h1 className="es-tape w-[110%] -rotate-3 py-4 text-4xl sm:text-6xl">
          {t('errors.notFound')}
        </h1>
      </div>
    </div>
  );
};

export default GameNotFound;
