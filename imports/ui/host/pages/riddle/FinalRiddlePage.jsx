import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useFinalRiddle } from '/imports/ui/shared/hooks/useFinalRiddle.js';
import { useRevealedLetters } from '/imports/ui/shared/hooks/useRevealedLetters.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import WinScreen from '/imports/ui/host/pages/game-completion/WinScreen.jsx';
import LoseScreen from '/imports/ui/host/pages/game-completion/LoseScreen.jsx';
import FinalRiddleInput from '/imports/ui/host/components/riddle/FinalRiddleInput.jsx';
import SidebarLayout from '/imports/ui/host/layouts/SidebarLayout.jsx';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';
import { useT } from '../../../../languages/LanguageProvider';
import { useGameUiTheme } from '../../../shared/components/theme/UiThemeProvider';

const FinalRiddlePage = () => {
  const { gameId } = useParams();
  useGameUiTheme(gameId);
  const navigate = useNavigate();
  const t = useT();
  const [hasWon, setHasWon] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const { loading, finalRiddle, finalRiddleHint, gameStatus } = useFinalRiddle(gameId);
  const { lettersLoading, letters } = useRevealedLetters(gameId);

  if (loading || lettersLoading) {
    return (
      <div className="es-room flex items-center justify-center">
        <p className="pulse-text font-display text-lg text-muted">{t('host.finalRiddle.loading')}</p>
      </div>
    );
  }

  if (!finalRiddle) return <GameNotFound />;

  // The game can also end off this screen — a teammate answering on a phone,
  // or a rival team escaping first — so follow the server's status too.
  if (hasWon || gameStatus === 'won') {
    return (
      <WinScreen
        gameId={gameId}
        onPlayAgain={() => navigate('/game/create')}
        onViewSummary={() => navigate(`/game/${gameId}/summary`)}
        onViewLeaderboard={() => navigate('/leaderboard')}
      />
    );
  }
  if (hasLost || gameStatus === 'lost') {
    return (
      <LoseScreen
        gameId={gameId}
        onPlayAgain={() => navigate('/game/create')}
        onViewSummary={() => navigate(`/game/${gameId}/summary`)}
        onViewLeaderboard={() => navigate('/leaderboard')}
      />
    );
  }

  // Laid out like the landing page's final-riddle section: the riddle as a
  // case file on the left, the lock (letters and answer) on a plate beside it.
  return (
    <SidebarLayout gameId={gameId} activePage="final-riddle">
      <RoomBar home={null} />

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-start gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-10">
        <div className="flex flex-col gap-8">
          <h1 className="es-title text-6xl text-ink lg:text-7xl">
            {t('host.finalRiddle.theFinal')} {t('host.finalRiddle.riddle')}
          </h1>

          <article className="es-paper -rotate-1 px-8 pb-9 pt-8">
            <span className="es-stamp mb-6 text-[#a3150e]">{t('host.finalRiddle.missionCritical')}</span>
            <p className="mb-3 text-sm text-[#3b322b]">{t('host.finalRiddle.decryptTheClue')}</p>
            <p className="text-2xl leading-[1.7]">&ldquo;{finalRiddle}&rdquo;</p>

            {finalRiddleHint && (
              <div className="mt-6">
                {hintRevealed ? (
                  <p className="es-hand text-sm leading-7 text-[#a3150e]">💡 {finalRiddleHint}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHintRevealed(true)}
                    className="es-link min-h-[44px] text-lg text-[#a3150e]"
                  >
                    REVEAL HINT
                  </button>
                )}
              </div>
            )}
          </article>
        </div>

        <div className="es-plate flex flex-col gap-8 px-6 pb-7 pt-6 lg:mt-24">
          <section>
            <h2 className="es-label mb-3 flex items-center gap-2">
              <span className="es-led" data-state={letters.length ? 'ready' : 'off'} aria-hidden="true" />
              {t('host.finalRiddle.revealedLetters')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {letters.map((letter, i) => (
                <span
                  key={i}
                  className="es-lcd es-lcd-text flex h-16 w-14 items-center justify-center text-4xl"
                >
                  {letter}
                </span>
              ))}
              {letters.length === 0 && (
                <p className="text-sm text-muted">{t('host.finalRiddle.noLettersRevealedYet')}</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="es-label mb-3">{t('host.finalRiddle.submitAnswer')}</h2>
            <FinalRiddleInput
              gameId={gameId}
              onCorrect={() => setHasWon(true)}
              onFailed={() => setHasLost(true)}
            />
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default FinalRiddlePage;
