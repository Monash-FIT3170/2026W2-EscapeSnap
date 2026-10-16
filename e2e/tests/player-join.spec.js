import { test, expect } from '@playwright/test';
import {
  closePlayers,
  createGame,
  joinGame,
  openPlayerPage,
  submitJoinForm,
  uniqueName,
} from '../helpers/game';

test.describe('Player: join game', () => {
  test('validates the join form before contacting the server', async ({
    page,
  }) => {
    await page.goto('/player');
    const alert = page.getByRole('alert');

    await page.getByRole('button', { name: 'Enter Game →' }).click();
    await expect(alert).toContainText('Player name required');

    await page.getByLabel('Player Name').fill('Alex');
    await page.getByRole('button', { name: 'Enter Game →' }).click();
    await expect(alert).toContainText('Game code required');

    // A short code is caught by the input's own pattern="[0-9]{4}", so the
    // browser blocks the submit before the app's validation runs.
    await page.getByLabel('Game Code').fill('12');
    await page.getByRole('button', { name: 'Enter Game →' }).click();
    await expect(page.locator('#game-code:invalid')).toHaveCount(1);
    await expect(page.getByText('Players in lobby')).toBeHidden();
  });

  test('shows an error for a game code that does not exist', async ({
    page,
  }) => {
    await page.goto('/player');
    // Join codes are 1000-9999, so 0000 can never match a real game.
    await submitJoinForm(page, { name: 'Alex', code: '0000' });

    await expect(page.getByRole('alert')).toContainText(
      'Game not found, or it has already started'
    );
  });

  test('a joining player appears live in the host lobby', async ({
    page: hostPage,
    browser,
  }) => {
    const { joinCode } = await createGame(hostPage, { capacity: 2 });
    const { context, page: playerPage } = await openPlayerPage(browser);
    const name = uniqueName('Alex');

    await joinGame(playerPage, { name, code: joinCode });

    await expect(playerPage.getByText(name.toUpperCase())).toBeVisible();
    // No reload on the host: this checks Meteor's real-time publication.
    await expect(hostPage.getByText(name.toUpperCase())).toBeVisible();
    await expect(hostPage.getByText('AWAITING OPERATIVE...')).toHaveCount(1);

    await context.close();
  });

  test('the QR join link pre-fills the game code', async ({
    page: hostPage,
    browser,
  }) => {
    const { joinCode } = await createGame(hostPage, { capacity: 2 });
    const { context, page: playerPage } = await openPlayerPage(browser);

    await playerPage.goto(`/join/${joinCode}`);

    await expect(playerPage.getByLabel('Game Code')).toHaveValue(joinCode);
    await expect(playerPage.getByText('✓ Scanned via QR')).toBeVisible();

    await context.close();
  });

  test('rejects a player once the lobby is full', async ({
    page: hostPage,
    browser,
  }) => {
    const { joinCode } = await createGame(hostPage, { capacity: 2 });
    const players = await Promise.all([
      openPlayerPage(browser),
      openPlayerPage(browser),
      openPlayerPage(browser),
    ]);

    await joinGame(players[0].page, { name: uniqueName('P1'), code: joinCode });
    await joinGame(players[1].page, { name: uniqueName('P2'), code: joinCode });

    await players[2].page.goto('/player');
    await submitJoinForm(players[2].page, {
      name: uniqueName('P3'),
      code: joinCode,
    });
    await expect(players[2].page.getByRole('alert')).toContainText(
      'This game is full'
    );

    await closePlayers(players);
  });
});
