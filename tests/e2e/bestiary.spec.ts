import { expect, test } from "@playwright/test";
import { createStarterParty, openTownService, startNewExpedition } from "./helpers";
import { CONTROLLER_VIEWPORT } from "./controllerGate";

// IMP-022D — the enemy record lives in the town Records service. A fresh party has met nothing, so
// the bestiary reads as empty rather than leaking data; accumulation + weakness reveal are locked by
// tests/bestiary.test.ts.
test.describe("bestiary in records", () => {
  test("the records service shows the bestiary section", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape");

    await openTownService(page, "Records");
    await expect(page.getByTestId("records-panel")).toBeVisible();
    const bestiary = page.getByTestId("bestiary");
    await expect(bestiary).toBeVisible();
    await expect(bestiary).toContainText("No enemies recorded yet");
  });
});
