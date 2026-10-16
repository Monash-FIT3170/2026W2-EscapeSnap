import { Meteor } from 'meteor/meteor';
import {
  createLocalMatch,
  enterMatchmaking,
  leaveMatchmaking,
  startLocalMatch,
} from './matchService';

// A non-string id would be read as a Mongo selector and could match some
// other team's game or match.
function assertId(id) {
  if (typeof id !== 'string' || !id) {
    throw new Meteor.Error('not-found', 'Not found');
  }
}

Meteor.methods({
  // Same room: creates both teams' games and returns the matchId.
  async 'matches.createLocal'(options) {
    return createLocalMatch(options);
  },

  async 'matches.start'(matchId) {
    assertId(matchId);
    await startLocalMatch(matchId);
  },

  // Online: queue a full team for a random opponent. If a rival is already
  // waiting, both games start before this returns.
  async 'matches.findOpponent'(gameId) {
    assertId(gameId);
    await enterMatchmaking(gameId);
  },

  async 'matches.cancelSearch'(gameId) {
    assertId(gameId);
    await leaveMatchmaking(gameId);
  },
});
