import { expect, test } from "@playwright/test";
import { startDebugRun, walkUntilCombat } from "./helpers";
import { CONTROLLER_VIEWPORT } from "./controllerGate";

// GAMEPLAY stress — plays combat like an impatient human, not a business-app form. The point is to
// catch the failure MODES a real player hits (freeze, stall, never-ending fight) that a testid/
// viewport check never would. This spec would have caught the F-spam freeze: mashing 全員でかかる
// used to restart playback from beat 0 on every press (a stale-closure guard), so the round never
// committed and the screen sat frozen. Here we mash F continuously and require the fight to PROGRESS
// to an end regardless — a freeze can only manifest as a timeout.
test.describe("combat survives impatient play", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
  });

  test("mashing F never freezes the fight — every round still commits and the fight ends", async ({ page }) => {
    test.setTimeout(180_000);
    await startDebugRun(page, { progress: "floor_4", world: "verdant" });

    const combatOver = async () =>
      (await page.getByTestId("combat-result").count()) > 0 ||
      (await page.getByTestId("combat-all-out").count()) === 0 || // dropped out of combat
      (await page.getByText(/全滅|冒険は終わった|ゲームオーバー/).count()) > 0;

    // Play several fights; each one is mashed to a conclusion.
    for (let fight = 0; fight < 4; fight += 1) {
      if (await combatOver()) {
        try {
          await walkUntilCombat(page);
        } catch {
          break; // no more encounters reachable — that's fine, we cleared some
        }
      }
      await expect(page.getByTestId("combat-all-out")).toBeVisible();

      // Mash F continuously. A freeze (playback restarting every press) would keep the fight from
      // ever committing, so the poll below would time out. The ref guard must let each round finish.
      const start = Date.now();
      let ended = false;
      while (Date.now() - start < 45_000) {
        if (await combatOver()) {
          ended = true;
          break;
        }
        // Fire a burst of presses faster than one playback (~1.5s at 2x) — the abusive case.
        for (let i = 0; i < 6; i += 1) {
          await page.keyboard.press("f");
          await page.waitForTimeout(40);
        }
        await page.waitForTimeout(120);
      }
      expect(ended, `fight ${fight} never ended under F-mashing — likely a playback freeze`).toBe(true);

      // Dismiss a victory result to reach the next encounter.
      if ((await page.getByTestId("combat-result-continue").count()) > 0) {
        await page.getByTestId("combat-result-continue").click().catch(() => {});
      }
      if (await page.getByText(/全滅|冒険は終わった|ゲームオーバー/).count()) {
        break; // party wiped — combat still terminated cleanly, which is the point
      }
    }
  });
});
