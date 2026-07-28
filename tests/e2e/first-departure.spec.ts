import { expect, test } from "@playwright/test";
import { createStarterParty, descendB1fViaWarden, startNewExpedition, walkB1fStairToMarker } from "./helpers";
import { CONTROLLER_VIEWPORT } from "./controllerGate";

// IMP-008 — a first departure is not a return.
//
// There was no state anywhere distinguishing "has never gone below" from "came back", so the
// town greeted a freshly built party with "Town return", a "Return record" reading
// `Rook joined the roster.` (that is `latestLogText` — the last LOG LINE, which for a new party
// is the last recruit), and the news that they could descend AGAIN. Nothing had happened yet.
//
// The town redesign then dropped the return-GREETING furniture entirely: the heading is the WORLD
// TITLE, and the only "return" signal is a quiet last-log NOTE under it — absent until the party has
// actually been below. So the regression cannot recur, and this now asserts that clean signal.
test.describe("first departure", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  test("a party that has never gone below is not greeted as if it came back", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape"); // leave the guild

    const town = page.getByTestId("town-cockpit");
    // The heading is the place (the world's own title), never a first-departure/return greeting.
    await expect(town).toContainText("Black Stela - Gate of Ash");
    // No return note and no wounds ledger before there is anything to return from.
    await expect(page.getByTestId("town-return-note")).toHaveCount(0);
    await expect(page.getByTestId("town-return-ledger")).toHaveCount(0);
    // None of the old return furniture may appear before there is anything to return from.
    await expect(town).not.toContainText("Town return");
    await expect(town).not.toContainText("Return record");
    await expect(town).not.toContainText("descend again");
    // …and above all, the last recruit joining is not an expedition result.
    await expect(town).not.toContainText("joined the roster");
  });

  test("the return note appears once the party has actually returned", async ({ page }) => {
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
    // The heading stays the world title; the last-log NOTE now appears — this party has been below.
    await expect(town).toContainText("Black Stela - Gate of Ash");
    await expect(page.getByTestId("town-return-note")).toBeVisible();
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
    await expect(town).toContainText("黒碑 — 灰の門");
    await expect(page.getByTestId("town-return-note")).toHaveCount(0);
    await expect(town).not.toContainText("帰還");
    await expect(town).not.toContainText("もう一度");
  });
});
