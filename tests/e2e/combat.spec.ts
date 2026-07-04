import { expect, test } from "@playwright/test";
import { createStarterParty, focusControllerButton, registerAdventurer, resolveVisibleCombat, setTitleLanguage, startNewExpedition } from "./helpers";

test("resolves tactical combat through visible actor, target, and combat commands", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enemy groups" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Party formation" })).toBeVisible();
  await expect(page.getByTestId("party-hud")).toHaveCount(0);
  await expect(page.getByLabel("Mini-map")).toHaveCount(0);
  await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
  await expect(page.getByTestId("combat-enemy-group")).not.toContainText(/HP \d+/);
  await expect(page.getByRole("button", { name: /Ash Slime/ })).toHaveCount(0);
  await expect(page.getByTestId("combat-actor")).toContainText("Mira");
  await expect(page.getByRole("button", { name: "Attack" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Target" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resolve round" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sleep" })).toBeVisible();

  const combatBoardHeight = await page.getByLabel("Battle screen").evaluate((element) => element.getBoundingClientRect().height);
  expect(combatBoardHeight).toBeLessThan(390);
  const cockpitFitsViewport = await page.locator(".adventure-cockpit").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.bottom <= window.innerHeight + 1;
  });
  expect(cockpitFitsViewport).toBe(true);

  await resolveVisibleCombat(page);

  await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
  await expect(page.getByText(/Victory.*XP.*gold/i)).toBeVisible();
});

test("queues visible party orders before resolving a combat round", async ({ page }) => {
  await startNewExpedition(page);

  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Battle order" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fight" })).toBeDisabled();

  await page.getByRole("button", { name: "Attack" }).click();
  await expect(page.getByText("Round 1")).toBeVisible();
  await expect(page.getByTestId("combat-order-list")).toContainText("Mira");
  await expect(page.getByTestId("combat-order-list")).toContainText("Attack");
  await expect(page.getByRole("button", { name: "Fight" })).toBeEnabled();

  await page.getByRole("button", { name: "Take back" }).click();
  await expect(page.getByTestId("combat-order-list")).toContainText("No orders set.");
  await expect(page.getByRole("button", { name: "Fight" })).toBeDisabled();

  await page.getByRole("button", { name: "Attack" }).click();
  await page.getByRole("button", { name: "Fight" }).click();
  await expect(page.locator("body")).toContainText(/Round 2|Victory|Hall of Old Dust/);
});

test("combat commands advance through party order instead of clicked actor cards", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByRole("button", { name: /Ash Slime|灰泥/ })).toHaveCount(0);
  const actorNames = await page.getByTestId("combat-actor").locator("strong").allTextContents();
  const firstActor = actorNames[0];
  const clickedActor = actorNames.at(-1) ?? firstActor;
  await page.getByTestId("combat-actor").filter({ hasText: clickedActor }).click();
  await page.getByRole("button", { name: "Attack" }).click();

  await expect(page.getByTestId("combat-order-list")).toContainText(firstActor);
  if (clickedActor !== firstActor) {
    await expect(page.getByTestId("combat-order-list")).not.toContainText(clickedActor);
  }
});

test("six-member party keeps front and back rows visible in combat", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await expect(page.getByTestId("party-front-row").getByTestId("party-token")).toHaveCount(3);
  await expect(page.getByTestId("party-back-row").getByTestId("party-token")).toHaveCount(3);
  await page.getByRole("button", { name: "Move" }).click();

  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByTestId("combat-front-row")).toContainText("Front row");
  await expect(page.getByTestId("combat-back-row")).toContainText("Back row");
  await expect(page.getByTestId("combat-actor")).toHaveCount(6);

  const commandDockBefore = await page.getByLabel("Combat commands").evaluate((element) => element.getBoundingClientRect().top);
  await page.getByRole("button", { name: "Defend" }).click();
  await expect(page.getByTestId("combat-order-list")).toContainText("Defend");
  const commandDockAfter = await page.getByLabel("Combat commands").evaluate((element) => element.getBoundingClientRect().top);
  expect(Math.abs(commandDockAfter - commandDockBefore)).toBeLessThan(2);
});

test("keyboard-only command flow keeps command windows stable", async ({ page }) => {
  await startNewExpedition(page);

  await createStarterParty(page);
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  const dungeonDockBefore = await page
    .getByTestId("dungeon-command-window")
    .evaluate((element) => element.getBoundingClientRect().top);
  await focusControllerButton(page, "Move");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Battle screen")).toBeVisible();

  const combatDockBefore = await page
    .getByTestId("combat-command-window")
    .evaluate((element) => element.getBoundingClientRect().top);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("g");
  await expect(page.getByTestId("combat-order-list")).toContainText("Defend");
  const combatDockAfter = await page
    .getByTestId("combat-command-window")
    .evaluate((element) => element.getBoundingClientRect().top);

  expect(Math.abs(combatDockAfter - combatDockBefore)).toBeLessThan(2);
  expect(dungeonDockBefore).toBeGreaterThan(0);
});

test("Japanese mobile combat order remains readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setTitleLanguage(page, "ja");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await createStarterParty(page, "ja");
  await page.getByRole("button", { name: "迷宮に入る" }).click();
  await page.getByRole("button", { name: "進む" }).click();

  await expect(page.getByRole("heading", { name: "戦闘", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "戦闘指示" })).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group")).toContainText("灰泥");
  await expect(page.getByTestId("combat-enemy-group")).not.toContainText(/HP \d+/);
  await expect(page.getByText("Ash Slime")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "決定" })).toBeVisible();
  await expect(page.getByRole("button", { name: "一手戻す" })).toBeVisible();
  await page.getByRole("button", { name: "攻撃" }).click();
  await expect(page.getByTestId("combat-order-list")).toContainText("攻撃");

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(horizontalOverflow).toBe(false);
});
