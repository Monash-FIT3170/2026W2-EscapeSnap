import { Meteor } from 'meteor/meteor';
import { Players } from './PlayersCollection';
import { Games } from '../games/GamesCollection';
import { logGameEvent } from '../events/gameEventLog';
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
    await logGameEvent({ gameId: game._id, type: 'playerJoined', playerId });
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
  // Teammates can see each other's ids, so only the connection the player is
  // playing on (bound by the player.self subscription) may make them leave.
  async 'players.leave'(playerId) {
    const connectionId = this.connection?.id;
    const player =
      typeof playerId === 'string' &&
      connectionId &&
      (await Players.findOneAsync({ _id: playerId, connectionId }));
    if (!player) throw new Meteor.Error('not-authorized', 'Not your player');
    await dropPlayer(player);
  },
});
