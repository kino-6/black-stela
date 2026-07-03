import { expect, test } from "@playwright/test";
import { resolveVisibleCombat, startNewExpedition } from "./helpers";

test("resolves tactical combat through visible actor, target, and round controls", async ({ page }) => {
  await startNewExpedition(page);

  await page.getByLabel("Name").fill("Mira");
  await page.getByRole("button", { name: "Add adventurer" }).click();
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enemy groups" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Party formation" })).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
  await expect(page.getByTestId("combat-actor")).toContainText("Mira");
  await expect(page.getByRole("button", { name: "Attack" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sleep" })).toBeVisible();

  await resolveVisibleCombat(page);

  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText(/Victory.*XP.*gold/i)).toBeVisible();
});
