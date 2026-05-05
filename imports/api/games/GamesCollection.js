import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

export const Games = new Mongo.Collection('games');

Games.attachSchema(new SimpleSchema({
  joinCode: {
    type: String,
    min: 4,
    max: 4,
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
  'finalRiddle': {
    type: Object,
  },
  'finalRiddle.text': {
    type: String,
  },
  'finalRiddle.answer': {
    type: String,
  },
}));
