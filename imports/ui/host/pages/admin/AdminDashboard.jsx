import React, { useEffect, useMemo, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '/imports/api/games/GamesCollection';
import { Players } from '/imports/api/players/PlayersCollection';
import { Rounds } from '/imports/api/rounds/RoundsCollection';
import { Matches } from '/imports/api/matches/MatchesCollection';
import { remainingGameMs } from '/imports/lib/gameClock';

// Operations page: every game that hasn't ended yet, for whoever is running
// the event. Operator-facing only, so it isn't translated.

const KEY_STORAGE = 'escapesnap.adminKey';
const LIVE_STATUSES = ['lobby', 'in_progress', 'final_riddle'];
// Mirrors LOBBY_MAX_AGE_MS in adminPublications: an older lobby that never
// started is treated as abandoned, not running.
const LOBBY_MAX_AGE_MS = 60 * 60 * 1000;

const COLORS = {
  bg: '#0e0e0e',
  text: '#e5e2e1',
  muted: '#aa8984',
  dim: '#555',
  line: '#1c1b1b',
  accent: '#8b0000',
  ok: '#4caf50',
  warn: '#d4a017',
};

const STATUS_LABELS = {
  lobby: 'Lobby',
  in_progress: 'In progress',
  final_riddle: 'Final riddle',
};

const STATUS_COLORS = {
  lobby: COLORS.muted,
  in_progress: COLORS.ok,
  final_riddle: COLORS.warn,
};

function readKey() {
  try {
    return window.sessionStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function writeKey(key) {
  try {
    if (key) window.sessionStorage.setItem(KEY_STORAGE, key);
    else window.sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    // Only costs re-entering the key after a refresh.
  }
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(hours ? 2 : 1, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours ? `${hours}:${mmss}` : mmss;
}

function presenceOf(player) {
  if (player.leftAt) return 'left';
  if (player.disconnectedAt) return 'disconnected';
  return 'connected';
}

const PRESENCE_COLORS = {
  connected: COLORS.ok,
  disconnected: COLORS.warn,
  left: COLORS.dim,
};

// Problems worth an operator's attention, derived from what's already loaded.
function gameWarnings(game, players, now) {
  const warnings = [];
  const present = players.filter((p) => presenceOf(p) === 'connected');
  if (game.status !== 'lobby' && players.length > 0 && present.length === 0) {
    warnings.push('Nobody connected');
  }
  if (game.status === 'in_progress' && remainingGameMs(game, now) === 0) {
    warnings.push('Clock ran out');
  }
  if (!game.riddlesReady) warnings.push('Riddles not ready');
  return warnings;
}

function KeyForm({ error, onSubmit }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="w-full max-w-sm flex flex-col gap-4"
    >
      <p
        className="text-xs tracking-widest uppercase"
        style={{ color: COLORS.accent }}
      >
        Restricted
      </p>
      <h1 className="text-2xl font-bold tracking-widest uppercase">
        Operations
      </h1>
      <input
        type="password"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Admin key"
        aria-label="Admin key"
        className="px-4 py-3 text-sm outline-none"
        style={{
          background: '#151414',
          color: COLORS.text,
          border: `1px solid ${COLORS.line}`,
        }}
      />
      {error && (
        <p
          role="alert"
          className="text-xs tracking-widest"
          style={{ color: COLORS.accent }}
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        className="text-sm tracking-widest uppercase py-3 cursor-pointer"
        style={{
          background: COLORS.accent,
          color: COLORS.text,
          border: 'none',
        }}
      >
        Unlock
      </button>
    </form>
  );
}

function StatTile({ label, value, color = COLORS.text }) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3"
      style={{ border: `1px solid ${COLORS.line}` }}
    >
      <span
        className="text-[10px] tracking-widest uppercase"
        style={{ color: COLORS.muted }}
      >
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className="text-[10px] tracking-widest uppercase px-2 py-0.5 whitespace-nowrap"
      style={{
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const ROUND_MARKS = {
  correct: { mark: '✓', color: COLORS.ok, label: 'solved' },
  wrong: { mark: '✗', color: COLORS.accent, label: 'wrong' },
  timeout: { mark: '✗', color: COLORS.accent, label: 'timed out' },
  pending: { mark: '?', color: COLORS.muted, label: 'in play' },
};

// A destructive button that needs a second click within a few seconds, so a
// stray click on a live game doesn't end it.
function ConfirmButton({ label, confirmLabel, onConfirm, disabled }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timeout = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timeout);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!armed) return setArmed(true);
        setArmed(false);
        onConfirm();
      }}
      className="text-[10px] tracking-widest uppercase px-3 py-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        color: COLORS.text,
        background: armed ? COLORS.accent : 'transparent',
        border: `1px solid ${COLORS.accent}`,
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

function RoundGrid({ game, players, rounds, adminKey, busy, run }) {
  const roundNumbers = Array.from(
    { length: game.totalRounds },
    (_, i) => i + 1
  );
  const namesById = Object.fromEntries(players.map((p) => [p._id, p.name]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr
            className="text-[10px] tracking-widest uppercase"
            style={{ color: COLORS.dim }}
          >
            <th className="text-left font-normal py-1 pr-3">Player</th>
            <th className="text-left font-normal py-1 pr-3">Status</th>
            {roundNumbers.map((n) => (
              <th
                key={n}
                className="font-normal py-1 px-2 text-center"
                style={{
                  color: n === game.currentRound ? COLORS.text : COLORS.dim,
                }}
              >
                R{n}
              </th>
            ))}
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const presence = presenceOf(p);
            return (
              <tr key={p._id} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                <td className="py-1.5 pr-3 font-bold uppercase whitespace-nowrap">
                  <span style={{ color: PRESENCE_COLORS[presence] }}>● </span>
                  {p.name}
                </td>
                <td
                  className="py-1.5 pr-3"
                  style={{ color: PRESENCE_COLORS[presence] }}
                >
                  {presence}
                </td>
                {roundNumbers.map((n) => {
                  const round = rounds.find(
                    (r) => r.playerId === p._id && r.roundNumber === n
                  );
                  const info = round && ROUND_MARKS[round.status];
                  const cover = round?.coveredBy && namesById[round.coveredBy];
                  const title = info
                    ? [
                        info.label,
                        round.hintRevealedAt && 'hint used',
                        cover && `covered by ${cover}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : 'not reached';
                  return (
                    <td
                      key={n}
                      title={title}
                      className="py-1.5 px-2 text-center font-bold"
                      style={{ color: info ? info.color : COLORS.dim }}
                    >
                      {info ? info.mark : '—'}
                      {round?.hintRevealedAt && (
                        <sup style={{ color: COLORS.warn }}>h</sup>
                      )}
                    </td>
                  );
                })}
                <td className="py-1.5 text-right">
                  {!p.leftAt && (
                    <ConfirmButton
                      label="Kick"
                      confirmLabel={`Kick ${p.name}?`}
                      disabled={busy}
                      onConfirm={() =>
                        run(
                          () =>
                            Meteor.callAsync(
                              'admin.kickPlayer',
                              adminKey,
                              p._id
                            ),
                          `${p.name} was kicked.`
                        )
                      }
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GameRow({ game, players, rounds, now, expanded, onToggle, adminKey }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const active = players.filter((p) => !p.leftAt);
  const connected = players.filter((p) => presenceOf(p) === 'connected').length;
  const left = remainingGameMs(game, now);
  const warnings = gameWarnings(game, players, now);
  const hintsUsed = rounds.filter((r) => r.hintRevealedAt).length;
  const solved = rounds.filter((r) => r.status === 'correct').length;
  const progress = rounds.length
    ? Math.round((solved / rounds.length) * 100)
    : 0;

  const run = async (action, success) => {
    setBusy(true);
    setResult(null);
    try {
      await action();
      setResult({ ok: true, text: success });
    } catch (err) {
      setResult({ ok: false, text: err.reason || err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ borderBottom: `1px solid ${COLORS.line}` }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full grid grid-cols-2 md:grid-cols-[70px_1fr_80px_110px_80px_80px_80px] gap-x-4 gap-y-1 items-center px-4 py-3 text-left cursor-pointer"
        style={{
          background: expanded ? '#141313' : 'transparent',
          color: COLORS.text,
        }}
      >
        <span className="font-mono font-bold tracking-widest">
          {game.joinCode}
        </span>
        <span className="text-sm font-bold uppercase truncate">
          {game.groupName}
          {warnings.length > 0 && (
            <span
              className="ml-2 text-[10px] tracking-widest"
              style={{ color: COLORS.warn }}
            >
              ⚠ {warnings.join(' · ')}
            </span>
          )}
        </span>
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: COLORS.muted }}
        >
          {game.playMode}
        </span>
        <span>
          <StatusBadge status={game.status} />
        </span>
        <span className="text-xs tabular-nums" style={{ color: COLORS.muted }}>
          R {game.currentRound}/{game.totalRounds}
        </span>
        <span className="text-xs tabular-nums">
          {active.length}/{game.capacity}
          <span
            style={{
              color: connected < active.length ? COLORS.warn : COLORS.ok,
            }}
          >
            {' '}
            ●{connected}
          </span>
        </span>
        <span className="text-sm font-bold tabular-nums">
          {left === null ? '—' : formatDuration(left)}
        </span>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 pt-1 flex flex-col gap-4 text-xs"
          style={{ background: '#141313' }}
        >
          <div
            className="flex flex-wrap gap-x-6 gap-y-1"
            style={{ color: COLORS.muted }}
          >
            <span>Difficulty: {game.difficulty}</span>
            <span>Theme: {game.theme}</span>
            <span>Timer: {game.timerMinutes} min</span>
            <span>Hints used: {hintsUsed}</span>
            {game.finalRiddleAttempts > 0 && (
              <span>Final riddle attempts: {game.finalRiddleAttempts}</span>
            )}
            <span>
              Created: {new Date(game.createdAt).toLocaleTimeString()}
            </span>
            {game.startedAt && (
              <span>
                Started: {new Date(game.startedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          {game.status !== 'lobby' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5" style={{ background: COLORS.line }}>
                <div
                  className="h-full"
                  style={{ width: `${progress}%`, background: COLORS.ok }}
                />
              </div>
              <span className="tabular-nums" style={{ color: COLORS.muted }}>
                {solved}/{rounds.length} riddles solved · {progress}%
              </span>
            </div>
          )}

          {players.length === 0 ? (
            <p style={{ color: COLORS.dim }}>No players have joined.</p>
          ) : (
            <RoundGrid
              game={game}
              players={players}
              rounds={rounds}
              adminKey={adminKey}
              busy={busy}
              run={run}
            />
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <ConfirmButton
              label={game.status === 'lobby' ? 'Close lobby' : 'End game'}
              confirmLabel="Click again to confirm"
              disabled={busy}
              onConfirm={() =>
                run(
                  () => Meteor.callAsync('admin.endGame', adminKey, game._id),
                  'Game ended.'
                )
              }
            />
            {result && (
              <span
                role="status"
                style={{ color: result.ok ? COLORS.ok : COLORS.accent }}
              >
                {result.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, games, playersByGame, now }) {
  return (
    <div
      className="flex flex-col"
      style={{ border: `1px solid ${COLORS.line}` }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 text-[10px] tracking-widest uppercase"
        style={{
          borderBottom: `1px solid ${COLORS.line}`,
          color: COLORS.muted,
        }}
      >
        <span>
          {match.mode} match · {match.status.replace('_', ' ')}
        </span>
      </div>
      {games.map((g) => {
        const left = remainingGameMs(g, now);
        const active = (playersByGame[g._id] || []).filter(
          (p) => !p.leftAt
        ).length;
        return (
          <div
            key={g._id}
            className="flex items-center gap-3 px-4 py-2 text-sm"
          >
            <span className="font-mono font-bold">{g.joinCode}</span>
            <span className="flex-1 font-bold uppercase truncate">
              {g.groupName}
            </span>
            <StatusBadge status={g.status} />
            <span
              className="text-xs tabular-nums w-14 text-right"
              style={{ color: COLORS.muted }}
            >
              R {g.currentRound}/{g.totalRounds}
            </span>
            <span className="text-xs tabular-nums w-10 text-right">
              {active}p
            </span>
            <span className="font-bold tabular-nums w-14 text-right">
              {left === null ? '—' : formatDuration(left)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Dashboard({ adminKey, onAuthError, onLock }) {
  const [now, setNow] = useState(Date.now());
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    loading,
    games: subscribed,
    matches,
  } = useTracker(() => {
    const sub = Meteor.subscribe('admin.liveGames', adminKey, {
      onStop(err) {
        if (err) onAuthError(err);
      },
    });
    return {
      loading: !sub.ready(),
      games: Games.find(
        { status: { $in: LIVE_STATUSES } },
        { sort: { createdAt: -1 } }
      ).fetch(),
      matches: Matches.find({
        status: { $in: ['lobby', 'in_progress'] },
      }).fetch(),
    };
  }, [adminKey]);

  // The server only sends lobbies younger than the cut-off as of subscribing;
  // this drops the ones that age past it while the page stays open.
  const games = subscribed.filter(
    (g) =>
      g.status !== 'lobby' ||
      now - new Date(g.createdAt).getTime() < LOBBY_MAX_AGE_MS
  );

  // Keyed on the id list rather than the docs, so the details subscription
  // only restarts when a game appears or ends.
  const gameIdsKey = games
    .map((g) => g._id)
    .sort()
    .join(',');
  const { players, rounds } = useTracker(() => {
    const gameIds = gameIdsKey ? gameIdsKey.split(',') : [];
    Meteor.subscribe('admin.gameDetails', adminKey, gameIds);
    const inLive = { gameId: { $in: gameIds } };
    return {
      players: Players.find(inLive, { sort: { joinedAt: 1 } }).fetch(),
      rounds: Rounds.find(inLive).fetch(),
    };
  }, [adminKey, gameIdsKey]);

  const playersByGame = useMemo(() => groupBy(players, 'gameId'), [players]);
  const roundsByGame = useMemo(() => groupBy(rounds, 'gameId'), [rounds]);
  const gamesById = useMemo(
    () => Object.fromEntries(games.map((g) => [g._id, g])),
    [games]
  );

  const stats = {
    live: games.length,
    online: players.filter((p) => presenceOf(p) === 'connected').length,
    lobby: games.filter((g) => g.status === 'lobby').length,
    inProgress: games.filter((g) => g.status === 'in_progress').length,
    finalRiddle: games.filter((g) => g.status === 'final_riddle').length,
  };

  const queue = games
    .filter((g) => g.matchmakingSince && !g.matchId)
    .sort(
      (a, b) => new Date(a.matchmakingSince) - new Date(b.matchmakingSince)
    );

  const liveMatches = matches
    .map((m) => ({
      match: m,
      games: m.gameIds.map((id) => gamesById[id]).filter(Boolean),
    }))
    .filter(({ games: teams }) => teams.length > 0);

  const needle = search.trim().toLowerCase();
  const filtered = games.filter(
    (g) =>
      (statusFilter === 'all' || g.status === statusFilter) &&
      (modeFilter === 'all' || g.playMode === modeFilter) &&
      (!needle ||
        g.joinCode.toLowerCase().includes(needle) ||
        g.groupName.toLowerCase().includes(needle))
  );

  const selectStyle = {
    background: '#151414',
    color: COLORS.text,
    border: `1px solid ${COLORS.line}`,
  };

  return (
    <div className="w-full max-w-6xl flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p
            className="text-xs tracking-widest mb-1"
            style={{ color: COLORS.accent }}
          >
            LIVE · {new Date(now).toLocaleTimeString()}
          </p>
          <h1 className="text-3xl font-bold tracking-widest uppercase">
            Operations
          </h1>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="text-[10px] tracking-widest uppercase px-3 py-1.5 cursor-pointer"
          style={{
            color: COLORS.muted,
            border: `1px solid ${COLORS.line}`,
            background: 'none',
          }}
        >
          Lock
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="Live games" value={stats.live} />
        <StatTile
          label="Players online"
          value={stats.online}
          color={COLORS.ok}
        />
        <StatTile label="In lobby" value={stats.lobby} color={COLORS.muted} />
        <StatTile
          label="In progress"
          value={stats.inProgress}
          color={COLORS.ok}
        />
        <StatTile
          label="Final riddle"
          value={stats.finalRiddle}
          color={COLORS.warn}
        />
        <StatTile label="Matchmaking" value={queue.length} />
      </div>

      {loading && (
        <p className="text-xs tracking-widest" style={{ color: COLORS.muted }}>
          LOADING...
        </p>
      )}

      {liveMatches.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2
            className="text-xs tracking-widest uppercase"
            style={{ color: COLORS.muted }}
          >
            Team vs team ({liveMatches.length})
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {liveMatches.map(({ match, games: teams }) => (
              <MatchCard
                key={match._id}
                match={match}
                games={teams}
                playersByGame={playersByGame}
                now={now}
              />
            ))}
          </div>
        </section>
      )}

      {queue.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2
            className="text-xs tracking-widest uppercase"
            style={{ color: COLORS.muted }}
          >
            Matchmaking queue ({queue.length})
          </h2>
          <div style={{ border: `1px solid ${COLORS.line}` }}>
            {queue.map((g) => {
              const waited = now - new Date(g.matchmakingSince).getTime();
              return (
                <div
                  key={g._id}
                  className="flex items-center gap-3 px-4 py-2 text-sm"
                >
                  <span className="font-mono font-bold">{g.joinCode}</span>
                  <span className="flex-1 font-bold uppercase truncate">
                    {g.groupName}
                  </span>
                  <span
                    className="text-xs uppercase"
                    style={{ color: COLORS.muted }}
                  >
                    {g.difficulty}
                  </span>
                  <span
                    className="font-bold tabular-nums"
                    style={{
                      color: waited > 2 * 60 * 1000 ? COLORS.warn : COLORS.text,
                    }}
                  >
                    waiting {formatDuration(waited)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2
            className="text-xs tracking-widest uppercase"
            style={{ color: COLORS.muted }}
          >
            All live games ({filtered.length})
          </h2>
          <div className="flex gap-2 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code or group"
              aria-label="Search games"
              className="px-3 py-1.5 text-xs outline-none"
              style={selectStyle}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="px-2 py-1.5 text-xs"
              style={selectStyle}
            >
              <option value="all">All statuses</option>
              {LIVE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="Filter by mode"
              className="px-2 py-1.5 text-xs"
              style={selectStyle}
            >
              <option value="all">All modes</option>
              <option value="solo">Solo</option>
              <option value="local">Local</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>

        <div style={{ border: `1px solid ${COLORS.line}` }}>
          <div
            className="hidden md:grid grid-cols-[70px_1fr_80px_110px_80px_80px_80px] gap-x-4 px-4 py-2 text-[10px] tracking-widest uppercase"
            style={{
              color: COLORS.dim,
              borderBottom: `1px solid ${COLORS.line}`,
            }}
          >
            <span>Code</span>
            <span>Group</span>
            <span>Mode</span>
            <span>Status</span>
            <span>Round</span>
            <span>Players</span>
            <span>Time left</span>
          </div>
          {filtered.length === 0 && !loading && (
            <p
              className="px-4 py-6 text-xs tracking-widest"
              style={{ color: COLORS.dim }}
            >
              NO GAMES MATCH
            </p>
          )}
          {filtered.map((g) => (
            <GameRow
              key={g._id}
              game={g}
              players={playersByGame[g._id] || []}
              rounds={roundsByGame[g._id] || []}
              now={now}
              expanded={expandedId === g._id}
              adminKey={adminKey}
              onToggle={() =>
                setExpandedId(expandedId === g._id ? null : g._id)
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function groupBy(docs, field) {
  const groups = {};
  for (const doc of docs) (groups[doc[field]] ||= []).push(doc);
  return groups;
}

const AdminDashboard = () => {
  const [adminKey, setAdminKey] = useState(readKey);
  const [error, setError] = useState('');

  const unlock = (key) => {
    setError('');
    writeKey(key);
    setAdminKey(key);
  };

  const lock = (message = '') => {
    writeKey('');
    setAdminKey('');
    setError(message);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: COLORS.bg, color: COLORS.text }}
    >
      <header
        className="px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${COLORS.line}` }}
      >
        <span className="font-bold text-xl tracking-widest uppercase">
          ESCAPESNAP
        </span>
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: COLORS.muted }}
        >
          Admin
        </span>
      </header>
      <main className="flex-1 px-4 sm:px-8 py-10 flex flex-col items-center">
        {adminKey ? (
          <Dashboard
            adminKey={adminKey}
            onAuthError={(err) =>
              lock(
                err.error === 'forbidden'
                  ? 'Wrong admin key.'
                  : 'Lost access — try again.'
              )
            }
            onLock={() => lock()}
          />
        ) : (
          <KeyForm error={error} onSubmit={unlock} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
