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
  connectionId: {
    type: String,
    optional: true,
  },
  // SHA-256 of the secret players.join hands to the joining player (see
  // presence.js). Teammates can see a player's _id, so the _id alone never
  // proves who you are.
  sessionTokenHash: {
    type: String,
    optional: true,
  },
  disconnectedAt: {
    type: Date,
    optional: true,
  },
}));
