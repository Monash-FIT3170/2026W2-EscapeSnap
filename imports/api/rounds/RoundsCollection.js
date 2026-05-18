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
  photoUrl: {
    type: String,
    optional: true,
  },
  submittedAt: {
    type: Date,
    optional: true,
  },
}));
