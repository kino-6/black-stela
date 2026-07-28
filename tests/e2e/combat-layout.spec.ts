import { expect, test, type Page } from "@playwright/test";
import { startDebugRun, walkUntilCombat } from "./helpers";

// IMP-024 — the combat command surface must not hide the enemies it informs, and the party must
// read as a 3+3 formation. Stage-height / silhouette checks passed while the menu blurred the
// creatures behind it, so this asserts real SCREEN GEOMETRY: while choosing, no enemy mark may
// intersect any HUD band, and the front/back tags must be present.
async function enterCombatChoosing(page: Page) {
  await page.addInitScript(() => window.localStorage.setItem("black-stela:settings:locale", "ja"));
  await startDebugRun(page, { progress: "floor_4", world: "verdant" });
  await walkUntilCombat(page);
  await expect(page.getByTestId("combat-command-menu")).toBeVisible();
  await page.waitForTimeout(500); // let the stage re-render into the choosing frame
}

for (const vp of [
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1920x1080", width: 1920, height: 1080 }
]) {
  test(`no enemy mark hides behind the command HUD while choosing (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await enterCombatChoosing(page);

    // The command zone is the topmost HUD band while choosing; every persistent band sits below it.
    // So "no enemy mark intersects any HUD band" reduces to: every mark's VISIBLE bottom is above the
    // command zone's top edge. Marks live inside `.enemy-stage`, which is `overflow: hidden` — a mark
    // anchored at a low creature's feet (a big foe grounded near the front, e.g. the 棘虫 at 1080p) has a
    // layout box that runs past the stage, but the overflowing part is CLIPPED and never painted. So clamp
    // each mark's bottom to the stage's clip edge before comparing: what the player can SEE is what counts.
    const cmd = await page.locator(".combat-command-zone").boundingBox();
    expect(cmd, "command zone must be laid out").toBeTruthy();
    const stage = await page.locator(".enemy-stage").boundingBox();
    expect(stage, "enemy stage must be laid out").toBeTruthy();
    const stageBottom = stage!.y + stage!.height;
    const marks = await page.locator(".enemy-mark").all();
    expect(marks.length, "at least one enemy on the stage").toBeGreaterThan(0);
    for (const mark of marks) {
      const box = await mark.boundingBox();
      if (!box) continue;
      const visibleBottom = Math.min(box.y + box.height, stageBottom); // overflow:hidden clips at the stage
      expect(
        visibleBottom,
        `an enemy mark (visible bottom ${Math.round(visibleBottom)}) overlaps the command band (top ${Math.round(cmd!.y)})`
      ).toBeLessThanOrEqual(Math.round(cmd!.y) + 1);
    }

    // The formation reads as 3 front + 3 back, tagged at the group level (no per-actor row labels).
    await expect(page.getByTestId("combat-front-row")).toContainText("前衛");
    await expect(page.getByTestId("combat-back-row")).toContainText("後衛");
    await expect(page.getByTestId("combat-front-row").getByTestId("combat-actor")).toHaveCount(3);
    await expect(page.getByTestId("combat-back-row").getByTestId("combat-actor")).toHaveCount(3);
  });
}
