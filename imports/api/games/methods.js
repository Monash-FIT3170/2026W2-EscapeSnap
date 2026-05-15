import { Meteor } from 'meteor/meteor';
import { Games } from './GamesCollection';
import { HARDCODED_RIDDLES } from '/imports/lib/riddles';

Meteor.methods({
  async 'games.submitRiddle'(gameId, playerId, round = 1) {
    const riddle = HARDCODED_RIDDLES.find(
      r => r.playerId === playerId && r.round === round
    );

    if (!riddle) throw new Meteor.Error('no-riddle', 'No riddle found');

    return riddle.revealedLetter;
  },
});