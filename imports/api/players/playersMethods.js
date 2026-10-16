import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import { dropPlayer, findReconnectablePlayer } from './presence';

Meteor.methods({
  async 'players.join'(joinCode, playerName) {
    const game = await Games.findOneAsync({ joinCode, status: 'lobby' });
    if (!game) throw new Meteor.Error('not-found', 'Game not found or already started');

    const playerCount = await Players.find({ gameId: game._id }).countAsync();
    if (playerCount >= game.capacity)
      throw new Meteor.Error('full', 'Game is full');

    const playerId = await Players.insertAsync({
      gameId: game._id,
      name: playerName.trim(),
      joinedAt: new Date(),
      revealedLetters: [],
    });
    return { playerId, gameId: game._id };
  },

  async 'players.rejoin'(playerId) {
    const player = await findReconnectablePlayer(playerId);
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
  async 'players.leave'(playerId) {
    const player =
      typeof playerId === 'string' && (await Players.findOneAsync(playerId));
    if (!player) return;
    await dropPlayer(player);
  },
});
