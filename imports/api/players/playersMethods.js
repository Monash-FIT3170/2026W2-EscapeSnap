import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';

Meteor.methods({
  async 'players.join'(joinCode, playerName) {
    // The host displays the Mongo _id as the join code
    const game = await Games.findOneAsync({ _id: joinCode, status: 'lobby' });
    if (!game) throw new Meteor.Error('not-found', 'Game not found or already started');

    return Players.insertAsync({
      gameId: game._id,
      name: playerName.trim(),
      joinedAt: new Date(),
      revealedLetters: [],
    });
  },
});
