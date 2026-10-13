// Shared steps for the E2E specs. Each helper drives the real UI rather than
// calling Meteor methods directly, so the flows stay covered end to end.
import { devices, expect } from '@playwright/test';
import { FINAL_RIDDLE_BANK } from '../../imports/lib/finalRiddle';

// Unique per run so a test never picks up a player or game left behind by an
// earlier run against the same dev database.
export function uniqueName(prefix) {
  return `${prefix}${Date.now().toString(36).slice(-4)}`;
}

// Fills in the host's create-game form and waits for the lobby.
// Returns the new game's id and its 4-digit join code.
export async function createGame(page, { groupName, capacity = 2 } = {}) {
  await page.goto('/host');
  await page
    .getByPlaceholder('e.g. FIT3170 BEST TEAM')
    .fill(groupName ?? uniqueName('E2E TEAM '));

  // The capacity slider is the only range input with min=2.
  await page.locator('input[type="range"][min="2"]').fill(String(capacity));

  await page.getByRole('button', { name: 'INITIALIZE MISSION' }).click();
  await page.waitForURL(/\/game\/[^/]+\/lobby$/);

  const joinCode = page.getByTitle('Select and copy this 4-digit game code');
  await expect(joinCode).toHaveText(/^\d{4}$/);

  const gameId = page.url().match(/\/game\/([^/]+)\/lobby$/)[1];
  return { gameId, joinCode: (await joinCode.textContent()).trim() };
}

// Opens a phone-sized browser context, the way a player joins in real life.
// Callers should close the returned context when done.
export async function openPlayerPage(browser) {
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    locale: 'en-US',
    permissions: ['camera'],
  });
  const page = await context.newPage();
  return { context, page };
}

// Fills in the player join form. Doesn't assert the outcome, so it can be
// used for both successful and failing joins.
export async function submitJoinForm(page, { name, code }) {
  await page.getByLabel('Player Name').fill(name);
  await page.getByLabel('Game Code').fill(code);
  await page.getByRole('button', { name: 'Enter Game →' }).click();
}

// Joins a game from the player home screen and waits for the player lobby.
export async function joinGame(page, { name, code }) {
  await page.goto('/player');
  await submitJoinForm(page, { name, code });
  await expect(page.getByText('Players in lobby')).toBeVisible();
}

// Creates a game, fills it with players and starts it, leaving every player
// on the round 1 riddle and the host on the progress page. Callers should
// close each player's context when done.
export async function startGame(hostPage, browser, { capacity = 2 } = {}) {
  const { gameId, joinCode } = await createGame(hostPage, { capacity });

  const players = [];
  for (let i = 1; i <= capacity; i++) {
    const player = await openPlayerPage(browser);
    await joinGame(player.page, { name: uniqueName(`P${i}`), code: joinCode });
    players.push(player);
  }

  await expect(hostPage.getByText('RIDDLES READY')).toBeVisible();
  await hostPage.getByRole('button', { name: 'START MISSION' }).click();
  await hostPage.waitForURL(`**/game/${gameId}/progress`);

  for (const { page } of players) {
    await page.getByRole('button', { name: 'Skip Tutorial' }).click();
    await expect(page.getByText('ROUND_1')).toBeVisible();
  }

  return { gameId, players };
}

// Snaps a photo of the round's riddle. The browser's camera is Chrome's fake
// webcam and the server's photo check is faked to "correct" (see
// playwright.config.js), so this always banks the round's letter.
export async function takePhoto(page, roundNumber) {
  await expect(page.getByText(`ROUND_${roundNumber}`)).toBeVisible();

  // The shutter does nothing until the camera has delivered a frame.
  const video = page.locator('video');
  await expect
    .poll(() => video.evaluate((el) => el.videoWidth))
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Capture photo' }).click();
  await expectRoundSettled(page, roundNumber);
  // A rejected photo stays on an INCORRECT! screen until retried or skipped.
  await expect(page.getByText('INCORRECT!')).toBeHidden();
}

// Gives up on the round (two taps, like a real player) and forfeits its letter.
export async function skipRound(page, roundNumber) {
  await expect(page.getByText(`ROUND_${roundNumber}`)).toBeVisible();
  await page.getByRole('button', { name: 'Skip Round' }).click();
  await page.getByRole('button', { name: 'Tap Again To Forfeit' }).click();
  await expectRoundSettled(page, roundNumber);
}

// Waits for the round's riddle to leave the screen. The result screen
// (CORRECT! / SKIPPED!) isn't asserted on: for the last player to finish, the
// server advances the round at once and that screen only flashes by.
async function expectRoundSettled(page, roundNumber) {
  await expect(page.getByText(`ROUND_${roundNumber}`)).toBeHidden();
}

// Moves the host from the progress page to the final riddle via the sidebar.
export async function openFinalRiddle(hostPage) {
  await hostPage.getByRole('button', { name: 'FINAL RIDDLE' }).click();
  await expect(hostPage.getByText('MISSION CRITICAL')).toBeVisible();
}

// The answer never reaches the browser, so look the riddle on screen up in
// the offline bank the app draws from when Gemini is off (as it is in tests).
export async function finalAnswerFor(hostPage) {
  for (const { riddle, answer } of FINAL_RIDDLE_BANK) {
    if (await hostPage.getByText(riddle, { exact: false }).count()) {
      return answer;
    }
  }
  throw new Error('The final riddle on screen is not in FINAL_RIDDLE_BANK');
}

export async function submitFinalAnswer(hostPage, guess) {
  await hostPage.getByPlaceholder('ENTER TERMINAL OVERRIDE...').fill(guess);
  await hostPage.getByRole('button', { name: 'SUBMIT ANSWER' }).click();
}
