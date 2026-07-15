import { expect, test } from "@playwright/test";
import { CONTROLLER_VIEWPORT, expectFitsViewport } from "./controllerGate";
import { startDebugRun, startNewExpedition, walkUntilCombat } from "./helpers";

const pixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

test("character creation previews one image in every gameplay context", async ({ page }, testInfo) => {
  await page.setViewportSize(CONTROLLER_VIEWPORT);
  await startNewExpedition(page);
  await page.getByRole("button", { name: "Skip explanation" }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: "Next" }).click();

  await expect(page.getByTestId("visual-preview-token")).toBeVisible();
  await expect(page.getByTestId("portrait-preview")).toBeVisible();
  await expect(page.getByTestId("visual-preview-battle")).toBeVisible();
  await page.getByTestId("portrait-input").setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: pixelPng });
  await page.getByTestId("battle-art-input").setInputFiles({ name: "battle.png", mimeType: "image/png", buffer: pixelPng });

  const portrait = page.getByTestId("portrait-preview");
  const before = await portrait.getAttribute("style");
  const moveRight = page.getByRole("button", { name: "Move portrait focus right" });
  await moveRight.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => portrait.getAttribute("style")).not.toBe(before);
  await expectFitsViewport(page, "character visual authoring");
  await page.screenshot({ path: testInfo.outputPath("character-visual-authoring.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "mobile character visual authoring must not overflow horizontally"
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("character-visual-authoring-mobile.png"), fullPage: true });
});

test("the active combat actor owns a stable large-art lane", async ({ page }, testInfo) => {
  await page.setViewportSize(CONTROLLER_VIEWPORT);
  await startDebugRun(page, { progress: "floor_2" });
  await walkUntilCombat(page);

  const presence = page.getByTestId("character-presence");
  await expect(presence).toBeVisible();
  await expect(presence.getByTestId("character-presence-art")).toBeVisible();
  const firstActorId = await presence.getAttribute("data-character-id");

  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect.poll(() => presence.getAttribute("data-character-id")).not.toBe(firstActorId);
  await expectFitsViewport(page, "combat character presence");
  await page.screenshot({ path: testInfo.outputPath("combat-character-presence.png"), fullPage: true });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expectFitsViewport(page, "combat character presence at review viewport");
  await page.screenshot({ path: testInfo.outputPath("combat-character-presence-1920.png"), fullPage: true });
});

test("a room event acknowledges one rule-selected adventurer without exposing AI controls", async ({ page }, testInfo) => {
  await page.goto("/?debug=1&progress=floor_3&at=room.b3f.003&facing=north");
  const presence = page.getByTestId("event-character-presence");
  await expect(presence).toBeVisible();
  await expect(presence).toHaveAttribute("data-character-id", /.+/);
  await expect(page.getByText(/provider|model|local ai|プロバイダー|ローカルAI/i)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("event-character-presence.png"), fullPage: true });
});
