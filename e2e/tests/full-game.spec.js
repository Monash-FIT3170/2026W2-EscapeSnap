// Plays complete games from lobby to the end screen, visiting every host and
// player page on the way. Photos are taken with Chrome's fake webcam and the
// server's photo/sketch check is faked to "correct" (see playwright.config.js),
// so no real camera or Gemini call is needed.
import { test, expect } from '@playwright/test';
import { demoPause } from '../helpers/demo';
import {
  closePlayers,
  checkLetters,
  drawAnswer,
  finalAnswerFor,
  openFinalRiddle,
  revealHint,
  skipRound,
  startGame,
  submitFinalAnswer,
  takePhoto,
} from '../helpers/game';

// games.create's default; the create-game form has no control for it.
const TOTAL_ROUNDS = 3;

// After every round is solved: the host cracks the final riddle and every
// screen shows the win.
async function solveFinalRiddle(hostPage, players) {
  for (const { page } of players) {
    await expect(page.getByText('All rounds completed')).toBeVisible();
  }

  await openFinalRiddle(hostPage);
  // Every round banked a letter, so none of them is a forfeited '?'.
  await expect(hostPage.getByText('NO LETTERS REVEALED YET')).toBeHidden();
  await expect(hostPage.getByText('?', { exact: true })).toHaveCount(0);

  await submitFinalAnswer(hostPage, await finalAnswerFor(hostPage));

  await expect(hostPage.getByText('YOU ESCAPED')).toBeVisible();
  for (const { page } of players) {
    await expect(page.getByText('Your team cracked the code.')).toBeVisible();
  }
  await demoPause(hostPage, 5000);
}

test.describe('Full game', () => {
  // Three rounds per player, each with a short on-screen result pause.
  test.slow();

  test('team photographs every object and escapes', async ({
    page: hostPage,
    browser,
  }) => {
    const { groupName, players } = await startGame(hostPage, browser, {
      capacity: 2,
      readTutorial: true,
    });
    const [firstPlayer] = players;

    // The debrief stays sealed while the game is running.
    await hostPage.getByRole('button', { name: 'DEBRIEF' }).click();
    await expect(hostPage.getByText('MISSION STILL ACTIVE')).toBeVisible();
    await hostPage.getByRole('button', { name: 'BACK TO OPERATIVES' }).click();
    await expect(hostPage.getByText('TEAM PROGRESS')).toBeVisible();

    // A hint costs the whole team a minute, which shows on the host's clock.
    await revealHint(firstPlayer.page);
    await expect(hostPage.getByText(/HINT PENALTY -/)).toBeVisible();

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      if (round === 2) {
        await checkLetters(firstPlayer.page, {
          solved: 1,
          total: TOTAL_ROUNDS,
        });
      }
      for (const { page } of players) {
        await takePhoto(page, round);
      }
    }

    await solveFinalRiddle(hostPage, players);

    // The debrief opens once the game is over, with every photo in it.
    await hostPage.getByRole('button', { name: 'VIEW DEBRIEF' }).click();
    await expect(hostPage.getByText('MISSION DEBRIEF')).toBeVisible();
    await expect(hostPage.getByText('MISSION SUCCESS')).toBeVisible();
    await expect(hostPage.locator('img[src^="data:image/"]')).toHaveCount(
      TOTAL_ROUNDS * players.length
    );
    await demoPause(hostPage);

    // The team now ranks on the leaderboard.
    await hostPage.goto('/leaderboard');
    await expect(hostPage.getByText('FASTEST ESCAPES')).toBeVisible();
    await expect(hostPage.getByText(groupName)).toBeVisible();
    await demoPause(hostPage);

    await closePlayers(players);
  });

  test('team sketches every answer and escapes (drawing mode)', async ({
    page: hostPage,
    browser,
  }) => {
    const { players } = await startGame(hostPage, browser, {
      capacity: 2,
      mode: 'drawing',
    });

    for (let round = 1; round <= TOTAL_ROUNDS; round++) {
      for (const { page } of players) {
        await drawAnswer(page, round);
      }
    }

    await solveFinalRiddle(hostPage, players);

    await closePlayers(players);
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

    await closePlayers(players);
  });
});
