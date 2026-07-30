import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { registerAdventurer, resolveVisibleCombat, startNewExpedition } from "./helpers";

// IMP-029 browser Gate — the controller-only current-cell chest loop. A closed chest owns the command
// region; opening it restores exploration at once. The deeper chamber also proves that the player can
// select its best thief handler for traps and locks without a mouse.

// Grab the controller cursor onto a chest action and confirm it — directional keys navigate the chest
// ring (they no longer walk the party while a chest holds the cell).
async function confirmChestAction(page: Page, testid: string) {
  const target = page.getByTestId(testid);
  for (let hop = 0; hop < 6 && !(await target.evaluate((el) => el === document.activeElement).catch(() => false)); hop += 1) {
    await page.keyboard.press("ArrowRight");
  }
  await expect(target).toBeFocused();
  await page.keyboard.press("Enter");
}

async function reachChamberChest(page: Page, classId = "warrior") {
  await startNewExpedition(page);
  await registerAdventurer(page, { name: "Nim", classId });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  // The entrance landing has its own reward chest now — Leave it before descending.
  if ((await page.getByTestId("chest-leave").count()) > 0) {
    await confirmChestAction(page, "chest-leave");
    await expect(page.getByTestId("chest-panel")).toHaveCount(0);
  }
  await page.keyboard.press("w"); // step south into the chamber → the authored ash-slime fight
  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByTestId("chest-panel")).toBeVisible();
}

async function confirmRecommendedHandler(page: Page) {
  await expect(page.locator('[data-testid="chest-handler"]:focus')).toHaveCount(1);
  await page.keyboard.press("Enter");
}

test("opening a chest returns to exploration without a second confirmation", async ({ page }) => {
  await reachChamberChest(page, "thief");

  // The trapped and locked chest is closed, on the current cell, and grounded in the first-person view.
  await expect(page.getByTestId("chest-investigate")).toBeVisible();
  await expect(page.locator("[data-testid='dungeon-canvas']").first()).toHaveAttribute("data-chest-visual", "closed");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: "test-results/imp029/chest-closed-720.png" });

  await confirmChestAction(page, "chest-investigate");
  await confirmRecommendedHandler(page);
  if ((await page.getByTestId("chest-disarm").count()) > 0) {
    await confirmChestAction(page, "chest-disarm");
    await confirmRecommendedHandler(page);
  }
  await confirmChestAction(page, "chest-unlock");
  await confirmRecommendedHandler(page);
  await confirmChestAction(page, "chest-open");

  // Opening is final: no acknowledgement panel steals focus. The opened sprite remains in the scene,
  // while the normal dock and movement return immediately.
  await expect(page.getByTestId("chest-panel")).toHaveCount(0);
  await expect(page.locator("[data-testid='dungeon-canvas']").first()).toHaveAttribute("data-chest-visual", "open");
  await page.screenshot({ path: "test-results/imp029/chest-open-720.png" });
  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();
});

test("leaving hands the cell back to movement (the chest no longer holds the command region)", async ({ page }) => {
  await reachChamberChest(page);
  await confirmChestAction(page, "chest-leave");
  await expect(page.getByTestId("chest-panel")).toHaveCount(0);
  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();
  // Movement is restored — the party can walk off the cell.
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("chest-panel")).toHaveCount(0);
});
