import { expect, test } from "@playwright/test";
import { registerAdventurer } from "./helpers";

// End-to-end proof that a scenario switch drives a different world. The picker
// appears because content/worlds/ ships more than one scenario (default + verdant).

test("picking the verdant scenario loads its own world, not the default", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New expedition" }).click();

  // The scenario picker lists both worlds; choose verdant.
  await expect(page.getByRole("heading", { name: "Choose a Scenario" })).toBeVisible();
  await expect(page.getByTestId("scenario-card-default")).toBeVisible();
  await page.getByTestId("scenario-card-verdant").click();

  await registerAdventurer(page, { name: "Fern" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();
  // Verdant's own opening room — proof the world switched.
  await expect(page.locator("#location-heading")).toHaveText("Sunken Threshold");
  // The default world's opening is nowhere in sight.
  await expect(page.getByText("Silent Stone Chamber")).toHaveCount(0);
  await expect(page.getByText("Ash Slime")).toHaveCount(0);
  // The standard party still has resolvable, statted starter gear (shared base
  // catalog merged into verdant, which ships no items of its own).
  await expect(page.getByTestId("party-hud")).toContainText(/Damage \d+-\d+/);
});

test("picking the default scenario still loads the default world (round-trip)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New expedition" }).click();
  await page.getByTestId("scenario-card-default").click();

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();
  // Default's own opening room — verdant's is absent.
  await expect(page.getByText("Sunken Threshold")).toHaveCount(0);
});
