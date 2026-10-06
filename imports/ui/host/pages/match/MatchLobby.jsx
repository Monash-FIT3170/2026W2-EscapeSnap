import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { QRCodeSVG } from 'qrcode.react';
import { useMatch } from '/imports/ui/shared/hooks/useMatch';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { errorKey } from '../../../../languages/errors';

const TeamLobbyPanel = ({ team, players }) => {
  const t = useT();
  const teamPlayers = players.filter((p) => p.gameId === team._id);
  const slots = [
    ...teamPlayers,
    ...Array(Math.max(0, team.capacity - teamPlayers.length)).fill(null),
  ];
  const joinUrl = `${window.location.origin}/join/${team.joinCode}`;

  return (
    <div className="flex flex-col gap-5 p-6" style={{ background: '#0e0e0e', border: '1px solid #1c1b1b', minWidth: 0 }}>
      <div className="flex items-start justify-between gap-4">
        <div style={{ minWidth: 0 }}>
          <p className="truncate" style={{ fontWeight: 700, fontSize: 24, letterSpacing: '2px', color: '#e5e2e1' }}>
            {team.groupName?.toUpperCase()}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: team.riddlesReady ? '#2e7d32' : '#3a2a00' }} />
            <p style={{ fontSize: 10, letterSpacing: '1px', color: team.riddlesReady ? '#7ac47f' : '#8a7a55' }}>
              {t(team.riddlesReady ? 'host.match.riddlesReady' : 'host.match.generatingRiddles')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p style={{ fontSize: 9, letterSpacing: '1px', color: '#aa8984' }}>{t('host.match.players')}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#e5e2e1' }}>
            {teamPlayers.length}
            <span style={{ color: '#555' }}> / {team.capacity}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div style={{ background: '#e5e2e1', padding: 8, lineHeight: 0, flexShrink: 0 }}>
          <QRCodeSVG value={joinUrl} size={120} bgColor="#e5e2e1" fgColor="#0e0e0e" level="M" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 9, letterSpacing: '1.5px', color: '#aa8984', marginBottom: 6 }}>
            {t('host.match.scanToJoin', { team: team.groupName?.toUpperCase() })}
          </p>
          <p style={{ fontSize: 9, letterSpacing: '1px', color: '#555' }}>{t('host.match.joinCode')}</p>
          <p style={{ fontSize: 44, fontWeight: 700, letterSpacing: '4px', lineHeight: 1, color: '#e5e2e1', userSelect: 'all' }}>
            {team.joinCode}
          </p>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        {slots.map((player, i) => (
          <div
            key={player?._id ?? `empty-${i}`}
            className="truncate px-4 py-3"
            style={{
              background: player ? '#1c1b1b' : '#0a0a0a',
              border: player ? '1px solid #2a2a2a' : '1px dashed #1c1b1b',
              fontSize: player ? 13 : 10,
              fontWeight: player ? 700 : 400,
              letterSpacing: '1.5px',
              color: player ? '#e5e2e1' : '#2a2a2a',
            }}
          >
            {player ? player.name?.toUpperCase() : t('host.lobby.awaitingOperative')}
          </div>
        ))}
      </div>
    </div>
  );
};

const MatchLobby = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const { loading, match, teams, players } = useMatch(matchId);

  useEffect(() => {
    if (match && match.status !== 'lobby' && match.startedAt) {
      navigate(`/match/${matchId}/progress`);
    }
  }, [match?.status, match?.startedAt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e0e' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>{t('host.match.loading')}</p>
      </div>
    );
  }
  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e0e0e' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: '#8b0000' }}>{t('host.match.notFound')}</p>
      </div>
    );
  }

  const teamSizes = teams.map((team) => players.filter((p) => p.gameId === team._id).length);
  const canStart = teams.length === match.gameIds.length && teamSizes.every((n) => n > 0);
  const allFull = canStart && teams.every((team, i) => teamSizes[i] === team.capacity);
  const busy = starting || match.status !== 'lobby';

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      await Meteor.callAsync('matches.start', matchId);
    } catch (err) {
      setError(t(errorKey(err)));
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0e0e0e', color: '#e5e2e1' }}>
      <header className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid #1c1b1b' }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: '#e5e2e1' }}>ESCAPESNAP</span>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 10, letterSpacing: '1px', color: '#aa8984' }}>{t('host.match.eyebrow')}</span>
          <LanguagePicker />
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 p-8">
        <div>
          <p style={{ fontSize: 10, letterSpacing: '1.5px', color: '#8b0000', marginBottom: 4 }}>{t('host.match.eyebrow')}</p>
          <h1 style={{ fontWeight: 700, fontSize: 28, letterSpacing: '2px', color: '#e5e2e1' }}>{t('host.match.lobbyTitle')}</h1>
        </div>

        <div className="grid items-center gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)' }}>
          {teams[0] && <TeamLobbyPanel team={teams[0]} players={players} />}
          <span style={{ fontWeight: 900, fontSize: 32, letterSpacing: '2px', color: '#8b0000' }}>{t('host.match.vs')}</span>
          {teams[1] && <TeamLobbyPanel team={teams[1]} players={players} />}
        </div>

        {error && <p style={{ fontSize: 11, color: '#8b0000', letterSpacing: '1px' }}>!! {error}</p>}

        {canStart && !allFull && !busy && (
          <p style={{ fontSize: 11, color: '#aa8984', letterSpacing: '1px' }}>{t('host.match.notFullHint')}</p>
        )}

        <button
          onClick={handleStart}
          disabled={busy || !canStart}
          style={{
            width: '100%',
            padding: '18px',
            background: busy ? '#3a0000' : canStart ? '#8b0000' : '#1c1b1b',
            color: busy || !canStart ? '#555' : '#e5e2e1',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '2px',
            cursor: busy || !canStart ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          {busy
            ? t('host.match.starting')
            : canStart
              ? t('host.match.startMatch')
              : t('host.match.awaitingTeams')}
        </button>
      </main>
    </div>
  );
};

export default MatchLobby;
