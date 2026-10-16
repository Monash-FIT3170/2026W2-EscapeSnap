import { Meteor } from 'meteor/meteor';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { endGame } from '../games/gameLifecycle';
import {
  claimMatchVictory,
  leaveMatchmaking,
  settleMatchIfOver,
} from '../matches/matchService';

// Server-only. Tracks which players are still at the table:
//  - a dropped connection starts a grace window the player can reconnect in,
//  - once it runs out they have left: a lobby frees their slot, a live game
//    hands their unsolved riddles to the teammates still playing,
//  - a team with nobody left forfeits.
// Everything is driven by fields on the player doc and a periodic sweep, so a
// server restart can't strand a game the way in-memory timers would.

// Long enough for a locked phone or a closed tab to find its way back, in the
// lobby and mid-game alike. Leaving on purpose (players.leave) skips it.
export const RECONNECT_WINDOW_MS = 2 * 60 * 1000;
const SWEEP_INTERVAL_MS = 15 * 1000;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

// A new session secret for a joining player: the token goes back to that
// player only, and just its hash is stored.
export function newSessionToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

// Anyone in the game can see a teammate's _id, so the id alone must never be
// enough to act as that player — the secret token handed out at join is. A
// wrong token looks exactly like a missing player, so ids can't be probed.
export async function findOwnedPlayer(playerId, sessionToken) {
  const player =
    typeof playerId === 'string' &&
    typeof sessionToken === 'string' &&
    (await Players.findOneAsync(playerId));
  const expected = player?.sessionTokenHash;
  const given = expected && Buffer.from(hashToken(sessionToken));
  if (!given || !timingSafeEqual(given, Buffer.from(expected))) {
    throw new Meteor.Error('not-found', 'Player not found');
  }
  return player;
}

// Players still in the game, oldest first. A player inside the grace window
// counts — the team waits for them rather than reshuffling on every blip.
async function activePlayers(gameId) {
  return Players.find(
    { gameId, leftAt: { $exists: false } },
    { sort: { joinedAt: 1 } }
  ).fetchAsync();
}

// Ends a team that has nobody left. In a match the rival takes the win —
// unless the rival has walked away too, which makes it a draw.
async function forfeitTeam(game) {
  const endedAt = new Date();
  if (!(await endGame(game._id, 'lost', endedAt))) return;
  if (!game.matchId) return;

  const rivals = await Games.find({
    matchId: game.matchId,
    _id: { $ne: game._id },
    status: 'in_progress',
  }).fetchAsync();
  for (const rival of rivals) {
    const stillPlaying = await Players.find({
      gameId: rival._id,
      leftAt: { $exists: false },
    }).countAsync();
    if (stillPlaying === 0) continue;
    if (await claimMatchVictory(game.matchId, rival._id, endedAt)) {
      await endGame(rival._id, 'won', endedAt);
    }
    return;
  }
  await settleMatchIfOver(game.matchId, endedAt);
}

// Makes sure every unsolved riddle has someone present to solve it. A leaver's
// riddles are dealt round-robin across the remaining players (`coveredBy`); a
// player who comes back reclaims theirs from the next round on. The round on
// screen is never pulled out from under whoever is already working on it.
export async function rebalanceTeam(gameId) {
  const game = await Games.findOneAsync(gameId);
  if (!game || game.status !== 'in_progress') return;

  const active = await activePlayers(gameId);
  if (active.length === 0) {
    await forfeitTeam(game);
    return;
  }
  const activeIds = new Set(active.map((p) => p._id));

  const pending = await Rounds.find(
    { gameId, status: 'pending' },
    { sort: { roundNumber: 1, playerId: 1 } }
  ).fetchAsync();

  let turn = 0;
  for (const round of pending) {
    const coverIsActive = !!round.coveredBy && activeIds.has(round.coveredBy);
    if (activeIds.has(round.playerId)) {
      const keepCover = coverIsActive && round.roundNumber <= game.currentRound;
      if (round.coveredBy && !keepCover) {
        await Rounds.updateAsync(
          { _id: round._id, status: 'pending' },
          { $unset: { coveredBy: '' } }
        );
      }
    } else if (!coverIsActive) {
      const coveredBy = active[turn++ % active.length]._id;
      await Rounds.updateAsync(
        { _id: round._id, status: 'pending' },
        { $set: { coveredBy } }
      );
    }
  }
}

// Called when a player is gone for good — their grace window ran out, or they
// chose to leave.
export async function playerLeft(player, game) {
  game ??= await Games.findOneAsync(player.gameId);
  console.log(
    `[presence] ${player.name} (${player._id}) left game ${player.gameId} (${game?.status})`
  );
  if (game?.status === 'lobby') {
    await Players.removeAsync(player._id);
    // A queued team is no longer full, so it can't be paired any more.
    await leaveMatchmaking(game._id);
    return;
  }
  await Players.updateAsync(
    { _id: player._id, leftAt: { $exists: false } },
    { $set: { leftAt: new Date() } }
  );
  await rebalanceTeam(player.gameId);
}

// Binds the player to the DDP connection they are playing on.
export async function attachPlayer(player, connectionId) {
  await Players.updateAsync(player._id, {
    $set: { connectionId },
    $unset: { disconnectedAt: '', leftAt: '' },
  });
  if (player.leftAt) await rebalanceTeam(player.gameId);
}

// Only the connection the player is currently bound to may mark them gone —
// an old tab closing must not flag a player who is still playing elsewhere.
export async function detachPlayer(playerId, connectionId) {
  const marked = await Players.updateAsync(
    { _id: playerId, connectionId, disconnectedAt: { $exists: false } },
    { $set: { disconnectedAt: new Date() } }
  );
  if (marked) console.log(`[presence] player ${playerId} disconnected`);
}

export async function sweepDisconnectedPlayers(now = new Date()) {
  const expired = await Players.find({
    disconnectedAt: { $lte: new Date(now.getTime() - RECONNECT_WINDOW_MS) },
    leftAt: { $exists: false },
  }).fetchAsync();
  for (const player of expired) {
    try {
      await playerLeft(player);
    } catch (err) {
      console.error(`[presence] expiring player ${player._id} failed:`, err);
    }
  }
}

export async function startPresenceTracking() {
  // Every connection died with the previous server process, so anyone still
  // marked connected gets a fresh grace window to come back in.
  await Players.updateAsync(
    { connectionId: { $exists: true }, disconnectedAt: { $exists: false } },
    { $set: { disconnectedAt: new Date() } },
    { multi: true }
  );
  Meteor.setInterval(() => {
    sweepDisconnectedPlayers().catch((err) =>
      console.error('[presence] sweep failed:', err)
    );
  }, SWEEP_INTERVAL_MS);
}
