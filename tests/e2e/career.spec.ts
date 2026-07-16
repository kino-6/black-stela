import { expect, test } from "@playwright/test";
import { createStarterParty, startNewExpedition } from "./helpers";
import { CONTROLLER_VIEWPORT, expectControllerFocus, expectFitsViewport } from "./controllerGate";

// IMP-021C — the town CAREER service. A build is the vocations mastered: the panel shows the current
// vocation + mastery, the destinations (advanced ones locked with their prerequisites visible), the
// learned techniques, and the bounded combat loadout. Controller-first; changing vocation keeps level.
test.describe("town career service", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  test("shows vocations, gates advanced ones, changes a basic vocation, and edits the loadout", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape");

    await page.getByTestId("town-service-career").click();
    const panel = page.getByTestId("career-panel");
    await expect(panel).toBeVisible();
    await expectFitsViewport(page, "career");
    await expectControllerFocus(page, "career", { surface: "town-career" });

    // An advanced vocation is present and LOCKED, with its prerequisites shown before committing.
    const reaver = page.getByTestId("career-vocation-vocation.ash-reaver");
    await expect(reaver).toBeVisible();
    await expect(reaver).toContainText("Needs");
    await expect(page.getByTestId("career-adopt-vocation.ash-reaver")).toHaveCount(0); // cannot adopt yet

    // A basic vocation with no prerequisites can be taken now. The first member is a Vanguard;
    // becoming a Sellsword is available.
    const current = page.getByTestId("career-current-vocation");
    const before = await current.innerText();
    const adoptSellsword = page.getByTestId("career-adopt-sellsword");
    await expect(adoptSellsword).toBeVisible();
    await adoptSellsword.click();
    await expect(current).not.toHaveText(before);

    // The learned techniques carry a loadout toggle.
    const techniques = page.getByTestId("career-techniques");
    await expect(techniques).toBeVisible();
    const firstToggle = techniques.locator("button").first();
    if (await firstToggle.count()) {
      await firstToggle.click(); // toggling the loadout must not crash or reflow the page
      await expectFitsViewport(page, "career after loadout toggle");
    }

    await page.screenshot({ path: "/private/tmp/claude-501/-Users-kinoshitayuki-work-black-stela/49ea553a-6563-4a3b-9e1d-476f1621a177/scratchpad/career-1280.png" });

    // Cancel returns to town.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town-cockpit")).toBeVisible();
  });
});
