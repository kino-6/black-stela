import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { registerAdventurer, resolveVisibleCombat, startNewExpedition } from "./helpers";

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
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await expect(page.getByText("The party returns to town.")).toBeVisible();
});

async function advanceToB1fMarker(page: Page) {
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: "Move" }).click();
  }
}
