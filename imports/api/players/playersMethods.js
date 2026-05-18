import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';

Meteor.methods({
  async 'players.join'(joinCode, playerName) {
    const game = await Games.findOneAsync({ joinCode, status: 'lobby' });
    if (!game) throw new Meteor.Error('not-found', 'Game not found or already started');

    const playerCount = await Players.find({ gameId: game._id }).countAsync();
    if (playerCount >= game.capacity)
      throw new Meteor.Error('full', 'Game is full');

    return Players.insertAsync({
      gameId: game._id,
      name: playerName.trim(),
      joinedAt: new Date(),
      revealedLetters: [],
    });
  },
});
