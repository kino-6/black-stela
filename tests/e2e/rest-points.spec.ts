import { test, expect } from "@playwright/test";
import { faceDirection, resolveVisibleCombat } from "./helpers";

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

  // Thread the maze down to the Chain Descent (the block-1 cap rest point),
  // resolving the cistern-crossing fight on the way (scripts/genFloorMaze.mjs path).
  const toChainDescent: Array<"north" | "south" | "east" | "west"> = [
    "south", "south", "east", "east", "east", "east", "south", "south", "east", "east",
    "south", "south", "east", "south", "south", "south", "south", "east", "south", "south",
    "east", "east", "north", "north", "east", "east", "south", "south", "east", "east",
    "south", "south", "south", "south", "west", "west"
  ];
  for (const dir of toChainDescent) {
    await faceDirection(page, dir);
    await move(page);
  }

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
