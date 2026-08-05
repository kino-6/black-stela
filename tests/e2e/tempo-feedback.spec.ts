import { test, expect } from "@playwright/test";

/**
 * Lane X: repeat/auto must never read as a stalled or hidden timer. When the
 * runner is going, a live indicator shows the mode + step, a visible speed tier,
 * and an always-available immediate Stop.
 */
test("auto-explore shows a live tempo indicator with speed and stop", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_2");

  // The dungeon scene must be mounted before we drive it — on CI's software renderer a click on the
  // tempo button raced the scene mount and auto never started. Wait for the canvas, then start the
  // runner with its KEYBOARD toggle (Space): IMP-026 binds R/Space on the window regardless of focus,
  // so it does not depend on button hit-testing the way a click does. (The button path is the same
  // toggleTempoMode; the Stop click below still exercises a button.)
  await expect(page.getByTestId("dungeon-canvas").first()).toBeVisible();
  await page.keyboard.press("Space");

  // The live indicator appears with the active mode and a step readout. Auto-explore steps on its own,
  // so on a slow CI renderer the first frames can pass before the assert — give it generous room.
  const indicator = page.getByTestId("tempo-indicator");
  await expect(indicator).toBeVisible({ timeout: 15_000 });
  await expect(indicator).toContainText("Auto-explore");
  await expect(page.getByTestId("tempo-step")).toBeVisible();

  // Speed is a visible tier that toggles.
  await expect(page.getByTestId("tempo-speed")).toContainText("×1");
  await page.getByTestId("tempo-speed").click();
  await expect(page.getByTestId("tempo-speed")).toContainText("×2");

  // Stop is immediate: the indicator disappears.
  await page.getByTestId("tempo-stop").click();
  await expect(page.getByTestId("tempo-indicator")).toHaveCount(0);
});
