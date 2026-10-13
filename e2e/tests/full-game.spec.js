// Plays complete games from lobby to the end screen. Photos are taken with
// Chrome's fake webcam and the server's photo check is faked to "correct"
// (see playwright.config.js), so no real camera or Gemini call is needed.
import { test, expect } from '@playwright/test';
import { demoPause } from '../helpers/demo';
import {
  finalAnswerFor,
  openFinalRiddle,
  skipRound,
  startGame,
  submitFinalAnswer,
  takePhoto,
} from '../helpers/game';

// games.create's default; the create-game form has no control for it.
const TOTAL_ROUNDS = 3;

test.describe('Full game', () => {
  // Three rounds per player, each with a short on-screen result pause.
  test.slow();

  test('team photographs every object and escapes', async ({
    page: hostPage,
    browser,
  }) => {
    const { players } = await startGame(hostPage, browser, { capacity: 2 });

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      for (const { page } of players) {
        await takePhoto(page, round);
      }
    }

    for (const { page } of players) {
      await expect(page.getByText('All rounds completed')).toBeVisible();
    }

    await openFinalRiddle(hostPage);
    // Every photo banked a letter, so none of them is a forfeited '?'.
    await expect(hostPage.getByText('NO LETTERS REVEALED YET')).toBeHidden();
    await expect(hostPage.getByText('?', { exact: true })).toHaveCount(0);

    await submitFinalAnswer(hostPage, await finalAnswerFor(hostPage));

    await expect(hostPage.getByText('YOU ESCAPED')).toBeVisible();
    for (const { page } of players) {
      await expect(page.getByText('Your team cracked the code.')).toBeVisible();
    }
    await demoPause(hostPage, 5000);

    await Promise.all(players.map(({ context }) => context.close()));
  });

  test('team skips every round and fails the final riddle', async ({
    page: hostPage,
    browser,
  }) => {
    const { players } = await startGame(hostPage, browser, { capacity: 2 });

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      for (const { page } of players) {
        await skipRound(page, round);
      }
    }

    await openFinalRiddle(hostPage);
    // Each skipped round forfeits its letter: 3 rounds x 2 players.
    await expect(hostPage.getByText('?', { exact: true })).toHaveCount(6);

    // Three wrong guesses end the game.
    await submitFinalAnswer(hostPage, 'WRONG');
    await expect(hostPage.getByText('INCORRECT - TRY AGAIN')).toBeVisible();
    await expect(hostPage.getByText('2 ATTEMPTS LEFT')).toBeVisible();

    await submitFinalAnswer(hostPage, 'STILL WRONG');
    await expect(hostPage.getByText('1 ATTEMPT LEFT')).toBeVisible();

    await submitFinalAnswer(hostPage, 'NOPE');

    await expect(hostPage.getByText('NO ESCAPE.')).toBeVisible();
    for (const { page } of players) {
      await expect(
        page.getByText('Your team ran out of attempts.')
      ).toBeVisible();
    }
    await demoPause(hostPage, 5000);

    await Promise.all(players.map(({ context }) => context.close()));
  });
});
