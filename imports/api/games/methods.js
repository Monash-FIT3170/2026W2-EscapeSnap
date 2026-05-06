import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';

Meteor.methods({
  async 'games.submitRiddle'(gameId, playerId) {

    const riddle = HARDCODED_RIDDLES.find(r => r.playerId === playerId);
    if (!riddle) throw new Meteor.Error('no-riddle');

    return riddle.revealedLetter;
  },
});