import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceToB1fMarker, createStarterParty, descendB1fViaWarden, registerAdventurer, resolveVisibleCombat, startNewExpedition, walkB1fStairToMarker } from "./helpers";

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
  // The entrance is the town gate — stairs back up are available from the start.
  await expect(page.getByRole("button", { name: "Climb the stairs to town" })).toBeVisible();

  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guild Registry" })).toHaveCount(0);
  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
  await expect(page.getByText("Ash Slime blocks the passage.")).toHaveCount(0);
  await expect(page.getByLabel("Mini-map")).toHaveCount(0);
  await expect(page.getByLabel("Visible dungeon features")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  await resolveVisibleCombat(page);

  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByTestId("minimap-visited")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  await advanceToB1fMarker(page);

  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await expect(page.getByLabel("Visible dungeon features")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toBeVisible();

  await page.getByRole("button", { name: "Use return marker" }).click();

  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
  await expect(page.getByText("The party returns to town.")).toBeVisible();
  await page.getByRole("button", { name: "Records" }).click();
  await expect(page.getByText(/^[1-9]\d* records$/)).toBeVisible();
});

test("visible controls can descend to B2F and still return through the authored stair", async ({ page }) => {
  test.setTimeout(120000);
  await startNewExpedition(page);

  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  // The descent is gated behind the Warden's Hall crank, so a straight walk to
  // the stair no longer works — clear the south branch to unlock it and descend.
  expect(await descendB1fViaWarden(page)).toBe(true);
  await expect(page.getByTestId("map-current")).toContainText("Landing of Split Dust");

  await page.getByLabel("Turn left").click();
  await page.getByLabel("Turn left").click();
  await page.getByRole("button", { name: "Use stairs" }).click();

  // Climbing back up lands on the stair cell; thread to the return marker's alcove.
  await expect(page.getByRole("heading", { name: "Winding Stair" })).toBeVisible();
  await walkB1fStairToMarker(page);
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
});

test("starting cell south wall matches minimap, first-person view, and movement", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-east/);
  // The entrance opens east into a corridor, not a door.
  await expect(page.getByTestId("dungeon-canvas")).toHaveAttribute("data-front-edge", "open");
  await expect(page.getByTestId("dungeon-canvas")).toHaveAttribute("data-front-depth", "corridor");

  await page.getByLabel("Turn right").click();
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-south/);

  const canvasShell = page.getByTestId("dungeon-canvas");
  await expect(canvasShell).toHaveAttribute("data-front-edge", "wall");
  await expect(canvasShell).toHaveAttribute("data-front-traversable", "false");
  await expect(canvasShell).toHaveAttribute("data-front-visual", "blocked-wall");
  await expect(canvasShell).toHaveAttribute("data-left-edge", "open");
  await expect(canvasShell).toHaveAttribute("data-right-edge", "wall");

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  await expect(page.getByText("A cold wall blocks the way.")).toBeVisible();
});

test("first-person view, minimap, and movement agree when forward is blocked", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();
  await resolveVisibleCombat(page);
  await advanceToB1fMarker(page);
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();

  // The marker sits in a dead-end alcove entered from the north; its east and west
  // are solid stone and the winch shortcut is south. Face the east wall to test a
  // blocked step. (Arrives facing south, having stepped into the alcove.)
  await page.getByLabel("Turn left").click();
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-east/);

  const canvasShell = page.getByTestId("dungeon-canvas");
  await expect(canvasShell).toHaveAttribute("data-front-edge", "wall");
  await expect(canvasShell).toHaveAttribute("data-front-traversable", "false");
  await expect(canvasShell).toHaveAttribute("data-left-edge", "open");

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
  await expect(page.getByText("A cold wall blocks the way.")).toBeVisible();
  await expect(canvasShell).toHaveAttribute("data-front-edge", "wall");
});

