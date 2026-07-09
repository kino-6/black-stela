import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceToB1fMarker, createStarterParty, descendB1fViaWarden, faceDirection, registerAdventurer, resolveVisibleCombat, startNewExpedition, walkB1fStairToMarker, walkB1fToStair } from "./helpers";

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

  await expect(page.getByRole("heading", { name: "Warden's Hall" })).toBeVisible();
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

  // The descent is never locked on this shallow floor: thread the maze to the
  // Winding Stair and use it. Exploration is pressured by reward and difficulty.
  expect(await descendB1fViaWarden(page)).toBe(true);
  await expect(page.getByTestId("map-current")).toContainText("Landing of Split Dust");

  // The B2F landing's up-stair to B1F faces west; turn to it and climb back.
  await faceDirection(page, "west");
  await page.getByRole("button", { name: "Use stairs" }).click();

  // Climbing back up lands on the stair cell; thread to the return marker.
  await expect(page.getByRole("heading", { name: "Winding Stair" })).toBeVisible();
  await walkB1fStairToMarker(page);
  await expect(page.getByRole("heading", { name: "Warden's Hall" })).toBeVisible();
  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
});

test("starting cell south wall matches minimap, first-person view, and movement", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-south/);
  // The maze mouth opens south into a corridor, not a door.
  await expect(page.getByTestId("dungeon-canvas")).toHaveAttribute("data-front-edge", "open");
  await expect(page.getByTestId("dungeon-canvas")).toHaveAttribute("data-front-depth", "corridor");

  await page.getByLabel("Turn right").click();
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-west/);

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
  await walkB1fToStair(page);
  await expect(page.getByRole("heading", { name: "Winding Stair" })).toBeVisible();
  // Facing the down-stair under the recommended clear level shows a soft warning
  // (the party is level 1; B1F recommends level 2 before descending). Never a lock.
  await expect(page.getByTestId("descent-underlevel")).toBeVisible();

  // The Winding Stair is a dead-end at the maze's deepest turn: the corridor comes
  // in from the east and the stair drops south, so north and west are solid stone.
  await faceDirection(page, "north");
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-north/);

  const canvasShell = page.getByTestId("dungeon-canvas");
  await expect(canvasShell).toHaveAttribute("data-front-edge", "wall");
  await expect(canvasShell).toHaveAttribute("data-front-traversable", "false");
  await expect(canvasShell).toHaveAttribute("data-right-edge", "open");

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Winding Stair" })).toBeVisible();
  await expect(page.getByText("A cold wall blocks the way.")).toBeVisible();
  await expect(canvasShell).toHaveAttribute("data-front-edge", "wall");
});

