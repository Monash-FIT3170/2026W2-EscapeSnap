import { Meteor } from 'meteor/meteor';
import '/imports/api/games/methods';
import '/imports/api/players/playersMethods';
import '/imports/api/players/playersPublications';

Meteor.startup(() => {
  console.log('[EscapeSnap] server ready');
});