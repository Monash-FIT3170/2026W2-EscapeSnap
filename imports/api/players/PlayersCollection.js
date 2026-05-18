import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import 'meteor/aldeed:collection2/static';

export const Players = new Mongo.Collection('players');

Players.attachSchema(new SimpleSchema({
  gameId: {
    type: String,
  },
  name: {
    type: String,
    min: 1,
    max: 20,
  },
  joinedAt: {
    type: Date,
  },
  revealedLetters: {
    type: Array,
    defaultValue: [],
  },
  'revealedLetters.$': {
    type: String,
    allowedValues: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '?'],
  },
}));
