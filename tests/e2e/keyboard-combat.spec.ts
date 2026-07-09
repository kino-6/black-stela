import { test, expect } from "@playwright/test";
import { createStarterParty, startNewExpedition } from "./helpers";

/**
 * Gate (AGENTS §Combat & Party UI Standards, rule 7): combat must be fully playable
 * by keyboard alone — no mouse. Drive an entire fight from move-in to victory with
 * only key presses, using a FULL six-member party (three back-row who cannot strike),
 * so a stall on a back-row member would fail this. F = act (attack, else defend);
 * X = execute the round.
 */
test("a fight can be fought to victory by keyboard alone", async ({ page }) => {
  await startNewExpedition(page);
  await createStarterParty(page);
  // Entering the dungeon is a town action; from here on, keyboard only.
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();

  // Walk into the intro fight with the keyboard (ArrowUp = move forward).
  await page.keyboard.press("ArrowUp");
  await expect(page.getByLabel("Battle screen")).toBeVisible();

  // Fight it out: F acts for each of the six actors in turn (back-row members
  // fall back to Defend rather than stalling), then X executes the round.
  for (let round = 0; round < 12; round += 1) {
    if (await page.getByRole("heading", { name: "Combat" }).isHidden().catch(() => true)) {
      break;
    }
    for (let actor = 0; actor < 6; actor += 1) {
      await page.keyboard.press("f");
      await page.waitForTimeout(25);
    }
    await page.keyboard.press("x");
    await page.waitForTimeout(160);
  }

  // The fight is over (won) and we never touched the mouse in combat.
  await expect(page.getByRole("heading", { name: "Combat" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
});
