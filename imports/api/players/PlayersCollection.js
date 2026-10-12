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
  // Secret handed to the joining phone so it can reconnect as this player.
  // Never published.
  sessionToken: {
    type: String,
    optional: true,
  },
  // Presence (see presence.js): the DDP connection the player is on, when it
  // dropped, and when the reconnect window ran out on them.
  connectionId: {
    type: String,
    optional: true,
  },
  disconnectedAt: {
    type: Date,
    optional: true,
  },
  leftAt: {
    type: Date,
    optional: true,
  },
}));
