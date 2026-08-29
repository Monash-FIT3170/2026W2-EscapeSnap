import { Meteor } from 'meteor/meteor';
import { Games } from '../games/GamesCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { Submissions } from './SubmissionsCollection';

const ENDED = ['won', 'lost'];

Meteor.publish('games.summary', async function (gameId) {
  const self = this;

  if (typeof gameId !== 'string' || !gameId) {
    self.ready();
    return;
  }

  let handles = [];
  let opened = false;

  function relay(cursor, collectionName) {
    return cursor.observeChangesAsync({
      added: (id, fields) => self.added(collectionName, id, fields),
      changed: (id, fields) => self.changed(collectionName, id, fields),
      removed: (id) => self.removed(collectionName, id),
    });
  }

  async function open() {
    if (opened) return;
    opened = true;
    handles.push(await relay(Rounds.find({ gameId }), 'rounds'));
    handles.push(await relay(Submissions.find({ gameId }), 'submissions'));
  }

  const game = await Games.findOneAsync(gameId, { fields: { status: 1 } });
  if (game && ENDED.includes(game.status)) {
    await open();
    self.ready();
  } else {
    // Not ended yet — publish nothing, but watch for the transition.
    const gameWatcher = await Games.find(
      { _id: gameId },
      { fields: { status: 1 } }
    ).observeChangesAsync({
      changed: (id, fields) => {
        if (fields.status && ENDED.includes(fields.status)) {
          open().catch((err) => console.error('[EscapeSnap] summary open failed:', err));
        }
      },
    });
    handles.push(gameWatcher);
    self.ready();
  }

  self.onStop(() => {
    handles.forEach((h) => h.stop());
    handles = [];
  });
});
