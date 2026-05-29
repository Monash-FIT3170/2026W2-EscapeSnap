import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Players } from '../../../api/players/PlayersCollection';

export function useRevealedLetters(gameId) {
  return useTracker(() => {
    const sub = Meteor.subscribe('players.inGame', gameId);
    const players = Players.find({ gameId }).fetch();
    return {
      lettersLoading: !sub.ready(),
      letters: players.flatMap(p => p.revealedLetters ?? []),
    };
  }, [gameId]);
}
