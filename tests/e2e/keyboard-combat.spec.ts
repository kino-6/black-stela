import { test, expect } from "@playwright/test";
import { createStarterParty, startDebugRun, startNewExpedition, walkUntilCombat } from "./helpers";

/**
 * Gate (AGENTS §Combat & Party UI Standards, rule 7): combat must be fully playable
 * by keyboard alone via the command menu — no mouse. The nested menu (command →
 * target/spell) is driven with Enter: each press either descends a submenu or queues
 * the current actor, front to back, and the round auto-resolves after the last actor.
 * A full six-member party (three back-row who fall to Magic/Defend, not a stall) is
 * fought to victory with Enter alone.
 */
test("a fight can be fought to victory by keyboard alone", async ({ page }) => {
  await startNewExpedition(page);
  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();

  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("combat-command-menu")).toBeVisible();

  // Drive the whole fight with Enter (the menu owns the keyboard while focused).
  for (let step = 0; step < 80; step += 1) {
    if (await page.getByRole("heading", { name: "Combat" }).isHidden().catch(() => true)) {
      break;
    }
    await page.getByTestId("combat-command-menu").focus().catch(() => {});
    await page.keyboard.press("Enter");
    await page.waitForTimeout(50);
  }

  const result = page.getByTestId("combat-result");
  await expect(result).toBeVisible();
  const aftermath = page.getByTestId("combat-aftermath");
  await expect(aftermath).toBeVisible();
  await expect(result.locator(".combat-result-card")).toHaveCount(0);

  const resultBox = await result.boundingBox();
  const aftermathBox = await aftermath.boundingBox();
  expect(resultBox).not.toBeNull();
  expect(aftermathBox).not.toBeNull();
  expect(aftermathBox!.width).toBeGreaterThan(resultBox!.width * 0.9);
  expect(Math.abs((aftermathBox!.y + aftermathBox!.height) - (resultBox!.y + resultBox!.height))).toBeLessThanOrEqual(2);
  await expect(page.getByTestId("combat-result-continue")).toBeFocused();
  await page.screenshot({ path: "docs/evidence/improve-017-2026-07-14/combat-aftermath-1280.png" });
  await page.keyboard.press("Enter");
  await expect(result).toHaveCount(0);
  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await page.screenshot({ path: "docs/evidence/improve-009-011-2026-07-14/06-same-cell-resume-1280.png" });
});

test("level growth is recorded inside the Japanese battle aftermath", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
  await startDebugRun(page, { progress: "floor_8", world: "verdant" });
  await walkUntilCombat(page);
  await page.getByTestId("debug-force-victory").click();

  const aftermath = page.getByTestId("combat-aftermath");
  await expect(aftermath).toBeVisible();
  await expect(aftermath.getByRole("heading", { name: "成長" })).toBeVisible();
  const growthRows = page.getByTestId("result-levelup-member");
  expect(await growthRows.count()).toBeGreaterThan(0);
  await expect(growthRows.first()).toContainText("レベルアップ");
  await expect(growthRows.first()).toContainText(/レベル \d+/);
  await expect(growthRows.first().locator("img")).toBeVisible();
  await expect(page.getByTestId("combat-result-continue")).toBeFocused();
  await page.screenshot({ path: "docs/evidence/improve-017-2026-07-14/level-growth-ja-1280.png" });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(aftermath).toBeVisible();
  await page.screenshot({ path: "docs/evidence/improve-017-2026-07-14/level-growth-ja-1920.png" });
});
