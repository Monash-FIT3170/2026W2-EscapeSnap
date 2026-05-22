import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '/imports/api/games/GamesCollection';

export function useFinalRiddle(gameId) {
  return useTracker(() => {
    const sub = Meteor.subscribe('games.current', gameId);
    const game = Games.findOne(gameId);
    return {
      loading: !sub.ready(),
      finalRiddle: game?.finalRiddle.riddle ?? null,
      gameStatus: game?.status ?? null,
    };
  }, [gameId]);
}
