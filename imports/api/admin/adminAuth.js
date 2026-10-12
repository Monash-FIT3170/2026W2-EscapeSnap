import { Meteor } from 'meteor/meteor';
import { createHash, timingSafeEqual } from 'crypto';

// Server-only. There are no accounts, so the operations page is gated by a
// shared key from ADMIN_KEY. With no key configured the page stays locked —
// a missing env var must never mean "open to everyone".

function digest(value) {
  return createHash('sha256').update(value).digest();
}

export function isAdminKey(key, expected = process.env.ADMIN_KEY) {
  if (!expected || typeof key !== 'string' || !key) return false;
  // Hashing first gives equal-length buffers, so the comparison is
  // constant-time whatever length was guessed.
  return timingSafeEqual(digest(key), digest(expected));
}

export function assertAdmin(key) {
  if (!isAdminKey(key)) {
    throw new Meteor.Error('forbidden', 'Invalid admin key');
  }
}
