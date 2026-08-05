import { test, expect } from "@playwright/test";

/**
 * Lane X: repeat/auto must never read as a stalled or hidden timer. When the
 * runner is going, a live indicator shows the mode + step, a visible speed tier,
 * and an always-available immediate Stop.
 */
test("auto-explore shows a live tempo indicator with speed and stop", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_2");

  // Wait for the dock to be interactive before clicking — on slow CI the click could otherwise
  // land before the dungeon scene has mounted, and auto never starts.
  const dock = page.getByTestId("dungeon-command-window");
  await expect(dock).toBeVisible();

  // Start auto-explore from the dungeon dock (the Repeat/tempo button).
  await dock.getByRole("button", { name: "Auto", exact: true }).click();

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
