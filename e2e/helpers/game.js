// Shared steps for the E2E specs. Each helper drives the real UI rather than
// calling Meteor methods directly, so the flows stay covered end to end.
import { devices, expect } from '@playwright/test';

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
