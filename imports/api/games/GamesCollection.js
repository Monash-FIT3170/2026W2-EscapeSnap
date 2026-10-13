import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import 'meteor/aldeed:collection2/static';
import { THEMES } from '/imports/lib/cocoClasses';
import { CUSTOM_THEME, CUSTOM_THEME_MAX_LENGTH } from '/imports/lib/customTheme';
import { ANSWER_MODES, DEFAULT_ANSWER_MODE } from '/imports/lib/answerModes';

export const Games = new Mongo.Collection('games');

Games.attachSchema(
  new SimpleSchema({
    joinCode: {
      type: String,
      min: 4,
      max: 4,
    },
    groupName: {
      type: String,
      min: 1,
      max: 40,
    },
    status: {
      type: String,
      allowedValues: ['lobby', 'in_progress', 'final_riddle', 'won', 'lost'],
    },
    currentRound: {
      type: SimpleSchema.Integer,
      min: 1,
    },
    totalRounds: {
      type: SimpleSchema.Integer,
      min: 1,
      max: 10,
    },
    timerMinutes: {
      type: SimpleSchema.Integer,
      min: 10,
      max: 60,
    },
    capacity: {
      type: SimpleSchema.Integer,
      min: 1,
      max: 4,
    },
    difficulty: {
      type: String,
      allowedValues: ['easy', 'medium', 'hard'],
    },
    theme: {
      type: String,
      allowedValues: [...THEMES, CUSTOM_THEME],
      defaultValue: 'classroom',
    },
    // The host's own theme text; only set when theme === 'custom'.
    customTheme: {
      type: String,
      optional: true,
      min: 1,
      max: CUSTOM_THEME_MAX_LENGTH,
    },
    mode: {
      type: String,
      allowedValues: ANSWER_MODES,
      defaultValue: DEFAULT_ANSWER_MODE,
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
    timePenaltyMs: {
      type: Number,
      min: 0,
      defaultValue: 0,
    },
    finalRiddleAttempts: {
      type: SimpleSchema.Integer,
      optional: true,
      min: 0,
    },
    finalRiddle: {
      type: Object,
    },
    'finalRiddle.riddle': {
      type: String,
    },
    'finalRiddle.hint': {
      type: String,
    },
    'finalRiddle.answer': {
      type: String,
    },
    // Set once finalRiddle + pregeneratedRoundRiddles are both ready.
    riddlesReady: {
      type: Boolean,
      optional: true,
      defaultValue: false,
    },
    // Generated at games.create so START MISSION is instant.
    pregeneratedRoundRiddles: {
      type: Array,
      optional: true,
    },
    'pregeneratedRoundRiddles.$': {
      type: Object,
    },
    'pregeneratedRoundRiddles.$.text': {
      type: String,
    },
    'pregeneratedRoundRiddles.$.hint': {
      type: String,
    },
    'pregeneratedRoundRiddles.$.answer': {
      type: String,
    },
  })
);
