import { Meteor } from 'meteor/meteor';
import {
  createLocalMatch,
  enterMatchmaking,
  leaveMatchmaking,
  startLocalMatch,
} from './matchService';

Meteor.methods({
  // Same room: creates both teams' games and returns the matchId.
  async 'matches.createLocal'(options) {
    return createLocalMatch(options);
  },

  async 'matches.start'(matchId) {
    await startLocalMatch(matchId);
  },

  // Online: queue a full team for a random opponent. If a rival is already
  // waiting, both games start before this returns.
  async 'matches.findOpponent'(gameId) {
    await enterMatchmaking(gameId);
  },

  async 'matches.cancelSearch'(gameId) {
    await leaveMatchmaking(gameId);
  },
});
