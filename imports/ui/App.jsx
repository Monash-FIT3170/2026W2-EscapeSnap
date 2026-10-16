import React, { useState, useEffect, useRef } from 'react';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../api/games/GamesCollection';
import { Players } from '../api/players/PlayersCollection';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';
import { HelpTutorial } from './mobile/components/gameplay/HelpTutorial';
import { useGameUiTheme } from './shared/components/theme/UiThemeProvider';
import CreateGame from './host/pages/create-game/CreateGame';
import Lobby from './host/pages/lobby/Lobby';
import ProgressPage from './host/pages/progress/ProgressPage';
import FinalRiddlePage from './host/pages/riddle/FinalRiddlePage';
import SummaryPage from './host/pages/summary/SummaryPage';
import LandingPage from './host/pages/landing/Landing';
import { gameBudgetMs } from '../lib/gameClock';
import { useT } from '../languages/LanguageProvider';
import { errorKey } from '../languages/errors';
import Leaderboard from './host/pages/leaderboard/Leaderboard';

// The playerId and session token from players.join, kept so a refresh or a
// closed tab can rejoin. The token is what proves the player is who they say.
const SESSION_KEY = 'escapesnap.session';
// Held only a playerId, which can no longer rejoin on its own.
const OLD_SESSION_KEY = 'escapesnap.playerId';

function readSession() {
  try {
    window.localStorage.removeItem(OLD_SESSION_KEY);
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    return session?.playerId && session?.sessionToken ? session : null;
  } catch {
    return null; // storage blocked or unreadable — reconnect just isn't available
  }
}

function writeSession(session) {
  try {
    if (session) {
      const { playerId, sessionToken } = session;
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ playerId, sessionToken })
      );
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Not persisting only costs the ability to reconnect.
  }
}

// Losing the session mid-game always means the reconnect window ran out:
// 'expired', or 'not-found' once an abandoned lobby slot has been freed.
const RECONNECT_ERRORS = {
  expired: 'errors.reconnectExpired',
  'not-found': 'errors.reconnectExpired',
};

function PlayerFlow({ initialCode = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Set when the player joined from the landing page's keypad.
  const joined = location.state?.joined;
  const [screen, setScreen] = useState(() => {
    if (joined) return 'lobby';
    return readSession() ? 'resuming' : 'home';
  });
  const [playerName, setPlayerName] = useState(joined?.playerName ?? '');
  const [gameCode, setGameCode] = useState(joined?.gameCode ?? '');
  const [playerId, setPlayerId] = useState(joined?.playerId ?? null);
  const [gameId, setGameId] = useState(joined?.gameId ?? null);
  const [sessionToken, setSessionToken] = useState(
    joined?.sessionToken ?? null
  );
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const t = useT();
  useGameUiTheme(gameId);

  const { game, playerCount } = useTracker(() => {
    if (!gameId) return { game: null, playerCount: 0 };
    Meteor.subscribe('games.current', gameId);
    Meteor.subscribe('players.inGame', gameId);
    // Also what keeps the server's view of this player's connection current.
    // It errors once the reconnect window has closed on them.
    if (playerId && sessionToken) {
      Meteor.subscribe('player.self', playerId, sessionToken, {
        onStop(err) {
          if (!err) return;
          handleExitToHome();
          setJoinError(t(errorKey(err, RECONNECT_ERRORS)));
        },
      });
    }
    return {
      game: Games.findOne(gameId),
      playerCount: Players.find({ gameId }).count(),
    };
  }, [gameId, playerId, sessionToken]);

  // Fire the auto-advance once per join. Without the guard, returning to the
  // lobby mid-game bounces you straight back out again.
  const autoAdvancedRef = useRef(false);
  useEffect(() => {
    if (game?.status === 'in_progress' && screen === 'lobby' && !autoAdvancedRef.current) {
      autoAdvancedRef.current = true;
      setScreen('tutorial');
    }
  }, [game?.status, screen]);

  useEffect(() => {
    if (joined) {
      // Save a keypad join like any other, then drop it from the router state
      // so a refresh resumes through players.rejoin below instead.
      writeSession(joined);
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    const saved = readSession();
    if (!saved) return;
    Meteor.callAsync('players.rejoin', saved.playerId, saved.sessionToken)
      .then((session) => {
        setPlayerName(session.playerName);
        setGameCode(session.gameCode);
        setPlayerId(session.playerId);
        setSessionToken(saved.sessionToken);
        setGameId(session.gameId);
        // Straight back to where they were, minus the tutorial already seen.
        const inGame = session.status === 'in_progress';
        autoAdvancedRef.current = inGame;
        setScreen(inGame ? 'dashboard' : 'lobby');
      })
      .catch((err) => {
        writeSession(null);
        // A finished game has nothing to rejoin — just land on the join form.
        if (err.error !== 'invalid-state') {
          setJoinError(t(errorKey(err, RECONNECT_ERRORS)));
        }
        setScreen('home');
      });
    // Mount only: a saved session is resumed once, when the page loads.
  }, []);

  const handleJoin = async (name, code) => {
    setJoinLoading(true);
    setJoinError('');
    try {
      const session = await Meteor.callAsync('players.join', code, name);
      writeSession(session);
      setPlayerName(name);
      setGameCode(code);
      setPlayerId(session.playerId);
      setSessionToken(session.sessionToken);
      setGameId(session.gameId);
      autoAdvancedRef.current = false;
      setScreen('lobby');
    } catch (err) {
      // 'not-found' from players.join specifically means the code was wrong
      // or the game already started.
      setJoinError(t(errorKey(err, { 'not-found': 'errors.gameNotFoundOrStarted' })));
    } finally {
      setJoinLoading(false);
    }
  };

  const handleExitToHome = () => {
    writeSession(null);
    setPlayerName('');
    setGameCode('');
    setPlayerId(null);
    setSessionToken(null);
    setGameId(null);
    setJoinError('');
    setScreen('home');
  };

  // Pressing exit in the lobby: tell the server so the slot is freed, then go
  // home straight away. If the call fails the player is still home, and the
  // slot frees itself once the reconnect window runs out after they close the tab.
  const handleLeave = () => {
    Meteor.callAsync('players.leave', playerId, sessionToken).catch((err) =>
      console.error('[players.leave] failed:', err.reason || err.message)
    );
    handleExitToHome();
  };

  if (screen === 'resuming') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ground px-5">
        <p
          role="status"
          className="pulse-text font-mono text-xs uppercase tracking-[0.25em] text-muted"
        >
          {t('mobile.home.reconnecting')}
        </p>
      </div>
    );
  }
  if (screen === 'home') {
    return (
      <PlayerHome
        onStart={handleJoin}
        loading={joinLoading}
        serverError={joinError}
        initialCode={initialCode}
      />
    );
  }
  if (screen === 'lobby') {
    return (
      <PlayerLobby
        playerName={playerName}
        gameCode={gameCode}
        playerCount={playerCount}
        inSession={game?.status === 'in_progress'}
        gameStartedAt={game?.startedAt ? new Date(game.startedAt).getTime() : null}
        roundDuration={game ? Math.round(gameBudgetMs(game) / 1000) : 30 * 60}
        onExit={game?.status === 'in_progress' ? () => setScreen('dashboard') : handleLeave}
      />
    );
  }
  if (screen === 'tutorial') {
    return <HelpTutorial onComplete={() => setScreen('dashboard')} />;
  }
  return (
    <PlayerDashboard
      playerName={playerName}
      gameCode={gameCode}
      playerId={playerId}
      gameId={gameId}
      onExit={() => setScreen('lobby')}
    />
  );
}

function JoinViaQr() {
  const { joinCode } = useParams();
  return <PlayerFlow initialCode={(joinCode || '').toUpperCase()} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/player/*" element={<PlayerFlow />} />
      <Route path="/join/:joinCode" element={<JoinViaQr />} />
      <Route path="/host" element={<CreateGame />} />
      <Route path="/game/create" element={<CreateGame />} />
      <Route path="/game/:gameId/lobby" element={<Lobby />} />
      <Route path="/game/:gameId/progress" element={<ProgressPage />} />
      <Route path="/game/:gameId/final-riddle" element={<FinalRiddlePage />} />
      <Route path="/game/:gameId/summary" element={<SummaryPage />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}
