import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { QRCodeSVG } from 'qrcode.react';
import { Games } from '../../../../api/games/GamesCollection';
import { Players } from '../../../../api/players/PlayersCollection';
import { useT } from '../../../../languages/LanguageProvider';
import { useGameUiTheme } from '../../../shared/components/theme/UiThemeProvider';
import { LanguagePicker } from '../../../../languages/LanguagePicker';
import { ThemePicker } from '../../../shared/components/theme/ThemePicker';
import { errorKey } from '../../../../languages/errors';
import { SEARCH_TTL_MS } from '/imports/lib/teamStatus';
import { formatClock } from '../../components/match/TeamScoreCard';
import { RoomBar } from '/imports/ui/shared/components/room/RoomBar';

// Each player who joins is pinned up as a polaroid, the way the landing
// page's evidence board pins its photos; the tilt alternates down the row.
const PlayerCard = ({ player, index }) => {
  const initials = player.name?.slice(0, 2).toUpperCase() || '??';
  return (
    <div className="es-pola relative" style={{ '--rot': `${index % 2 ? 1.6 : -1.8}deg` }}>
      <span className="es-pin" aria-hidden="true" />
      <div className="es-pola-photo flex aspect-[4/3] items-center justify-center">
        <span className="font-display text-5xl font-bold tracking-[0.04em] text-[#e8dfcf]/80">
          {initials}
        </span>
      </div>
      <p className="es-pola-note mt-3 truncate px-1 text-base">{player.name?.toUpperCase()}</p>
    </div>
  );
};

const EmptySlot = () => {
  const t = useT();
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-sm border-2 border-dashed border-line/70 px-4 text-center font-display text-base tracking-[0.04em] text-dim">
      {t('host.lobby.awaitingOperative')}
    </div>
  );
};

// Online versus: a full team searches for a random rival instead of starting.
// The game flips to in_progress the moment a rival is found, which the
// lobby's existing redirect picks up.
const OnlineMatchmaking = ({ game, lobbyFull, remainingSlots }) => {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  const since = game.matchmakingSince ? new Date(game.matchmakingSince).getTime() : null;
  const expired = since !== null && now - since > SEARCH_TTL_MS;
  const searching = pending || (since !== null && !expired);

  useEffect(() => {
    if (!searching) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [searching]);

  const handleFind = async () => {
    setPending(true);
    setError(null);
    setNow(Date.now());
    try {
      await Meteor.callAsync('matches.findOpponent', game._id);
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setPending(false);
    }
  };

  const handleCancel = () => {
    Meteor.callAsync('matches.cancelSearch', game._id).catch((err) => setError(t(errorKey(err))));
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <p role="alert" className="font-display text-base text-brand-bright">⚠ {error}</p>}
      {expired && !pending && <p className="text-sm text-muted">{t('host.lobby.searchExpired')}</p>}
      {searching ? (
        <div className="flex items-stretch gap-3">
          <div className="es-lcd flex-1 px-4 py-3 text-center">
            <p className="es-lcd-text animate-pulse text-lg">{t('host.lobby.searching')}</p>
            <p className="mt-1 text-sm text-brand-bright/70">
              {t('host.lobby.searchingFor', { time: formatClock(since ? Math.max(0, now - since) : 0) })}
            </p>
          </div>
          {since !== null && (
            <button type="button" onClick={handleCancel} className="es-btn es-btn-ghost">
              {t('host.lobby.cancelSearch')}
            </button>
          )}
        </div>
      ) : (
        <button type="button" onClick={handleFind} disabled={!lobbyFull} className="es-btn es-btn-primary w-full">
          {lobbyFull
            ? t('host.lobby.findOpponent')
            : t('host.lobby.awaitingMore', { n: remainingSlots })}
        </button>
      )}
    </div>
  );
};

const Lobby = () => {
  const { gameId } = useParams();
  useGameUiTheme(gameId);
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

  // A same-room team's lobby lives on the shared match screen.
  useEffect(() => {
    if (game?.playMode === 'local' && game.matchId) {
      navigate(`/match/${game.matchId}/lobby`, { replace: true });
    }
  }, [game?.playMode, game?.matchId]);

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
      <div className="es-room flex items-center justify-center">
        <p className="pulse-text font-display text-lg text-muted">{t('host.lobby.loading')}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="es-room flex items-center justify-center">
        <p className="font-display text-lg text-brand-bright">{t('host.lobby.gameNotFound')}</p>
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

  const remaining = capacity - players.length;
  const code = game.joinCode || '----';

  return (
    <div className="es-room flex flex-col">
      <RoomBar home={null}>
        <span className="hidden font-display text-base tracking-[0.04em] text-muted sm:inline">
          {t('host.lobby.navTag')}
        </span>
        <ThemePicker chipClassName="es-chip" />
        <LanguagePicker chipClassName="es-chip" />
      </RoomBar>

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-10">
        {/* The way in: the code on a keypad display, the QR taped beside it. */}
        <aside className="flex flex-col gap-8">
          <div className="es-plate px-5 pb-5 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="es-label">{t('host.lobby.gameCode')}</h2>
              <span className="es-led" data-state="ready" aria-hidden="true" />
            </div>
            <p
              title={t('host.lobby.copyTitle')}
              className="es-lcd es-lcd-text cursor-text select-all px-4 py-3 text-center text-7xl leading-none tracking-[0.18em]"
            >
              {code}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">{t('host.lobby.shareHint')}</p>
          </div>

          <div className="es-paper mx-auto w-full max-w-[300px] rotate-[1.4deg] px-5 pb-5 pt-6 text-center">
            <span className="es-pin" aria-hidden="true" />
            <p className="es-stamp mb-4 !text-sm text-[#a3150e]">{t('host.lobby.scanToDeploy')}</p>
            <div className="mx-auto w-fit bg-[#f4efe4] p-2 leading-none">
              <QRCodeSVG value={joinUrl} size={168} bgColor="#f4efe4" fgColor="#1e1915" level="M" />
            </div>
            <p className="mt-3 break-all text-xs leading-5 text-[#3b322b]">{joinUrl}</p>
            <p className="mt-1 text-xs leading-5 text-[#3b322b]">{t('host.lobby.distributeHint')}</p>
          </div>
        </aside>

        {/* The room filling up. */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="es-label mb-2">{game.groupName?.toUpperCase()}</p>
              <h1 className="es-title text-6xl text-ink">{t('host.lobby.title')}</h1>
              <ul className="mt-4 flex flex-col gap-1.5 text-sm text-muted">
                {game.playMode === 'online' && <li>{t('host.lobby.onlineVersus')}</li>}
                <li className="flex items-center gap-2">
                  <span className="es-led" data-state="busy" aria-hidden="true" />
                  {t('host.lobby.awaitingStart')}
                </li>
                <li className={`flex items-center gap-2 ${game.riddlesReady ? 'text-correct' : ''}`}>
                  <span className="es-led" data-state={game.riddlesReady ? 'ok' : 'off'} aria-hidden="true" />
                  {game.riddlesReady ? 'RIDDLES READY' : 'GENERATING RIDDLES...'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="es-led" data-state="off" aria-hidden="true" />
                  {t('host.lobby.gameDifficulty')}: {t(`difficulty.${game.difficulty}`)}, {t(`difficulty.${game.difficulty}Sub`)}
                </li>
              </ul>
            </div>
            <div className="text-right">
              <p className="es-label">{t('host.lobby.capacity')}</p>
              <p className="es-title mt-1 text-5xl tabular-nums text-ink">
                {String(players.length).padStart(2, '0')}
                <span className="text-dim"> / {String(capacity).padStart(2, '0')}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 pt-2 xl:grid-cols-4">
            {slots.map((player, i) =>
              player ? (
                <PlayerCard key={player._id} player={player} index={i} />
              ) : (
                <EmptySlot key={`empty-${i}`} />
              )
            )}
          </div>

          {error && <p role="alert" className="font-display text-base text-brand-bright">⚠ {error}</p>}

          {game.playMode === 'online' && !gameStarted ? (
            <OnlineMatchmaking game={game} lobbyFull={lobbyFull} remainingSlots={remaining} />
          ) : gameStarted ? (
            <p className="es-lcd es-lcd-text px-4 py-4 text-center text-lg">{t('host.lobby.missionActive')}</p>
          ) : (
            <button
              type="button"
              onClick={handleStartGame}
              disabled={starting || !lobbyFull}
              className="es-btn es-btn-primary w-full"
            >
              {starting
                ? 'DEPLOYING AGENTS...'
                : lobbyFull
                  ? 'START MISSION'
                  : `AWAITING ${remaining} MORE OPERATIVE${remaining === 1 ? '' : 'S'}...`}
            </button>
          )}
        </section>
      </main>
    </div>
  );
};

export default Lobby;
