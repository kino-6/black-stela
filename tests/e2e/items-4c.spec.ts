import { expect, test } from "@playwright/test";
import { walkUntilCombat } from "./helpers";

/**
 * §9.4c — the item answers to a missing class must be reachable BY A PLAYER.
 *
 * Two ways this slice could have shipped dead, neither of which the unit suite can see: the combat item
 * menu filtered to healing/cure/focus, so a ward charm or a thrown flask would never have appeared in
 * it at all; and its target picker only ever listed party members, so a throwable had no shape of
 * command that could reach an enemy.
 */
test("a throwable is offered in combat and asks for an ENEMY, not an ally", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3&level=6&items=item.ember-flask,item.warding-charm");
  await page.waitForSelector('[data-testid="dungeon-canvas"]');
  await walkUntilCombat(page);

  await expect(page.getByTestId("combat-menu-item")).toBeVisible();
  await page.getByTestId("combat-menu-item").click();
  await page.waitForTimeout(120);

  const offered = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid^=combat-menu-]")).map((el) => el.getAttribute("data-testid") ?? "")
  );
  expect(offered.some((id) => id.includes("ember-flask")), `item menu showed: ${offered.join(", ")}`).toBe(true);
  expect(offered.some((id) => id.includes("warding-charm"))).toBe(true);

  // Choosing the flask must offer ENEMY GROUPS. Before §9.4c this submenu listed the party, so the
  // only thing a player could do with a thrown flask was pour it on a friend.
  await page.getByTestId("combat-menu-item.ember-flask").click();
  await page.waitForTimeout(120);
  const targets = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid^=combat-menu-]")).map((el) => el.getAttribute("data-testid") ?? "")
  );
  expect(targets.some((id) => id.includes("group.")), `flask target list was: ${targets.join(", ")}`).toBe(true);
});

test("a party-scope ward charm queues with no target prompt at all", async ({ page }) => {
  await page.goto("/?debug=1&progress=floor_3&level=6&items=item.warding-charm");
  await page.waitForSelector('[data-testid="dungeon-canvas"]');
  await walkUntilCombat(page);

  const ordersBefore = (await page.getByTestId("combat-order-list").textContent()) ?? "";
  await page.getByTestId("combat-menu-item").click();
  await page.waitForTimeout(120);
  await page.getByTestId("combat-menu-item.warding-charm").click();
  await page.waitForTimeout(150);

  // It must queue immediately — not strand the player in a target list it never needed.
  const ordersAfter = (await page.getByTestId("combat-order-list").textContent()) ?? "";
  expect(ordersAfter, `the charm must queue an order (was "${ordersBefore}")`).not.toBe(ordersBefore);
});
