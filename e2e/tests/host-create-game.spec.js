import { test, expect } from '@playwright/test';
import { createGame, uniqueName } from '../helpers/game';

test.describe('Host: create game', () => {
  test('requires a group name', async ({ page }) => {
    await page.goto('/host');
    await page.getByRole('button', { name: 'INITIALIZE MISSION' }).click();

    await expect(page.getByText('GROUP NAME REQUIRED')).toBeVisible();
    await expect(page).toHaveURL(/\/host$/);
  });

  test('creates a game and shows its lobby', async ({ page }) => {
    const groupName = uniqueName('E2E TEAM ');
    const { joinCode } = await createGame(page, { groupName, capacity: 3 });

    // Group name, join code and QR link are all shown to the host.
    await expect(page.getByText(groupName.toUpperCase())).toBeVisible();
    await expect(page.getByText(`/join/${joinCode}`)).toBeVisible();

    // An empty lobby has one placeholder per seat and can't be started yet.
    await expect(page.getByText('AWAITING OPERATIVE...')).toHaveCount(3);
    await expect(
      page.getByRole('button', { name: 'AWAITING 3 MORE OPERATIVES...' })
    ).toBeDisabled();
  });
});
