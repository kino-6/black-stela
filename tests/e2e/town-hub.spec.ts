import { expect, test } from "@playwright/test";
import { createStarterParty, openTownServiceByTestId, startNewExpedition } from "./helpers";
import { CONTROLLER_VIEWPORT, expectFitsViewport } from "./controllerGate";

// IMP-025 — the town's first level is a readable preparation loop, not a ten-button service grid.
// The square shows a handful of DESTINATIONS plus a clearly separated departure; every system is one
// step inside a destination and still reachable without a pointer or page scroll.
test.describe("town square is a preparation loop, not a service grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  test("the first level is at most five peer destinations plus a separated departure", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.getByRole("button", { name: "Back to town" }).click();

    const menu = page.locator(".town-service-menu");
    const buttons = menu.getByRole("button");
    // At most five: the destinations + the way down (was ten equal services).
    await expect(buttons).toHaveCount(5);
    // The departure is present and visually separated (the sole primary action).
    await expect(page.getByTestId("town-enter-dungeon")).toBeVisible();
    await expect(menu.locator("button.primary-action")).toHaveCount(1);
    // No individual system is exposed on the square itself.
    await expect(page.getByTestId("town-service-loot")).toHaveCount(0);
    await expect(page.getByTestId("town-service-career")).toHaveCount(0);
    await expectFitsViewport(page, "town square");
  });

  test("every prepared system is still reachable through a destination, without page scroll", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.getByRole("button", { name: "Back to town" }).click();

    const reach = async (testid: string, panelTestId: string) => {
      await openTownServiceByTestId(page, testid);
      await expect(page.getByTestId(panelTestId)).toBeVisible();
      const scrolls = await page.evaluate(() => document.scrollingElement!.scrollHeight > window.innerHeight + 2);
      expect(scrolls, `${testid} scrolled the page`).toBe(false);
    };

    await reach("town-service-career", "career-panel"); // guild hall
    await reach("town-service-loot", "loot-panel"); // market
    await reach("town-service-workshop", "workshop-panel"); // market
    await reach("town-service-quests", "quest-board"); // archive
    await reach("town-service-recovery", "recovery-counter"); // the square itself
  });
});
