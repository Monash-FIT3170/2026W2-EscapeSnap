import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows both entry points', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'ESCAPESNAP' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'JOIN AS PLAYER' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'HOST A GAME' })).toBeVisible();
  });

  test('"Host a game" opens the create-game form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'HOST A GAME' }).click();

    await expect(page).toHaveURL(/\/host$/);
    await expect(
      page.getByRole('button', { name: 'INITIALIZE MISSION' })
    ).toBeVisible();
  });

  test('"Join as player" opens the player join form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'JOIN AS PLAYER' }).click();

    await expect(page).toHaveURL(/\/player$/);
    await expect(page.getByLabel('Player Name')).toBeVisible();
    await expect(page.getByLabel('Game Code')).toBeVisible();
  });
});
