import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { QRCodeSVG } from 'qrcode.react';
import { Games } from '../../../../api/games/GamesCollection';
import { Players } from '../../../../api/players/PlayersCollection';
import { useT } from '../../../../languages/LanguageProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';
import { errorKey } from '../../../../languages/errors';

const PlayerCard = ({ player }) => {
  const initials = player.name?.slice(0, 2).toUpperCase() || '??';
  return (
    <div
      className="flex items-center gap-4 p-4"
      style={{ background: 'rgb(var(--es-ground))', border: '1px solid rgb(var(--es-panel))' }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 64, height: 64,
          background: 'rgb(var(--es-panel))',
          border: '1px solid rgb(var(--es-line))',
          fontSize: 20,
          fontWeight: 700,
          color: 'rgb(var(--es-ink))',
          letterSpacing: '1px',
        }}
      >
        {initials}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 16, letterSpacing: '1.5px', color: 'rgb(var(--es-ink))' }}>
          {player.name?.toUpperCase()}
        </p>
        <div className="flex gap-1 mt-2">
          <div style={{ width: 24, height: 3, background: 'rgb(var(--es-brand))' }} />
          <div style={{ width: 12, height: 3, background: 'rgb(var(--es-brand) / 0.4)' }} />
        </div>
      </div>
    </div>
  );
};

const EmptySlot = () => {
  const t = useT();
  return (
  <div
    className="flex items-center justify-center"
    style={{
      background: 'rgb(var(--es-ground))',
      border: '1px dashed rgb(var(--es-panel))',
      minHeight: 88,
      color: 'rgb(var(--es-line))',
      fontSize: 11,
      letterSpacing: '1.5px',
    }}
  >
    {t('host.lobby.awaitingOperative')}
  </div>
  );
};

const Lobby = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const { game, players, loading } = useTracker(() => {
    const gameSub = Meteor.subscribe('games.current', gameId);
    const playersSub = Meteor.subscribe('players.inGame', gameId);
    return {
      loading: !gameSub.ready() || !playersSub.ready(),
      game: Games.findOne(gameId),
      players: Players.find({ gameId }, { sort: { joinedAt: 1 } }).fetch(),
    };
  }, [gameId]);

  useEffect(() => {
    if (game?.status === 'in_progress') {
      navigate(`/game/${gameId}/progress`);
    }
  }, [game?.status]);

  const handleStartGame = async () => {
    setStarting(true);
    setError(null);
    try {
      await Meteor.callAsync('games.start', gameId);
    } catch (err) {
      setError(t(errorKey(err)));
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--es-ground))' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.lobby.loading')}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--es-ground))' }}>
        <p style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-brand))' }}>{t('host.lobby.gameNotFound')}</p>
      </div>
    );
  }

  const gameStarted = game.status === 'in_progress';
  const capacity = game.capacity || 4;
  const lobbyFull = players.length === capacity;
  const joinUrl = `${window.location.origin}/join/${game.joinCode}`;
  const slots = [
    ...players,
    ...Array(Math.max(0, capacity - players.length)).fill(null),
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgb(var(--es-ground))', color: 'rgb(var(--es-ink))' }}>

      {/* Navbar */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid rgb(var(--es-panel))' }}
      >
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '1.8px', color: 'rgb(var(--es-ink))' }}>
          ESCAPESNAP
        </span>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>
            {t('host.lobby.navTag')}
          </span>
          <ThemePicker />
          <LanguagePicker />
        </div>
      </header>

      <main className="flex-1 flex">

        {/* Left sidebar */}
        <div
          className="flex flex-col gap-6 p-8"
          style={{ width: 300, minWidth: 300, borderRight: '1px solid rgb(var(--es-panel))' }}
        >
          {/* Join code */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '1.5px', color: 'rgb(var(--es-muted))', marginBottom: 4 }}>
              {t('host.lobby.accessAuthorization')}
            </p>
            <p style={{ fontSize: 9, letterSpacing: '1px', color: 'rgb(var(--es-dim))', marginBottom: 8 }}>
              {t('host.lobby.gameCode')}
            </p>
            <p
              title={t('host.lobby.copyTitle')}
              style={{
                fontSize: 48,
                fontWeight: 700,
                letterSpacing: '4px',
                lineHeight: 1,
                color: 'rgb(var(--es-ink))',
                cursor: 'text',
                userSelect: 'all',
              }}
            >
              {game.joinCode || '----'}
            </p>
            <p style={{ fontSize: 9, color: 'rgb(var(--es-dim))', marginTop: 10, lineHeight: 1.5 }}>
              {t('host.lobby.shareHint')}
            </p>
          </div>

          {/* QR join */}
          <div
            className="flex flex-col items-center p-4"
            style={{ background: 'rgb(var(--es-panel))', border: '1px solid rgb(var(--es-line))' }}
          >
            <p style={{ fontSize: 9, letterSpacing: '1.5px', color: 'rgb(var(--es-muted))', marginBottom: 12, alignSelf: 'flex-start' }}>
              {t('host.lobby.scanToDeploy')}
            </p>
            <div style={{ background: 'rgb(var(--es-ink))', padding: 10, lineHeight: 0 }}>
              <QRCodeSVG value={joinUrl} size={140} bgColor="#e5e2e1" fgColor="#0e0e0e" level="M" />
            </div>
            <p style={{ fontSize: 9, color: 'rgb(var(--es-dim))', marginTop: 10, textAlign: 'center', lineHeight: 1.5, wordBreak: 'break-all' }}>
              {joinUrl}
            </p>
            <p style={{ fontSize: 9, color: 'rgb(var(--es-dim))', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>
              {t('host.lobby.distributeHint')}
            </p>
          </div>

          {/* Difficulty */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: '1.5px', color: 'rgb(var(--es-muted))', marginBottom: 8 }}>
              {t('host.lobby.gameDifficulty')}
            </p>
            {['easy', 'medium', 'hard'].map(d => (
              <div
                key={d}
                className="flex items-center justify-between px-4 py-3 mb-2"
                style={{ border: game.difficulty === d ? '1px solid rgb(var(--es-brand))' : '1px solid rgb(var(--es-panel))' }}
              >
                <span style={{ fontSize: 11, letterSpacing: '1px', color: game.difficulty === d ? 'rgb(var(--es-ink))' : 'rgb(var(--es-dim))' }}>
                  {`${t(`difficulty.${d}`)}: ${t(`difficulty.${d}Sub`)}`}
                </span>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid ${game.difficulty === d ? 'rgb(var(--es-brand))' : 'rgb(var(--es-dim))'}`,
                  background: game.difficulty === d ? 'rgb(var(--es-brand))' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {game.difficulty === d && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgb(var(--es-on-brand))' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col p-8 gap-6">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 10, letterSpacing: '1.5px', color: 'rgb(var(--es-brand))', marginBottom: 4 }}>
                {game.groupName?.toUpperCase()}
              </p>
              <h1 style={{ fontWeight: 700, fontSize: 28, letterSpacing: '2px', color: 'rgb(var(--es-ink))' }}>
                {t('host.lobby.title')}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgb(var(--es-brand))' }} />
                <p style={{ fontSize: 10, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>
                  {t('host.lobby.awaitingStart')}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: game.riddlesReady ? 'rgb(var(--es-correct))' : 'rgb(var(--es-dim))',
                  }}
                />
                <p style={{ fontSize: 10, letterSpacing: '1px', color: game.riddlesReady ? 'rgb(var(--es-correct))' : 'rgb(var(--es-muted))' }}>
                  {game.riddlesReady ? 'RIDDLES READY' : 'GENERATING RIDDLES...'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ fontSize: 9, letterSpacing: '1px', color: 'rgb(var(--es-muted))' }}>{t('host.lobby.capacity')}</p>
              <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '2px', color: 'rgb(var(--es-ink))' }}>
                {String(players.length).padStart(2, '0')} /{' '}
                <span style={{ color: 'rgb(var(--es-dim))' }}>{String(capacity).padStart(2, '0')}</span>
              </p>
            </div>
          </div>

          {/* Players grid */}
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {slots.map((player, i) =>
              player ? (
                <PlayerCard key={player._id} player={player} />
              ) : (
                <EmptySlot key={`empty-${i}`} />
              )
            )}
          </div>

          {error && (
            <p style={{ fontSize: 11, color: 'rgb(var(--es-brand))', letterSpacing: '1px' }}>!! {error}</p>
          )}

          {/* Start button */}
          {gameStarted ? (
            <div
              className="text-center py-4"
              style={{ border: '1px solid rgb(var(--es-brand))', background: 'rgb(var(--es-brand) / 0.2)' }}
            >
              <p style={{ fontSize: 12, letterSpacing: '1.5px', color: 'rgb(var(--es-muted))' }}>
                {t('host.lobby.missionActive')}
              </p>
            </div>
          ) : (
            <button
              onClick={handleStartGame}
              disabled={starting || !lobbyFull}
              style={{
                width: '100%',
                padding: '18px',
                background: starting ? 'rgb(var(--es-brand) / 0.4)' : lobbyFull ? 'rgb(var(--es-brand))' : 'rgb(var(--es-panel))',
                color: starting || !lobbyFull ? 'rgb(var(--es-dim))' : 'rgb(var(--es-ink))',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '2px',
                cursor: starting || !lobbyFull ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                border: 'none',
              }}
              onMouseEnter={e => { if (!starting && lobbyFull) e.currentTarget.style.background = 'rgb(var(--es-brand-bright))'; }}
              onMouseLeave={e => { if (!starting && lobbyFull) e.currentTarget.style.background = 'rgb(var(--es-brand))'; }}
            >
              {starting
                ? 'DEPLOYING AGENTS...'
                : lobbyFull
                  ? 'START MISSION'
                  : `AWAITING ${capacity - players.length} MORE OPERATIVE${capacity - players.length === 1 ? '' : 'S'}...`}
            </button>
          )}

        </div>
      </main>
    </div>
  );
};

export default Lobby;
