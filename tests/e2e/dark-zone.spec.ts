import { test, expect } from "@playwright/test";
import { resolveVisibleCombat } from "./helpers";

/**
 * Lane Z slice D-3 (darkness gimmick): a dark-zone room snuffs out the automap.
 * B4F "Unlit Square" carries the dark_zone gate. B4F is now a dense 20x20: the
 * spinner entry sits at the top-left and the Unlit Square is the east pocket at
 * (18,9), so the party leaves the spinner once (no re-entry, no spin), crosses
 * the lantern hall, and drops down the east wall to the square.
 */
async function move(page: import("@playwright/test").Page, times = 1) {
  for (let i = 0; i < times; i += 1) {
    await page.getByRole("button", { name: "Move", exact: true }).click();
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
      await resolveVisibleCombat(page);
    }
  }
}

test("dark zone obscures the minimap", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_4");
  await expect(page.getByTestId("map-current")).toContainText("Lanterns Facing Inward");

  // (2,1) faces east. Leave south into the hall, run east along y=4 to the wall,
  // then drop south to the Unlit Square pocket at (18,9).
  await page.getByRole("button", { name: "Turn right" }).click(); // face south
  await move(page, 3); // -> (2,2) -> (2,3) -> (2,4)
  await page.getByRole("button", { name: "Turn left" }).click(); // face east
  await move(page, 15); // -> (17,4)
  await page.getByRole("button", { name: "Turn right" }).click(); // face south
  await move(page, 5); // -> (17,9)
  await page.getByRole("button", { name: "Turn left" }).click(); // face east
  await move(page, 1); // -> (18,9) Unlit Square

  await expect(page.getByTestId("map-current")).toContainText("Unlit Square");
  await expect(page.getByTestId("minimap-dark")).toBeVisible();
});
