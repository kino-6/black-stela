import { expect, test } from "@playwright/test";
import { startDebugRun, walkUntilCombat } from "./helpers";
import { CONTROLLER_VIEWPORT, expectFitsViewport } from "./controllerGate";

// The enemy-stage rebuild, locked numerically.
//
// What real play reported: "the enemy art is oddly small and floats off the dungeon", and
// "the log window and enemy status cards make the UI stretch and shrink violently". Both
// came from the same root: enemies were drawn TWICE — as sprites in the 3D view and again
// as DOM cards below it — and the cards, the log and the command menu all resized with
// their contents, so every blow re-flowed the screen.
test.describe("combat stage", () => {
  // The no-reflow lock below asserts the layout does not MOVE. It said nothing about whether
  // the layout FITS, so it stayed green at 1280x720 while the command dock (オート / リピート /
  // 退却) hung below the fold at y=719..786 on a page that does not scroll — the commands were
  // simply unreachable. Half a lock is not a lock. (IMP-005)
  test("every combat command is on screen at 1280x720", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await startDebugRun(page, { progress: "floor_2" });
    await walkUntilCombat(page);
    await expectFitsViewport(page, "combat");
  });

  test("enemy cards are gone — the creatures are the only representation", async ({ page }) => {
    await startDebugRun(page, { progress: "floor_2" });
    await walkUntilCombat(page);

    // The old card row is gone for good.
    await expect(page.locator(".enemy-figure")).toHaveCount(0);
    await expect(page.locator(".enemy-figure-count")).toHaveCount(0);

    // What is left is a mark planted on the creatures themselves: a name and an HP bar,
    // positioned from the renderer's anchors rather than laid out in the page.
    const mark = page.getByTestId("combat-enemy-group").first();
    await expect(mark).toBeVisible();
    await expect(mark.locator(".enemy-mark-name")).toBeVisible();
    await expect(mark.locator(".enemy-hp")).toBeVisible();

    // Anchored, not stacked: the mark carries an explicit position from the 3D scene.
    const positioned = await mark.evaluate((el) => {
      const style = getComputedStyle(el);
      return { position: style.position, left: el.style.left, top: el.style.top };
    });
    expect(positioned.position).toBe("absolute");
    expect(positioned.left).toMatch(/%$/);
    expect(positioned.top).toMatch(/%$/);

    // A count of N is N bodies in the corridor, so the mark must not re-state it as "×N".
    await expect(mark.locator(".enemy-mark-name")).not.toContainText("×");
  });

  test("all six adventurers keep portraits, level, and complete vitals in combat", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await startDebugRun(page, { progress: "floor_2" });
    await walkUntilCombat(page);

    const tokens = page.getByTestId("combat-actor");
    await expect(tokens).toHaveCount(6);
    await expect(page.getByTestId("combat-party-portrait")).toHaveCount(6);
    await expect(page.getByTestId("combat-front-row").getByTestId("combat-actor")).toHaveCount(3);
    await expect(page.getByTestId("combat-back-row").getByTestId("combat-actor")).toHaveCount(3);

    for (const token of await tokens.all()) {
      await expect(token).toContainText(/Lv \d+/);
      await expect(token).toContainText(/HP \d+\/\d+/);
      await expect(token).toContainText(/MP (?:\d+\/\d+|—)/);
    }

    await expectFitsViewport(page, "combat party identity");
    await page.screenshot({ path: "docs/evidence/improve-012-2026-07-14/combat-party-default-1280.png" });
  });

  test("Verdant combat resolves the scenario portrait set for all six members", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
    await startDebugRun(page, { progress: "floor_2", world: "verdant" });
    await walkUntilCombat(page);

    const portraits = page.getByTestId("combat-party-portrait");
    await expect(portraits).toHaveCount(6);
    const sources = await portraits.evaluateAll((images) => images.map((image) => image.getAttribute("src") ?? ""));
    expect(
      sources.every((source) => /\/(?:gate|ruin|vial|coin|map|ward|road|pit|ink|grave|dock|cloak)(?:-|\.png)/.test(source)),
      `unexpected portrait source: ${sources.join(", ")}`
    ).toBe(true);
    await expectFitsViewport(page, "Verdant combat party identity");
    await page.screenshot({ path: "docs/evidence/improve-012-2026-07-14/combat-party-verdant-ja-1280.png" });
  });

  test("the layout does not move while the fight plays out", async ({ page }) => {
    await startDebugRun(page, { progress: "floor_2" });
    await walkUntilCombat(page);

    const zones = [".enemy-stage", ".party-strip", ".combat-message", ".combat-command-zone"];
    const measure = async () =>
      Promise.all(
        zones.map(async (selector) => {
          const box = await page.locator(selector).first().boundingBox();
          return { selector, top: Math.round(box!.y), height: Math.round(box!.height) };
        })
      );

    const before = await measure();

    // Play a full round: order every actor, confirm, and let the beats play back — the
    // exact sequence during which the screen used to breathe in and out.
    for (let i = 0; i < 6; i += 1) {
      const menu = page.getByTestId("combat-command-menu");
      if (!(await menu.isVisible().catch(() => false))) {
        break;
      }
      await page.keyboard.press("Enter"); // Attack
      await page.keyboard.press("Enter"); // first target
      await page.waitForTimeout(60);
    }
    const confirm = page.getByTestId("combat-confirm-execute");
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
    await page.waitForTimeout(900); // mid-playback: beats revealing, log filling

    const during = await measure();
    // …and after the round has fully resolved.
    await page.waitForTimeout(1600);
    const after = await measure();

    for (const [i, zone] of zones.entries()) {
      // The combat may have ended (victory overlay) — then the zones are gone and there is
      // nothing to compare. The point is that WHILE fighting, nothing moves.
      expect(during[i].height, `${zone} height changed mid-round`).toBe(before[i].height);
      expect(during[i].top, `${zone} moved mid-round`).toBe(before[i].top);
      if (after[i]) {
        expect(after[i].height, `${zone} height changed after the round`).toBe(before[i].height);
      }
    }
  });

  test("Auto and fast Auto replace the reserved command region without moving combat", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await startDebugRun(page, { progress: "floor_2" });
    await walkUntilCombat(page);

    const selectors = [".enemy-stage", ".party-strip", ".combat-message", ".combat-command-zone", ".combat-command-window"];
    const measure = async () =>
      Promise.all(selectors.map(async (selector) => {
        const box = (await page.locator(selector).first().boundingBox())!;
        return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
      }));
    const before = await measure();

    await page.getByTestId("combat-auto").click();
    await expect(page.getByTestId("tempo-indicator")).toBeVisible();
    const normal = await measure();
    await page.getByTestId("tempo-speed").click();
    const fast = await measure();

    expect(normal).toEqual(before);
    expect(fast).toEqual(before);
    await page.getByTestId("tempo-stop").click();
  });

  test("the live combat band shows current context without becoming a history focus stop", async ({ page }) => {
    await startDebugRun(page, { progress: "floor_2" });
    await walkUntilCombat(page);

    const beats = page.locator(".combat-log-beats");
    const before = (await beats.boundingBox())!.height;

    for (let i = 0; i < 6; i += 1) {
      const menu = page.getByTestId("combat-command-menu");
      if (!(await menu.isVisible().catch(() => false))) {
        break;
      }
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(60);
    }
    const confirm = page.getByTestId("combat-confirm-execute");
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
    await page.waitForTimeout(2200);

    const box = await beats.boundingBox().catch(() => null);
    if (box) {
      expect(Math.round(box.height), "the log box grew with its contents").toBe(Math.round(before));
      expect(await page.getByTestId("combat-log").evaluate((el) => el.tagName)).toBe("DIV");
      expect(await page.locator(".combat-log-context").count()).toBeLessThanOrEqual(1);
      expect(await page.locator(".combat-log-beat").count()).toBe(1);
    }
  });

  test("Verdant small packs meet the combat framing floor and use the stage width", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
    await startDebugRun(page, { progress: "floor_2", world: "verdant" });
    await walkUntilCombat(page);

    const canvas = page.getByTestId("dungeon-canvas");
    await expect.poll(async () => Number(await canvas.getAttribute("data-combat-minimum-silhouette"))).toBeGreaterThanOrEqual(72);
    const stageWidth = (await page.locator(".enemy-stage").boundingBox())!.width;
    const formationWidth = Number(await canvas.getAttribute("data-combat-formation-width"));
    expect(formationWidth / stageWidth).toBeGreaterThanOrEqual(0.4);
    expect(formationWidth / stageWidth).toBeLessThanOrEqual(0.65);
    await page.screenshot({ path: "docs/evidence/improve-009-011-2026-07-14/03-verdant-combat-1280.png" });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect.poll(async () => (await page.locator(".enemy-stage").boundingBox())?.height ?? 0).toBeGreaterThan(500);
    const stage1080 = (await page.locator(".enemy-stage").boundingBox())!;
    const canvas1080 = (await canvas.boundingBox())!;
    // The stage and its inner view each contribute a 1px border. Anything beyond
    // those four edge pixels means the generic exploration canvas cap has leaked
    // back into combat and recreated the large black void seen in IMP-011.
    expect(Math.abs(stage1080.height - canvas1080.height)).toBeLessThanOrEqual(4);
    const webglCanvas = canvas.locator("canvas");
    await expect.poll(async () => (await webglCanvas.boundingBox())?.height ?? 0).toBeGreaterThan(500);
    const rendererSize = await webglCanvas.evaluate((element) => ({
      cssHeight: element.clientHeight,
      bufferHeight: (element as HTMLCanvasElement).height,
      pixelRatio: window.devicePixelRatio
    }));
    expect(Math.abs(stage1080.height - rendererSize.cssHeight)).toBeLessThanOrEqual(5);
    expect(rendererSize.bufferHeight).toBeGreaterThanOrEqual(rendererSize.cssHeight * rendererSize.pixelRatio - 2);
    expect(Number(await canvas.getAttribute("data-combat-minimum-silhouette"))).toBeGreaterThan(72);
    await page.screenshot({ path: "docs/evidence/improve-009-011-2026-07-14/04-verdant-combat-1920.png" });
  });

  test("the four commands fit their box — 防御 is not clipped off the bottom", async ({ page }) => {
    await startDebugRun(page, { progress: "floor_2" });
    await walkUntilCombat(page);

    const list = page.locator(".combat-command-menu-list").first();
    await expect(list).toBeVisible();
    const fit = await list.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
    expect(fit.scroll, "the command menu overflows its own reserved height").toBeLessThanOrEqual(fit.client);
  });
});
