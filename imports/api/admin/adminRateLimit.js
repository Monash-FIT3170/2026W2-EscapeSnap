import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

// Server-only. Every admin method and subscription takes the admin key, so
// without a limit the key could be guessed by calling them as fast as the
// connection allows. Counted per client address rather than per connection,
// so opening more connections doesn't buy more guesses. The page itself makes
// a handful of calls a minute, well inside this.
export const ADMIN_CALLS_PER_WINDOW = 30;
export const ADMIN_WINDOW_MS = 60 * 1000;

DDPRateLimiter.addRule(
  {
    name: (name) => typeof name === 'string' && name.startsWith('admin.'),
    clientAddress: () => true,
  },
  ADMIN_CALLS_PER_WINDOW,
  ADMIN_WINDOW_MS
);
