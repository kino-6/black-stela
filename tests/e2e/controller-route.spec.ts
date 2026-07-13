import { expect, test } from "@playwright/test";
import {
  activateByController,
  createStarterPartyByController,
  startExpeditionByController
} from "./helpers";
import {
  CONTROLLER_VIEWPORT,
  expectControllerFocus,
  expectFitsViewport,
  expectSelectionMatchesFocus,
  moveFocus,
  pressCancel,
  pressConfirm,
  readFocus
} from "./controllerGate";

// IMP-001 — the browser Gate must be able to FAIL.
//
// The 2026-07-13 hand playtest found `npm run selfplay:browser` passing in 38.5s while the
// game could not be played with a controller at all: the scenario picker had no focus cursor,
// focus fell to BODY after every guild recruit, the town painted one command gold while
// focusing another, and the combat command dock sat below the fold. The suite could not see
// any of it, because the route is 100% locator.click() and the only overflow check is on the
// HORIZONTAL axis.
//
// AGENTS.md:137 — "A player-facing change is not done unless Playwright or screenshot
// evidence proves keyboard/controller style traversal for the changed surface. Mouse support
// is allowed only as a secondary convenience; it cannot be the only visible or tested path."
//
// This spec walks the whole normal route with directional keys, Confirm and Cancel ONLY, and
// asserts at every screen that (a) a controller cursor exists, (b) the commands are on
// screen, and (c) what LOOKS selected IS what is focused.
//
// Failure category: `controller_input` (docs/gates/browser-selfplay-gate.md).
test.describe("controller route (no mouse)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT); // 1280x720 — the size the playtest used
  });

  test("the title screen hands the player a cursor", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "New expedition" })).toBeVisible();
    await expectControllerFocus(page, "title");
    await expectFitsViewport(page, "title");
  });

  test("the scenario picker can be answered with a controller", async ({ page }) => {
    await page.goto("/");
    await activateByController(page, "New expedition");
    await expect(page.getByTestId("scenario-card-default")).toBeVisible();

    // A controller player arriving here must already have a cursor — Tab is not a gamepad button.
    await expectControllerFocus(page, "scenario picker");
    await expectFitsViewport(page, "scenario picker");

    // Directional input must move the selection.
    const before = await readFocus(page);
    await moveFocus(page, "down");
    const after = await readFocus(page);
    expect(after.label, "the scenario selection does not move on Down").not.toBe(before.label);

    // Cancel must back out to the title rather than trapping the player.
    await pressCancel(page);
    await expect(page.getByRole("button", { name: "New expedition" })).toBeVisible();
  });

  test("a scenario card never shows its raw pack id", async ({ page }) => {
    await page.goto("/");
    await activateByController(page, "New expedition");
    await expect(page.locator('[data-testid^="scenario-card-"]').first()).toBeVisible();

    // AGENTS.md: normal play must not expose raw route ids. Compare each card's visible text
    // against its OWN pack id rather than a word-boundary regex — "Gate of Ashdefault" has no
    // word boundary before "default", so a naive /\bdefault\b/ would miss the leak entirely.
    const leaks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid^="scenario-card-"]')).flatMap((card) => {
        const id = (card.getAttribute("data-testid") || "").replace("scenario-card-", "");
        return Array.from(card.querySelectorAll("*"))
          .filter((node) => (node.textContent || "").trim().toLowerCase() === id.toLowerCase())
          .map((node) => `${id}: <${node.tagName.toLowerCase()}> renders the raw pack id`);
      })
    );
    expect(leaks, `scenario cards leak raw pack ids — ${leaks.join("; ")}`).toEqual([]);
  });

  test("six adventurers can be recruited without a mouse, and focus is never dropped", async ({ page }) => {
    await startExpeditionByController(page);
    await expectControllerFocus(page, "guild (on entry)");
    await expectFitsViewport(page, "guild (on entry)");

    const labels = { skip: "Skip explanation", yes: "Yes" };
    if (await page.getByRole("button", { name: labels.skip }).isVisible().catch(() => false)) {
      await activateByController(page, labels.skip);
    }

    for (let index = 0; index < 6; index += 1) {
      await activateByController(page, labels.yes);
      await expect(page.getByTestId("guild-suggestion")).toBeVisible();
      // The proposal appearing must not drop the cursor.
      await expectControllerFocus(page, `guild (proposal ${index + 1})`);

      await activateByController(page, labels.yes);
      await expect(page.getByText(`${index + 1}/6`)).toBeVisible();
      // …and neither must accepting it.
      await expectControllerFocus(page, `guild (after recruit ${index + 1})`);
      await expectFitsViewport(page, `guild (after recruit ${index + 1})`);
    }
  });

  test("the town's selected command is the focused command", async ({ page }) => {
    await startExpeditionByController(page);
    await createStarterPartyByController(page);
    await activateByController(page, "Back to town");

    await expectControllerFocus(page, "town");
    await expectFitsViewport(page, "town");
    // The playtest pressed Enter on a gold "Enter dungeon" and landed in the Guild.
    await expectSelectionMatchesFocus(page, "town");
  });

  test("the dungeon and a full combat round are playable with keys alone", async ({ page }) => {
    await startExpeditionByController(page);
    await createStarterPartyByController(page);
    await activateByController(page, "Back to town");
    await activateByController(page, "Enter dungeon");

    await expect(page.getByTestId("dungeon-canvas").first()).toBeVisible();
    await expectControllerFocus(page, "dungeon");
    await expectFitsViewport(page, "dungeon");

    // Walk until something meets us. Arrows move the party in the dungeon (they do not move
    // focus there) — that is the DRPG convention this route must honour.
    for (let step = 0; step < 90; step += 1) {
      if ((await page.getByTestId("combat-enemy-group").count()) > 0) {
        break;
      }
      await page.keyboard.press(step % 5 === 4 ? "ArrowLeft" : "ArrowUp");
      await page.waitForTimeout(90);
    }
    await expect(page.getByTestId("combat-enemy-group").first()).toBeVisible();

    // Combat is where "controller-first" is a blocking rule, and where the dock went missing.
    await expectControllerFocus(page, "combat", { surface: "combat-menu" });
    await expectFitsViewport(page, "combat");
    await expectSelectionMatchesFocus(page, "combat");

    // Command all six actors: Attack -> first target, in formation order.
    for (let actor = 0; actor < 6; actor += 1) {
      const menu = page.getByTestId("combat-command-menu");
      if (!(await menu.isVisible().catch(() => false))) {
        break;
      }
      await pressConfirm(page); // Attack
      await pressConfirm(page); // first target
      await page.waitForTimeout(80);
      await expectFitsViewport(page, `combat (after actor ${actor + 1})`);
    }
  });
});
