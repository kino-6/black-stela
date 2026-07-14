import { expect, test } from "@playwright/test";
import { startDebugRun } from "./helpers";

const evidence = "docs/evidence/improve-009-011-2026-07-14";

test("Verdant portraits read in character creation and the six-person dungeon HUD", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
  await page.goto("/");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-verdant").click();
  await page.getByRole("button", { name: "説明を聞かない" }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: "次へ" }).click();

  const preview = page.getByTestId("portrait-preview");
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute("src", /gate/);
  await page.screenshot({ path: `${evidence}/01-verdant-character-creation-1280.png` });

  await startDebugRun(page, { progress: "floor_2", world: "verdant" });
  const portraits = page.getByTestId("party-hud-portrait");
  await expect(portraits).toHaveCount(6);
  const sources = await portraits.evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""));
  expect(new Set(sources).size).toBeGreaterThanOrEqual(5);
  expect(
    sources.every((source) => /\/(?:gate|ruin|vial|coin|map|ward|road|pit|ink|grave|dock|cloak)(?:-|\.png)/.test(source)),
    `unexpected portrait source: ${sources.join(", ")}`
  ).toBe(true);
  await page.screenshot({ path: `${evidence}/02-verdant-six-person-hud-1280.png` });
});
