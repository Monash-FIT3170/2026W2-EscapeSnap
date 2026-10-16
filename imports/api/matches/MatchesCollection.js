import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import 'meteor/aldeed:collection2/static';

// A team-vs-team match. Each team is an ordinary game (see Games.matchId), so
// the round engine is untouched — the match only ties the teams together,
// starts them on the same clock and records who escaped first.
export const Matches = new Mongo.Collection('matches');

Matches.attachSchema(
  new SimpleSchema({
    mode: {
      type: String,
      allowedValues: ['local', 'online'],
    },
    status: {
      type: String,
      allowedValues: ['lobby', 'in_progress', 'finished'],
    },
    gameIds: {
      type: Array,
      minCount: 2,
    },
    'gameIds.$': {
      type: String,
    },
    // Unset on a draw — every team failed its final riddle.
    winnerGameId: {
      type: String,
      optional: true,
    },
    createdAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
      optional: true,
    },
    endedAt: {
      type: Date,
      optional: true,
    },
  })
);
