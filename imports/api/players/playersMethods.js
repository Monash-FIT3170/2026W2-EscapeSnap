import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import { logGameEvent } from '../events/gameEventLog';
import { findOwnedPlayer, newSessionToken, playerLeft } from './presence';

Meteor.methods({
  async 'players.join'(joinCode, playerName) {
    const game = await Games.findOneAsync({ joinCode, status: 'lobby' });
    if (!game) throw new Meteor.Error('not-found', 'Game not found or already started');

    const playerCount = await Players.find({ gameId: game._id }).countAsync();
    if (playerCount >= game.capacity)
      throw new Meteor.Error('full', 'Game is full');

    const { token, tokenHash } = newSessionToken();
    const playerId = await Players.insertAsync({
      gameId: game._id,
      name: playerName.trim(),
      joinedAt: new Date(),
      revealedLetters: [],
      sessionTokenHash: tokenHash,
    });
    await logGameEvent({ gameId: game._id, type: 'playerJoined', playerId });
    // The token is the player's proof of who they are from here on: rejoin,
    // player.self and leave all ask for it.
    return { playerId, gameId: game._id, sessionToken: token };
  },

  // A refreshed or reopened phone picking its game back up. Mid-game this
  // works even after the reconnect window: the player reclaims their riddles
  // from teammates from the next round on (see presence.js).
  async 'players.rejoin'(playerId, sessionToken) {
    const player = await findOwnedPlayer(playerId, sessionToken);
    const game = await Games.findOneAsync({
      _id: player.gameId,
      status: { $in: ['lobby', 'in_progress'] },
    });
    if (!game) throw new Meteor.Error('invalid-state', 'Game is over');

    return {
      playerId: player._id,
      gameId: game._id,
      playerName: player.name,
      gameCode: game.joinCode,
      groupName: game.groupName,
      status: game.status,
    };
  },

  // Leaving on purpose skips the reconnect window: a lobby slot frees up at
  // once, and mid-game the teammates take over straight away.
  async 'players.leave'(playerId, sessionToken) {
    const player = await findOwnedPlayer(playerId, sessionToken);
    await playerLeft(player);
  },
});
