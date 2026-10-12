import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../api/games/GamesCollection';
import { Players } from '../api/players/PlayersCollection';
import { PlayerHome } from './mobile/pages/PlayerHome';
import { PlayerLobby } from './mobile/pages/lobby/PlayerLobby';
import { PlayerDashboard } from './mobile/pages/PlayerDashboard';
import { HelpTutorial } from './mobile/components/gameplay/HelpTutorial';
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
import MatchLobby from './host/pages/match/MatchLobby';
import MatchScoreboard from './host/pages/match/MatchScoreboard';

// What players.join handed this phone, kept so a refresh or a closed tab can
// pick the game back up.
const SESSION_KEY = 'escapesnap.session';

function readSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    return session?.playerId && session?.sessionToken ? session : null;
  } catch {
    return null; // storage blocked or garbled — reconnect just isn't available
  }
}

// sessionStorage survives a refresh but not closing the tab. A refresh drops
// the player straight back into their game; opening the app fresh shows the
// join menu, with the old game offered as a choice rather than forced on them.
const ACTIVE_TAB_KEY = 'escapesnap.activePlayer';

function markTabActive(playerId) {
  try {
    if (playerId) window.sessionStorage.setItem(ACTIVE_TAB_KEY, playerId);
    else window.sessionStorage.removeItem(ACTIVE_TAB_KEY);
  } catch {
    // Without it a refresh shows the rejoin offer instead — still recoverable.
  }
}

function isTabActive(playerId) {
  try {
    return window.sessionStorage.getItem(ACTIVE_TAB_KEY) === playerId;
  } catch {
    return false;
  }
}

function writeSession(session) {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Not persisting only costs the ability to reconnect.
  }
  markTabActive(session?.playerId);
}

// A QR code for a different game means the player is moving on — the saved
// session must not drag them back into the old one.
function resumableSession(initialCode) {
  const session = readSession();
  if (session && initialCode && session.gameCode !== initialCode) {
    writeSession(null);
    return null;
  }
  return session;
}

const SESSION_ERRORS = { 'not-found': 'errors.sessionEnded' };

function PlayerFlow({ initialCode = '' }) {
  const [session, setSession] = useState(() => resumableSession(initialCode));
  const [autoResume] = useState(
    () => !!session && isTabActive(session.playerId)
  );
  const [screen, setScreen] = useState(autoResume ? 'resuming' : 'home');
  // The still-running game this phone belongs to, offered on the join menu.
  const [rejoinOffer, setRejoinOffer] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const t = useT();

  const sessionToken = session?.sessionToken;
  const { game, playerCount } = useTracker(() => {
    if (!gameId) return { game: null, playerCount: 0 };
    Meteor.subscribe('games.current', gameId);
    Meteor.subscribe('players.inGame', gameId);
    // Held for the whole session: it is how the server knows this player is
    // still here. It errors if the player was dropped from the game.
    if (playerId && sessionToken) {
      Meteor.subscribe('player.self', playerId, sessionToken, {
        onStop(err) {
          if (!err) return;
          resetToHome();
          setJoinError(t(errorKey(err, SESSION_ERRORS)));
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

  const enterRejoinedGame = (rejoined) => {
    markTabActive(rejoined.playerId);
    setRejoinOffer(null);
    setJoinError('');
    setPlayerName(rejoined.playerName);
    setGameCode(rejoined.gameCode);
    setPlayerId(rejoined.playerId);
    setGameId(rejoined.gameId);
    // Straight back to where they were, minus the tutorial already seen.
    const inGame = rejoined.status === 'in_progress';
    autoAdvancedRef.current = inGame;
    setScreen(inGame ? 'dashboard' : 'lobby');
  };

  // Mount only: a saved session is checked once, when the page loads.
  useEffect(() => {
    if (!session) return;
    Meteor.callAsync('players.rejoin', session.playerId, session.sessionToken)
      .then((rejoined) => {
        if (autoResume) enterRejoinedGame(rejoined);
        else setRejoinOffer(rejoined);
      })
      .catch((err) => {
        writeSession(null);
        setSession(null);
        // A finished game has nothing to rejoin — just land on the join form.
        // Only a player who expected to be put back needs telling why not.
        if (autoResume && err.error !== 'invalid-state') {
          setJoinError(t(errorKey(err, SESSION_ERRORS)));
        }
        setScreen('home');
      });
  }, []);

  // Gives up the saved game for good, so the team isn't left waiting.
  const leaveSavedGame = () => {
    if (session) {
      Meteor.callAsync('players.leave', session.playerId, session.sessionToken).catch(
        (err) => console.error('[players.leave] failed:', err.error || err.message)
      );
    }
    writeSession(null);
    setSession(null);
    setRejoinOffer(null);
  };

  const handleJoin = async (name, code) => {
    setJoinLoading(true);
    setJoinError('');
    try {
      // Joining somewhere new means walking out of the old game.
      if (rejoinOffer) leaveSavedGame();
      const {
        playerId: pid,
        gameId: gid,
        sessionToken: token,
      } = await Meteor.callAsync('players.join', code, name);
      const joined = { playerId: pid, sessionToken: token, gameCode: code };
      writeSession(joined);
      setSession(joined);
      setPlayerName(name);
      setGameCode(code);
      setPlayerId(pid);
      setGameId(gid);
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

  const resetToHome = () => {
    writeSession(null);
    setSession(null);
    setPlayerName('');
    setGameCode('');
    setPlayerId(null);
    setGameId(null);
    setJoinError('');
    setScreen('home');
  };

  // Walking out of the lobby gives the slot straight back to the team.
  const handleExitToHome = () => {
    if (playerId && sessionToken) {
      Meteor.callAsync('players.leave', playerId, sessionToken).catch((err) =>
        console.error('[players.leave] failed:', err.error || err.message)
      );
    }
    resetToHome();
  };

  if (screen === 'resuming') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0e0e0e] px-5">
        <p
          role="status"
          className="pulse-text font-mono text-xs uppercase tracking-[0.25em] text-[#aa8984]"
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
        rejoin={
          rejoinOffer && {
            ...rejoinOffer,
            onRejoin: () => enterRejoinedGame(rejoinOffer),
            onLeave: leaveSavedGame,
          }
        }
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
        onExit={game?.status === 'in_progress' ? () => setScreen('dashboard') : handleExitToHome}
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
      <Route path="/match/:matchId/lobby" element={<MatchLobby />} />
      <Route path="/match/:matchId/progress" element={<MatchScoreboard />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}
