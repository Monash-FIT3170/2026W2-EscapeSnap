import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useFinalRiddle } from '/imports/ui/shared/hooks/useFinalRiddle.js';
import { useRevealedLetters } from '/imports/ui/shared/hooks/useRevealedLetters.js';
import GameNotFound from '/imports/ui/shared/components/GameNotFound.jsx';
import WinScreen from '/imports/ui/host/pages/game-completion/WinScreen.jsx';
import LoseScreen from '/imports/ui/host/pages/game-completion/LoseScreen.jsx';
import FinalRiddleInput from '/imports/ui/host/components/riddle/FinalRiddleInput.jsx';
import SidebarLayout from '/imports/ui/host/layouts/SidebarLayout.jsx';
import { useT } from '../../../../languages/LanguageProvider';

const BG = '#131313';

const FinalRiddlePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const [hasWon, setHasWon] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  const { loading, finalRiddle, finalRiddleHint } = useFinalRiddle(gameId);
  const { lettersLoading, letters } = useRevealedLetters(gameId);

  if (loading || lettersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p style={{ color: '#aa8984', fontSize: 10, letterSpacing: '1px' }}>{t('host.finalRiddle.loading')}</p>
      </div>
    );
  }

  if (!finalRiddle) return <GameNotFound />;

  if (hasWon) {
    return (
      <WinScreen
        gameId={gameId}
        onPlayAgain={() => navigate('/game/create')}
        onViewSummary={() => navigate(`/game/${gameId}/summary`)}
        onViewLeaderboard={() => navigate('/leaderboard')}
      />
    );
  }
  if (hasLost) {
    return (
      <LoseScreen
        gameId={gameId}
        onPlayAgain={() => navigate('/game/create')}
        onViewSummary={() => navigate(`/game/${gameId}/summary`)}
        onViewLeaderboard={() => navigate('/leaderboard')}
      />
    );
  }

  return (
    <SidebarLayout gameId={gameId} activePage="final-riddle">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ background: BG, borderBottom: '2px solid #1c1b1b' }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1' }}>ESCAPESNAP</span>
      </header>

      {/* Body */}
      <div className="flex-1 p-8 flex flex-col gap-6">

        {/* Title */}
        <div className="flex items-center gap-3">
          <div style={{ width: 4, height: 32, background: '#8b0000' }} />
          <div>
            <p style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>{t('host.finalRiddle.missionCritical')}</p>
            <h1 style={{ fontWeight: 700, fontSize: 28, letterSpacing: '2px', color: '#e5e2e1', lineHeight: 1.2 }}>
              {t('host.finalRiddle.theFinal')} <span style={{ color: '#8b0000' }}>{t('host.finalRiddle.riddle')}</span>
            </h1>
          </div>
        </div>

        {/* Riddle card */}
        <div style={{ background: '#0e0e0e', borderLeft: '4px solid #8b0000', padding: '32px' }}>
          <p style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984', marginBottom: 12 }}>{t('host.finalRiddle.decryptTheClue')}</p>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#e5e2e1', lineHeight: 1.6, letterSpacing: '0.5px' }}>
            &ldquo;{finalRiddle}&rdquo;
          </p>

          {finalRiddleHint && (
            <div style={{ marginTop: 20 }}>
              {hintRevealed ? (
                <p style={{ fontSize: 13, color: '#aa8984', letterSpacing: '0.3px' }}>
                  💡 HINT: {finalRiddleHint}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setHintRevealed(true)}
                  style={{
                    fontSize: 11,
                    letterSpacing: '1.5px',
                    color: '#8b0000',
                    background: 'transparent',
                    border: '1px solid #8b0000',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  REVEAL HINT
                </button>
              )}
            </div>
          )}
        </div>

        {/* Revealed Letters */}
        <div style={{ background: '#1c1b1b', padding: '24px' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 4, height: 16, background: '#8b0000' }} />
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: '#e5e2e1' }}>{t('host.finalRiddle.revealedLetters')}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {letters.map((letter, i) => (
              <div key={i} style={{
                width: 64, height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#0e0e0e',
                borderBottom: '2px solid #8b0000',
                fontWeight: 700, fontSize: 24,
                color: '#e5e2e1', letterSpacing: '2px',
              }}>
                {letter}
              </div>
            ))}
            {letters.length === 0 && (
              <p style={{ fontSize: 11, color: '#aa8984', opacity: 0.6 }}>{t('host.finalRiddle.noLettersRevealedYet')}</p>
            )}
          </div>
        </div>

        {/* Input */}
        <div style={{ background: '#0e0e0e', padding: '24px' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 4, height: 16, background: '#8b0000' }} />
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '1.2px', color: '#e5e2e1' }}>{t('host.finalRiddle.submitAnswer')}</span>
          </div>
          <FinalRiddleInput
            gameId={gameId}
            onCorrect={() => setHasWon(true)}
            onFailed={() => setHasLost(true)}
          />
        </div>

      </div>

    </SidebarLayout>
  );
};

export default FinalRiddlePage;
