import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import { logGameEvent } from '../events/gameEventLog';
import {
  dropPlayer,
  findOwnedPlayer,
  findReconnectablePlayer,
  newSessionToken,
} from './presence';

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

  async 'players.rejoin'(playerId, sessionToken) {
    const player = await findReconnectablePlayer(playerId, sessionToken);
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
      status: game.status,
    };
  },

  // The player pressed exit. Without this they'd stay in the game with their
  // tab still open, so the team would keep waiting on them every round.
  async 'players.leave'(playerId, sessionToken) {
    const player = await findOwnedPlayer(playerId, sessionToken);
    await dropPlayer(player);
  },
});
