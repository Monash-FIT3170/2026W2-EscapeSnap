import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';

if (Meteor.isServer) {
  const { isAdminKey } = require('./adminAuth');

  describe('admin key', function () {
    it('accepts the configured key', function () {
      assert.isTrue(isAdminKey('s3cret-key', 's3cret-key'));
    });

    it('rejects a wrong key, including a prefix of the right one', function () {
      assert.isFalse(isAdminKey('nope', 's3cret-key'));
      assert.isFalse(isAdminKey('s3cret', 's3cret-key'));
    });

    it('stays locked when no key is configured', function () {
      assert.isFalse(isAdminKey('', ''));
      assert.isFalse(isAdminKey('anything', undefined));
    });

    it('rejects non-string input', function () {
      assert.isFalse(isAdminKey(undefined, 's3cret-key'));
      assert.isFalse(isAdminKey({ $ne: null }, 's3cret-key'));
    });
  });
}
