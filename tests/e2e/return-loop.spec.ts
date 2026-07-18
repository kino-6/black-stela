import { expect, test } from "@playwright/test";
import { advanceToB1fMarker, createStarterParty, openTownServiceByTestId, resolveVisibleCombat, startNewExpedition } from "./helpers";

// IMP-027 — every dungeon return lands on the town HUB, whatever path departed. The regression: a
// DIRECT departure from the 6/6 guild-completion screen left townMode on "guild", so the authored
// return marker brought the party back to Adventurer Registration (a second "Enter dungeon"), not
// the return/preparation loop. The existing self-play route missed it because it backs out to the
// hub before departing; this one departs straight from 6/6.
test("a direct 6/6-guild departure still returns to the town hub, not Adventurer Registration", async ({ page }) => {
  test.setTimeout(120_000);
  await startNewExpedition(page);
  await createStarterParty(page); // ends on the 6/6 guild-completion screen

  // Depart DIRECTLY from the guild screen — do NOT back out to the town hub first.
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();

  // Thread B1F to the authored return marker and use it: step into the first encounter, win it,
  // then walk to the marker.
  await page.getByRole("button", { name: "Move" }).click();
  await resolveVisibleCombat(page);
  await advanceToB1fMarker(page);
  await expect(page.getByRole("button", { name: "Use return marker" })).toBeVisible();
  await page.getByRole("button", { name: "Use return marker" }).click();

  // Arrival is the town return loop — NOT a stale Guild/registration screen.
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
  await expect(page.getByText("The party returns to town.")).toBeVisible();
  // The hub (its service menu with Enter dungeon) is shown; the guild suggestion form is not.
  await expect(page.getByTestId("town-enter-dungeon")).toBeVisible();
  await expect(page.getByTestId("guild-suggestion")).toHaveCount(0);
  await expect(page.getByText("How about this one?")).toHaveCount(0);

  // And the hub's services are reachable (a real preparation loop, not a dead registration screen).
  await openTownServiceByTestId(page, "town-service-loot");
  await expect(page.getByTestId("loot-panel")).toBeVisible();
});
