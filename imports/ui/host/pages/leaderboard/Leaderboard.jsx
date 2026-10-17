import React from 'react';
import { useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '/imports/api/games/GamesCollection';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';

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
    <div className="es-room flex flex-col">
      <RoomBar>
        <ThemePicker chipClassName="es-chip" />
        <LanguagePicker chipClassName="es-chip" />
      </RoomBar>

      <main className="flex flex-1 flex-col items-center px-5 py-14">
        <div className="w-full max-w-2xl">
          <p className="es-label mb-3">{t('host.leaderboard.fastestEscapes')}</p>
          <h1 className="es-title mb-10 text-6xl text-ink">{t('host.leaderboard.groupRankings')}</h1>

          {loading && (
            <p className="pulse-text text-muted">{t('host.leaderboard.loading')}</p>
          )}

          {!loading && rankedGames.length === 0 && (
            <p className="text-muted">{t('host.leaderboard.noGroupsEscaped')}</p>
          )}

          {!loading && rankedGames.length > 0 && (
            <ol className="es-plate flex flex-col p-2">
              {rankedGames.map((g, i) => (
                <li
                  key={g._id}
                  className={`flex items-center gap-4 rounded-md px-4 py-4 ${
                    i === 0 ? 'es-lcd' : i > 0 ? 'border-t border-line/60' : ''
                  }`}
                >
                  <span
                    className={`w-10 text-right font-display text-2xl font-semibold tabular-nums ${
                      i === 0 ? 'es-lcd-text' : 'text-dim'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-display text-xl font-semibold tracking-[0.02em] text-ink">
                    {g.groupName}
                  </span>
                  <span className="hidden font-display text-sm tracking-[0.04em] text-muted sm:inline">
                    {t(`difficulty.${g.difficulty}`)}
                  </span>
                  <span
                    className={`font-display text-2xl font-semibold tabular-nums ${
                      i === 0 ? 'es-lcd-text' : 'text-ink'
                    }`}
                  >
                    {formatDuration(g.durationMs)}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <button
            type="button"
            onClick={() => navigate('/game/create')}
            className="es-btn es-btn-primary mt-8 w-full"
          >
            {t('host.leaderboard.newGame')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
