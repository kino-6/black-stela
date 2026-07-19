import { expect, test } from "@playwright/test";
import { startDebugRun } from "./helpers";
import { CONTROLLER_VIEWPORT } from "./controllerGate";

// Real-browser verification of the reported "この戦闘終わらない" bug: the Verdant G2 keep squad
// (茨の盾 front blocker + 胞子撃き shielded back caster) hung auto-battle forever, because auto
// swung at the unreachable shielded group. This drives the ACTUAL party through the floor to the
// keep fight and proves auto now RESOLVES it — if the stall were still present, オート would never
// end and the poll below would time out.
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
    await startDebugRun(page, { progress: "floor_2", world: "verdant" });

    const enemyNames = async () =>
      page.locator(".enemy-mark-name").allInnerTexts().catch(() => [] as string[]);
    const inCombat = async () => (await page.getByTestId("combat-enemy-group").count()) > 0;
    const resultUp = async () => (await page.getByTestId("combat-result").count()) > 0;

    let clearedKeep = false;
    for (let step = 0; step < 30 && !clearedKeep; step += 1) {
      if (await resultUp()) {
        await page.getByTestId("combat-result-continue").click().catch(() => {});
        await page.waitForTimeout(150);
        continue;
      }
      if (await inCombat()) {
        const names = await enemyNames();
        const isKeep = names.some((n) => n.includes("茨の盾"));
        // Run オート and watch the fight END. A stall would never satisfy this.
        await page.getByTestId("combat-auto").click();
        await expect
          .poll(async () => ((await inCombat()) && !(await resultUp()) ? "fighting" : "done"), {
            message: isKeep ? "the 茨の番所 keep squad hung — auto-battle never ended" : "a fight hung under auto",
            timeout: 30_000
          })
          .toBe("done");
        if (isKeep) {
          clearedKeep = true;
          await page.screenshot({ path: "/private/tmp/claude-501/-Users-kinoshitayuki-work-black-stela/49ea553a-6563-4a3b-9e1d-476f1621a177/scratchpad/keep-cleared.png" });
        }
        continue;
      }
      // IMP-029 — a chest on the cell holds the command region (no auto-explore button); Leave it.
      if ((await page.getByTestId("chest-leave").count()) > 0) {
        await page.getByTestId("chest-leave").focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(60);
        continue;
      }
      // In the dungeon: auto-explore walks until the next fight (or the down-stair).
      const explore = page.getByTestId("debug-auto-explore");
      if (await explore.count()) {
        await explore.click();
        await page.waitForTimeout(250);
      } else {
        break;
      }
    }

    expect(clearedKeep, "never reached/cleared the 茨の番所 keep squad in 30 steps").toBe(true);
  });
});
