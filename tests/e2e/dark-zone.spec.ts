import { test, expect } from "@playwright/test";
import { clearAnyCombat, faceDirection } from "./helpers";

/**
 * Lane Z slice D-3 (darkness gimmick): a dark-zone room snuffs out the automap.
 * B4F "Unlit Square" carries the dark_zone gate. B4F is now a maze; thread the
 * generated path (scripts/genFloorMaze.mjs) down to the Unlit Square down-stair.
 * The spinner entry re-orients facing, so each step re-faces explicitly.
 */
// A wandering pack can ambush any step now, and the victory overlay swallows clicks —
// clear both around every move.
async function move(page: import("@playwright/test").Page) {
  await clearAnyCombat(page);
  await page.keyboard.press("w");
  await clearAnyCombat(page);
}

test("dark zone obscures the minimap", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_4");
  await expect(page.getByTestId("map-current")).toContainText("Lanterns Facing Inward");

  const toUnlitSquare: Array<"north" | "south" | "east" | "west"> = [
    "east", "east", "south", "south", "south", "south", "south", "south", "east", "east",
    "east", "east", "east", "south", "south", "east", "east", "east", "east", "east",
    "east", "east", "east", "east", "south", "south", "south", "south", "west", "west",
    "south", "south", "east", "east", "south", "south", "west", "west"
  ];
  for (const dir of toUnlitSquare) {
    await clearAnyCombat(page);
    await faceDirection(page, dir);
    await move(page);
  }

  await expect(page.getByTestId("map-current")).toContainText("Unlit Square");
  await expect(page.getByTestId("minimap-dark")).toBeVisible();
});
