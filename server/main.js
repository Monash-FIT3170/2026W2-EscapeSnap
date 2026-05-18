import { Meteor } from 'meteor/meteor';
import '../imports/api/games/gamesMethods';
import '../imports/api/games/gamesPublications';
import '../imports/api/players/playersMethods';
import '../imports/api/players/playersPublications';
import '../imports/api/rounds/roundsMethods';
import '../imports/api/rounds/roundsPublications';
import { Games } from '../imports/api/games/GamesCollection';
import { Rounds } from '../imports/api/rounds/RoundsCollection';

Meteor.startup(async () => {
  await Games.createIndexAsync({ joinCode: 1 });
  await Games.createIndexAsync({ status: 1 });
  await Rounds.createIndexAsync({ gameId: 1, roundNumber: 1 });
  await Rounds.createIndexAsync({ playerId: 1, roundNumber: 1 });
});
