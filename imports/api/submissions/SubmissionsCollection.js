import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import 'meteor/aldeed:collection2/static';

// One document per photo capture attempt
// Documents are removed by a MongoDB TTL index 

export const Submissions = new Mongo.Collection('submissions');

export const PHOTO_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function photoExpiryFrom(createdAt) {
  return new Date(createdAt.getTime() + PHOTO_TTL_MS);
}
const PHOTO_URL_REGEX = /^(data:image\/(jpeg|png|webp);base64,|https:\/\/)/;

Submissions.attachSchema(new SimpleSchema({
  gameId: {
    type: String,
  },
  playerId: {
    type: String,
  },
  roundId: {
    type: String,
  },
  roundNumber: {
    type: SimpleSchema.Integer,
    min: 1,
  },

  attemptNumber: {
    type: SimpleSchema.Integer,
    min: 1,
  },

  targetObject: {
    type: String,
  },
  outcome: {
    type: String,
    allowedValues: ['pass', 'fail', 'escalate'],
  },
  photoUrl: {
    type: String,
    regEx: PHOTO_URL_REGEX,
    max: 1500000,
  },

  detections: {
    type: Array,
    defaultValue: [],
  },
  'detections.$': {
    type: Object,
  },
  'detections.$.label': {
    type: String,
  },
  'detections.$.confidence': {
    type: Number,
    min: 0,
    max: 1,
  },
  createdAt: {
    type: Date,
  },
  
  expiresAt: {
    type: Date,
  },
}));
