import { expect, test } from "@playwright/test";
import { createStarterParty, openTownServiceByTestId, startNewExpedition } from "./helpers";
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

    await openTownServiceByTestId(page, "town-service-career");
    const panel = page.getByTestId("career-panel");
    await expect(panel).toBeVisible();
    await expectFitsViewport(page, "career");
    await expectControllerFocus(page, "career", { surface: "town-career" });

    // An advanced vocation is present and LOCKED, with its prerequisites shown before committing.
    const reaver = page.getByTestId("career-vocation-vocation.ash-reaver");
    await expect(reaver).toBeVisible();
    await expect(reaver).toContainText("Needs");
    await expect(page.getByTestId("career-adopt-vocation.ash-reaver")).toHaveCount(0); // cannot adopt yet

    // A basic vocation with no prerequisites can be taken now. The first member is a Warrior;
    // becoming a Knight (another basic) is available. (Was Vanguard→Sellsword before the 12→8 class
    // consolidation folded both into Warrior — see LEGACY_CLASS_MAPPING.)
    const current = page.getByTestId("career-current-vocation");
    const before = await current.innerText();
    // SFC/DQ3 flow: choosing a calling opens its preview+confirm, it never reclasses in one press
    // (CareerPanel: "the row IS the choice"). Pick Knight, then confirm on its preview sheet.
    const adoptKnight = page.getByTestId("career-adopt-knight");
    await expect(adoptKnight).toBeVisible();
    await adoptKnight.click();
    await expect(page.getByTestId("career-preview")).toBeVisible();
    await page.getByTestId("career-preview").getByRole("button", { name: "Reclass to this calling" }).click();
    await expect(current).not.toHaveText(before);

    // The learned techniques carry a loadout toggle.
    const techniques = page.getByTestId("career-techniques");
    await expect(techniques).toBeVisible();
    const firstToggle = techniques.locator("button").first();
    if (await firstToggle.count()) {
      await firstToggle.click(); // toggling the loadout must not crash or reflow the page
      await expectFitsViewport(page, "career after loadout toggle");
    }

    // Cancel returns to town.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town-cockpit")).toBeVisible();
  });
});
