import { test, expect } from "@playwright/test";

/**
 * Lane X: repeat/auto must never read as a stalled or hidden timer. When the
 * runner is going, a live indicator shows the mode + step, a visible speed tier,
 * and an always-available immediate Stop.
 */
test("auto-explore shows a live tempo indicator with speed and stop", async ({ page }) => {
  // The tempo runner is a setInterval that walks the floor and STOPS itself on reaching the stairs or a
  // fight (App.tsx). This test is about the live INDICATOR + its speed/stop controls, not the walk — but
  // a real walk finishes the small floor fast (faster still on a slow CI renderer between assertions),
  // so the indicator would vanish mid-test. Freeze the clock: the runner still starts (mode is set
  // synchronously on toggle) but its interval never fires, so it never self-terminates and the indicator,
  // speed tier, and Stop are all stable and deterministic. Advance once past load so app init flushes.
  await page.clock.install();
  await page.goto("/?debug=1&progress=floor_2");
  await page.clock.runFor(1000);
  await expect(page.getByTestId("dungeon-canvas").first()).toBeVisible();

  // Start the runner with its KEYBOARD toggle (Space): IMP-026 binds R/Space on the window regardless of
  // focus, so it does not depend on hit-testing a button that may not be wired yet on a slow renderer.
  await page.keyboard.press("Space");

  // The live indicator appears with the active mode and a step readout.
  const indicator = page.getByTestId("tempo-indicator");
  await expect(indicator).toBeVisible();
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
