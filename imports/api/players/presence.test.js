import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Games } from '../games/GamesCollection';
import { Players } from './PlayersCollection';
import { Rounds } from '../rounds/RoundsCollection';
import { Matches } from '../matches/MatchesCollection';
import { GameResults } from '../achievements/GameResultsCollection';
import {
  RECONNECT_WINDOW_MS,
  attachPlayer,
  detachPlayer,
  sweepDisconnectedPlayers,
} from './presence';
import './playersMethods';
import '../games/gamesMethods';
import '../rounds/roundsMethods';
import '../matches/matchesMethods';

if (Meteor.isServer) {
  async function expectError(promise, code) {
    try {
      await promise;
      assert.fail(`expected a ${code} error`);
    } catch (error) {
      assert.equal(error.error, code);
    }
  }

  async function joinAll(gameId, names) {
    const { joinCode } = await Games.findOneAsync(gameId);
    const sessions = {};
    for (const name of names) {
      sessions[name] = await Meteor.callAsync('players.join', joinCode, name);
    }
    return sessions;
  }

  async function startedSoloGame(names, totalRounds = 2) {
    const gameId = await Meteor.callAsync('games.create', {
      groupName: 'Team Rocket',
      capacity: names.length,
      totalRounds,
    });
    const sessions = await joinAll(gameId, names);
    await Meteor.callAsync('games.start', gameId);
    return { gameId, sessions };
  }

  function leave(session) {
    return Meteor.callAsync(
      'players.leave',
      session.playerId,
      session.sessionToken
    );
  }

  describe('player presence', function () {
    beforeEach(async function () {
      await Games.removeAsync({});
      await Players.removeAsync({});
      await Rounds.removeAsync({});
      await Matches.removeAsync({});
      await GameResults.removeAsync({});
    });

    describe('players.rejoin', function () {
      it('returns the game for the right token', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          capacity: 2,
        });
        const { Ada } = await joinAll(gameId, ['Ada']);

        const rejoined = await Meteor.callAsync(
          'players.rejoin',
          Ada.playerId,
          Ada.sessionToken
        );

        assert.equal(rejoined.gameId, gameId);
        assert.equal(rejoined.playerName, 'Ada');
        assert.equal(rejoined.status, 'lobby');
      });

      it('refuses a player id without its token', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          capacity: 2,
        });
        const { Ada } = await joinAll(gameId, ['Ada']);

        await expectError(
          Meteor.callAsync('players.rejoin', Ada.playerId, 'not-the-token'),
          'not-found'
        );
      });

      it('refuses a game that is over', async function () {
        const { gameId, sessions } = await startedSoloGame(['Ada']);
        await Games.updateAsync(gameId, { $set: { status: 'lost' } });

        await expectError(
          Meteor.callAsync(
            'players.rejoin',
            sessions.Ada.playerId,
            sessions.Ada.sessionToken
          ),
          'invalid-state'
        );
      });
    });

    describe('leaving the lobby', function () {
      it('frees the slot straight away', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          capacity: 2,
        });
        const { Ada } = await joinAll(gameId, ['Ada', 'Grace']);

        await leave(Ada);

        assert.equal(await Players.find({ gameId }).countAsync(), 1);
        assert.isUndefined(await Players.findOneAsync(Ada.playerId));
      });
    });

    describe('leaving mid-game', function () {
      it("hands the leaver's riddles to a teammate", async function () {
        const { gameId, sessions } = await startedSoloGame(['Ada', 'Grace']);

        await leave(sessions.Ada);

        const adaRounds = await Rounds.find({
          playerId: sessions.Ada.playerId,
        }).fetchAsync();
        assert.lengthOf(adaRounds, 2);
        for (const round of adaRounds) {
          assert.equal(round.coveredBy, sessions.Grace.playerId);
        }
        assert.equal((await Games.findOneAsync(gameId)).status, 'in_progress');
      });

      it('lets the teammate finish the round for both of them', async function () {
        const { gameId, sessions } = await startedSoloGame(['Ada', 'Grace']);
        await leave(sessions.Ada);

        const roundOne = await Rounds.find({ gameId, roundNumber: 1 }).fetchAsync();
        for (const round of roundOne) {
          await Meteor.callAsync('rounds.submit', round._id, true);
        }

        assert.equal((await Games.findOneAsync(gameId)).currentRound, 2);
        // The covered letter still lands on the player it belongs to.
        const ada = await Players.findOneAsync(sessions.Ada.playerId);
        assert.lengthOf(ada.revealedLetters, 1);
      });

      it('spreads the riddles across everyone still playing', async function () {
        const { sessions } = await startedSoloGame(['Ada', 'Grace', 'Alan'], 2);
        await leave(sessions.Ada);

        const covers = (
          await Rounds.find({ playerId: sessions.Ada.playerId }).fetchAsync()
        ).map((round) => round.coveredBy);
        assert.sameMembers(covers, [
          sessions.Grace.playerId,
          sessions.Alan.playerId,
        ]);
      });

      it('gives future riddles back when the player returns', async function () {
        const { gameId, sessions } = await startedSoloGame(['Ada', 'Grace']);
        await leave(sessions.Ada);

        const ada = await Players.findOneAsync(sessions.Ada.playerId);
        await attachPlayer(ada, 'new-connection');

        const current = await Rounds.findOneAsync({
          gameId,
          playerId: ada._id,
          roundNumber: 1,
        });
        const future = await Rounds.findOneAsync({
          gameId,
          playerId: ada._id,
          roundNumber: 2,
        });
        // Grace may already be scanning round 1, so it stays with her.
        assert.equal(current.coveredBy, sessions.Grace.playerId);
        assert.isUndefined(future.coveredBy);
      });

      it('loses the game once the whole team has left', async function () {
        const { gameId, sessions } = await startedSoloGame(['Ada', 'Grace']);

        await leave(sessions.Ada);
        await leave(sessions.Grace);

        assert.equal((await Games.findOneAsync(gameId)).status, 'lost');
      });
    });

    describe('in a match', function () {
      async function startedMatch() {
        const matchId = await Meteor.callAsync('matches.createLocal', {
          teamNames: ['Red', 'Blue'],
          capacity: 1,
          totalRounds: 2,
        });
        const [red, blue] = (await Matches.findOneAsync(matchId)).gameIds;
        const redSessions = await joinAll(red, ['r0']);
        await joinAll(blue, ['b0']);
        await Meteor.callAsync('matches.start', matchId);
        return { matchId, red, blue, redSessions };
      }

      it('hands the match to the rival when a team walks out', async function () {
        const { matchId, red, blue, redSessions } = await startedMatch();

        await leave(redSessions.r0);

        assert.equal((await Games.findOneAsync(red)).status, 'lost');
        assert.equal((await Games.findOneAsync(blue)).status, 'won');
        const match = await Matches.findOneAsync(matchId);
        assert.equal(match.status, 'finished');
        assert.equal(match.winnerGameId, blue);
      });
    });

    describe('dropped connections', function () {
      it('waits out the reconnect window before anyone takes over', async function () {
        const { sessions } = await startedSoloGame(['Ada', 'Grace']);
        const ada = await Players.findOneAsync(sessions.Ada.playerId);
        await attachPlayer(ada, 'conn-1');
        await detachPlayer(ada._id, 'conn-1');

        await sweepDisconnectedPlayers(new Date());
        assert.isUndefined((await Players.findOneAsync(ada._id)).leftAt);

        await sweepDisconnectedPlayers(
          new Date(Date.now() + RECONNECT_WINDOW_MS + 1000)
        );
        assert.instanceOf((await Players.findOneAsync(ada._id)).leftAt, Date);
        const round = await Rounds.findOneAsync({ playerId: ada._id, roundNumber: 1 });
        assert.equal(round.coveredBy, sessions.Grace.playerId);
      });

      it('frees a lobby slot once the reconnect window passes', async function () {
        const gameId = await Meteor.callAsync('games.create', {
          groupName: 'Team Rocket',
          capacity: 2,
        });
        const { Ada } = await joinAll(gameId, ['Ada']);
        const ada = await Players.findOneAsync(Ada.playerId);
        await attachPlayer(ada, 'conn-1');
        await detachPlayer(ada._id, 'conn-1');

        // A locked phone in the lobby keeps its slot for the whole window.
        await sweepDisconnectedPlayers(
          new Date(Date.now() + RECONNECT_WINDOW_MS - 5000)
        );
        assert.isOk(await Players.findOneAsync(ada._id));

        await sweepDisconnectedPlayers(
          new Date(Date.now() + RECONNECT_WINDOW_MS + 1000)
        );
        assert.isUndefined(await Players.findOneAsync(ada._id));
      });

      it('ignores an old connection closing after the player moved on', async function () {
        const { sessions } = await startedSoloGame(['Ada']);
        const ada = await Players.findOneAsync(sessions.Ada.playerId);
        await attachPlayer(ada, 'old-tab');
        await attachPlayer(ada, 'new-tab');

        await detachPlayer(ada._id, 'old-tab');

        assert.isUndefined((await Players.findOneAsync(ada._id)).disconnectedAt);
      });
    });
  });
}
