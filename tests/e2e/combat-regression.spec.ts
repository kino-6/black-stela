import { test, expect } from "@playwright/test";

// Regression cover for the 2026-07-11 combat playtest troubles (see
// docs/gates/past-trouble-regression-gate.md). These are the exact things a player
// found by hand in ~3 minutes; each must now be caught automatically.

async function enterCombat(page: import("@playwright/test").Page) {
  await page.goto("/?debug=1&progress=ready");
  await page.getByRole("button", { name: "Enter dungeon" }).click();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("combat-command-menu")).toBeVisible();
}

test("the command menu is fully navigable by WASD (and confirms / backs)", async ({ page }) => {
  await enterCombat(page);

  // S moves the cursor down off Attack; W moves it back up.
  await page.keyboard.press("s");
  await expect(page.getByTestId("combat-menu-attack")).not.toHaveAttribute("aria-current", "true");
  await page.keyboard.press("w");
  await expect(page.getByTestId("combat-menu-attack")).toHaveAttribute("aria-current", "true");

  // D confirms into the target submenu; A backs out to the command list.
  await page.keyboard.press("d");
  await expect(page.getByTestId("combat-command-menu")).toContainText(/target|標的/i);
  await page.keyboard.press("a");
  await expect(page.getByTestId("combat-command-menu")).toContainText(/command|コマンド/i);
});

test("using an item opens a target submenu (never completes with no selection)", async ({ page }) => {
  await enterCombat(page);

  await page.getByTestId("combat-menu-item").click();
  // An item command must ask WHO to use it on — a party member appears as a target.
  await expect(page.getByTestId("combat-command-menu")).toContainText(/target|標的/i);
  await expect(page.getByTestId("combat-command-menu")).toContainText("Rook");
});

test("HP and MP render as gauge bars, not bare numbers", async ({ page }) => {
  await enterCombat(page);
  // The gauges live in the scrollable combat rail; scroll each into view as a
  // player would, then confirm they render as visible meter bars.
  const hp = page.getByTestId("combat-hp-gauge").first();
  await hp.scrollIntoViewIfNeeded();
  await expect(hp).toBeVisible();
  await expect(hp).toHaveAttribute("role", "meter");

  const mp = page.getByTestId("combat-mp-gauge").first();
  await mp.scrollIntoViewIfNeeded();
  await expect(mp).toBeVisible();
});

test("the front row's Attack is enabled (a real command, not a lone toolbar)", async ({ page }) => {
  await enterCombat(page);
  // The first actor is front row (#64) and can attack (#65 reach not needed up front).
  await expect(page.getByTestId("combat-menu-attack")).toBeEnabled();
});

test("auto-battle safety stops are a Config toggle (off by default)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Config" }).click();
  const toggle = page.getByTestId("config-auto-safety");
  await expect(toggle).toBeVisible();
  await expect(toggle).not.toBeChecked();
});
