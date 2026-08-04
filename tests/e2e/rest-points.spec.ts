import { test, expect } from "@playwright/test";

/**
 * Lane Z slice A: return-to-town is available only at block-cap rest points
 * (every ~3 floors), not on every floor. B3F "The Chain Descent" is the block-1 cap;
 * T29 seats its rest point on the regenerated DESCENT room (room.b3f.exit, "Ash Descent").
 *
 * The party is seeded directly on the cell under test via `&at=...` (see
 * withDebugStartCell) so the test proves the rest-point rule, not a long maze walk
 * across a regenerated grid.
 */
test("B3F block-cap rest point offers return to town", async ({ page }) => {
  // A mid-floor cell (the hidden-passage gate) must NOT offer return.
  await page.goto("/?debug=1&progress=floor_3&at=room.b3f.gate&facing=north");
  await expect(page.getByTestId("map-current")).toContainText("Suspect Wall");
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  // The block-1 cap's descent room IS a rest point: return to town is offered here.
  await page.goto("/?debug=1&progress=floor_3&at=room.b3f.exit&facing=north");
  await expect(page.getByTestId("map-current")).toContainText("Ash Descent");
  const returnBtn = page.getByRole("button", { name: "Use return marker" });
  await expect(returnBtn).toBeVisible();

  await returnBtn.click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();

  // The reached rest point is now a resumable checkpoint from the dungeon entry.
  await expect(page.getByTestId("checkpoint-resume")).toBeVisible();
  await page.getByTestId("resume-room.b3f.exit").click();
  await expect(page.getByTestId("map-current")).toContainText("Ash Descent");
});
