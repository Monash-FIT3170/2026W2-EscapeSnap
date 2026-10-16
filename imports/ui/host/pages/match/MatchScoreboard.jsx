import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMatch } from '/imports/ui/shared/hooks/useMatch';
import TeamScoreCard from '../../components/match/TeamScoreCard';
import { useT } from '../../../../languages/LanguageProvider';

// The shared screen for a same-room match. It deliberately shows no riddles
// and no letters — both teams can see it, so it is a scoreboard only, and each
// team enters its final answer on a phone.
const MatchScoreboard = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const { loading, match, teams, players, rounds } = useMatch(matchId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--es-panel))' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.match.loading')}</p>
      </div>
    );
  }
  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--es-panel))' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-brand))' }}>{t('host.match.notFound')}</p>
      </div>
    );
  }

  const finished = match.status === 'finished';
  const winner = teams.find((team) => team._id === match.winnerGameId);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(var(--es-panel))', color: 'rgb(var(--es-ink))' }}>
      <header className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '2px solid rgb(var(--es-panel))' }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: 'rgb(var(--es-ink))' }}>ESCAPESNAP</span>
        <span style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>
          {t('host.match.eyebrow')} · {t('host.match.scoreboard')}
        </span>
      </header>

      <main className="flex-1 flex flex-col gap-8 p-8">
        {finished && (
          <div className="flex flex-col items-center gap-2 py-8" style={{ background: 'rgb(var(--es-ground))', borderLeft: `4px solid ${winner ? 'rgb(var(--es-correct))' : 'rgb(var(--es-brand))'}` }}>
            <p style={{ fontSize: 11, letterSpacing: '3px', color: 'rgb(var(--es-muted))' }}>
              {t(winner ? 'host.match.winnerSub' : 'host.match.drawSub')}
            </p>
            <h1 style={{ fontWeight: 800, fontSize: 56, letterSpacing: '4px', lineHeight: 1.1, color: winner ? 'rgb(var(--es-correct))' : 'rgb(var(--es-ink))', textAlign: 'center' }}>
              {winner
                ? t('host.match.winner', { team: winner.groupName?.toUpperCase() })
                : t('host.match.draw')}
            </h1>
          </div>
        )}

        <div className="grid items-start gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)' }}>
          <TeamScoreCard team={teams[0]} players={players} rounds={rounds} highlight={finished && winner?._id === teams[0]?._id} />
          <span className="self-center" style={{ fontWeight: 900, fontSize: 32, letterSpacing: '2px', color: 'rgb(var(--es-brand))' }}>
            {t('host.match.vs')}
          </span>
          <TeamScoreCard team={teams[1]} players={players} rounds={rounds} highlight={finished && winner?._id === teams[1]?._id} />
        </div>

        {finished && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {teams.map((team) => (
              <button
                key={team._id}
                onClick={() => navigate(`/game/${team._id}/summary`)}
                style={{ background: 'transparent', color: 'rgb(var(--es-muted))', border: '1px solid rgb(var(--es-line))', padding: '14px 32px', fontSize: 12, fontWeight: 700, letterSpacing: '2px', cursor: 'pointer' }}
              >
                {t('host.match.viewDebrief', { team: team.groupName?.toUpperCase() })}
              </button>
            ))}
            <button
              onClick={() => navigate('/game/create')}
              style={{ background: 'rgb(var(--es-brand))', color: 'rgb(var(--es-on-brand))', border: 'none', padding: '14px 32px', fontSize: 12, fontWeight: 700, letterSpacing: '2px', cursor: 'pointer' }}
            >
              {t('host.match.newMatch')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchScoreboard;
