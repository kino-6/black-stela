import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { registerAdventurer, resolveVisibleCombat, startNewExpedition, walkB1fStairToMarker } from "./helpers";

test("create party, import portrait, enter dungeon, fight, use stairs, and view log", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, {
    name: "Mira",
    notes: "Maps every room by hand.",
    portrait: {
      name: "portrait.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64"
      )
    }
  });

  await expect(page.getByRole("heading", { name: "Mira" })).toBeVisible();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();
  await expect(page.getByTestId("character-profile")).toHaveCount(0);
  await expect(page.getByTestId("party-hud")).toContainText("Mira");
  await expect(page.getByTestId("party-hud").getByTestId("party-hud-portrait")).toBeVisible();
  await expect(page.getByTestId("party-hud")).toContainText(/Damage \d+-\d+/);
  await expect(page.getByTestId("party-hud")).toContainText(/Armor \d+/);
  await expect(page.getByTestId("party-hud")).toContainText(/Speed \d+/);
  await expect(page.getByTestId("party-front-row")).toBeVisible();
  await expect(page.getByTestId("party-back-row")).toBeVisible();

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByTestId("character-profile")).toHaveCount(0);
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  await advanceToB1fMarker(page);
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
  await expect(page.getByText("The party returns to town.")).toBeVisible();
});

async function advanceToB1fMarker(page: Page) {
  // Walk the trunk east onto the Winding Stair (reachable without the crank — only
  // the descent itself is gated), then thread into the south alcove that holds the
  // Black Marker, since the return shortcut now sits off the trunk.
  for (let step = 0; step < 40; step += 1) {
    if (await page.getByRole("heading", { name: "Winding Stair" }).isVisible().catch(() => false)) {
      break;
    }
    await page.getByRole("button", { name: "Move", exact: true }).click();
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
      await resolveVisibleCombat(page);
    }
  }
  await walkB1fStairToMarker(page);
}
