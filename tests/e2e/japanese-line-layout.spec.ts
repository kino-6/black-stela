import { test, expect, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createStarterParty } from "./helpers";
import { analyzeLineLayout, assertNoOrphanWrap } from "./lineLayout";

/**
 * Japanese line-layout gate (BS-192) + representative message-box capture
 * (BS-193). Drives the normal Japanese player route to each layout-sensitive
 * message box, asserts no one-character orphan wrap or stranded line-start
 * punctuation, and writes screenshots for review.
 */

const dir = "test-results/ja-line-layout";

async function useJapanese(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("black-stela:settings:locale", "ja");
  });
}

test("Japanese message boxes wrap without orphan tails or stranded punctuation", async ({ page }) => {
  await mkdir(dir, { recursive: true });
  let shotIndex = 0;
  const capture = async (name: string) => {
    shotIndex += 1;
    await page.screenshot({ path: join(dir, `${String(shotIndex).padStart(2, "0")}-${name}.png`), fullPage: true });
  };
  const check = async (locator: Locator, label: string, shot: string) => {
    await expect(locator, `${label} が見つかりません`).toBeVisible();
    const report = await assertNoOrphanWrap(locator, label);
    await capture(shot);
    return report;
  };

  await useJapanese(page);
  await page.goto("/");

  // 1) Guild master briefing
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});
  await check(page.getByText("潜る気か", { exact: false }), "ギルド説明", "guild-briefing");

  // 2) Quick-recruit prompt (guild master speech during recruiting)
  await page.getByRole("button", { name: "登録を始める" }).click().catch(() => undefined);
  const recruitPrompt = page.getByText("迷うなら、見繕うが", { exact: false });
  if (await recruitPrompt.isVisible().catch(() => false)) {
    await check(recruitPrompt, "見繕いの誘い", "recruit-prompt");
  }

  // Build the six-person party and reach the ready copy.
  await page.goto("/");
  await page.getByRole("button", { name: "新たな探索" }).click();
  await page.getByTestId("scenario-card-default").click({ timeout: 5000 }).catch(() => {});
  await createStarterParty(page, "ja");
  await expect(page.getByText("6/6")).toBeVisible();
  await check(page.getByText("六人の名は帳面に揃った", { exact: false }), "隊列準備完了コピー", "party-ready");

  // 3) Dungeon room description + event window
  await page.getByRole("button", { name: "迷宮に入る" }).click();
  await expect(page.locator(".room-copy").first()).toBeVisible();
  await check(page.locator(".room-copy").first(), "部屋の描写", "room-copy");
  const eventWindow = page.locator(".event-window").first();
  if (await eventWindow.isVisible().catch(() => false)) {
    await check(eventWindow, "イベント文", "event-window");
  }

  // 4) Combat round message (drive one move into the encounter)
  await page.getByRole("button", { name: "進む", exact: true }).click();
  if (await page.getByRole("heading", { name: "戦闘" }).isVisible().catch(() => false)) {
    const combatMessage = page.getByTestId("combat-command-window").locator(".event-window").first();
    if (await combatMessage.isVisible().catch(() => false)) {
      await check(combatMessage, "戦闘メッセージ", "combat-message");
    } else {
      await capture("combat");
    }
  }
});

test("line-layout detector rejects orphan tails and stranded punctuation", async ({ page }) => {
  // Guards the gate itself: a detector that never fails is worthless. Force
  // known-bad wraps and confirm they are caught, and a clean wrap that is not.
  await page.setContent(`
    <div style="font-size:20px;font-family:sans-serif;line-height:1.5">
      <div id="orphan" style="width:80px;word-break:break-all">あいうえお</div>
      <div id="stranded" style="width:24px;line-break:anywhere;word-break:break-all">あ。</div>
      <div id="clean" style="width:400px">あいうえお、かきくけこ。</div>
    </div>
  `);

  const orphan = await analyzeLineLayout(page.locator("#orphan"));
  expect(orphan.orphanTail, `orphan case lines=${JSON.stringify(orphan.lines)}`).toBe(true);

  const stranded = await analyzeLineLayout(page.locator("#stranded"));
  expect(stranded.strandedPunctuation, `stranded case lines=${JSON.stringify(stranded.lines)}`).toBe("。");

  const clean = await analyzeLineLayout(page.locator("#clean"));
  expect(clean.orphanTail).toBe(false);
  expect(clean.strandedPunctuation).toBeNull();
});
