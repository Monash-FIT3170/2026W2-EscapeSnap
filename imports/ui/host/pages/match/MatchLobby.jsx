import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { QRCodeSVG } from 'qrcode.react';
import { useMatch } from '/imports/ui/shared/hooks/useMatch';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { errorKey } from '../../../../languages/errors';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';

const TeamLobbyPanel = ({ team, players }) => {
  const t = useT();
  const teamPlayers = players.filter((p) => p.gameId === team._id);
  const slots = [
    ...teamPlayers,
    ...Array(Math.max(0, team.capacity - teamPlayers.length)).fill(null),
  ];
  const joinUrl = `${window.location.origin}/join/${team.joinCode}`;

  return (
    <div className="es-plate flex min-w-0 flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="es-title truncate text-3xl text-ink">{team.groupName?.toUpperCase()}</p>
          <p className={`mt-2 flex items-center gap-2 text-sm ${team.riddlesReady ? 'text-correct' : 'text-warn'}`}>
            <span className="es-led" data-state={team.riddlesReady ? 'ok' : 'busy'} aria-hidden="true" />
            {t(team.riddlesReady ? 'host.match.riddlesReady' : 'host.match.generatingRiddles')}
          </p>
        </div>
        <div className="text-right">
          <p className="es-label">{t('host.match.players')}</p>
          <p className="es-title mt-1 text-3xl tabular-nums text-ink">
            {teamPlayers.length}
            <span className="text-dim"> / {team.capacity}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex-shrink-0 bg-[#f4efe4] p-2 leading-none">
          <QRCodeSVG value={joinUrl} size={120} bgColor="#f4efe4" fgColor="#1e1915" level="M" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm text-muted">
            {t('host.match.scanToJoin', { team: team.groupName?.toUpperCase() })}
          </p>
          <p className="es-label mb-1">{t('host.match.joinCode')}</p>
          <p className="es-lcd es-lcd-text select-all px-3 py-2 text-center text-5xl leading-none tracking-[0.15em]">
            {team.joinCode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {slots.map((player, i) =>
          player ? (
            <div key={player._id} className="es-well truncate px-4 py-3 font-display text-lg font-semibold tracking-[0.02em] text-ink">
              {player.name?.toUpperCase()}
            </div>
          ) : (
            <div key={`empty-${i}`} className="truncate rounded-md border-2 border-dashed border-line/70 px-4 py-3 font-display text-sm tracking-[0.03em] text-dim">
              {t('host.lobby.awaitingOperative')}
            </div>
          )
        )}
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

  const allFull = teams.length === match.gameIds.length && teams.every(
    (team) => players.filter((p) => p.gameId === team._id).length === team.capacity
  );
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
    <div className="es-room flex flex-col">
      <RoomBar home={null}>
        <span className="hidden font-display text-base tracking-[0.04em] text-muted sm:inline">{t('host.match.eyebrow')}</span>
        <LanguagePicker chipClassName="es-chip" />
      </RoomBar>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-10 lg:px-10">
        <div>
          <p className="es-label mb-2">{t('host.match.eyebrow')}</p>
          <h1 className="es-title text-6xl text-ink">{t('host.match.lobbyTitle')}</h1>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {teams[0] && <TeamLobbyPanel team={teams[0]} players={players} />}
          <span className="es-title text-center text-6xl text-brand-bright">{t('host.match.vs')}</span>
          {teams[1] && <TeamLobbyPanel team={teams[1]} players={players} />}
        </div>

        {error && <p role="alert" className="font-display text-base text-brand-bright">⚠ {error}</p>}

        <button
          type="button"
          onClick={handleStart}
          disabled={busy || !allFull}
          className="es-btn es-btn-primary w-full"
        >
          {busy
            ? t('host.match.starting')
            : allFull
              ? t('host.match.startMatch')
              : t('host.match.awaitingTeams')}
        </button>
      </main>
    </div>
  );
};

export default MatchLobby;
