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
  });

  test("the F key resolves a whole round (played back at 2x) and clears the fight", async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
    await startDebugRun(page, { progress: "floor_2", world: "verdant" });
    await walkUntilCombat(page);

    // The primary quick-fight command is present and enabled.
    const allOut = page.getByTestId("combat-all-out");
    await expect(allOut).toBeVisible();
    await expect(allOut).toBeEnabled();

    // Each press plays the whole round back at 2x (never skips), so wait for the round to finish —
    // the all-out button re-enables when playback ends — before the next press. The fight must
    // PROGRESS and END (no infinite stall).
    const isOver = async () =>
      (await page.getByTestId("combat-result").count()) > 0 || // victory result screen
      (await page.getByTestId("combat-cockpit").count()) === 0 || // dragged back to town
      (await page.getByTestId("combat-enemy-group").count()) === 0; // no enemies left

    let ended = false;
    for (let i = 0; i < 15 && !ended; i += 1) {
      if (await isOver()) { ended = true; break; }
      await page.keyboard.press("f");
      // Wait out this round's 2x playback: the button is disabled during playback, then re-enables
      // (or the fight ends into the result screen).
      await expect
        .poll(async () => ((await isOver()) ? "over" : (await allOut.isEnabled()) ? "ready" : "playing"), { timeout: 15_000 })
        .not.toBe("playing");
      if (await isOver()) ended = true;
    }
    expect(ended, "the fight did not end after 15 all-out rounds").toBe(true);
  });
});
