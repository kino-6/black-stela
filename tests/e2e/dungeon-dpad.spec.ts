import { expect, test } from "@playwright/test";
import { createStarterParty, resolveVisibleCombat, startNewExpedition } from "./helpers";
import { CONTROLLER_VIEWPORT, expectFitsViewport } from "./controllerGate";

// IMP-026 — exploration is directional input plus current-cell decisions, not an
// eleven-button web toolbar. Movement/turn/strafe are keyboard/gamepad only; the
// command window carries at most five relevant actions and auto is a compact status,
// never the first command in the room.
test.describe("dungeon exploration is a d-pad, not a toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
  });

  async function enterDungeon(page: import("@playwright/test").Page) {
    await startNewExpedition(page);
    await createStarterParty(page);
    await page.getByRole("button", { name: "Back to town" }).click();
    await page.getByRole("button", { name: "Enter dungeon" }).click();
    await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
  }

  test("no movement/turn/strafe buttons exist — directional input does it, without a pointer", async ({ page }) => {
    await enterDungeon(page);

    const dock = page.getByTestId("dungeon-command-window");
    // The six movement verbs must not appear as command buttons any more.
    for (const name of ["Move", "Back", "Turn left", "Turn right", "Sidestep left", "Sidestep right"]) {
      await expect(dock.getByRole("button", { name, exact: true })).toHaveCount(0);
    }

    // Keyboard alone moves the party into the entrance-room fight — no button, no pointer.
    await page.keyboard.press("w");
    await expect(page.getByLabel("Battle screen")).toBeVisible();
  });

  test("the command window shows at most five current-cell actions, and auto is a separate compact status", async ({ page }) => {
    await enterDungeon(page);

    const dock = page.getByTestId("dungeon-command-window");
    // Primary commands = the current-cell decisions only (search/listen/party/map plus
    // any authored cell action). Auto rides in a separate status chip, excluded here.
    const commands = dock.locator("button:not(.tempo-status)");
    const count = await commands.count();
    expect(count).toBeLessThanOrEqual(5);
    expect(count).toBeGreaterThan(0);

    // Auto is present but is NOT the first command in the room.
    const tempo = page.getByTestId("dungeon-tempo");
    await expect(tempo).toBeVisible();
    const first = dock.locator("button").first();
    await expect(first).not.toHaveAttribute("data-testid", "dungeon-tempo");

    // A non-focusable movement legend replaces the direction buttons.
    const legend = page.getByTestId("dungeon-move-legend");
    await expect(legend).toBeVisible();
    await expect(legend).toHaveAttribute("aria-hidden", "true");

    await expectFitsViewport(page, "dungeon command dock");
  });

  test("auto starts and interrupts immediately from its compact status", async ({ page }) => {
    await enterDungeon(page);
    // Clear the entrance fight so auto has somewhere to walk.
    await page.keyboard.press("w");
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
      await resolveVisibleCombat(page);
    }
    // IMP-029 — the tutorial chamber now leaves a chest; walk away from it (Leave) to restore the dock.
    if ((await page.getByTestId("chest-leave").count()) > 0) {
      await page.getByTestId("chest-leave").focus();
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("dungeon-command-window")).toBeVisible();

    const tempo = page.getByTestId("dungeon-tempo");
    await tempo.click();
    await expect(tempo).toHaveAttribute("aria-pressed", "true");
    // Immediate interrupt — one more press stops it.
    await tempo.click();
    await expect(tempo).toHaveAttribute("aria-pressed", "false");
  });
});
