import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function startNewExpedition(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New expedition" }).click();
}

export async function setTitleLanguage(page: Page, locale: "en" | "ja") {
  await page.goto("/");
  await page.getByRole("button", { name: "Config" }).click();
  await page.getByLabel("Language").selectOption(locale);
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
        notes: "メモ",
        register: "冒険者を登録"
      }
    : {
        skip: "Skip explanation",
        next: "Next",
        plus: "Might +",
        name: "Name",
        title: "Title",
        notes: "Notes",
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
