import { expect, test } from "@playwright/test";
import { createStarterParty, focusControllerButton, registerAdventurer, startNewExpedition } from "./helpers";

test("normal play surfaces support directional focus, confirm, and cancel", async ({ page }) => {
  await startNewExpedition(page);

  await focusControllerButton(page, "Skip explanation");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("guild-step-class")).toBeVisible();

  await focusControllerButton(page, "Next");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("guild-step-appearance")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("guild-step-class")).toBeVisible();

  await createStarterParty(page);
  await focusControllerButton(page, "Enter dungeon");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();

  await focusControllerButton(page, "Move");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Battle screen")).toBeVisible();

  await focusControllerButton(page, "Attack");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("combat-order-list")).toContainText("Attack");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("combat-order-list")).toContainText("No orders set.");
});

test("town, shop, config, and repeat surfaces remain controller reachable", async ({ page }) => {
  await page.goto("/");

  await focusControllerButton(page, "Config");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Config" })).toBeVisible();
  await expect(page.getByLabel("Language")).toBeFocused();

  await startNewExpedition(page);
  await createStarterParty(page);

  await focusControllerButton(page, "Shop");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Stela Gate General Store" })).toBeVisible();
  await focusControllerButton(page, "Consumables");
  await page.keyboard.press("Enter");
  await focusControllerButton(page, "Buy Healing Draught");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Bought Healing Draught for 25 gold.")).toBeVisible();

  await focusControllerButton(page, "Records");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Records" })).toBeVisible();
  await focusControllerButton(page, "Dungeon Entry");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Enter dungeon" })).toBeVisible();
  await focusControllerButton(page, "Enter dungeon");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
});

test("repeat mode can be started and stopped through confirm focus", async ({ page }) => {
  await startNewExpedition(page);
  await registerAdventurer(page, { name: "Mira" });
  await page.getByRole("button", { name: "Enter dungeon" }).click();

  await focusControllerButton(page, "Repeat");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Repeat stopped.")).toBeVisible();
});
