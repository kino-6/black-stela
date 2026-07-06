import { test, expect } from "@playwright/test";
import { resolveVisibleCombat } from "./helpers";

/**
 * Lane Z slice A: return-to-town is available only at block-cap rest points
 * (every ~3 floors), not on every floor. B3F "Chain Descent" is the block-1 cap.
 */
test("B3F block-cap rest point offers return to town", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3");
  await expect(page.getByTestId("map-current")).toContainText("Dry Cistern Mouth");

  // A mid-floor cell must not offer return.
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  // Navigate 001 -> (east) 002 -> (south) 003 rest room.
  await page.getByRole("button", { name: "Move", exact: true }).click();
  if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) await resolveVisibleCombat(page);
  await page.getByRole("button", { name: "Turn right" }).click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) await resolveVisibleCombat(page);

  await expect(page.getByTestId("map-current")).toContainText("Chain Descent");
  const returnBtn = page.getByRole("button", { name: "Use return marker" });
  await expect(returnBtn).toBeVisible();

  await returnBtn.click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
});
