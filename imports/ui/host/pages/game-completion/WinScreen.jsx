import React from 'react';
import PostGameLeaderboard from '../../components/leaderboard/PostGameLeaderboard';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';
import { useT } from '../../../../languages/LanguageProvider';

const WinScreen = ({ gameId, onPlayAgain, onViewSummary, onViewLeaderboard }) => {
  const t = useT();
  return (
    <div className="es-room flex flex-col overflow-x-hidden">
      <RoomBar />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-16 pt-14 text-center">
        {/* The ESCAPED stamp from the landing page's case file. */}
        <span className="es-stamp mb-8 !text-2xl text-correct">{t('host.winScreen.missionSuccess')}</span>
        <h1 className="es-title text-7xl text-ink sm:text-8xl">{t('host.winScreen.youEscaped')}</h1>

        <p className="mt-6 text-lg text-muted">{t('host.winScreen.riddleSolved')}</p>

        <div className="mt-12 w-full text-left">
          <PostGameLeaderboard gameId={gameId} />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={onPlayAgain} className="es-btn es-btn-primary">
            {t('host.winScreen.playAgain')}
          </button>
          <button type="button" onClick={onViewLeaderboard} className="es-btn es-btn-ghost">
            {t('host.winScreen.viewLeaderboard')}
          </button>
          {onViewSummary && (
            <button type="button" onClick={onViewSummary} className="es-link px-4 text-lg">
              {t('host.winScreen.viewDebrief')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinScreen;
