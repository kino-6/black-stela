import { test, expect } from "@playwright/test";

/**
 * Lane Z slice C: an expensive single-use return charm escapes to town mid-floor,
 * but is barred on the boss floor.
 */
test("return charm escapes mid-floor but is barred on the boss floor", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3");
  const charm = page.getByTestId("use-return-charm");
  await expect(charm).toBeVisible();
  await charm.click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();

  // The finale floor is a commitment: the charm is not offered there.
  await page.goto("/?debug=1&progress=floor_8");
  await expect(page.getByText("dungeon.b8f").first()).toBeVisible();
  await expect(page.getByTestId("use-return-charm")).toHaveCount(0);
});
