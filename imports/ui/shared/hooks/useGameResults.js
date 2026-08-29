import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { GameResults } from '/imports/api/achievements/GameResultsCollection';

export function useGameResults(gameId) {
  return useTracker(() => {
    if (!gameId) return { loading: false, results: [] };

    const subscription = Meteor.subscribe('gameResults.forGame', gameId);
    return {
      loading: !subscription.ready(),
      results: GameResults.find(
        { gameId },
        { sort: { rank: 1, playerName: 1 } }
      ).fetch(),
    };
  }, [gameId]);
}

export function usePlayerResult(playerId) {
  return useTracker(() => {
    if (!playerId) return { loading: false, result: null };

    const subscription = Meteor.subscribe('gameResults.forPlayer', playerId);
    return {
      loading: !subscription.ready(),
      result: GameResults.findOne({ playerId }) ?? null,
    };
  }, [playerId]);
}
