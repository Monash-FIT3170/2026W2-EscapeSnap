import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '/imports/api/games/GamesCollection';
import { UI_THEMES, DEFAULT_UI_THEME } from '/imports/lib/uiThemes';

const STORAGE_KEY = 'escapesnap.uiTheme';

const UiThemeContext = createContext(null);

function readStoredUiTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && UI_THEMES.includes(stored)) return stored;
  } catch {
    // localStorage unavailable (private mode) — fall through to default
  }
  return DEFAULT_UI_THEME;
}

// Wraps the whole app, host and player screens alike. The attribute goes on
// <html> rather than a wrapper div so the page background behind the app
// (overscroll, safe areas) follows the skin too.
//
// The skin comes from one of two places. Inside a game (a screen has called
// useGameUiTheme) it is the game's own `uiTheme`, so every device in that game
// shows the same one and it survives opening the game somewhere else. Outside
// a game it is this device's last choice, kept in localStorage.
export function UiThemeProvider({ children }) {
  const [deviceUiTheme, setDeviceUiTheme] = useState(readStoredUiTheme);
  const [gameId, setGameId] = useState(null);
  // A pick that has been sent to the server but not yet echoed back, shown
  // straight away so the tap doesn't wait on the round trip.
  const [pendingUiTheme, setPendingUiTheme] = useState(null);

  const gameUiTheme = useTracker(() => {
    if (!gameId) return null;
    Meteor.subscribe('games.current', gameId);
    const game = Games.findOne(gameId, { fields: { uiTheme: 1 } });
    // Games created before uiTheme existed have none; they use the device's.
    return game?.uiTheme ?? null;
  }, [gameId]);

  const uiTheme = pendingUiTheme ?? gameUiTheme ?? deviceUiTheme;

  // Layout effect, so a stored skin is in place before the first paint.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-ui-theme', uiTheme);
  }, [uiTheme]);

  const setUiTheme = useCallback(
    (next) => {
      if (!UI_THEMES.includes(next)) return;
      setDeviceUiTheme(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Not persisting is fine; the choice still applies for this session.
      }
      if (!gameId) return;
      setPendingUiTheme(next);
      // callAsync settles only once the game document has been updated
      // locally, so dropping the pending value here cannot flash the old skin.
      // If the call fails the screen simply returns to the game's skin.
      Meteor.callAsync('games.setUiTheme', gameId, next)
        .catch(() => {})
        .finally(() => setPendingUiTheme(null));
    },
    [gameId]
  );

  const value = useMemo(
    () => ({ uiTheme, setUiTheme, setGameId }),
    [uiTheme, setUiTheme]
  );

  return (
    <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>
  );
}

export function useUiTheme() {
  const ctx = useContext(UiThemeContext);
  if (!ctx) throw new Error('useUiTheme must be used inside <UiThemeProvider>');
  return ctx;
}

// Called by every screen that belongs to a game, with that game's id, so the
// app shows the game's skin and the picker changes it for the whole game.
// Passing a falsy id (a player who hasn't joined yet) leaves the device's own.
export function useGameUiTheme(gameId) {
  const { setGameId } = useUiTheme();
  useEffect(() => {
    if (!gameId) return undefined;
    setGameId(gameId);
    return () => setGameId(null);
  }, [gameId, setGameId]);
}
