import { expect, test } from "@playwright/test";
import { createStarterParty, descendB1fViaWarden, startNewExpedition, walkB1fStairToMarker } from "./helpers";
import { CONTROLLER_VIEWPORT } from "./controllerGate";

// IMP-008 — a first departure is not a return.
//
// There was no state anywhere distinguishing "has never gone below" from "came back", so the
// town greeted a freshly built party with "Town return", a "Return record" reading
// `Rook joined the roster.` (that is `latestLogText` — the last LOG LINE, which for a new party
// is the last recruit), no wounds, nothing carried, and the news that they could descend AGAIN.
// Nothing had happened yet. GameState now counts expeditions.
test.describe("first departure", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  test("a party that has never gone below is not greeted as if it came back", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape"); // leave the guild

    await expect(page.getByTestId("town-first-departure")).toBeVisible();
    const town = page.getByTestId("town-cockpit");

    // None of the return furniture may appear before there is anything to return from.
    await expect(town).not.toContainText("Town return");
    await expect(town).not.toContainText("Return record");
    await expect(town).not.toContainText("descend again");
    // …and above all, the last recruit joining is not an expedition result.
    await expect(town).not.toContainText("joined the roster");

    await expect(town).toContainText("Before the first descent");
    await expect(town).toContainText("6 registered");
  });

  test("the return state comes back once the party has actually returned", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape");
    await page.getByTestId("town-enter-dungeon").click();

    // Go below, come back through the authored return marker.
    await descendB1fViaWarden(page);
    await page.getByRole("button", { name: "Use stairs" }).click();
    await walkB1fStairToMarker(page);
    await page.getByRole("button", { name: "Use return marker" }).click();

    const town = page.getByTestId("town-cockpit");
    await expect(town).toContainText("Town return");
    await expect(town).toContainText("Return record");
    // The first-departure ledger is gone for good — this party HAS been below.
    await expect(page.getByTestId("town-first-departure")).toHaveCount(0);
  });

  test("Japanese normal play does not tell a fresh party it can descend 'again'", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Config" }).click();
    await page.getByLabel("Language").selectOption("ja");
    await page.getByRole("button", { name: /設定/ }).first().click();
    await page.getByRole("button", { name: "新たな探索" }).click();
    await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});
    await createStarterParty(page, "ja");
    await page.keyboard.press("Escape");

    const town = page.getByTestId("town-cockpit");
    await expect(town).toContainText("初めて潜る前に");
    await expect(town).not.toContainText("帰還");
    await expect(town).not.toContainText("もう一度");
  });
});
