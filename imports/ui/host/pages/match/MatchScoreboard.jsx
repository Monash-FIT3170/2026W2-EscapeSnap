import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMatch } from '/imports/ui/shared/hooks/useMatch';
import TeamScoreCard from '../../components/match/TeamScoreCard';
import { useT } from '../../../../languages/LanguageProvider';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';
import { useGameUiTheme } from '/imports/ui/shared/components/theme/UiThemeProvider';

// The shared screen for a same-room match. It deliberately shows no riddles
// and no letters — both teams can see it, so it is a scoreboard only, and each
// team enters its final answer on a phone.
const MatchScoreboard = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const { loading, match, teams, players, rounds } = useMatch(matchId);
  // Both teams were created in the same skin; show it here as on their phones.
  useGameUiTheme(match?.gameIds?.[0]);

  if (loading) {
    return (
      <div className="es-room flex items-center justify-center">
        <p className="pulse-text font-display text-lg text-muted">{t('host.match.loading')}</p>
      </div>
    );
  }
  if (!match) {
    return (
      <div className="es-room flex items-center justify-center">
        <p className="font-display text-lg text-brand-bright">{t('host.match.notFound')}</p>
      </div>
    );
  }

  const finished = match.status === 'finished';
  const winner = teams.find((team) => team._id === match.winnerGameId);

  return (
    <div className="es-room flex flex-col">
      <RoomBar>
        <span className="font-display text-base tracking-[0.04em] text-muted">{t('host.match.scoreboard')}</span>
      </RoomBar>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-10 lg:px-10">
        {finished && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className={`es-stamp !text-xl ${winner ? 'text-correct' : 'text-muted'}`}>
              {t(winner ? 'host.match.winnerSub' : 'host.match.drawSub')}
            </span>
            <h1 className={`es-title text-7xl ${winner ? 'text-correct' : 'text-ink'}`}>
              {winner
                ? t('host.match.winner', { team: winner.groupName?.toUpperCase() })
                : t('host.match.draw')}
            </h1>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <TeamScoreCard team={teams[0]} players={players} rounds={rounds} highlight={finished && winner?._id === teams[0]?._id} />
          <span className="es-title self-center text-center text-6xl text-brand-bright">{t('host.match.vs')}</span>
          <TeamScoreCard team={teams[1]} players={players} rounds={rounds} highlight={finished && winner?._id === teams[1]?._id} />
        </div>

        {finished && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {teams.map((team) => (
              <button
                key={team._id}
                type="button"
                onClick={() => navigate(`/game/${team._id}/summary`)}
                className="es-btn es-btn-ghost"
              >
                {t('host.match.viewDebrief', { team: team.groupName?.toUpperCase() })}
              </button>
            ))}
            <button type="button" onClick={() => navigate('/game/create')} className="es-btn es-btn-primary">
              {t('host.match.newMatch')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchScoreboard;
