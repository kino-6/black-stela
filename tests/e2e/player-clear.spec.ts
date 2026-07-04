import { expect, test } from "@playwright/test";
import { registerAdventurer, resolveVisibleCombat, startNewExpedition } from "./helpers";

test("clears the MVP route through visible player controls only", async ({ page }) => {
  await startNewExpedition(page);

  await expect(page.getByRole("heading", { name: "Black Stela" })).toHaveCount(0);
  await expect(page.getByText(/local narration|local ai|provider|endpoint|ローカル描写|ローカルAI|プロバイダー/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Headless reachability" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Headless clear" })).toHaveCount(0);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guild Registry" })).toHaveCount(0);
  await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();
  await expect(page.getByLabel("Visible dungeon features")).toHaveCount(0);
  await expect(page.getByLabel("Mini-map")).toBeVisible();
  await expect(page.getByTestId("minimap-current")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guild Registry" })).toHaveCount(0);
  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
  await expect(page.getByText("Ash Slime blocks the passage.")).toHaveCount(0);
  await expect(page.getByLabel("Mini-map")).toBeVisible();
  await expect(page.getByLabel("Visible dungeon features")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  await resolveVisibleCombat(page);

  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByTestId("minimap-visited")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await expect(page.getByLabel("Visible dungeon features")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toBeVisible();

  await page.getByRole("button", { name: "Use return marker" }).click();

  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
  await expect(page.getByText("The party returns to town.")).toBeVisible();
  await page.getByRole("button", { name: "Records" }).click();
  await expect(page.getByText(/^[1-9]\d* records$/)).toBeVisible();
});

test("visible controls can descend to B2F and still return through the authored stair", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByRole("button", { name: "Beginner Safe" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();
  await resolveVisibleCombat(page);
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use return marker" })).toBeVisible();

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByTestId("map-current")).toContainText("Landing of Split Dust");

  if (await page.getByRole("heading", { name: "Combat" }).isVisible()) {
    await resolveVisibleCombat(page);
  }

  await page.getByLabel("Turn left").click();
  await page.getByLabel("Turn left").click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByRole("heading", { name: "Town" })).toBeVisible();
});

test("first-person view, minimap, and movement agree when forward is blocked", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByRole("button", { name: "Beginner Safe" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();
  await resolveVisibleCombat(page);
  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();

  await page.getByLabel("Turn left").click();
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-north/);

  const canvasShell = page.getByTestId("dungeon-canvas");
  await expect(canvasShell).toHaveAttribute("data-front-edge", "wall");
  await expect(canvasShell).toHaveAttribute("data-front-traversable", "false");
  await expect(canvasShell).toHaveAttribute("data-left-edge", "open");
  await expect(canvasShell).toHaveAttribute("data-right-edge", "open");

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await expect(page.getByText("A cold wall blocks the way.")).toBeVisible();
  await expect(canvasShell).toHaveAttribute("data-front-edge", "wall");
});
