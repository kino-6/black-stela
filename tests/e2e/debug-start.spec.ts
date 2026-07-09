import { expect, test } from "@playwright/test";

test("debug start can load progress and run the reachability probe", async ({ page }) => {
  await page.goto("/?debug=1&progress=after_encounter");

  await expect(page.getByRole("heading", { name: "Debug Start" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText("Mapped 2/1282")).toBeVisible();

  // The debug panel collapses by default so it doesn't crowd the game; expand it
  // to reach the reachability probe.
  await page.getByTestId("debug-panel-toggle").click();
  await page.getByRole("button", { name: "Headless reachability" }).click();

  await expect(page.getByText("Headless reachability: reached")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
  // The probe explores B1F on its way out, so more rooms are mapped than the two
  // the debug state seeded.
  await expect(page.getByText(/Mapped \d+\/1282/)).toBeVisible();
});
