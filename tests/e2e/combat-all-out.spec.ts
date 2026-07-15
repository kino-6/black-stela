import { expect, test } from "@playwright/test";
import { startDebugRun, walkUntilCombat } from "./helpers";
import { CONTROLLER_VIEWPORT } from "./controllerGate";

// Combat FEEL — friction cure. A plain round used to be six × (command → target) + a confirm.
// "全員でかかる" (All-out) commits the whole round with the smart attack default in one press;
// the F key does the same for a controller. This also exercises the auto-target fix — the fight
// must actually PROGRESS and END, not stall on a shielded back-liner.
test.describe("combat all-out (one-press round)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    // Resolve rounds instantly so the test reads round-to-round state without waiting on playback.
    await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:instant-combat-log", "on"));
  });

  test("the F key resolves a whole round and clears the fight without a per-actor loop", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
    await startDebugRun(page, { progress: "floor_2", world: "verdant" });
    await walkUntilCombat(page);

    // The primary quick-fight command is present and enabled.
    const allOut = page.getByTestId("combat-all-out");
    await expect(allOut).toBeVisible();
    await expect(allOut).toBeEnabled();

    // One press advances the round: the enemy roster changes (damage / a group falls) and the
    // fight terminates within a sane number of presses — no infinite stall.
    let ended = false;
    for (let i = 0; i < 15; i += 1) {
      if ((await page.getByTestId("combat-enemy-group").count()) === 0) {
        ended = true;
        break;
      }
      await page.keyboard.press("f");
      await page.waitForTimeout(120);
      // Combat may resolve into the victory conclusion, or the party may be dragged back to town.
      if ((await page.getByTestId("combat-cockpit").count()) === 0 && (await page.locator(".enemy-stage").count()) === 0) {
        ended = true;
        break;
      }
    }
    expect(ended, "the fight did not end after 15 all-out rounds").toBe(true);
  });
});
