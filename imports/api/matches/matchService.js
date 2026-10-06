import { Meteor } from 'meteor/meteor';
import { Matches } from './MatchesCollection';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { FINAL_RIDDLE } from '../../lib/finalRiddle';
import {
  endGame,
  ensureRiddlesReady,
  generateJoinCode,
  pregenerateRiddlesOnce,
  shrinkTeamToPlayers,
  startGame,
} from '../games/gameLifecycle';
import { SEARCH_TTL_MS } from '../../lib/teamStatus';

async function assertLobbyFull(game) {
  const playerCount = await Players.find({ gameId: game._id }).countAsync();
  if (playerCount !== game.capacity) {
    throw new Meteor.Error(
      'lobby-not-full',
      'All player slots must be filled before starting'
    );
  }
}

// Starts every team on the same clock. The first game is the source of truth:
// the others take its round riddles, so both teams hunt the same objects. Each
// team keeps its own final riddle, so overhearing the rival never gives the
// answer away.
// `shareSettings` also copies the clock and riddle settings, for online teams
// that were configured separately before being paired.
async function launchTeams(gameIds, { shareSettings = false } = {}) {
  const [source] = await Games.find({ _id: gameIds[0] }).fetchAsync();
  const $set = { pregeneratedRoundRiddles: source.pregeneratedRoundRiddles };
  if (shareSettings) {
    Object.assign($set, {
      timerMinutes: source.timerMinutes,
      difficulty: source.difficulty,
      theme: source.theme,
    });
  }
  await Games.updateAsync(
    { _id: { $in: gameIds.slice(1) } },
    { $set },
    { multi: true }
  );

  const startedAt = new Date();
  await Promise.all(gameIds.map((gameId) => startGame(gameId, startedAt)));
  return startedAt;
}

// ---------------------------------------------------------------------------
// Same-room matches: one host screen, two teams, two join codes.
// ---------------------------------------------------------------------------

export async function createLocalMatch({
  teamNames,
  timerMinutes = 30,
  totalRounds = 3,
  capacity = 4,
  difficulty = 'medium',
  theme = 'classroom',
} = {}) {
  const names = (Array.isArray(teamNames) ? teamNames : []).map((name) =>
    typeof name === 'string' ? name.trim() : ''
  );
  if (names.length !== 2 || names.some((name) => !name)) {
    throw new Meteor.Error('invalid-group-name', 'Both team names are required');
  }
  if (names[0].toLowerCase() === names[1].toLowerCase()) {
    throw new Meteor.Error('duplicate-team-name', 'Team names must differ');
  }

  const createdAt = new Date();
  const gameIds = [];
  for (const groupName of names) {
    gameIds.push(
      await Games.insertAsync({
        joinCode: await generateJoinCode(),
        groupName,
        status: 'lobby',
        currentRound: 1,
        totalRounds,
        timerMinutes,
        capacity,
        difficulty,
        theme,
        mode: 'local',
        createdAt,
        startedAt: null,
        endedAt: null,
        // Placeholder — overwritten by the pre-warm below.
        finalRiddle: FINAL_RIDDLE,
      })
    );
  }

  const matchId = await Matches.insertAsync({
    mode: 'local',
    status: 'lobby',
    gameIds,
    createdAt,
  });
  await Games.updateAsync(
    { _id: { $in: gameIds } },
    { $set: { matchId } },
    { multi: true }
  );

  for (const gameId of gameIds) {
    pregenerateRiddlesOnce(gameId, {
      totalRounds,
      capacity,
      difficulty,
      theme,
    });
  }

  return matchId;
}

export async function startLocalMatch(matchId) {
  const match = await Matches.findOneAsync(matchId);
  if (!match) throw new Meteor.Error('not-found', 'Match not found');
  if (match.mode !== 'local' || match.status !== 'lobby') {
    throw new Meteor.Error('invalid-state', 'Match is not in lobby state');
  }

  // Unlike solo and online games, a same-room team doesn't have to be full —
  // one player per team is enough to play.
  const games = await Games.find({ _id: { $in: match.gameIds } }).fetchAsync();
  for (const game of games) {
    if (game.status !== 'lobby') {
      throw new Meteor.Error('invalid-state', 'Game is not in lobby state');
    }
    if ((await Players.find({ gameId: game._id }).countAsync()) === 0) {
      throw new Meteor.Error('team-empty', 'Every team needs a player');
    }
  }

  // Claiming the match first means a double-clicked START can't deal the
  // rounds twice.
  const claimed = await Matches.updateAsync(
    { _id: matchId, status: 'lobby' },
    { $set: { status: 'in_progress' } }
  );
  if (claimed === 0) {
    throw new Meteor.Error('invalid-state', 'Match is already starting');
  }

  try {
    await Promise.all(games.map(ensureRiddlesReady));
    await Promise.all(
      match.gameIds.map(async (gameId) => {
        const game = await Games.findOneAsync(gameId);
        const playerCount = await Players.find({ gameId }).countAsync();
        await shrinkTeamToPlayers(game, playerCount);
      })
    );
    const startedAt = await launchTeams(match.gameIds);
    await Matches.updateAsync(matchId, { $set: { startedAt } });
  } catch (err) {
    await Matches.updateAsync(
      { _id: matchId, startedAt: { $exists: false } },
      { $set: { status: 'lobby' } }
    );
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Online matches: a full team enters the queue and is paired with the
// longest-waiting team of the same size.
// ---------------------------------------------------------------------------

export async function enterMatchmaking(gameId) {
  const game = await Games.findOneAsync(gameId);
  if (!game) throw new Meteor.Error('not-found', 'Game not found');
  if (game.mode !== 'online') {
    throw new Meteor.Error('invalid-state', 'Not an online versus game');
  }
  if (game.status !== 'lobby' || game.matchId) {
    throw new Meteor.Error('invalid-state', 'Game is not in lobby state');
  }
  await assertLobbyFull(game);
  // A team only queues once it can start the instant a rival appears.
  await ensureRiddlesReady(game);

  await Games.updateAsync(
    { _id: gameId, status: 'lobby', matchId: { $exists: false } },
    { $set: { matchmakingSince: new Date() } }
  );
  await runMatchmaking();
}

export async function leaveMatchmaking(gameId) {
  await Games.updateAsync(
    { _id: gameId, matchId: { $exists: false } },
    { $unset: { matchmakingSince: '' } }
  );
}

// Claims a queued team for `matchId`. Fails if the team left the queue or was
// claimed by another pairing in the meantime.
function claimQueuedTeam(gameId, matchId) {
  return Games.updateAsync(
    {
      _id: gameId,
      status: 'lobby',
      matchId: { $exists: false },
      matchmakingSince: { $exists: true },
    },
    { $set: { matchId }, $unset: { matchmakingSince: '' } }
  );
}

async function pairTeams(first, second) {
  const matchId = await Matches.insertAsync({
    mode: 'online',
    status: 'lobby',
    gameIds: [first._id, second._id],
    createdAt: new Date(),
  });

  const claimedFirst = await claimQueuedTeam(first._id, matchId);
  const claimedSecond = claimedFirst
    ? await claimQueuedTeam(second._id, matchId)
    : 0;
  if (!claimedFirst || !claimedSecond) {
    // Put the first team back in the queue at its original place.
    if (claimedFirst) {
      await Games.updateAsync(first._id, {
        $unset: { matchId: '' },
        $set: { matchmakingSince: first.matchmakingSince },
      });
    }
    await Matches.removeAsync(matchId);
    return false;
  }

  await Matches.updateAsync(matchId, { $set: { status: 'in_progress' } });
  // The team that waited longest set the terms it was searching with.
  const startedAt = await launchTeams([first._id, second._id], {
    shareSettings: true,
  });
  await Matches.updateAsync(matchId, { $set: { startedAt } });
  return true;
}

async function pairWaitingTeams() {
  const waiting = await Games.find(
    {
      mode: 'online',
      status: 'lobby',
      matchId: { $exists: false },
      matchmakingSince: { $gte: new Date(Date.now() - SEARCH_TTL_MS) },
    },
    { sort: { matchmakingSince: 1 } }
  ).fetchAsync();

  const paired = new Set();
  for (const team of waiting) {
    if (paired.has(team._id)) continue;
    const rival = waiting.find(
      (other) =>
        other._id !== team._id &&
        !paired.has(other._id) &&
        other.capacity === team.capacity &&
        other.totalRounds === team.totalRounds
    );
    if (!rival) continue;
    paired.add(team._id);
    paired.add(rival._id);
    try {
      await pairTeams(team, rival);
    } catch (err) {
      console.error(
        `[matchmaking] Pairing ${team._id} with ${rival._id} failed:`,
        err
      );
    }
  }
}

// Every pass is chained onto the last one, so two teams queueing at the same
// moment can't each look, see nobody, and wait forever: the second pass always
// runs after the first has written its team into the queue.
let matchmakingQueue = Promise.resolve();

export function runMatchmaking() {
  matchmakingQueue = matchmakingQueue
    .then(pairWaitingTeams)
    .catch((err) => console.error('[matchmaking] pass failed:', err));
  return matchmakingQueue;
}

// ---------------------------------------------------------------------------
// Ending a match.
// ---------------------------------------------------------------------------

// The first team to crack its final riddle takes the match, and every rival
// still playing loses on the spot. Returns false if someone got there first.
export async function claimMatchVictory(matchId, gameId, endedAt = new Date()) {
  const claimed = await Matches.updateAsync(
    { _id: matchId, status: 'in_progress' },
    { $set: { status: 'finished', winnerGameId: gameId, endedAt } }
  );
  if (claimed === 0) return false;

  const rivals = await Games.find({
    matchId,
    _id: { $ne: gameId },
    status: 'in_progress',
  }).fetchAsync();
  await Promise.all(rivals.map((rival) => endGame(rival._id, 'lost', endedAt)));
  return true;
}

// Once no team is still playing and nobody won, the match is a draw.
export async function settleMatchIfOver(matchId, endedAt = new Date()) {
  const stillPlaying = await Games.find({
    matchId,
    status: 'in_progress',
  }).countAsync();
  if (stillPlaying > 0) return false;

  const updated = await Matches.updateAsync(
    { _id: matchId, status: 'in_progress' },
    { $set: { status: 'finished', endedAt } }
  );
  return updated === 1;
}
