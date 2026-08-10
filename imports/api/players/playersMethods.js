import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';

const BALD_AVATAR_OPTIONS =
  'noHair1,noHair2,noHair3,shaved1,shaved2,shaved3';

function createProfilePictureUrl() {
  const seed = encodeURIComponent(Random.id());
  return `https://api.dicebear.com/10.x/open-peeps/svg?seed=${seed}&headVariant=${BALD_AVATAR_OPTIONS}&facialHairProbability=100&backgroundColor=0a0a0a,1c1b1b,3a0000`;
}

Meteor.methods({
  async 'players.join'(joinCode, playerName) {
    const game = await Games.findOneAsync({ joinCode, status: 'lobby' });
    if (!game) throw new Meteor.Error('not-found', 'Game not found or already started');

    const playerCount = await Players.find({ gameId: game._id }).countAsync();
    if (playerCount >= game.capacity)
      throw new Meteor.Error('full', 'Game is full');

    const photoUrl = createProfilePictureUrl();
    const playerId = await Players.insertAsync({
      gameId: game._id,
      name: playerName.trim(),
      photoUrl,
      joinedAt: new Date(),
      revealedLetters: [],
    });
    return { playerId, gameId: game._id, photoUrl };
  },
});
