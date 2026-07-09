import { test, expect } from "@playwright/test";
import { faceDirection, resolveVisibleCombat } from "./helpers";

/**
 * Lane Z slice D-3 (darkness gimmick): a dark-zone room snuffs out the automap.
 * B4F "Unlit Square" carries the dark_zone gate. B4F is now a maze; thread the
 * generated path (scripts/genFloorMaze.mjs) down to the Unlit Square down-stair.
 * The spinner entry re-orients facing, so each step re-faces explicitly.
 */
async function move(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Move", exact: true }).click();
  if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
    await resolveVisibleCombat(page);
  }
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
    await faceDirection(page, dir);
    await move(page);
  }

  await expect(page.getByTestId("map-current")).toContainText("Unlit Square");
  await expect(page.getByTestId("minimap-dark")).toBeVisible();
});
