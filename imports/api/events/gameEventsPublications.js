import { Meteor } from 'meteor/meteor';
import { GameEvents } from './GameEventsCollection';

export const EVENT_LOG_LIMIT = 50;

// Host: the most recent events for the progress page's event log.
Meteor.publish('gameEvents.forGame', function (gameId) {
  if (typeof gameId !== 'string' || !gameId) return this.ready();

  return GameEvents.find(
    { gameId },
    { sort: { createdAt: -1 }, limit: EVENT_LOG_LIMIT }
  );
});
