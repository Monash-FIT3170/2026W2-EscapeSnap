import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp-client';
import { assert } from 'chai';
import './adminMethods';
import { ADMIN_CALLS_PER_WINDOW } from './adminRateLimit';

if (Meteor.isServer) {
  describe('admin rate limit', function () {
    this.timeout(15000);

    let client;
    afterEach(function () {
      client?.disconnect();
    });

    // The limiter only sees calls from real client connections, so this goes
    // through DDP like a browser would.
    it('stops guessing the admin key after a burst of calls', async function () {
      client = DDP.connect(Meteor.absoluteUrl());
      const guess = () =>
        client
          .callAsync('admin.endGame', 'wrong-key', 'some-game')
          .then(() => 'ok', (err) => err.error);

      const errors = [];
      for (let i = 0; i <= ADMIN_CALLS_PER_WINDOW; i++) {
        errors.push(await guess());
      }

      assert.deepEqual(
        errors.slice(0, ADMIN_CALLS_PER_WINDOW),
        Array(ADMIN_CALLS_PER_WINDOW).fill('forbidden')
      );
      assert.equal(errors[ADMIN_CALLS_PER_WINDOW], 'too-many-requests');
    });
  });
}
