import { test, expect } from '@playwright/test';
import {
  createGame,
  joinGame,
  openPlayerPage,
  uniqueName,
} from '../helpers/game';

test.describe('Starting a game', () => {
  test('host starts a full lobby and every player reaches round 1', async ({
    page: hostPage,
    browser,
  }) => {
    const { gameId, joinCode } = await createGame(hostPage, { capacity: 2 });
    const players = await Promise.all([
      openPlayerPage(browser),
      openPlayerPage(browser),
    ]);

    await joinGame(players[0].page, { name: uniqueName('P1'), code: joinCode });
    await joinGame(players[1].page, { name: uniqueName('P2'), code: joinCode });

    // Riddles come from the offline bank (no GEMINI_API_KEY), so this is quick.
    await expect(hostPage.getByText('RIDDLES READY')).toBeVisible();
    await hostPage.getByRole('button', { name: 'START MISSION' }).click();

    await hostPage.waitForURL(`**/game/${gameId}/progress`);
    await expect(hostPage.getByText('TEAM PROGRESS')).toBeVisible();

    // Players are moved on from the lobby automatically when the game starts.
    for (const { page } of players) {
      await expect(page.getByText('HOW TO PLAY')).toBeVisible();
      await page.getByRole('button', { name: 'Skip Tutorial' }).click();

      await expect(page.getByText('ROUND_1')).toBeVisible();
      await expect(page.getByText('Loading riddle...')).toBeHidden();
    }

    await Promise.all(players.map(({ context }) => context.close()));
  });

  test('a started game no longer accepts new players', async ({
    page: hostPage,
    browser,
  }) => {
    const { joinCode } = await createGame(hostPage, { capacity: 2 });
    const players = await Promise.all([
      openPlayerPage(browser),
      openPlayerPage(browser),
    ]);

    await joinGame(players[0].page, { name: uniqueName('P1'), code: joinCode });
    await joinGame(players[1].page, { name: uniqueName('P2'), code: joinCode });
    await hostPage.getByRole('button', { name: 'START MISSION' }).click();
    await hostPage.waitForURL(/\/progress$/);

    const late = await openPlayerPage(browser);
    await late.page.goto(`/join/${joinCode}`);
    await late.page.getByLabel('Player Name').fill(uniqueName('Late'));
    await late.page.getByRole('button', { name: 'Enter Game →' }).click();

    await expect(late.page.getByRole('alert')).toContainText(
      'Game not found, or it has already started'
    );

    await Promise.all([...players, late].map(({ context }) => context.close()));
  });
});
