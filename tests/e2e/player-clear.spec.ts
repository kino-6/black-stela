import { expect, test } from "@playwright/test";
import { resolveVisibleCombat, startNewExpedition } from "./helpers";

test("clears the MVP route through visible player controls only", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("heading", { name: "Black Stela" })).toHaveCount(0);
  await expect(page.getByText(/local narration|local ai|provider|endpoint|ローカル描写|ローカルAI|プロバイダー/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Headless clear" })).toHaveCount(0);

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Add adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();
  await expect(page.getByLabel("Visible dungeon features")).toContainText("Door");
  await expect(page.getByLabel("Mini-map")).toBeVisible();
  await expect(page.getByTestId("minimap-current")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Return" })).toHaveCount(0);

  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
  await expect(page.getByText("Ash Slime stands in the party's path.")).toBeVisible();
  await expect(page.getByLabel("Visible dungeon features")).toContainText("Ash Slime");
  await expect(page.getByRole("button", { name: "Return" })).toHaveCount(0);

  await resolveVisibleCombat(page);

  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByTestId("minimap-visited")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Return" })).toHaveCount(0);

  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await expect(page.getByLabel("Visible dungeon features")).toContainText("Stairs");
  await expect(page.getByRole("button", { name: "Return" })).toBeVisible();

  await page.getByRole("button", { name: "Return" }).click();

  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await expect(page.getByText("The party returns to town.")).toBeVisible();
  await page.getByRole("button", { name: "Records" }).click();
  await expect(page.getByText(/^[1-9]\d* records$/)).toBeVisible();
});
