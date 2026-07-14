import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  createStarterParty,
  descendB1fViaWarden,
  resolveVisibleCombat,
  startNewExpedition,
  walkB1fStairToMarker
} from "./helpers";
import { CONTROLLER_VIEWPORT, expectControllerFocus, expectFitsViewport } from "./controllerGate";

// IMP-013 / IMP-014 — the 6/6 guild screen and the recovery service.
/** One full expedition on the normal route: fight, descend, come back up, return to town. */
async function runExpedition(page: Page) {
  await page.getByTestId("town-enter-dungeon").click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await resolveVisibleCombat(page);
  await descendB1fViaWarden(page);
  await page.getByRole("button", { name: "Use stairs" }).click();
  await walkB1fStairToMarker(page);
  await page.getByRole("button", { name: "Use return marker" }).click();
  await expect(page.getByTestId("town-cockpit")).toBeVisible();
}

/**
 * Recovery only means anything with a hurt party, and whether a given fight lands a hit is luck.
 * So go down and come back until someone IS hurt, and let the recovery screen itself be the
 * judge of that — it is the thing under test. Bounded, so a genuinely un-hurtable party fails
 * loudly instead of hanging.
 */
async function returnToTownHurt(page: Page, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await runExpedition(page);
    await page.getByRole("button", { name: "Recovery" }).click();
    await expect(page.getByTestId("recovery-counter")).toBeVisible();
    if ((await page.locator(".recovery-row").count()) > 0) {
      return;
    }
    await page.getByTestId("recovery-cancel").click();
  }
  throw new Error(`the party survived ${attempts} expeditions untouched — recovery cannot be tested`);
}

test.describe("town services", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  // IMP-013. Completing a party and administering a roster are two jobs. The 6/6 screen was
  // doing both: under "Party ready" and the 3+3 it also carried six Bench buttons, the reserve,
  // the retired, the portable vault and a character sheet with Retire / Reclass / Deposit /
  // Edit — which ran to y=986 in a 720px frame.
  test("the 6/6 screen says one thing, and nothing peeks below the frame", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await expect(page.getByText("6/6")).toBeVisible();

    await expectFitsViewport(page, "guild 6/6");

    // Roster ADMINISTRATION is not on the completion screen.
    await expect(page.getByTestId("character-profile")).toHaveCount(0);
    await expect(page.getByTestId("adventurer-vault")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Bench" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retire" })).toHaveCount(0);

    // What IS there: the finished formation, and the two ways on.
    await expect(page.getByTestId("guild-front-row").locator(".party-member")).toHaveCount(3);
    await expect(page.getByTestId("guild-back-row").locator(".party-member")).toHaveCount(3);
    await expect(page.getByTestId("guild-roster-open")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enter dungeon" })).toBeVisible();
  });

  test("roster work is behind a command, and it is still reachable", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);

    await page.getByTestId("guild-roster-open").click();
    await expect(page.getByTestId("character-profile")).toBeVisible();
    await expect(page.getByRole("button", { name: "Bench" }).first()).toBeVisible();
    // A long roster may scroll inside its own panel — but the screen must not.
    await expectFitsViewport(page, "guild roster");

    // …and Cancel closes it, back to the completion screen.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("character-profile")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enter dungeon" })).toBeVisible();
  });

  // IMP-014. Recovery was a large empty field, then six plain cards spread edge to edge (five
  // saying "No treatment."), then a full-width submit the height of a paragraph. It read like a
  // web form. What a player needs is small, and it has to include the number that decides the
  // answer.
  test("recovery is a service counter: who is hurt, to what, at what price", async ({ page }) => {
    test.setTimeout(180_000); // an expedition is ~35s and we may need more than one hit to land
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape");

    await returnToTownHurt(page);

    const counter = page.getByTestId("recovery-counter");
    await expect(counter).toBeVisible();
    await expectFitsViewport(page, "recovery");

    // Only the wounded are listed — five cards saying "No treatment." is not information.
    const rows = page.locator(".recovery-row");
    const wounded = await rows.count();
    expect(wounded, "healthy members are being listed").toBeLessThan(6);

    // Every fact IMP-014 requires, on one row: name, HP before → after, and what it costs.
    const first = rows.first();
    await expect(first.locator(".recovery-hp")).toContainText(/\d+\/\d+/);
    await expect(first.locator(".recovery-cost")).toContainText(/\d/);
    await expect(page.getByTestId("recovery-total")).toBeVisible();

    // Confirm and cancel are commands, not a paragraph-sized submit — and the cursor starts on
    // the one the player came here to give.
    await expectControllerFocus(page, "recovery", { surface: "town-recovery" });
    const confirm = page.getByTestId("recovery-confirm");
    await expect(confirm).toBeEnabled();
    const box = (await confirm.boundingBox())!;
    expect(box.height, "the confirm button is a paragraph, not a command").toBeLessThan(60);
    expect(box.width, "the confirm button spans the whole screen").toBeLessThan(400);
    await expect(page.getByTestId("recovery-cancel")).toBeVisible();

    // And it works.
    await confirm.click();
    await expect(page.locator(".recovery-row")).toHaveCount(0);
  });

  test("a healthy party gets one line, not six empty cards", async ({ page }) => {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Recovery" }).click();

    await expect(page.getByTestId("recovery-plan")).toContainText("No treatment needed");
    await expect(page.locator(".recovery-row")).toHaveCount(0);
    await expect(page.getByTestId("recovery-confirm")).toBeDisabled();
    await expectFitsViewport(page, "recovery (healthy)");
  });
});
