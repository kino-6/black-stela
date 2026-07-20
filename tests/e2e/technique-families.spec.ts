import { expect, test } from "@playwright/test";
import { walkUntilCombat } from "./helpers";

/**
 * §9.4 — the new ability families are reachable BY A PLAYER, not merely by the resolver.
 *
 * The unit suite proves ward/buff/debuff/cure change a combat outcome. It cannot prove a player can ever
 * cast one, and that is exactly where this slice broke: the combat UI branched "ally → pick a party
 * member, ELSE pick an enemy group". A party-scope ward is neither, so it landed in the enemy branch,
 * the menu correctly never asked for a group, and the queued order was dropped on the floor. Selectable,
 * silent, and every unit test green. Only a real browser shows it.
 *
 * `level=6` is required: every debug preset starts the party at level 1, so the techniques learned above
 * level 1 are otherwise unreachable in the browser at all.
 */

/** Queue an attack for the current actor, which advances the menu to the next one. */
async function queueAttackAndAdvance(page: import("@playwright/test").Page) {
  await page.getByTestId("combat-menu-attack").click();
  await page.waitForTimeout(80);
  const ids = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid^=combat-menu-]")).map((el) => el.getAttribute("data-testid") ?? "")
  );
  const group = ids.find((id) => !/attack|spell|item|defend/.test(id));
  if (group) {
    await page.getByTestId(group).click();
  }
  await page.waitForTimeout(120);
}

/** Advance the command menu until the actor whose technique list contains `techniqueId`. */
async function advanceToCasterOf(page: import("@playwright/test").Page, techniqueId: string) {
  for (let actor = 0; actor < 6; actor += 1) {
    if ((await page.getByTestId("combat-menu-spell").count()) > 0) {
      await page.getByTestId("combat-menu-spell").click();
      await page.waitForTimeout(60);
      if ((await page.getByTestId(`combat-menu-${techniqueId}`).count()) > 0) {
        return true;
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(60);
    }
    await queueAttackAndAdvance(page);
  }
  return false;
}

test("every §9.4 family is offered to the class that learns it", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3&level=6");
  await page.waitForSelector('[data-testid="dungeon-canvas"]');
  await walkUntilCombat(page);

  const offered: string[] = [];
  for (let actor = 0; actor < 6; actor += 1) {
    if ((await page.getByTestId("combat-menu-spell").count()) > 0) {
      await page.getByTestId("combat-menu-spell").click();
      await page.waitForTimeout(60);
      offered.push(
        ...(await page.evaluate(() =>
          Array.from(document.querySelectorAll("[data-testid^=combat-menu-]")).map((el) => el.getAttribute("data-testid") ?? "")
        ))
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(60);
    }
    await queueAttackAndAdvance(page);
  }

  // The cure, the ward, the buff and the debuff each reached a real class's real menu.
  expect(offered).toContain("combat-menu-purge");
  expect(offered).toContain("combat-menu-ward-hymn");
  expect(offered).toContain("combat-menu-battle-hymn");
  expect(offered).toContain("combat-menu-sunder");
});

test("§9.4b every class brings a real line to the fight, the Knight most of all", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3&level=9");
  await page.waitForSelector('[data-testid="dungeon-canvas"]');
  await walkUntilCombat(page);

  const offered: string[] = [];
  for (let actor = 0; actor < 6; actor += 1) {
    if ((await page.getByTestId("combat-menu-spell").count()) > 0) {
      await page.getByTestId("combat-menu-spell").click();
      await page.waitForTimeout(60);
      const ids = await page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-testid^=combat-menu-]")).map((el) => el.getAttribute("data-testid") ?? "")
      );
      // Each actor's own list must be a LINE, not a lone move.
      expect(ids.length, `an actor offered only ${ids.length} technique(s)`).toBeGreaterThanOrEqual(5);
      offered.push(...ids);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(60);
    }
    await queueAttackAndAdvance(page);
  }

  // The Knight was a selectable class whose only move was Attack, right up until §9.4b.
  expect(offered).toContain("combat-menu-cover");
  expect(offered).toContain("combat-menu-shield-wall");
  // The Swordmaster was the other empty class — but the debug party has no Swordmaster, so what this
  // run can prove is the Knight; `techniqueLines.test.ts` holds the whole roster.
  expect(offered).toContain("combat-menu-dread");
  expect(offered).toContain("combat-menu-greater-heal");
  // §5's two corrections, visible on the screen: the Occultist no longer carries the Mage's firebolt,
  // and the Chanter heals with its own weaker art.
  expect(offered).not.toContain("combat-menu-firebolt");
  expect(offered).toContain("combat-menu-lesser-heal");
});

test("a party-scope ward casts with no target prompt, and resolves", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3&level=6");
  await page.waitForSelector('[data-testid="dungeon-canvas"]');
  await walkUntilCombat(page);

  expect(await advanceToCasterOf(page, "ward-hymn"), "the chanter must offer the ward").toBe(true);

  const ordersBefore = (await page.getByTestId("combat-order-list").textContent()) ?? "";
  await page.getByTestId("combat-menu-ward-hymn").click();
  await page.waitForTimeout(150);

  // THE REGRESSION: a party-scope technique must queue immediately. It must not strand the player in a
  // target submenu, and it must not vanish leaving the order count unchanged.
  await expect(page.getByTestId("combat-menu-ward-hymn")).toHaveCount(0);
  const ordersAfter = (await page.getByTestId("combat-order-list").textContent()) ?? "";
  expect(ordersAfter, `the ward must add a queued order (was "${ordersBefore}")`).not.toBe(ordersBefore);
});
