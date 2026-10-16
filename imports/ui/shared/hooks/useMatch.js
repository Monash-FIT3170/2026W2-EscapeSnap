import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Matches } from '/imports/api/matches/MatchesCollection';
import { Games } from '/imports/api/games/GamesCollection';
import { Players } from '/imports/api/players/PlayersCollection';
import { Rounds } from '/imports/api/rounds/RoundsCollection';

// A match plus a scoreboard-safe view of every team in it. Teams come back in
// the match's own order, so team 1 is always on the left.
export function useMatch(matchId) {
  return useTracker(() => {
    if (!matchId) {
      return { loading: false, match: null, teams: [], players: [], rounds: [] };
    }
    const sub = Meteor.subscribe('matches.byId', matchId);
    const match = Matches.findOne(matchId);
    const gameIds = match?.gameIds ?? [];
    return {
      loading: !sub.ready(),
      match,
      teams: gameIds.map((id) => Games.findOne(id)).filter(Boolean),
      players: Players.find(
        { gameId: { $in: gameIds } },
        { sort: { joinedAt: 1 } }
      ).fetch(),
      rounds: Rounds.find({ gameId: { $in: gameIds } }).fetch(),
    };
  }, [matchId]);
}
