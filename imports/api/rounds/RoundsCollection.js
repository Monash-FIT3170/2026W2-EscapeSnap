import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import 'meteor/aldeed:collection2/static';

export const Rounds = new Mongo.Collection('rounds');
Rounds.attachSchema(new SimpleSchema({
  gameId: {
    type: String,
  },
  playerId: {
    type: String,
  },
  roundNumber: {
    type: SimpleSchema.Integer,
    min: 1,
  },
  riddleText: {
    type: String,
  },
  answer: {
    type: String,
  },
  letter: {
    type: String,
    allowedValues: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')],
  },
  status: {
    type: String,
    allowedValues: ['pending', 'correct', 'wrong', 'timeout'],
    defaultValue: 'pending',
  },
  // Set once, when the riddle is first shown to the player. Measures against
  // submittedAt to give time-per-round.
  startedAt: {
    type: Date,
    optional: true,
  },
  startedAt: {
    type: Date,
    optional: true,
  },
  submittedAt: {
    type: Date,
    optional: true,
  },
  solveDurationMs: {
    type: Number,
    min: 0,
    optional: true,
  },
}));
