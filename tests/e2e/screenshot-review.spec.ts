import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { advanceToB1fMarker, createStarterParty, resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("captures desktop screenshot review states", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: "test-results/screenshot-review/desktop-title.png", fullPage: true });

  await startNewExpedition(page);
  await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-guild-empty.png", fullPage: true });
  await page.getByRole("button", { name: "Skip explanation" }).click();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-guild-class.png", fullPage: true });
  await page.getByTestId("guild-step-class").getByRole("button", { name: "Next" }).click();
  await page.getByTestId("guild-step-appearance").getByRole("button", { name: "Next" }).click();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-guild-bonus.png", fullPage: true });

  // The Guild Master lives in the HALL, and the registration steps no longer sit beside him
  // (IMP-003) — so come back out of the form before asking him to pick someone.
  await page.locator(".guild-stepper button").first().click();
  await createStarterParty(page);
  await page.screenshot({ path: "test-results/screenshot-review/desktop-guild.png", fullPage: true });

  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-dungeon-start.png", fullPage: true });
  await page.getByLabel("Turn right").click();
  await expect(page.getByTestId("minimap-facing")).toHaveClass(/facing-west/);
  await expect(page.getByTestId("dungeon-canvas")).toHaveAttribute("data-front-visual", "blocked-wall");
  await page.screenshot({ path: "test-results/screenshot-review/desktop-dungeon-start-west-wall.png", fullPage: true });
  await page.getByLabel("Turn left").click();

  await page.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-combat.png", fullPage: true });

  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText(/Victory.*XP.*gold/i)).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-map-after-move.png", fullPage: true });

  await advanceToB1fMarker(page);
  await expect(page.getByRole("heading", { name: "Warden's Hall" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-return-stair.png", fullPage: true });

  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-post-return-town.png", fullPage: true });

  await page.getByTestId("town-cockpit").getByRole("button", { name: "Shop" }).click();
  await expect(page.getByRole("heading", { name: "Stela Gate General Store" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-shop.png", fullPage: true });
});

test("captures mobile Japanese guild screenshot review state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});
  await createStarterParty(page, "ja");

  await expect(page.getByRole("heading", { name: "冒険者登録" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/mobile-ja-guild.png", fullPage: true });
});

test("captures authoring and B2F screenshot review states", async ({ page }) => {
  await page.goto("/?scenario=invalid");
  await expect(page.getByRole("heading", { name: "Scenario Validation" })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/scenario-validation-error.png", fullPage: true });

  await page.goto("/?debug=1");
  await page.getByTestId("debug-panel-toggle").click(); // expand the collapsed debug panel
  await page.getByTestId("scenario-pack-input").setInputFiles(defaultPackFiles(["manifest.md", "world.md", "items.md", "enemies.md", "encounters.md", "treasure.md", "progression.md", "dungeons/b1f.md", "dungeons/b2f.md", "dungeons/b3f.md", "dungeons/b4f.md", "dungeons/b5f.md", "dungeons/b6f.md", "dungeons/b7f.md", "dungeons/b8f.md"]));
  await expect(page.getByText("Loaded Black Stela - Gate of Ash (8 floors).")).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/scenario-import-success.png", fullPage: true });

  await page.goto("/?debug=1&progress=floor_2");
  await expect(page.getByRole("heading", { name: /Landing of Split Dust/ })).toBeVisible();
  await page.screenshot({ path: "test-results/screenshot-review/desktop-b2f-entry.png", fullPage: true });
});

function defaultPackFiles(relativePaths: string[]) {
  return relativePaths.map((relativePath) => ({
    name: relativePath.replaceAll("/", "__"),
    mimeType: "text/markdown",
    buffer: readFileSync(join(process.cwd(), "content/worlds/default", relativePath))
  }));
}

