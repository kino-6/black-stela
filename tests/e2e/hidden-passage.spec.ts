import { test, expect } from "@playwright/test";

/**
 * Lane Z (hidden-passage gimmick): a scenario-authored `kind: secret` grid edge
 * stays indistinguishable from a wall until the party searches the cell.
 * B7F hides a south passage from the vault gallery (c11_6) to the "Hidden Cache".
 *
 * The party is seeded directly on the search cell via `&at=...&facing=...` (see
 * withDebugStartCell) so the test proves the gimmick, not a long maze walk.
 */
test("a secret wall opens only after searching", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_7&at=room.b7f.c11_6&facing=south");
  await expect(page.getByTestId("map-current")).toContainText("Quiet Vault Gallery");

  // The south wall reads as solid: moving into it is blocked, party stays put.
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByTestId("map-current")).toContainText("Quiet Vault Gallery");

  // Searching reveals the hidden passage...
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/hidden passage/i)).toBeVisible();

  // ...and now the party can step through into the cache.
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByTestId("map-current")).toContainText("Hidden Cache");
});
