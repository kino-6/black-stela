import { expect, test, type Page } from "@playwright/test";
import {
  activateByController,
  createStarterPartyByController
} from "./helpers";
import {
  CONTROLLER_VIEWPORT,
  expectControllerFocus,
  expectFitsViewport,
  expectNoMouseUsed,
  installMouseSpy,
  pressCancel
} from "./controllerGate";

const evidenceDir = "test-results/codex-imp-021-022";

async function reachTown(
  page: Page,
  options: {
    locale: "en" | "ja";
    scenario: string | RegExp;
  }
) {
  await installMouseSpy(page);
  await page.addInitScript((locale) => {
    window.localStorage.setItem("black-stela:settings:locale", locale);
    window.localStorage.setItem("black-stela:settings:instant-combat-log", "on");
    window.localStorage.setItem("black-stela:settings:confirm-round", "off");
  }, options.locale);
  await page.goto("/");
  await activateByController(page, options.locale === "ja" ? "新たな探索" : "New expedition");
  if (await page.getByTestId("scenario-card-default").isVisible().catch(() => false)) {
    await activateByController(page, options.scenario);
  }
  await createStarterPartyByController(page, options.locale);
  await pressCancel(page);
  await expectControllerFocus(page, "town after recruitment");
}

test.describe("Codex verification for IMP-021 / IMP-022", () => {
  test("default career route is controller-only at 1920x1080", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await reachTown(page, { locale: "en", scenario: /Black Stela|Gate of Ash/ });

    await activateByController(page, "Guild hall");
    await activateByController(page, "Vocations");
    await expect(page.getByTestId("career-panel")).toBeVisible();
    await expect(page.locator(".career-vocation.career-advanced")).toHaveCount(6);
    await expect(page.getByTestId("career-vocation-vocation.needle-dancer")).toContainText("Needle Dancer");
    await expectControllerFocus(page, "default career", { surface: "town-career", exclusive: true });
    await expectFitsViewport(page, "default career");

    await activateByController(page, /Become Sellsword/);
    await expect(page.getByTestId("career-current-vocation")).toContainText("Sellsword");
    await expectFitsViewport(page, "default career after vocation change");
    await page.screenshot({ path: `${evidenceDir}/default-career-1920.png`, fullPage: false });

    await expectNoMouseUsed(page, "default career route");
  });

  test("Verdant career route is localized and controller-only at 1280x720", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await reachTown(page, { locale: "ja", scenario: /翠碑|沈む樹心/ });

    await activateByController(page, "ギルド館");
    await activateByController(page, "生業");
    await expect(page.getByTestId("career-panel")).toBeVisible();
    const advancedVocations = page.locator(".career-vocation.career-advanced");
    await expect(advancedVocations).toHaveCount(6);
    await expect(page.getByTestId("career-vocation-vocation.verdant.briar-reaver")).toContainText("茨砕き");
    expect((await advancedVocations.allTextContents()).join(" ")).not.toMatch(
      /vanguard|sellsword|bulwark|duelist|seeker|scout|cutpurse|mender|chanter|occultist|arcanist|wayfinder/i
    );
    await expectControllerFocus(page, "Verdant career", { surface: "town-career", exclusive: true });
    await expectFitsViewport(page, "Verdant career");
    await page.screenshot({ path: `${evidenceDir}/verdant-career-ja-1280.png`, fullPage: false });

    await expectNoMouseUsed(page, "Verdant career route");
  });

  test("the appraiser is reachable without a pointer at the minimum viewport", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await reachTown(page, { locale: "ja", scenario: /黒碑|灰の門/ });

    await activateByController(page, "市場通り");
    await activateByController(page, "鑑定所");
    await expect(page.getByTestId("loot-panel")).toBeVisible();
    await expect(page.getByTestId("loot-bulk")).toBeVisible();
    await expectControllerFocus(page, "appraiser", { surface: "town-loot", exclusive: true });
    await expectFitsViewport(page, "appraiser");
    await page.screenshot({ path: `${evidenceDir}/appraiser-ja-1280.png`, fullPage: false });

    await pressCancel(page);
    await expect(page.getByTestId("town-cockpit")).toBeVisible();
    await expectNoMouseUsed(page, "appraiser route");
  });

  test("the workshop (materials sink) is reachable without a pointer at the minimum viewport", async ({ page }) => {
    await page.setViewportSize(CONTROLLER_VIEWPORT);
    await reachTown(page, { locale: "ja", scenario: /黒碑|灰の門/ });

    await activateByController(page, "市場通り");
    await activateByController(page, "錬成所");
    await expect(page.getByTestId("workshop-panel")).toBeVisible();
    await expect(page.getByTestId("workshop-list")).toBeVisible();
    // The starter party wears gear, so at least one reinforce control is present (materials gate it).
    await expect(page.locator('[data-testid^="workshop-reinforce-"]').first()).toBeVisible();
    await expectControllerFocus(page, "workshop", { surface: "town-workshop", exclusive: true });
    await expectFitsViewport(page, "workshop");
    await page.screenshot({ path: `${evidenceDir}/workshop-ja-1280.png`, fullPage: false });

    await pressCancel(page);
    await expect(page.getByTestId("town-cockpit")).toBeVisible();
    await expectNoMouseUsed(page, "workshop route");
  });
});
