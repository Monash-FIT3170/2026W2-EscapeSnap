import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import 'meteor/aldeed:collection2/static';

export const GameResults = new Mongo.Collection('gameResults');

const ResultStatsSchema = new SimpleSchema({
  correctCount: {
    type: SimpleSchema.Integer,
    min: 0,
  },
  wrongCount: {
    type: SimpleSchema.Integer,
    min: 0,
  },
  timeoutCount: {
    type: SimpleSchema.Integer,
    min: 0,
  },
  completedCount: {
    type: SimpleSchema.Integer,
    min: 0,
  },
  totalRounds: {
    type: SimpleSchema.Integer,
    min: 0,
  },
  accuracyPercent: {
    type: Number,
    min: 0,
    max: 100,
  },
  fastestSolveMs: {
    type: Number,
    min: 0,
    optional: true,
  },
  averageSolveMs: {
    type: Number,
    min: 0,
    optional: true,
  },
});

const AwardedBadgeSchema = new SimpleSchema({
  id: {
    type: String,
  },
  metricValue: {
    type: Number,
    optional: true,
  },
});

GameResults.attachSchema(
  new SimpleSchema({
    gameId: {
      type: String,
    },
    playerId: {
      type: String,
    },
    playerName: {
      type: String,
    },
    outcome: {
      type: String,
      allowedValues: ['won', 'lost'],
    },
    rank: {
      type: SimpleSchema.Integer,
      min: 1,
    },
    stats: {
      type: ResultStatsSchema,
    },
    badges: {
      type: Array,
      defaultValue: [],
    },
    'badges.$': {
      type: AwardedBadgeSchema,
    },
    generatedAt: {
      type: Date,
    },
  })
);
