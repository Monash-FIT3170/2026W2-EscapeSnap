import React from 'react';
import PostGameLeaderboard from '../../components/leaderboard/PostGameLeaderboard';
import GameCompletionActions from '../../components/game-completion/GameCompletionActions';

const WinScreen = ({ gameId, onPlayAgain, onViewLeaderboard }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>

      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: '#aa8984' }}>
          MISSION COMPLETE
        </span>
      </header>

      <div className="flex-1 px-6 py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <p className="mb-3 text-xs tracking-widest" style={{ color: '#8b0000' }}>
            MISSION SUCCESS
          </p>
          <h1
            className="mb-4 text-center font-extrabold uppercase"
            style={{
              color: '#e5e2e1',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              letterSpacing: '0.1em',
              lineHeight: 1,
            }}
          >
            YOU ESCAPED
          </h1>

          <p
            className="mb-12 text-center uppercase"
            style={{ letterSpacing: '0.3em', fontSize: '1rem', color: '#aa8984' }}
          >
            THE RIDDLE HAS BEEN SOLVED.
          </p>

          <div className="w-full">
            <PostGameLeaderboard gameId={gameId} />
          </div>

          <GameCompletionActions
            playAgainLabel="PLAY AGAIN"
            onPlayAgain={onPlayAgain}
            onViewLeaderboard={onViewLeaderboard}
          />
        </div>
      </div>

    </div>
  );
};

export default WinScreen;
