import { expect, test } from "@playwright/test";
import { startDebugRun } from "./helpers";
import { CONTROLLER_VIEWPORT } from "./controllerGate";

// Real-browser verification of the reported "この戦闘終わらない" bug: the Verdant G2 keep squad
// (茨の盾 front blocker + 胞子撃き shielded back caster) hung auto-battle forever, because auto
// swung at the unreachable shielded group. This proves auto now RESOLVES it — if the stall were
// still present, オート would never end and the poll below would time out.
//
// The 番所 (guardpost) is a door-sealed chamber off the main path: auto-explore deliberately avoids
// undefeated squad rooms and a blind walker rarely opens its one door, so we START the party ON the
// keep cell (debug `at`) and step to re-enter it — the chamberGuardian re-triggers the squad — rather
// than gambling on navigation reaching it.
test.describe("verify: the shielded-squad fight no longer hangs", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await page.addInitScript(() => {
      window.localStorage.setItem("black-stela:settings:instant-combat-log", "on");
      window.localStorage.setItem("black-stela:settings:locale", "ja");
    });
  });

  test("auto clears the 茨の番所 keep squad instead of stalling", async ({ page }) => {
    test.setTimeout(120_000);
    // Start ON the guardpost cell facing south; stepping re-enters it and the chamberGuardian fires the squad.
    await startDebugRun(page, {
      progress: "floor_2",
      world: "verdant",
      at: "room.verdant.g2f.keep",
      facing: "south"
    });

    const enemyNames = async () =>
      page.locator(".enemy-mark-name").allInnerTexts().catch(() => [] as string[]);
    const inCombat = async () => (await page.getByTestId("combat-enemy-group").count()) > 0;
    const resultUp = async () => (await page.getByTestId("combat-result").count()) > 0;

    // Step (opening the door and re-entering) until the guardpost squad fires. Any wandering fight met on
    // the way is cleared by オート and the walk resumes; the 茨の盾 front-blocker marks the keep fight.
    // walkTick drives a 5-forward-then-turn pattern: the run of forwards opens-then-enters a door, and the
    // periodic turn frees the walker from a wall instead of pinning it (a plain double-tap would wedge).
    let clearedKeep = false;
    let walkTick = 0;
    for (let step = 0; step < 60 && !clearedKeep; step += 1) {
      if (await resultUp()) {
        await page.getByTestId("combat-result-continue").click().catch(() => {});
        await page.waitForTimeout(150);
        continue;
      }
      if (await inCombat()) {
        const isKeep = (await enemyNames()).some((n) => n.includes("茨の盾"));
        // Run オート and watch the fight END. A stall would never satisfy this.
        await page.getByTestId("combat-auto").click();
        await expect
          .poll(async () => ((await inCombat()) && !(await resultUp()) ? "fighting" : "done"), {
            message: isKeep ? "the 茨の番所 keep squad hung — auto-battle never ended" : "a fight hung under auto",
            timeout: 30_000
          })
          .toBe("done");
        clearedKeep = isKeep;
        continue;
      }
      // IMP-029 — a chest on the cell holds the command region; Leave it so a step can land.
      if ((await page.getByTestId("chest-leave").count()) > 0) {
        await page.getByTestId("chest-leave").focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(60);
        continue;
      }
      await page.keyboard.press(walkTick % 6 === 5 ? "ArrowLeft" : "ArrowUp");
      walkTick += 1;
      await page.waitForTimeout(80);
    }

    expect(clearedKeep, "never reached/cleared the 茨の番所 keep squad").toBe(true);
  });
});
