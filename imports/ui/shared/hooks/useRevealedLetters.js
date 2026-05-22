import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Games } from '../../../api/games/GamesCollection';

export function useRevealedLetters(gameId) {
  return useTracker(() => {
    const sub = Meteor.subscribe('games.current', gameId);
    const game = Games.findOne(gameId);
    return {
      loading: !sub.ready(),
      // flat array of all letters collected across all players e.g. ["E", "?", "A", "T"]
      letters: game?.players?.flatMap(p => p.revealedLetters ?? []) ?? [],
    };
  }, [gameId]);
}
