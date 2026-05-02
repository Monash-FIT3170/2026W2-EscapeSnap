import { Meteor } from 'meteor/meteor';
import '../imports/api/games/gamesMethods';
import '../imports/api/games/gamesPublications';
import { Games } from '../imports/api/games/GamesCollection';
import { FINAL_RIDDLE } from '../imports/lib/finalRiddle';

Meteor.startup(async () => {
  const count = await Games.find().countAsync();
  if (count === 0) {
    await Games.insertAsync({
      status: 'final_riddle',
      createdAt: new Date(),
      players: [
        { id: 'player1', name: 'Dylan', revealedLetters: ['M', '?', 'A'] },
      ],
      finalRiddle: FINAL_RIDDLE,
    });
  } else {
    const game = await Games.findOneAsync({ status: 'final_riddle' });
    console.log('GAME ALREADY EXISTS', game);
  }
});

