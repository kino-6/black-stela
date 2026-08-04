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

  // The finale floor is a commitment: the charm is not offered there. T31 moved the finale to B10F (the 真層);
  // B8F is now a regular Act III floor, so the commitment gate lives on B10F.
  await page.goto("/?debug=1&progress=floor_10");
  await expect(page.getByText("B10F - The Inmost Stela").first()).toBeVisible();
  await expect(page.getByTestId("use-return-charm")).toHaveCount(0);
});
