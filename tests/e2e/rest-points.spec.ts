import { test, expect } from "@playwright/test";
import { resolveVisibleCombat } from "./helpers";

/**
 * Lane Z slice A: return-to-town is available only at block-cap rest points
 * (every ~3 floors), not on every floor. B3F "Chain Descent" is the block-1 cap.
 *
 * B3F is now a dense grid; the descent sits past the warden choke, so the walk
 * from the entry threads the cistern galleries down through the warden's mark.
 */
async function move(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Move", exact: true }).click();
  if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
    await resolveVisibleCombat(page);
  }
}

test("B3F block-cap rest point offers return to town", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3");
  await expect(page.getByTestId("map-current")).toContainText("Dry Cistern Mouth");

  // A mid-floor cell must not offer return.
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  // Entry (1,4) faces east. Route: E into the gallery, S to the y6 aisle, E along
  // it to the warden column at x=11, then S through the warden (11,9) to the
  // Chain Descent at (11,11).
  await move(page); // -> (2,4)
  await page.getByRole("button", { name: "Turn right" }).click(); // face south
  await move(page); // -> (2,5)
  await move(page); // -> (2,6)
  await page.getByRole("button", { name: "Turn left" }).click(); // face east
  await move(page); // -> (3,6)
  await move(page); // -> (4,6)
  await move(page); // -> (5,6)
  await move(page); // -> (6,6)
  await move(page); // -> (7,6)
  await move(page); // -> (8,6)
  await move(page); // -> (9,6)
  await move(page); // -> (10,6)
  await move(page); // -> (11,6)
  await page.getByRole("button", { name: "Turn right" }).click(); // face south
  await move(page); // -> (11,7)
  await move(page); // -> (11,8)
  await move(page); // -> (11,9) warden choke (combat)
  await move(page); // -> (11,10)
  await move(page); // -> (11,11) Chain Descent

  await expect(page.getByTestId("map-current")).toContainText("Chain Descent");
  const returnBtn = page.getByRole("button", { name: "Use return marker" });
  await expect(returnBtn).toBeVisible();

  await returnBtn.click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();

  // The reached rest point is now a resumable checkpoint from the dungeon entry.
  await expect(page.getByTestId("checkpoint-resume")).toBeVisible();
  await page.getByTestId("resume-room.b3f.003").click();
  await expect(page.getByTestId("map-current")).toContainText("Chain Descent");
});
