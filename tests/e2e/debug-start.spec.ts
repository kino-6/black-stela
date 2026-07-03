import { expect, test } from "@playwright/test";

test("debug start can load progress and run the reachability probe", async ({ page }) => {
  await page.goto("/?debug=1&progress=after_encounter");

  await expect(page.getByRole("heading", { name: "Debug Start" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText("Mapped 2/24")).toBeVisible();

  await page.getByRole("button", { name: "Headless reachability" }).click();

  await expect(page.getByText("Headless reachability: reached")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await expect(page.getByText("Mapped 3/24")).toBeVisible();
});
