import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { advanceToB1fMarker, registerAdventurer, resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("repeat and keyboard commands keep the dungeon loop fast", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  // Space starts auto-explore, which walks into the first fight and stops there.
  await expect(page.getByRole("button", { name: "Auto", exact: true })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();

  // Resolve the fight through the command menu, then auto-explore resumes on Repeat
  // and stops at the next interesting tile — the loop stays fast and interruptible.
  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();

  await page.getByRole("button", { name: "Auto", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText("Auto move stopped: interesting event or unsafe state.")).toBeVisible();
});

test("combat and town recovery keep the loop playable", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await resolveVisibleCombat(page);
  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use return marker" })).toHaveCount(0);

  await advanceToB1fMarker(page);
  await expect(page.getByRole("heading", { name: "Warden's Hall" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Return", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
  await page.getByTestId("town-cockpit").getByRole("button", { name: "Recovery" }).click();
  await expect(page.getByRole("button", { name: "Recover party" })).toBeVisible();
});

test("Japanese tempo controls fit on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});

  await registerAdventurer(page, { locale: "ja", name: "ミラ" });
  await page.getByRole("button", { name: "迷宮に入る" }).click();

  await expect(page.getByRole("button", { name: "オート" })).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});

