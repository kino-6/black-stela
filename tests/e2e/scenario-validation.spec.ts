import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test("blocks start and shows actionable scenario validation errors", async ({ page }) => {
  await page.goto("/?scenario=invalid");

  await expect(page.getByRole("heading", { name: "Scenario Validation" })).toBeVisible();
  await expect(page.getByText("Exit references unknown room: room.missing")).toBeVisible();
  await expect(page.getByText("dungeons/b1f.md")).toBeVisible();
  await expect(page.getByText("rooms[0].exits.east")).toBeVisible();
  await expect(page.getByText("Route")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter dungeon" })).toHaveCount(0);
});

test("scenario validation UI supports Japanese labels", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
  await page.goto("/?scenario=invalid");

  await expect(page.getByRole("heading", { name: "シナリオ検証" })).toBeVisible();
  await expect(page.getByText("シナリオを開始できません。")).toBeVisible();
  await expect(page.getByText("経路")).toBeVisible();
});

test("debug scenario import reports success for a local pack file set", async ({ page }) => {
  await page.goto("/?debug=1");

  await page.getByTestId("scenario-pack-input").setInputFiles(
    defaultPackFiles([
      "manifest.md",
      "world.md",
      "items.md",
      "enemies.md",
      "encounters.md",
      "treasure.md",
      "progression.md",
      "dungeons/b1f.md",
      "dungeons/b2f.md",
      "dungeons/b3f.md",
      "dungeons/b4f.md",
      "dungeons/b5f.md",
      "dungeons/b6f.md",
      "dungeons/b7f.md",
      "dungeons/b8f.md"
    ])
  );

  await expect(page.getByText("Loaded Black Stela - Gate of Ash (8 floors).")).toBeVisible();
  await expect(page.getByText("Floors: 8")).toBeVisible();
});

function defaultPackFiles(relativePaths: string[]) {
  return relativePaths.map((relativePath) => ({
    name: relativePath.replaceAll("/", "__"),
    mimeType: "text/markdown",
    buffer: readFileSync(join(process.cwd(), "content/worlds/default", relativePath))
  }));
}
