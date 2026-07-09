import { test, expect } from "@playwright/test";

/**
 * DebugMode combat aids: a playtester can end a fight instantly ("Force win")
 * and fully revive the party in place, so a fight that isn't what they're
 * testing never blocks the run.
 */
test("debug force-win ends the current fight and returns to exploring", async ({ page }) => {
  await page.goto("/?debug=1&progress=ready");
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  // Walk into the intro fight.
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("combat-command-window")).toBeVisible();

  // The debug Force-win button clears the fight without playing it out.
  await page.getByTestId("debug-force-victory").click();
  await expect(page.getByTestId("combat-command-window")).toHaveCount(0);
  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();
});
