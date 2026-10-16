import React from 'react';
import { useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '/imports/api/games/GamesCollection';
import { useT } from '../../../../languages/LanguageProvider';

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const t = useT();

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
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(var(--es-ground))', color: 'rgb(var(--es-ink))' }}>
      <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--es-panel))' }}>
        <span className="font-display text-xl font-black tracking-wide text-brand">
          ESCAPESNAP
        </span>
        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgb(var(--es-muted))' }}>
          {t('host.leaderboard.leaderboard')}
        </span>
      </header>

      <main className="flex-1 px-8 py-12 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <p className="text-xs tracking-widest mb-1" style={{ color: 'rgb(var(--es-brand))' }}>
              {t('host.leaderboard.fastestEscapes')}
            </p>
            <h1 className="text-3xl font-bold tracking-widest uppercase" style={{ color: 'rgb(var(--es-ink))' }}>
              {t('host.leaderboard.groupRankings')}
            </h1>
          </div>

          {loading && (
            <p className="text-xs tracking-widest" style={{ color: 'rgb(var(--es-muted))' }}>{t('host.leaderboard.loading')}</p>
          )}

          {!loading && rankedGames.length === 0 && (
            <p className="text-xs tracking-widest" style={{ color: 'rgb(var(--es-muted))' }}>
              {t('host.leaderboard.noGroupsEscaped')}
            </p>
          )}

          {!loading && rankedGames.length > 0 && (
            <div className="flex flex-col" style={{ border: '1px solid rgb(var(--es-panel))' }}>
              {rankedGames.map((g, i) => (
                <div
                  key={g._id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i < rankedGames.length - 1 ? '1px solid rgb(var(--es-panel))' : 'none' }}
                >
                  <span
                    className="text-lg font-bold w-10 text-right"
                    style={{ color: i === 0 ? 'rgb(var(--es-brand))' : 'rgb(var(--es-dim))' }}
                  >
                    #{i + 1}
                  </span>
                  <span className="flex-1 text-sm font-bold tracking-wide uppercase" style={{ color: 'rgb(var(--es-ink))' }}>
                    {g.groupName}
                  </span>
                  <span className="text-xs tracking-widest uppercase" style={{ color: 'rgb(var(--es-muted))' }}>
                    {t(`difficulty.${g.difficulty}`)}
                  </span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'rgb(var(--es-ink))' }}>
                    {formatDuration(g.durationMs)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/game/create')}
            className="w-full mt-8 text-sm tracking-widest uppercase py-4 transition-colors cursor-pointer"
            style={{ background: 'rgb(var(--es-brand))', color: 'rgb(var(--es-on-brand))', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--es-brand-bright))'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgb(var(--es-brand))'}
          >
            {t('host.leaderboard.newGame')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
