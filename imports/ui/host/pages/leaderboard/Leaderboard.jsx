import React from 'react';
import { useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '/imports/api/games/GamesCollection';

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const Leaderboard = () => {
  const navigate = useNavigate();

  const { loading, rankedGames } = useTracker(() => {
    const sub = Meteor.subscribe('games.leaderboard');
    const games = Games.find({ status: 'won' }).fetch()
      .filter(g => g.groupName && g.startedAt && g.endedAt)
      .map(g => ({
        ...g,
        durationMs: new Date(g.endedAt).getTime() - new Date(g.startedAt).getTime(),
      }))
      .sort((a, b) => a.durationMs - b.durationMs);
    return { loading: !sub.ready(), rankedGames: games };
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>
      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span className="font-bold text-xl tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: '#aa8984' }}>
          LEADERBOARD
        </span>
      </header>

      <main className="flex-1 px-8 py-12 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <p className="text-xs tracking-widest mb-1" style={{ color: '#8b0000' }}>
              FASTEST ESCAPES
            </p>
            <h1 className="text-3xl font-bold tracking-widest uppercase" style={{ color: '#e5e2e1' }}>
              GROUP RANKINGS
            </h1>
          </div>

          {loading && (
            <p className="text-xs tracking-widest" style={{ color: '#aa8984' }}>LOADING...</p>
          )}

          {!loading && rankedGames.length === 0 && (
            <p className="text-xs tracking-widest" style={{ color: '#aa8984' }}>
              NO GROUPS HAVE ESCAPED YET
            </p>
          )}

          {!loading && rankedGames.length > 0 && (
            <div className="flex flex-col" style={{ border: '1px solid #1c1b1b' }}>
              {rankedGames.map((g, i) => (
                <div
                  key={g._id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i < rankedGames.length - 1 ? '1px solid #1c1b1b' : 'none' }}
                >
                  <span
                    className="text-lg font-bold w-10 text-right"
                    style={{ color: i === 0 ? '#8b0000' : '#555' }}
                  >
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm font-bold tracking-wide uppercase" style={{ color: '#e5e2e1' }}>
                    {g.groupName}
                  </span>
                  <span className="text-xs tracking-widest uppercase" style={{ color: '#aa8984' }}>
                    {g.difficulty}
                  </span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: '#e5e2e1' }}>
                    {formatDuration(g.durationMs)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/game/create')}
            className="w-full mt-8 text-sm tracking-widest uppercase py-4 transition-colors cursor-pointer"
            style={{ background: '#8b0000', color: '#e5e2e1', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#a50000'}
            onMouseLeave={e => e.currentTarget.style.background = '#8b0000'}
          >
            NEW GAME
          </button>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
