import { test, expect } from '@playwright/test';
import { createGame, openPlayerPage, uniqueName } from '../helpers/game';

// Players join from the keypad in the hero; there's no separate "join" link.
// Digits go in through the on-screen keys, the way a player taps them.
async function joinFromKeypad(page, { name, code }) {
  await page.goto('/');
  await page.getByLabel('Player Name').fill(name);
  const keys = page.getByRole('group', { name: 'Keypad' });
  for (const digit of code) {
    await keys.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Enter game' }).click();
}

test.describe('Landing page', () => {
  test('shows the title, the host link and the join keypad', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'EscapeSnap', level: 1 })
    ).toBeVisible();
    const hero = page.locator('#top');
    await expect(hero.getByRole('link', { name: 'Host a game' })).toBeVisible();
    await expect(hero.getByLabel('Player Name')).toBeVisible();
    await expect(
      hero.getByRole('button', { name: 'Enter game' })
    ).toBeVisible();
  });

  test('"Host a game" opens the create-game form', async ({ page }) => {
    await page.goto('/');
    // The page repeats this link further down; use the one in the hero.
    await page
      .locator('#top')
      .getByRole('link', { name: 'Host a game' })
      .click();

    await expect(page).toHaveURL(/\/host$/);
    await expect(
      page.getByRole('button', { name: 'INITIALIZE MISSION' })
    ).toBeVisible();
  });

  test('the keypad asks for a name before joining', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Enter game' }).click();

    await expect(page.locator('#lp-kp-status')).toHaveText(
      'Player name required'
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test('the keypad shows an error for a game code that does not exist', async ({
    page,
  }) => {
    // Join codes are 1000-9999, so 0000 can never match a real game.
    await joinFromKeypad(page, { name: 'Alex', code: '0000' });

    await expect(page.locator('#lp-kp-status')).toHaveText(
      'Game not found, or it has already started'
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test('joining from the keypad goes straight to the lobby', async ({
    page: hostPage,
    browser,
  }) => {
    const { joinCode } = await createGame(hostPage, { capacity: 2 });
    const { context, page: playerPage } = await openPlayerPage(browser);
    const name = uniqueName('Alex');

    await joinFromKeypad(playerPage, { name, code: joinCode });

    await expect(playerPage).toHaveURL(/\/player$/);
    await expect(playerPage.getByText('Players in lobby')).toBeVisible();
    await expect(playerPage.getByText(name.toUpperCase())).toBeVisible();
    await expect(hostPage.getByText(name.toUpperCase())).toBeVisible();

    await context.close();
  });
});
