import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import 'meteor/aldeed:collection2/static';

// One document per thing that happened in a game, shown to the host in the
// progress page's event log. Messages are not stored — the client renders
// each `type` through the locale files so the log follows the host's language.
export const GameEvents = new Mongo.Collection('gameEvents');

export const GAME_EVENT_TYPES = [
  'playerJoined',
  'gameStarted',
  'roundStarted',
  'roundSolved',
  'photoRejected',
  'hintRevealed',
  'roundSkipped',
  'roundTimedOut',
  'finalAnswerWrong',
  'gameWon',
  'gameLost',
];

GameEvents.attachSchema(
  new SimpleSchema({
    gameId: {
      type: String,
    },
    type: {
      type: String,
      allowedValues: GAME_EVENT_TYPES,
    },
    playerId: {
      type: String,
      optional: true,
    },
    // Copied in at write time so the log reads without joining players.
    playerName: {
      type: String,
      optional: true,
    },
    roundNumber: {
      type: SimpleSchema.Integer,
      min: 1,
      optional: true,
    },
    createdAt: {
      type: Date,
    },
  })
);
