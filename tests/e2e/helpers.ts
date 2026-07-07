import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function startNewExpedition(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New expedition" }).click();
}

export async function createStarterParty(page: Page, locale: "en" | "ja" = "en") {
  const labels = locale === "ja"
    ? {
        guild: "ギルド",
        back: "町へ戻る",
        skip: "説明を聞かない",
        yes: "はい",
        proposal: "こいつはどうだ？"
      }
    : {
        guild: "Guild",
        back: "Back to town",
        skip: "Skip explanation",
        yes: "Yes",
        proposal: "How about this one?"
      };

  if (await page.getByRole("button", { name: labels.skip }).isVisible()) {
    await page.getByRole("button", { name: labels.skip }).click();
  }

  for (let index = 0; index < 6; index += 1) {
    await page.getByRole("button", { name: labels.yes, exact: true }).click();
    await expect(page.getByTestId("guild-suggestion")).toContainText(labels.proposal);
    await page.getByRole("button", { name: labels.yes, exact: true }).click();
    await expect(page.getByText(`${index + 1}/6`)).toBeVisible();
  }
}

// The town lands on a hub whose service menu (Guild / Shop / Recovery / Records /
// Enter dungeon) is only visible from the hub itself. This returns to the hub if a
// service is currently open, then opens the requested service.
export async function openTownService(page: Page, name: string | RegExp, locale: "en" | "ja" = "en") {
  const back = page.getByRole("button", { name: locale === "ja" ? "町へ戻る" : "Back to town", exact: true });
  if (await back.isVisible().catch(() => false)) {
    await back.click();
  }
  await page.getByRole("button", { name, exact: true }).click();
}

export async function setTitleLanguage(page: Page, locale: "en" | "ja") {
  await page.goto("/");
  await page.getByRole("button", { name: "Config" }).click();
  await page.getByLabel("Language").selectOption(locale);
}

export async function focusControllerButton(page: Page, name: string | RegExp, options: { direction?: "next" | "previous"; limit?: number } = {}) {
  const direction = options.direction === "previous" ? "ArrowLeft" : "ArrowRight";
  const limit = options.limit ?? 24;

  for (let attempt = 0; attempt < limit; attempt += 1) {
    const label = await getActiveElementLabel(page);
    if (typeof name === "string" ? label.includes(name) : name.test(label)) {
      return;
    }
    await page.keyboard.press(direction);
  }

  throw new Error(`Controller focus did not reach ${String(name)}. Last focus: ${await getActiveElementLabel(page)}`);
}

async function getActiveElementLabel(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body || element === document.documentElement) {
      return "";
    }
    return [element?.getAttribute("aria-label"), element?.textContent]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  });
}

export async function registerAdventurer(
  page: Page,
  options: { locale?: "en" | "ja"; name?: string; title?: string; notes?: string; portrait?: { name: string; mimeType: string; buffer: Buffer } } = {}
) {
  const locale = options.locale ?? "en";
  const labels = locale === "ja"
    ? {
        skip: "説明を聞かない",
        next: "次へ",
        plus: "筋力 +",
        name: "名前",
        title: "二つ名",
        notes: "覚え書き",
        register: "冒険者を登録"
      }
    : {
        skip: "Skip explanation",
        next: "Next",
        plus: "Might +",
        name: "Name",
        title: "Epithet",
        notes: "Record",
        register: "Register adventurer"
      };

  await page.getByRole("button", { name: labels.skip }).click();
  await page.getByTestId("guild-step-class").getByRole("button", { name: labels.next }).click();
  if (options.portrait) {
    await page.getByTestId("portrait-input").setInputFiles(options.portrait);
  }
  await page.getByTestId("guild-step-appearance").getByRole("button", { name: labels.next }).click();
  const plusButton = page.getByLabel(labels.plus);
  for (let index = 0; index < 8; index += 1) {
    if (await plusButton.isDisabled()) {
      break;
    }
    await plusButton.click();
  }
  await page.getByTestId("guild-step-bonus").getByRole("button", { name: labels.next }).click();
  await page.getByLabel(labels.name).fill(options.name ?? (locale === "ja" ? "ミラ" : "Mira"));
  if (options.title) {
    await page.getByLabel(labels.title).fill(options.title);
  }
  if (options.notes) {
    await page.getByLabel(labels.notes).fill(options.notes);
  }
  await page.getByRole("button", { name: labels.register }).click();
}

export async function resolveVisibleCombat(page: Page) {
  await expect(page.getByLabel("Battle screen")).toBeVisible();
  await expect(page.getByTestId("combat-actor").first()).toBeVisible();
  await expect(page.getByTestId("combat-enemy-group").first()).toBeVisible();

  for (let round = 0; round < 6; round += 1) {
    if (await page.getByRole("heading", { name: "Combat" }).isHidden()) {
      return;
    }

    for (let order = 0; order < 6; order += 1) {
      const fight = page.getByRole("button", { name: "Fight" });
      if (await fight.isEnabled()) {
        break;
      }

      const attack = page.getByRole("button", { name: "Attack" });
      if (await attack.isEnabled()) {
        await attack.click();
      } else {
        await page.getByRole("button", { name: "Defend" }).click();
      }
    }
    await page.getByRole("button", { name: "Fight" }).click();
  }

  await expect(page.getByRole("heading", { name: "Combat" })).toHaveCount(0);
}
