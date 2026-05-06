import { Meteor } from 'meteor/meteor';
import '/imports/api/games/methods';

Meteor.startup(() => {
  console.log('[EscapeSnap] server ready');
});