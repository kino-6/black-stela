import { test, expect } from "@playwright/test";

/**
 * Lane X: repeat/auto must never read as a stalled or hidden timer. When the
 * runner is going, a live indicator shows the mode + step, a visible speed tier,
 * and an always-available immediate Stop.
 */
test("auto-explore shows a live tempo indicator with speed and stop", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_2");

  // Start auto-explore from the dungeon dock (the Repeat/tempo button).
  await page.getByTestId("dungeon-command-window").getByRole("button", { name: "Repeat" }).click();

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
