// Shared steps for the E2E specs. Each helper drives the real UI rather than
// calling Meteor methods directly, so the flows stay covered end to end.
import { devices, expect, test } from '@playwright/test';
import { FINAL_RIDDLE_BANK } from '../../imports/lib/finalRiddle';
import { DEMO, PLAYER_VIEWPORT, demoPause, placeWindow } from './demo';

// Unique per run so a test never picks up a player or game left behind by an
// earlier run against the same dev database.
export function uniqueName(prefix) {
  return `${prefix}${Date.now().toString(36).slice(-4)}`;
}

// Fills in the host's create-game form and waits for the lobby.
// Returns the new game's id, its 4-digit join code and its group name.
// `mode` is how players answer: 'camera' (photos) or 'drawing' (sketches).
export async function createGame(
  page,
  { groupName = uniqueName('E2E TEAM '), capacity = 2, mode = 'camera' } = {}
) {
  await placeWindow(page, 0);
  await page.goto('/host');
  await page.getByPlaceholder('e.g. FIT3170 BEST TEAM').fill(groupName);

  // The capacity slider is the only range input with min=2.
  await page.locator('input[type="range"][min="2"]').fill(String(capacity));

  if (mode === 'drawing') {
    await page.getByRole('button', { name: /^DRAWING/ }).click();
  }

  await page.getByRole('button', { name: 'INITIALIZE MISSION' }).click();
  await page.waitForURL(/\/game\/[^/]+\/lobby$/);

  const joinCode = page.getByTitle('Select and copy this 4-digit game code');
  await expect(joinCode).toHaveText(/^\d{4}$/);

  const gameId = page.url().match(/\/game\/([^/]+)\/lobby$/)[1];
  return {
    gameId,
    groupName,
    joinCode: (await joinCode.textContent()).trim(),
  };
}

// Opens a phone-sized browser context, the way a player joins in real life.
// Callers should close the returned context when done.
export async function openPlayerPage(browser) {
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    locale: 'en-US',
    permissions: ['camera'],
    ...(DEMO && {
      viewport: PLAYER_VIEWPORT,
      recordVideo: {
        dir: test.info().outputPath('player-videos'),
        size: PLAYER_VIEWPORT,
      },
    }),
  });
  const page = await context.newPage();
  // The host's context is the first one, so this is the player's join order.
  const slot = browser.contexts().length - 1;
  await placeWindow(page, slot);
  return { context, page, slot };
}

// Closes every player's browser. In demo mode each player's screen recording
// is attached to the report (it's only written once the context closes).
export async function closePlayers(players) {
  await Promise.all(players.map(({ context }) => context.close()));
  if (!DEMO) return;
  for (const { page, slot } of players) {
    const video = page.video();
    if (video) {
      await test.info().attach(`player ${slot} screen`, {
        path: await video.path(),
        contentType: 'video/webm',
      });
    }
  }
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
// on the round 1 riddle and the host on the progress page. The first player
// reads the whole tutorial when `readTutorial` is set; everyone else skips it.
// Callers should close each player's context when done.
export async function startGame(
  hostPage,
  browser,
  { capacity = 2, mode = 'camera', readTutorial = false } = {}
) {
  const { gameId, groupName, joinCode } = await createGame(hostPage, {
    capacity,
    mode,
  });

  const players = [];
  for (let i = 1; i <= capacity; i++) {
    const player = await openPlayerPage(browser);
    await joinGame(player.page, { name: uniqueName(`P${i}`), code: joinCode });
    players.push(player);
  }

  await expect(hostPage.getByText('RIDDLES READY')).toBeVisible();
  await hostPage.getByRole('button', { name: 'START MISSION' }).click();
  await hostPage.waitForURL(`**/game/${gameId}/progress`);

  for (const [i, { page }] of players.entries()) {
    if (readTutorial && i === 0) {
      await readWholeTutorial(page);
    } else {
      await page.getByRole('button', { name: 'Skip Tutorial' }).click();
    }
    await expect(page.getByText('ROUND_1')).toBeVisible();
  }

  return { gameId, groupName, players };
}

const TUTORIAL_STEPS = [
  'READ THE RIDDLE',
  'FIND THE OBJECT',
  'TAKE A PHOTO',
  'COLLECT LETTERS',
  'ESCAPE',
];

// Steps through every tutorial page (checking Back on the way) and starts.
async function readWholeTutorial(page) {
  for (const [i, title] of TUTORIAL_STEPS.entries()) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    if (i === 1) {
      await page.getByRole('button', { name: 'Back' }).click();
      await expect(
        page.getByText(TUTORIAL_STEPS[0], { exact: true })
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next' }).click();
    }
    const last = i === TUTORIAL_STEPS.length - 1;
    await page
      .getByRole('button', { name: last ? 'Start Mission' : 'Next' })
      .click();
  }
}

// Snaps a photo of the round's riddle. The browser's camera is Chrome's fake
// webcam and the server's photo check is faked to "correct" (see
// playwright.config.js), so this always banks the round's letter.
export async function takePhoto(page, roundNumber) {
  await expect(page.getByText(`ROUND_${roundNumber}`)).toBeVisible();

  await waitForCamera(page);

  await page.getByRole('button', { name: 'Capture photo' }).click();
  await expectRoundSettled(page, roundNumber);
  // A rejected photo stays on an INCORRECT! screen until retried or skipped.
  await expect(page.getByText('INCORRECT!')).toBeHidden();
}

// The shutter does nothing until the camera has delivered a frame. Under heavy
// load, Chrome's fake webcam occasionally never answers a camera request (no
// stream, no error), so if nothing arrives, flip to the Letters tab and back,
// which restarts the camera the same way a player would.
async function waitForCamera(page, attempts = 3) {
  const video = page.locator('video');
  for (let attempt = 1; ; attempt++) {
    try {
      await expect
        .poll(() => video.evaluate((el) => el.videoWidth), { timeout: 10_000 })
        .toBeGreaterThan(0);
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      await page.getByRole('button', { name: 'Letters' }).click();
      await page.getByRole('button', { name: 'Scanner' }).click();
    }
  }
}

// Sketches on the drawing canvas and submits it (drawing-mode games). Like
// photos, the server's check is faked to "correct".
export async function drawAnswer(page, roundNumber) {
  await expect(page.getByText(`ROUND_${roundNumber}`)).toBeVisible();

  const canvas = page.getByLabel('Drawing canvas');
  const box = await canvas.boundingBox();
  const at = (fx, fy) => [box.x + box.width * fx, box.y + box.height * fy];
  await page.mouse.move(...at(0.3, 0.3));
  await page.mouse.down();
  await page.mouse.move(...at(0.7, 0.4), { steps: 5 });
  await page.mouse.move(...at(0.5, 0.7), { steps: 5 });
  await page.mouse.up();

  await page.getByRole('button', { name: 'Submit Sketch' }).click();
  await expectRoundSettled(page, roundNumber);
  await expect(page.getByText('INCORRECT!')).toBeHidden();
}

// Buys the round's hint (two taps: it costs the team a minute).
export async function revealHint(page) {
  await page.getByRole('button', { name: /Reveal Hint/ }).click();
  await page.getByRole('button', { name: /Tap again/ }).click();
  await expect(page.getByRole('button', { name: /Reveal Hint/ })).toBeHidden();
  await expect(page.getByText(/^💡 \S/)).toBeVisible();
}

// Opens the player's Letters tab, checks the tally, and returns to the scanner.
export async function checkLetters(page, { solved, total }) {
  await page.getByRole('button', { name: 'Letters' }).click();
  await expect(
    page.getByText(`${solved} / ${total} Rounds Complete`)
  ).toBeVisible();
  await page.getByRole('button', { name: 'Scanner' }).click();
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
  await demoPause(hostPage);
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
  await demoPause(hostPage, 1500);
}
