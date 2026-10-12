import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from '../players/PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { Matches } from '../matches/MatchesCollection';
import { GameResults } from '../achievements/GameResultsCollection';
import '../games/gamesMethods';
import '../players/playersMethods';
import '../rounds/roundsMethods';
import './adminMethods';

if (Meteor.isServer) {
  const KEY = 'test-admin-key';

  async function expectError(promise, code) {
    try {
      await promise;
      assert.fail(`expected a ${code} error`);
    } catch (error) {
      assert.equal(error.error, code);
    }
  }

  async function gameWith(names, { start = false } = {}) {
    const gameId = await Meteor.callAsync('games.create', {
      groupName: 'Team Rocket',
      capacity: names.length,
      totalRounds: 2,
    });
    const { joinCode } = await Games.findOneAsync(gameId);
    const sessions = {};
    for (const name of names) {
      sessions[name] = await Meteor.callAsync('players.join', joinCode, name);
    }
    if (start) await Meteor.callAsync('games.start', gameId);
    return { gameId, sessions };
  }

  describe('admin methods', function () {
    let savedKey;

    before(function () {
      savedKey = process.env.ADMIN_KEY;
      process.env.ADMIN_KEY = KEY;
    });

    after(function () {
      if (savedKey === undefined) delete process.env.ADMIN_KEY;
      else process.env.ADMIN_KEY = savedKey;
    });

    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
      await Matches.removeAsync({});
      await GameResults.removeAsync({});
    });

    it('refuses callers without the admin key', async function () {
      const { gameId } = await gameWith(['Ada'], { start: true });
      await expectError(
        Meteor.callAsync('admin.endGame', 'wrong', gameId),
        'forbidden'
      );
      assert.equal((await Games.findOneAsync(gameId)).status, 'in_progress');
    });

    it('ends a running game as lost', async function () {
      const { gameId } = await gameWith(['Ada'], { start: true });

      await Meteor.callAsync('admin.endGame', KEY, gameId);

      const game = await Games.findOneAsync(gameId);
      assert.equal(game.status, 'lost');
      assert.instanceOf(game.endedAt, Date);
    });

    it('closes a lobby and sends its players away', async function () {
      const { gameId, sessions } = await gameWith(['Ada', 'Bo']);

      await Meteor.callAsync('admin.endGame', KEY, gameId);

      assert.equal((await Games.findOneAsync(gameId)).status, 'lost');
      await expectError(
        Meteor.callAsync(
          'players.rejoin',
          sessions.Ada.playerId,
          sessions.Ada.sessionToken
        ),
        'not-found'
      );
    });

    it('kicks a player for good mid-game', async function () {
      const { gameId, sessions } = await gameWith(['Ada', 'Bo'], {
        start: true,
      });

      await Meteor.callAsync('admin.kickPlayer', KEY, sessions.Ada.playerId);

      const ada = await Players.findOneAsync(sessions.Ada.playerId);
      assert.instanceOf(ada.leftAt, Date);
      assert.isUndefined(ada.sessionToken);
      // The old token no longer works, so reconnecting can't undo the kick.
      await expectError(
        Meteor.callAsync(
          'players.rejoin',
          sessions.Ada.playerId,
          sessions.Ada.sessionToken
        ),
        'not-found'
      );
      // Bo carries on, covering Ada's riddles.
      assert.equal((await Games.findOneAsync(gameId)).status, 'in_progress');
    });

    it('frees a lobby slot when kicking before the start', async function () {
      const { gameId, sessions } = await gameWith(['Ada', 'Bo']);

      await Meteor.callAsync('admin.kickPlayer', KEY, sessions.Ada.playerId);

      assert.equal(await Players.find({ gameId }).countAsync(), 1);
    });

    it('ends the game when the last player is kicked', async function () {
      const { gameId, sessions } = await gameWith(['Ada'], { start: true });

      await Meteor.callAsync('admin.kickPlayer', KEY, sessions.Ada.playerId);

      assert.equal((await Games.findOneAsync(gameId)).status, 'lost');
    });
  });
}
