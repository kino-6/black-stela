import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { registerAdventurer, resolveVisibleCombat, startNewExpedition } from "./helpers";

// IMP-029 browser Gate — the controller-only chamber → fight → chest loop. Town → B1F chamber
// (Hall of Old Dust) → fight the ash-slime → a closed chest appears on the cell → investigate →
// (disarm) → open → resume. Proves grounding, current-cell integrity, closed/open display, controller
// focus/confirm, and no overlap (the parts headless cannot show). While a chest sits on the cell it
// OWNS the command region: arrows navigate its actions, Confirm acts, Leave hands the cell back.

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

async function reachChamberChest(page: Page) {
  await startNewExpedition(page);
  await registerAdventurer(page, { name: "Nim" });
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

test("a chamber chest is investigated, (disarmed), and opened by controller only", async ({ page }) => {
  await reachChamberChest(page);

  // Closed, on the current cell, grounded in the first-person view.
  await expect(page.getByTestId("chest-investigate")).toBeVisible();
  await expect(page.locator("[data-testid='dungeon-canvas']").first()).toHaveAttribute("data-chest-visual", "closed");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: "test-results/imp029/chest-closed-720.png" });

  // Investigate — a result note appears; success rates / difficulty are never shown.
  await confirmChestAction(page, "chest-investigate");
  await expect(page.getByTestId("chest-note")).not.toHaveText("");

  // If the trap was detected, disarm it; then open. Every step is directional + Confirm.
  if ((await page.getByTestId("chest-disarm").count()) > 0) {
    await confirmChestAction(page, "chest-disarm");
  }
  await confirmChestAction(page, "chest-open");

  // Opened: the sprite swaps to open and a resume action returns to exploring.
  await expect(page.getByTestId("chest-resume")).toBeVisible();
  await expect(page.locator("[data-testid='dungeon-canvas']").first()).toHaveAttribute("data-chest-visual", "open");
  await page.screenshot({ path: "test-results/imp029/chest-open-720.png" });

  // Chest, message, and command regions must not overlap.
  const chestBox = await page.getByTestId("chest-panel").boundingBox();
  const messageBox = await page.locator(".cockpit-message").boundingBox();
  expect(chestBox && messageBox && chestBox.y >= messageBox.y + messageBox.height - 1).toBeTruthy();

  await confirmChestAction(page, "chest-resume"); // resume → movement dock returns
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
