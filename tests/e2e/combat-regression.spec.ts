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

  const menu = page.getByTestId("combat-command-menu");
  await page.getByTestId("combat-menu-item").click();
  // どうぐ first asks WHICH item (the consumable list), then WHO to use it on.
  await expect(menu).toContainText(/item|道具/i);
  await expect(menu).toContainText(/Healing Draught|治癒/i);
  // Pick the first consumable → a party-member target list appears (never auto-completes).
  await page.keyboard.press("Enter");
  await expect(menu).toContainText(/target|標的/i);
  await expect(menu).toContainText("Rook");
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

test("front-row members wield a 特技 (Skill) command, not just attack/defend (#8)", async ({ page }) => {
  await enterCombat(page);
  // The first actor is Rook (front-row vanguard); he now carries a 特技.
  const skill = page.getByTestId("combat-menu-spell");
  await expect(skill).toBeVisible();
  await expect(skill).toContainText(/Skill/);
});

test("オート and リピート are distinct controls (Repeat disarmed until a round runs)", async ({ page }) => {
  await enterCombat(page);
  // オート (continuous auto-battle) and リピート (re-run last round) are separate
  // buttons — the earlier confusion was one button that did neither clearly.
  await expect(page.getByTestId("combat-auto")).toBeVisible();
  await expect(page.getByTestId("combat-repeat-round")).toBeVisible();
  // Nothing has been carried out yet, so リピート has nothing to repeat.
  await expect(page.getByTestId("combat-repeat-round")).toBeDisabled();
  // The replay remap itself is unit-locked in tests/repeatOrders.test.ts.
});

test("a declared round PLAYS OUT on the battlefield with a floating damage number (#69)", async ({ page }) => {
  await enterCombat(page);
  await expect(page.getByTestId("combat-log")).toBeVisible();

  // Declare a round through the menu, then watch the round animate: the actual
  // fix is that the battlefield updates blow-by-blow (a floating damage number
  // rises on the struck target) BEFORE the result commits — not an instant snap
  // with a log trickling in afterward.
  const menu = page.getByTestId("combat-command-menu");
  let sawHitNumber = false;
  for (let step = 0; step < 60 && !sawHitNumber; step += 1) {
    if ((await menu.count()) > 0) {
      await menu.focus().catch(() => {});
      await page.keyboard.press("Enter");
    } else if ((await page.getByTestId("combat-confirm-round").count()) > 0) {
      // Confirm step (default ON): the "Fight" button is auto-focused — press it.
      await page.getByTestId("combat-confirm-execute").focus().catch(() => {});
      await page.keyboard.press("Enter");
    }
    if ((await page.getByTestId("hit-number").count()) > 0) {
      sawHitNumber = true;
      await expect(page.getByTestId("hit-number").first()).toContainText(/\d/);
      break;
    }
    if ((await page.getByTestId("dungeon-command-window").count()) > 0) break;
    await page.waitForTimeout(60);
  }
  expect(sawHitNumber).toBeTruthy();

  // The instant-log SKIP hides what happened, so it is a debug-only convenience — NOT offered in
  // normal Config. The default is paced playback, and a one-press auto command (全員でかかる) plays
  // back at 2x rather than skipping.
  await page.goto("/");
  await page.getByRole("button", { name: "Config" }).click();
  await expect(page.getByTestId("config-instant-combat-log")).toHaveCount(0);
});

test("a win shows a result screen with XP/gold, dismissed to continue (#81)", async ({ page }) => {
  await enterCombat(page);
  const menu = page.getByTestId("combat-command-menu");
  // Fight the intro to victory.
  for (let step = 0; step < 60; step += 1) {
    if ((await page.getByTestId("combat-result").count()) > 0) break;
    if ((await menu.count()) > 0) {
      await menu.focus().catch(() => {});
      await page.keyboard.press("Enter");
    } else if ((await page.getByTestId("combat-confirm-round").count()) > 0) {
      await page.getByTestId("combat-confirm-execute").focus().catch(() => {});
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(60);
  }
  // The victory result holds on screen (not a one-line flash) with the rewards.
  const result = page.getByTestId("combat-result");
  await expect(result).toBeVisible();
  await expect(page.getByTestId("result-xp")).toContainText(/\d/);
  await expect(page.getByTestId("result-gold")).toContainText(/\d/);
  // Dismissing it returns to exploring.
  await page.getByTestId("combat-result-continue").click();
  await expect(result).toHaveCount(0);
  // IMP-029 — the cleared chamber leaves a chest holding the cell; walk past it (Leave) to the dock.
  if ((await page.getByTestId("chest-leave").count()) > 0) {
    await page.getByTestId("chest-leave").focus();
    await page.keyboard.press("Enter");
  }
  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();
});

test("combat is a three-zone layout: enemy stage, one party strip, no side windows", async ({ page }) => {
  await enterCombat(page);
  // The enemy lives ON the stage (a large figure over the 3D view), not a side list.
  await expect(page.locator(".enemy-stage").getByTestId("combat-enemy-group").first()).toBeVisible();
  // The six members are ONE compact strip, not six big cards / a formation panel.
  await expect(page.getByTestId("party-strip")).toBeVisible();
  await expect(page.getByTestId("combat-actor")).toHaveCount(6);
  // The old separate enemy-list / formation windows are gone.
  await expect(page.getByRole("heading", { name: /Enemy groups|敵群/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Party formation|隊列/ })).toHaveCount(0);
});

test("after all orders are set, a confirm step gates the round (default ON) (#72)", async ({ page }) => {
  await enterCombat(page);
  const menu = page.getByTestId("combat-command-menu");
  // Command every actor; the round must NOT auto-start — a confirm step appears.
  for (let step = 0; step < 40 && (await page.getByTestId("combat-confirm-round").count()) === 0; step += 1) {
    if ((await menu.count()) > 0) {
      await menu.focus().catch(() => {});
      await page.keyboard.press("Enter");
    }
    if ((await page.getByTestId("dungeon-command-window").count()) > 0) break;
    await page.waitForTimeout(50);
  }
  await expect(page.getByTestId("combat-confirm-round")).toBeVisible();
  await expect(page.getByTestId("combat-confirm-execute")).toBeVisible();

  // It defaults to ON (you entered commands deliberately).
  await page.goto("/");
  await page.getByRole("button", { name: "Config" }).click();
  await expect(page.getByTestId("config-confirm-round")).toBeChecked();
});

test("オート also plays out blow-by-blow (not instant) (#73)", async ({ page }) => {
  await enterCombat(page);
  await page.getByTestId("combat-auto").click();
  // While Auto runs, rounds animate: a floating damage number appears on the stage
  // during playback — Auto no longer resolves the whole fight in an instant.
  let sawHit = false;
  for (let step = 0; step < 80 && !sawHit; step += 1) {
    if ((await page.getByTestId("hit-number").count()) > 0) sawHit = true;
    if ((await page.getByTestId("dungeon-command-window").count()) > 0) break;
    await page.waitForTimeout(70);
  }
  expect(sawHit).toBeTruthy();
});

test("auto-battle safety stops are a Config toggle (off by default)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Config" }).click();
  const toggle = page.getByTestId("config-auto-safety");
  await expect(toggle).toBeVisible();
  await expect(toggle).not.toBeChecked();
});
