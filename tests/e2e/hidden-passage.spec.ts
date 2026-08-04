import { test, expect } from "@playwright/test";

/**
 * Lane Z (hidden-passage gimmick): a scenario-authored `kind: secret` grid edge
 * stays indistinguishable from a wall until the party searches the cell.
 * T29 — every regenerated default floor carries one physical hidden door: the
 * "Suspect Wall" (room.b*.gate) opens SOUTH onto the "Hidden Passage" (room.b*.lift)
 * only after a search. B7F is exercised here.
 *
 * The party is seeded directly on the search cell via `&at=...&facing=...` (see
 * withDebugStartCell) so the test proves the gimmick, not a long maze walk.
 */
test("a secret wall opens only after searching", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_7&at=room.b7f.gate&facing=south");
  await expect(page.getByTestId("map-current")).toContainText("Suspect Wall");

  // The south wall reads as solid: moving into it is blocked, party stays put.
  await page.keyboard.press("w");
  await expect(page.getByTestId("map-current")).toContainText("Suspect Wall");

  // Searching reveals the hidden passage...
  await page.getByRole("button", { name: "Search" }).click();

  // ...and now the party can step through into the hidden passage.
  await page.keyboard.press("w");
  await expect(page.getByTestId("map-current")).toContainText("Hidden Passage");
});
