import { test, expect } from "@playwright/test";
import { createStarterParty, startNewExpedition } from "./helpers";

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

  await expect(page.getByRole("heading", { name: "Combat" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
});
