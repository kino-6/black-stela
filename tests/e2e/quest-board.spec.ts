import { expect, test } from "@playwright/test";
import { createStarterParty, startNewExpedition } from "./helpers";
import { CONTROLLER_VIEWPORT, expectControllerFocus, expectFitsViewport } from "./controllerGate";

// Q2 — the town quest board. Bounties and delivery tithes are authored data
// (content/worlds/*/quests.md); this proves the board is a real controller surface: reachable,
// focused, no-overlap at the 720p gate, and that accepting a contract updates its state. The
// reward/turn-in mechanics are locked by tests/quests.test.ts.
test.describe("quest board", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  test("a party can open the board, read the posted work, and take a contract", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape");

    // The board is a town service, reachable from the entry menu.
    await page.getByTestId("town-service-quests").click();
    const board = page.getByTestId("quest-board");
    await expect(board).toBeVisible();
    await expectFitsViewport(page, "quest board");

    // The authored contracts are posted (default world ships three).
    await expect(page.getByTestId("quest-list").locator(".quest-row")).toHaveCount(3);
    const glimmer = page.getByTestId("quest-quest.glimmer-hunt");
    await expect(glimmer).toContainText("Ashsilver Glimmer");
    await expect(glimmer.getByTestId("quest-progress-quest.glimmer-hunt")).toHaveText("0/1");

    // The cursor lands inside the board, on a live command — not off in nowhere.
    await expectControllerFocus(page, "quest board", { surface: "town-quests" });

    // Taking the contract moves it from "Available" to "In progress".
    await expect(page.getByTestId("quest-status-quest.glimmer-hunt")).toHaveText("Available");
    await page.getByTestId("quest-accept-quest.glimmer-hunt").click();
    await expect(page.getByTestId("quest-status-quest.glimmer-hunt")).toHaveText("In progress");
    // The accept button is gone — an accepted quest cannot be re-taken.
    await expect(page.getByTestId("quest-accept-quest.glimmer-hunt")).toHaveCount(0);

    // Cancel returns to town, board state intact.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("town-cockpit")).toBeVisible();
    await page.getByTestId("town-service-quests").click();
    await expect(page.getByTestId("quest-status-quest.glimmer-hunt")).toHaveText("In progress");
  });
});
