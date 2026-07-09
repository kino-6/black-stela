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

// B1F is a maze (see scripts/genFloorMaze.mjs, seed 20250709). Navigation replays
// the shortest walkable path as a fixed sequence of cardinal steps; a fight in the
// way is resolved in place (position is unchanged by combat, so the sequence holds).
type Dir = "north" | "south" | "east" | "west";

// Entrance → Winding Stair (down-stairs); ends faced west, so turn south to descend.
const B1F_ENTRANCE_TO_STAIR: Dir[] = [
  "south", "south", "east", "east", "south", "south", "east", "east", "south", "south",
  "south", "south", "east", "east", "south", "south", "south", "south", "east", "east",
  "east", "east", "east", "east", "south", "south", "east", "east", "south", "south",
  "west", "west", "west", "west"
];
// Entrance → Warden's Hall (the return marker).
const B1F_ENTRANCE_TO_WARDEN: Dir[] = [
  "south", "south", "east", "east", "south", "south", "east", "east", "south", "south",
  "south", "south", "east", "east", "south", "south", "south", "south", "east", "east"
];
// Winding Stair → Warden's Hall.
const B1F_STAIR_TO_WARDEN: Dir[] = [
  "east", "east", "east", "east", "north", "north", "west", "west", "north", "north",
  "west", "west", "west", "west"
];
// Entrance → Smoke-Bent needle chamber → Warden's Hall (routes across the trap so
// the party takes injury; used by the recovery flow).
const B1F_ENTRANCE_TO_NEEDLE: Dir[] = [
  "south", "south", "east", "east", "north", "north", "east", "east", "east", "east",
  "south", "south", "east", "east", "east", "east", "east", "east", "south", "south"
];
const B1F_NEEDLE_TO_WARDEN: Dir[] = [
  "south", "south", "west", "west", "south", "south", "west", "south", "south", "west", "south", "south"
];

async function walkB1fPath(page: Page, dirs: Dir[]) {
  for (const dir of dirs) {
    await faceDirection(page, dir);
    await page.getByRole("button", { name: "Move", exact: true }).click();
    await page.waitForTimeout(55);
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
      await resolveVisibleCombat(page);
    }
  }
}

// Thread the maze from the entrance to the Winding Stair cell, faced at the stair
// (its edge is south), without descending.
export async function walkB1fToStair(page: Page) {
  await walkB1fPath(page, B1F_ENTRANCE_TO_STAIR);
  await faceDirection(page, "south"); // the stair edge faces south
}

// Descend from B1F: thread the maze to the Winding Stair and use it. The stair
// carries no lock — the floor pressures exploration by reward and difficulty, not a
// gate. Returns once on B2F's landing.
export async function descendB1fViaWarden(page: Page) {
  const current = async () => (await page.getByTestId("map-current").textContent().catch(() => "")) ?? "";
  await walkB1fToStair(page);
  const stairs = page.getByRole("button", { name: "Use stairs" });
  if (await stairs.isVisible().catch(() => false)) {
    await stairs.click();
    await page.waitForTimeout(160);
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
      await resolveVisibleCombat(page);
    }
  }
  return (await current()).includes("Landing of Split Dust");
}

async function currentFacing(page: Page): Promise<string> {
  const text = (await page.getByText(/Facing (north|south|east|west)/i).first().textContent().catch(() => "")) ?? "";
  return (text.match(/Facing (\w+)/i)?.[1] ?? "").toLowerCase();
}

export async function faceDirection(page: Page, dir: "north" | "south" | "east" | "west") {
  for (let i = 0; i < 4; i += 1) {
    if ((await currentFacing(page)) === dir) {
      return;
    }
    await page.getByLabel("Turn right").click();
    await page.waitForTimeout(30);
  }
}

// From the Winding Stair cell (B1F's down-stair), thread the maze back to the
// Warden's Hall (the return marker).
export async function walkB1fStairToMarker(page: Page) {
  await walkB1fPath(page, B1F_STAIR_TO_WARDEN);
}

// Reach the Warden's Hall (the return marker) from the B1F entrance through the maze.
export async function advanceToB1fMarker(page: Page) {
  await walkB1fPath(page, B1F_ENTRANCE_TO_WARDEN);
}

// Reach the Warden's Hall via the Smoke-Bent needle chamber, so the party arrives
// injured (used to exercise town recovery). Resolves the entrance slime fight en route.
export async function advanceToB1fMarkerViaNeedle(page: Page) {
  await walkB1fPath(page, B1F_ENTRANCE_TO_NEEDLE);
  await walkB1fPath(page, B1F_NEEDLE_TO_WARDEN);
}
