import { expect, test } from "@playwright/test";
import { createStarterParty, startNewExpedition } from "./helpers";
import { CONTROLLER_VIEWPORT, expectControllerFocus, expectFitsViewport } from "./controllerGate";

// IMP-022C — the town APPRAISER. Reachable, controller-first, no-overlap. The appraise / lock /
// favorite / bulk-convert mechanics (and the protection guard) are locked by tests/loot.test.ts.
test.describe("town appraiser (loot)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  test("opens as a controller surface with the bulk-conversion section", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape");

    await page.getByTestId("town-service-loot").click();
    const panel = page.getByTestId("loot-panel");
    await expect(panel).toBeVisible();
    await expectFitsViewport(page, "appraiser");
    await expectControllerFocus(page, "appraiser", { surface: "town-loot" });

    // The bulk-conversion section is present; a fresh party carries no loose equipment, so it reads
    // as nothing-to-convert rather than offering a destructive action with no truthful preview.
    await expect(page.getByTestId("loot-bulk")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town-cockpit")).toBeVisible();
  });
});
