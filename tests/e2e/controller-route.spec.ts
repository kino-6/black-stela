import { expect, test, type Page } from "@playwright/test";
import {
  activateByController,
  createStarterParty,
  createStarterPartyByController,
  startExpeditionByController,
  startNewExpedition
} from "./helpers";
import {
  CONTROLLER_VIEWPORT,
  expectControllerFocus,
  expectFitsViewport,
  expectNoMouseUsed,
  expectSelectionMatchesFocus,
  installMouseSpy,
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
// "No mouse" is MEASURED here, not declared: installMouseSpy counts real pointerdown/mousedown
// events, so if a helper ever quietly reverts to locator.click() the claim fails loudly rather
// than rotting into a comment that is no longer true.
//
// Failure category: `controller_input` (docs/gates/browser-selfplay-gate.md).

// `npm run gate:final` (FINAL_GATE=1) strips any test.fail() marker, so a known gap cannot hide
// behind Playwright's "expected failure = pass". There is no marker left in this file — keep it
// that way, and run the final gate before calling the backlog done.
/** Front row first, then back row — the order AGENTS.md requires commands to be given in. */
async function formationOrder(page: Page) {
  const front = await page.locator('.party-strip-group[data-row="front"] .pt-name').allTextContents();
  const back = await page.locator('.party-strip-group[data-row="back"] .pt-name').allTextContents();
  return [...front, ...back].map((name) => name.trim());
}

/** Walk until something jumps us. Arrows move the PARTY in the dungeon, not the focus cursor. */
async function walkIntoCombat(page: Page, maxSteps = 120) {
  for (let step = 0; step < maxSteps; step += 1) {
    if ((await page.getByTestId("combat-enemy-group").count()) > 0) {
      return;
    }
    await page.keyboard.press(step % 5 === 4 ? "ArrowLeft" : "ArrowUp");
    await page.waitForTimeout(90);
  }
  throw new Error("walked the floor without meeting anything");
}

test.describe("controller route (no mouse)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT); // 1280x720 — the size the playtest used
    await installMouseSpy(page);
  });

  test("the title screen hands the player a cursor", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "New expedition" })).toBeVisible();
    await expectControllerFocus(page, "title");
    await expectFitsViewport(page, "title");
    await expectNoMouseUsed(page, "title");
  });

  test("the scenario picker can be answered with a controller", async ({ page }) => {
    await page.goto("/");
    await activateByController(page, "New expedition");
    await expect(page.getByTestId("scenario-card-default")).toBeVisible();

    // A controller player arriving here must already have a cursor — Tab is not a gamepad button.
    await expectControllerFocus(page, "scenario picker", { surface: "scenario" });
    await expectFitsViewport(page, "scenario picker");
    await expectSelectionMatchesFocus(page, "scenario picker");

    // Directional input must move the selection — and must not fling the cursor out of the
    // picker into some other surface, which a bare "the label changed" check would accept.
    const before = await readFocus(page);
    await moveFocus(page, "down");
    const after = await readFocus(page);
    expect(after.label, "the scenario selection does not move on Down").not.toBe(before.label);
    expect(after.surface, "Down threw the cursor out of the scenario picker").toBe("scenario");

    // Cancel must back out to the title AND hand the cursor back, not strand it.
    await pressCancel(page);
    await expect(page.getByTestId("scenario-card-default")).toHaveCount(0);
    await expectControllerFocus(page, "title (after Cancel)");
    expect(
      (await readFocus(page)).label,
      "Cancel left the title screen without the cursor on its command"
    ).toContain("New expedition");

    await expectNoMouseUsed(page, "scenario picker");
  });

  test("Confirm starts the scenario the cursor is actually on", async ({ page }) => {
    await page.goto("/");
    await activateByController(page, "New expedition");
    await expect(page.getByTestId("scenario-card-verdant")).toBeVisible();

    // Put the cursor on Verdant specifically, then Confirm. The run that starts must be the one
    // the player was pointing at — the town's "looks selected but isn't" bug, in miniature.
    await activateByController(page, /Verdant|翠碑/);
    await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Verdant|翠碑|Heartwood/i);
    await expectNoMouseUsed(page, "scenario confirm");
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

  // IMP-003 landed: the guild hall and the registration form no longer share a screen, so the
  // cursor cannot wander out of the step being asked for, and the roster scrolls inside its own
  // panel instead of running to 1370px. The test.fail marker is gone — this must stay green.
  test("six adventurers can be recruited without a mouse, and focus is never dropped", async ({ page }) => {
    await startExpeditionByController(page);
    await expectControllerFocus(page, "guild (on entry)", { exclusive: true });
    await expectFitsViewport(page, "guild (on entry)");

    await createStarterPartyByController(page);
    await expect(page.getByText("6/6")).toBeVisible();
    await expectControllerFocus(page, "guild (party complete)");
    await expectFitsViewport(page, "guild (party complete)");
    await expectNoMouseUsed(page, "guild");
  });

  test("the town's selected command is the focused command", async ({ page }) => {
    await startExpeditionByController(page);
    await createStarterPartyByController(page);
    await pressCancel(page); // Cancel leaves the guild — a controller must not have to hunt for the exit

    await expectControllerFocus(page, "town");
    await expectFitsViewport(page, "town");
    // The playtest pressed Enter on a gold "Enter dungeon" and landed in the Guild.
    await expectSelectionMatchesFocus(page, "town");
  });

  test("the dungeon and a full combat round are playable with keys alone", async ({ page }) => {
    await startExpeditionByController(page);
    await createStarterPartyByController(page);
    await pressCancel(page);
    await activateByController(page, "Enter dungeon");

    await expect(page.getByTestId("dungeon-canvas").first()).toBeVisible();
    await expectControllerFocus(page, "dungeon");
    await expectFitsViewport(page, "dungeon");

    await walkIntoCombat(page);

    // Combat is where "controller-first" is a blocking rule, and where the dock went missing.
    await expectControllerFocus(page, "combat", { surface: "combat-menu" });
    await expectFitsViewport(page, "combat");
    await expectSelectionMatchesFocus(page, "combat");

    // Command EVERY actor, and prove it. A loop that breaks as soon as the menu disappears can
    // "succeed" having commanded nobody — a test that asserts its own convenience.
    const expected = await formationOrder(page);
    expect(expected.length, "the party strip does not show six members").toBe(6);

    const commanded: string[] = [];
    for (let actor = 0; actor < 6; actor += 1) {
      const head = (await page.locator(".combat-command-menu-head").first().textContent()) ?? "";
      const name = expected.find((member) => head.includes(member));
      expect(name, `combat asked for a command from someone not in the party: "${head}"`).toBeTruthy();
      commanded.push(name!);

      await pressConfirm(page); // Attack
      await pressConfirm(page); // first living target
      await page.waitForTimeout(90);
      await expectFitsViewport(page, `combat (after actor ${actor + 1})`);
    }

    // AGENTS.md: commands advance through party members in FORMATION order (front, then back) —
    // not in whatever order a mouse happened to click actor cards in.
    expect(commanded, "combat did not ask the six members in formation order").toEqual(expected);

    // …and the round must actually RESOLVE, not merely stop asking. Resolution shows up as
    // blows in the log — or, if the six of them finished the fight outright, as the victory
    // screen (which unmounts the log along with the rest of the combat cockpit).
    const confirm = page.getByTestId("combat-confirm-execute");
    if (await confirm.isVisible().catch(() => false)) {
      await pressConfirm(page);
    }
    await expect(
      page.locator(".combat-log-beat").first().or(page.getByTestId("combat-result")),
      "the six orders were given but the round never resolved"
    ).toBeVisible({ timeout: 10_000 });
  });

  // Every test above seeds localStorage to skip the round-confirm step and the beat playback.
  // That is fine for route coverage, but it means NO test walks the game a player is actually
  // shipped. This one changes no settings at all.
  test("the shipped defaults are playable on a controller (no settings tampering)", async ({ page }) => {
    await page.goto("/");
    await activateByController(page, "New expedition");
    await activateByController(page, /Black Stela|黒碑/);

    await createStarterPartyByController(page);
    await pressCancel(page);
    await activateByController(page, "Enter dungeon");
    await walkIntoCombat(page);

    await expectControllerFocus(page, "combat (shipped defaults)", { surface: "combat-menu" });
    await expectFitsViewport(page, "combat (shipped defaults)");

    for (let actor = 0; actor < 6; actor += 1) {
      if (!(await page.getByTestId("combat-command-menu").isVisible().catch(() => false))) {
        break;
      }
      await pressConfirm(page);
      await pressConfirm(page);
      await page.waitForTimeout(90);
    }

    // With the shipped defaults the round does NOT auto-resolve: a confirm step gates it, and
    // the blows then play out beat by beat. Both must be reachable from the keyboard.
    const confirm = page.getByTestId("combat-confirm-execute");
    await expect(confirm, "the shipped confirm step never appeared").toBeVisible({ timeout: 5000 });
    await expectFitsViewport(page, "combat confirm (shipped defaults)");
    await pressConfirm(page);
    await expect(
      page.locator(".combat-log-beat").first().or(page.getByTestId("combat-result")),
      "the round never resolved under the shipped defaults"
    ).toBeVisible({ timeout: 15_000 });
  });
});
