import { test, expect } from "@playwright/test";

/**
 * Lane Z (hidden-passage gimmick): a scenario-authored `kind: secret` grid edge
 * stays indistinguishable from a wall until the party searches the cell.
 * B7F "Sealed Ash Vault" hides a south passage to the "Hidden Cache".
 */
test("a secret wall opens only after searching", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_7");

  // b7f.001 (faces east) -> turn to face south -> move through the door into b7f.002.
  await page.getByRole("button", { name: "Turn right" }).click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByTestId("map-current")).toContainText("Sealed Ash Vault");

  // The south wall reads as solid: moving into it is blocked, party stays put.
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByTestId("map-current")).toContainText("Sealed Ash Vault");

  // Searching reveals the hidden passage...
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText(/hidden passage/i)).toBeVisible();

  // ...and now the party can step through into the cache.
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await expect(page.getByTestId("map-current")).toContainText("Hidden Cache");
});
