import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createStarterParty, descendB1fViaWarden, resolveVisibleCombat, startNewExpedition, walkB1fStairToMarker } from "./helpers";

type FailureCategory =
  | "blocked_control"
  | "visual_mismatch"
  | "localization_leak"
  | "layout_overflow"
  | "command_shift"
  | "impossible_route"
  | "hidden_affordance";

interface SelfPlayStep {
  name: string;
  category: FailureCategory;
  status: "pass" | "fail";
  message?: string;
}

interface SelfPlayReport {
  route: string;
  mode: "browser-self-play";
  forbiddenShortcuts: string[];
  steps: SelfPlayStep[];
  screenshots: string[];
  commands: string[];
  finalState?: {
    heading: string;
    log: string;
    gold: string;
  };
  failure: null | {
    category: FailureCategory;
    step: string;
    message: string;
  };
  headlessLimitation: string;
}

const artifactDir = "test-results/selfplay";

test("browser self-play completes the visible dungeon loop without headless shortcuts", async ({ page }) => {
  await rm(artifactDir, { recursive: true, force: true });
  await mkdir(artifactDir, { recursive: true });

  const report: SelfPlayReport = {
    route: "title -> guild -> B1F combat -> B2F stair -> return marker -> town service",
    mode: "browser-self-play",
    forbiddenShortcuts: [
      "debug progress",
      "direct GameState mutation",
      "scenario-truth route skipping",
      "hidden command dispatch"
    ],
    steps: [],
    screenshots: [],
    commands: [],
    failure: null,
    headlessLimitation:
      "Headless reachability proves engine route reachability only; this browser self-play covers visible controls, screenshots, layout, and player-facing affordances for this route."
  };

  async function recordStep(name: string, category: FailureCategory, action: () => Promise<void>) {
    try {
      await action();
      report.steps.push({ name, category, status: "pass" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.steps.push({ name, category, status: "fail", message });
      report.failure = { category, step: name, message };
      throw error;
    }
  }

  async function capture(name: string) {
    await captureFrom(page, name, report);
  }

  async function captureFrom(targetPage: Page, name: string, targetReport: SelfPlayReport) {
    const path = join(artifactDir, `${String(targetReport.screenshots.length + 1).padStart(2, "0")}-${name}.png`);
    await targetPage.screenshot({ path, fullPage: true });
    targetReport.screenshots.push(path);
  }

  async function clickCommand(name: string | RegExp) {
    const locator = page.getByRole("button", { name });
    await locator.click();
    report.commands.push(String(name));
  }

  try {
    await recordStep("title screen has no debug or provider controls", "hidden_affordance", async () => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Black Stela" })).toBeVisible();
      await assertNormalPlayHasNoDebugControls(page);
      await capture("title");
    });

    await recordStep("guild creates a six-person party through visible proposals", "blocked_control", async () => {
      await startNewExpedition(page);
      await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toBeVisible();
      await capture("guild-start");
      await createStarterParty(page);
      await expect(page.getByText("6/6")).toBeVisible();
      await expect(page.getByTestId("guild-front-row").locator(".party-member")).toHaveCount(3);
      await expect(page.getByTestId("guild-back-row").locator(".party-member")).toHaveCount(3);
      await assertNormalPlayHasNoDebugControls(page);
      await capture("guild-party-ready");
    });

    await recordStep("party enters B1F through normal dungeon entry", "hidden_affordance", async () => {
      await page.getByRole("button", { name: "Back to town" }).click();
      await clickCommand("Enter dungeon");
      await expect(page.getByRole("heading", { name: "Silent Stone Chamber" })).toBeVisible();
      await expect(page.getByTestId("dungeon-canvas").locator("canvas")).toBeVisible();
      await expect(page.getByLabel("Mini-map")).toBeVisible();
      // The entrance doubles as the town gate — stairs back up are present here.
      await expect(page.getByRole("button", { name: "Climb the stairs to town" })).toBeVisible();
      await capture("dungeon-start");
    });

    await recordStep("visible combat resolves through combat commands", "command_shift", async () => {
      await clickCommand("Move");
      await expect(page.getByRole("heading", { name: "Combat" })).toBeVisible();
      await expect(page.getByLabel("Battle screen")).toBeVisible();
      await expect(page.getByLabel("Mini-map")).toHaveCount(0);
      await expect(page.getByTestId("combat-enemy-group")).toContainText("Ash Slime");
      await expect(page.getByTestId("combat-enemy-group")).not.toContainText(/HP \d+/);
      await capture("combat");
      await resolveVisibleCombat(page);
      await expect(page.getByRole("heading", { name: "Hall of Old Dust" })).toBeVisible();
      await expect(page.getByText(/Victory.*XP.*gold/i)).toBeVisible();
      await capture("post-combat");
    });

    await recordStep("visible controls clear the gated descent to B2F and return", "impossible_route", async () => {
      // Descending requires clearing the Warden's Hall crank first — the stair is
      // no longer a straight walk from the trunk.
      expect(await descendB1fViaWarden(page)).toBe(true);
      await expect(page.getByTestId("map-current")).toContainText("Landing of Split Dust");
      await capture("b2f-landing");

      await clickCommand("Turn left");
      await clickCommand("Turn left");
      await clickCommand("Use stairs");
      await expect(page.getByRole("heading", { name: "Winding Stair" })).toBeVisible();
      await capture("b1f-return-stair");
    });

    await recordStep("return marker brings the party back to town services", "hidden_affordance", async () => {
      // The return marker now sits in a south alcove off the trunk, a separate
      // turn from the descent; thread back to it from the stair cell.
      await walkB1fStairToMarker(page);
      await expect(page.getByRole("heading", { name: "Black Marker" })).toBeVisible();
      await clickCommand("Use return marker");
      await expect(page.getByRole("heading", { name: "Town", exact: true })).toBeVisible();
      await expect(page.getByText("The party returns to town.")).toBeVisible();
      await expect(page.getByTestId("town-cockpit")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Adventurer Registration" })).toHaveCount(0);
      await expect(page.getByText("Return record")).toBeVisible();
      await expect(page.getByText("Next preparation", { exact: true })).toBeVisible();
      await capture("post-return-town");

      await page.getByTestId("town-cockpit").getByRole("button", { name: "Shop" }).click();
      report.commands.push("Shop");
      await expect(page.getByRole("heading", { name: "Stela Gate General Store" })).toBeVisible();
      await expect(page.getByText(/\d+ gold/).first()).toBeVisible();
      await expect(page.getByText("Selected adventurer")).toBeVisible();
      await expect(page.getByTestId("shop-delta").first()).toBeVisible();
      await capture("shop");

      await page.getByRole("button", { name: "Back to town" }).click();
      await clickCommand("Recovery");
      await expect(page.getByRole("heading", { name: "Recovery" })).toBeVisible();
      await expect(page.getByText(/Recovery cost:/)).toBeVisible();
      await expect(page.getByTestId("recovery-plan")).toBeVisible();
      await capture("recovery");
    });

    await recordStep("Japanese route keeps town services localized", "localization_leak", async () => {
      const japanesePage = await page.context().newPage();
      try {
        await japanesePage.goto("/");
        await japanesePage.getByRole("button", { name: "Config" }).click();
        await japanesePage.getByLabel("Language").selectOption("ja");
        await japanesePage.getByRole("button", { name: "新たな探索" }).click();
        await createStarterParty(japanesePage, "ja");
        await japanesePage.getByRole("button", { name: "町へ戻る" }).click();
        await expect(japanesePage.getByRole("button", { name: "商店" })).toBeVisible();
        await expect(japanesePage.getByRole("button", { name: "施療院" })).toBeVisible();
        await japanesePage.getByRole("button", { name: "商店" }).click();
        await expect(japanesePage.getByRole("heading", { name: "黒碑門の雑貨店" })).toBeVisible();
        await expect(japanesePage.getByText("見る冒険者")).toBeVisible();
        await expect(japanesePage.getByText("gold")).toHaveCount(0);
        await expect(japanesePage.getByRole("button", { name: "Shop" })).toHaveCount(0);
        await captureFrom(japanesePage, "ja-shop", report);

        await japanesePage.getByRole("button", { name: "町へ戻る" }).click();
        await japanesePage.getByRole("button", { name: "施療院" }).click();
        await expect(japanesePage.getByRole("heading", { name: "施療院" })).toBeVisible();
        await expect(japanesePage.getByTestId("recovery-plan")).toBeVisible();
        await expect(japanesePage.getByText("Recovery")).toHaveCount(0);
        await captureFrom(japanesePage, "ja-recovery", report);
      } finally {
        await japanesePage.close();
      }
    });

    await recordStep("normal route avoids debug/admin/provider leaks", "localization_leak", async () => {
      await assertNormalPlayHasNoDebugControls(page);
      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(horizontalOverflow).toBe(false);
    });

    report.finalState = await collectFinalState(page);
  } finally {
    await writeSelfPlayReport(report);
  }

  expect(report.failure).toBeNull();
});

async function assertNormalPlayHasNoDebugControls(page: Page) {
  await expect(page.getByRole("button", { name: /Headless|Debug|Save game|Load game/i })).toHaveCount(0);
  await expect(page.getByText(/provider|endpoint|local ai|ローカルAI|プロバイダー|デバッグ/i)).toHaveCount(0);
}

async function collectFinalState(page: Page): Promise<SelfPlayReport["finalState"]> {
  return page.evaluate(() => {
    const heading = document.querySelector("h2, h3")?.textContent?.trim() ?? "";
    const log = Array.from(document.querySelectorAll(".event-window"))
      .map((element) => element.textContent?.trim() ?? "")
      .filter(Boolean)
      .at(-1) ?? "";
    const gold = Array.from(document.querySelectorAll("*"))
      .map((element) => element.textContent?.trim() ?? "")
      .find((text) => /^\d+ gold$/.test(text) || /^\d+G$/.test(text)) ?? "";

    return { heading, log, gold };
  });
}

async function writeSelfPlayReport(report: SelfPlayReport) {
  const jsonPath = join(artifactDir, "browser-selfplay-report.json");
  const mdPath = join(artifactDir, "browser-selfplay-report.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(mdPath, formatReportMarkdown(report));
}

function formatReportMarkdown(report: SelfPlayReport) {
  const steps = report.steps
    .map((step) => `- ${step.status === "pass" ? "PASS" : "FAIL"} ${step.name} (${step.category})${step.message ? `: ${step.message}` : ""}`)
    .join("\n");
  const screenshots = report.screenshots.map((path) => `- ${path}`).join("\n");

  return `# Browser Self-Play Report

Route: ${report.route}

## Steps

${steps}

## Screenshots

${screenshots}

## Final State

- Heading: ${report.finalState?.heading ?? ""}
- Log: ${report.finalState?.log ?? ""}
- Gold: ${report.finalState?.gold ?? ""}

## Failure

${report.failure ? `- ${report.failure.category}: ${report.failure.step}\n- ${report.failure.message}` : "- None"}

## Headless Limitation

${report.headlessLimitation}
`;
}
