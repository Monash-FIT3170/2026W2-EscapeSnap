// Presentation mode (`meteor npm run test:e2e:demo`): real browser windows,
// slowed down and tiled so an audience can follow the host and every player
// at once. Every helper here is a no-op in normal runs.

export const DEMO = Boolean(process.env.E2E_DEMO);

// Pause after every click/type, in ms. Override with E2E_DEMO=<ms>.
export const DEMO_SLOW_MO =
  Number(process.env.E2E_DEMO) > 1 ? Number(process.env.E2E_DEMO) : 600;

// Tiled for a ~1440px-wide laptop screen: host on the left, players in a row
// on the right. Viewports are what the page sees; windows add title-bar room.
const TITLE_BAR = 90;
export const HOST_VIEWPORT = { width: 820, height: 760 };
export const PLAYER_VIEWPORT = { width: 300, height: 640 };

function windowBounds(slot) {
  if (slot === 0) {
    return {
      left: 0,
      top: 0,
      width: HOST_VIEWPORT.width,
      height: HOST_VIEWPORT.height + TITLE_BAR,
    };
  }
  return {
    left: HOST_VIEWPORT.width + (slot - 1) * (PLAYER_VIEWPORT.width + 10),
    top: 0,
    width: PLAYER_VIEWPORT.width,
    height: PLAYER_VIEWPORT.height + TITLE_BAR,
  };
}

// Moves a page's browser window into its tile: slot 0 is the host, 1+ are
// players in join order.
export async function placeWindow(page, slot) {
  if (!DEMO) return;
  const session = await page.context().newCDPSession(page);
  const { windowId } = await session.send('Browser.getWindowForTarget');
  await session.send('Browser.setWindowBounds', {
    windowId,
    bounds: { ...windowBounds(slot), windowState: 'normal' },
  });
  await session.detach();
}

// Holds the screen so the audience can read it (end screens, results).
export async function demoPause(page, ms = 3000) {
  if (DEMO) await page.waitForTimeout(ms);
}
