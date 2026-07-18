import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function startNewExpedition(page: Page) {
  // These player-route tests exercise navigation and the command menu, not the
  // #69 combat playback (which hides the menu while a round animates). Run fights
  // in instant-log mode so a round resolves in one step. The playback itself is
  // covered by combat-regression.spec.ts, which drives combat directly.
  await page.addInitScript(() => {
    window.localStorage.setItem("black-stela:settings:instant-combat-log", "on");
    // Navigation tests drive the menu to victory; keep the classic auto-resolve
    // (no confirm step) so the fight loop matches the helper. The confirm step is
    // covered separately in combat-regression.spec.ts.
    window.localStorage.setItem("black-stela:settings:confirm-round", "off");
  });
  await page.goto("/");
  await page.getByRole("button", { name: "New expedition" }).click();
  // With more than one scenario registered, New Game opens the scenario picker.
  // These player-route tests run the default world — pick it when the picker shows.
  await page
    .getByTestId("scenario-card-default")
    .click({ timeout: 5000 })
    .catch(() => {});
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

  // The Guild Master stands in the HALL (the briefing step) — the registration steps are a
  // form and nothing else now (IMP-003). So we no longer skip past him to find him.
  for (let index = 0; index < 6; index += 1) {
    await page.getByRole("button", { name: labels.yes, exact: true }).click();
    await expect(page.getByTestId("guild-suggestion")).toContainText(labels.proposal);
    await page.getByTestId("guild-suggestion").getByRole("button", { name: labels.yes, exact: true }).click();
    await expect(page.getByText(`${index + 1}/6`)).toBeVisible();
  }
}

// IMP-025: the town is a two-level hub — a square of DESTINATIONS (guild hall / market / archive),
// with recovery and departure on the square itself and every other service one step inside a
// destination. This returns to the square, then opens the requested service wherever it lives —
// direct on the square, else by trying each destination until the named button appears.
export async function openTownService(page: Page, name: string | RegExp, locale: "en" | "ja" = "en") {
  const back = page.getByRole("button", { name: locale === "ja" ? "町へ戻る" : "Back to town", exact: true });
  if (await back.isVisible().catch(() => false)) {
    await back.click();
  }
  const toSquare = page.getByTestId("town-location-back");
  if (await toSquare.isVisible().catch(() => false)) {
    await toSquare.click();
  }
  const target = page.getByRole("button", { name, exact: true });
  if (await target.isVisible().catch(() => false)) {
    await target.click();
    return;
  }
  for (const location of ["town-location-hall", "town-location-market", "town-location-archive"]) {
    await page.getByTestId(location).click();
    if (await target.isVisible().catch(() => false)) {
      await target.click();
      return;
    }
    await page.getByTestId("town-location-back").click();
  }
  throw new Error(`town service not found on the hub: ${String(name)}`);
}

// Open a town service by its stable testid (e.g. "town-service-loot"), navigating the two-level hub.
export async function openTownServiceByTestId(page: Page, testid: string) {
  const back = page.getByRole("button", { name: /Back to town|町へ戻る/ });
  if (await back.first().isVisible().catch(() => false)) {
    await back.first().click();
  }
  const toSquare = page.getByTestId("town-location-back");
  if (await toSquare.isVisible().catch(() => false)) {
    await toSquare.click();
  }
  const target = page.getByTestId(testid);
  if (await target.isVisible().catch(() => false)) {
    await target.click();
    return;
  }
  for (const location of ["town-location-hall", "town-location-market", "town-location-archive"]) {
    await page.getByTestId(location).click();
    if (await target.isVisible().catch(() => false)) {
      await target.click();
      return;
    }
    await page.getByTestId("town-location-back").click();
  }
  throw new Error(`town service testid not found on the hub: ${testid}`);
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

// Drive a fight to victory through the command menu using Enter alone — each press
// descends command→target/spell or queues an actor; the round auto-resolves after
// the last actor.
export async function resolveVisibleCombat(page: Page) {
  // Language-agnostic and robust to the confirm step (default ON) and the beat
  // playback (default ON): drive the menu, press the confirm "Fight" button when it
  // appears, and wait through playback. Combat has truly ended only when the dungeon
  // dock is back — the menu also unmounts transiently during confirm/playback.
  await expect(page.getByTestId("combat-command-menu")).toBeVisible();

  const dismissResult = async () => {
    // A win pops a result screen over the dungeon — dismiss it to keep exploring. It
    // can appear a frame after the dungeon dock, so give it a beat before returning.
    await page.waitForTimeout(150).catch(() => {});
    if ((await page.getByTestId("combat-result").count()) > 0) {
      await page.getByTestId("combat-result-continue").click().catch(() => {});
      await page.waitForTimeout(40).catch(() => {});
    }
  };

  for (let step = 0; step < 300; step += 1) {
    if ((await page.getByTestId("combat-result").count()) > 0) {
      await page.getByTestId("combat-result-continue").click().catch(() => {});
      await page.waitForTimeout(40).catch(() => {});
      return;
    }
    if ((await page.getByTestId("dungeon-command-window").count()) > 0) {
      await dismissResult(); // combat ended — back in the dungeon
      return;
    }
    const menu = page.getByTestId("combat-command-menu");
    const confirm = page.getByTestId("combat-confirm-round");
    if ((await menu.count()) > 0) {
      await menu.focus().catch(() => {});
      await page.keyboard.press("Enter").catch(() => {});
    } else if ((await confirm.count()) > 0) {
      await page.getByTestId("combat-confirm-execute").focus().catch(() => {});
      await page.keyboard.press("Enter").catch(() => {});
    }
    // else: a round is playing out — just wait for it to finish.
    await page.waitForTimeout(60).catch(() => {});
  }

  await expect(page.getByTestId("dungeon-command-window")).toBeVisible();
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

// A wandering pack can now ambush the party on ANY step, so a scripted walk must be
// able to fight its way through: clear any live combat before touching a dungeon
// control (turning/moving in combat would look for buttons that aren't mounted).
export async function clearAnyCombat(page: Page) {
  await page.waitForTimeout(80);
  for (let guard = 0; guard < 6; guard += 1) {
    // A wipe ends the fight by dragging the party to TOWN — there is no dungeon dock to
    // wait for, so bail out instead of hanging.
    if ((await page.getByTestId("town-cockpit").count()) > 0) {
      return;
    }
    // A win leaves the result screen OVERLAYING the dungeon — it must be dismissed or
    // it silently swallows clicks on the movement controls underneath.
    if ((await page.getByTestId("combat-result").count()) > 0) {
      await page.getByTestId("combat-result-continue").click().catch(() => {});
      await page.waitForTimeout(80);
      continue;
    }
    const inCombat =
      (await page.getByTestId("combat-command-menu").count()) > 0 ||
      (await page.getByLabel("Battle screen").isVisible().catch(() => false));
    if (!inCombat) {
      return;
    }
    await resolveVisibleCombat(page);
    await page.waitForTimeout(80);
  }
}

// The victory overlay can appear a frame AFTER we think combat is over and it swallows
// clicks, so every dungeon control press retries behind a dismiss.
async function pressDungeon(page: Page, press: () => Promise<void>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await clearAnyCombat(page);
    try {
      await press();
      return;
    } catch {
      // an overlay slid in between the check and the click — dismiss and retry
    }
  }
  throw new Error("dungeon control stayed blocked (combat/result overlay never cleared)");
}

async function walkB1fPath(page: Page, dirs: Dir[]) {
  for (const dir of dirs) {
    await pressDungeon(page, () => faceDirection(page, dir));
    await pressDungeon(page, async () => {
      await page.keyboard.press("w");
    });
    await clearAnyCombat(page);
  }
}

// Thread the maze from the entrance to the Winding Stair cell, faced at the stair
// (its edge is south), without descending.
export async function walkB1fToStair(page: Page) {
  await walkB1fPath(page, B1F_ENTRANCE_TO_STAIR);
  await faceDirection(page, "west"); // the stair edge faces west (the way you arrive)
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
    await page.keyboard.press("d");
    await page.waitForTimeout(30);
  }
}

// Walk the entrance→stair path and, at each fight, count the distinct enemy figures
// on the stage BEFORE resolving — returns the most types seen in any single fight.
// Used to prove multi-type (複数種) encounters actually appear in play.
export async function walkB1fMaxEnemyTypes(page: Page): Promise<number> {
  let maxTypes = 0;
  // The needle route crosses the halls-table chambers (room.b1f.east), where a
  // designed multi-group fight fields two distinct types.
  for (const dir of [...B1F_ENTRANCE_TO_NEEDLE, ...B1F_NEEDLE_TO_WARDEN]) {
    await faceDirection(page, dir);
    await page.keyboard.press("w");
    await page.waitForTimeout(55);
    if (await page.getByLabel("Battle screen").isVisible().catch(() => false)) {
      const names = await page.getByTestId("combat-enemy-group").locator(".enemy-mark-name").allTextContents().catch(() => []);
      const distinct = new Set(names.map((name) => name.replace(/\s*×\d+/, "").trim()).filter(Boolean));
      maxTypes = Math.max(maxTypes, distinct.size);
      await resolveVisibleCombat(page);
    }
    if (maxTypes >= 2) break;
  }
  return maxTypes;
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

/** Boot straight into a debug run (skips guild/town), optionally on a given floor/world. */
export async function startDebugRun(page: Page, options: { progress?: string; world?: string } = {}) {
  const params = new URLSearchParams({ debug: "1" });
  if (options.progress) {
    params.set("progress", options.progress);
  }
  if (options.world) {
    params.set("world", options.world);
  }
  await page.goto(`/?${params.toString()}`);
  await expect(page.getByTestId("dungeon-canvas").first()).toBeVisible();
}

/** Walk the floor until something jumps us. Wandering encounters make this reliable. */
export async function walkUntilCombat(page: Page, maxSteps = 220) {
  for (let step = 0; step < maxSteps; step += 1) {
    if ((await page.getByTestId("combat-enemy-group").count()) > 0) {
      await page.waitForTimeout(400); // let the scene report its anchors
      return true;
    }
    await page.keyboard.press(step % 5 === 4 ? "ArrowLeft" : "ArrowUp");
    await page.waitForTimeout(90);
  }
  throw new Error("walked the floor without meeting anything");
}

// ---------------------------------------------------------------------------
// Controller-only route (IMP-001).
//
// The click-based helpers above stay as SECONDARY mouse coverage. These drive the same
// route with directional keys, Confirm and Cancel only — the path AGENTS.md:137 calls a
// blocking completion rule and the suite has never actually walked.
// ---------------------------------------------------------------------------

/** Cycle the controller cursor onto a command and press Confirm. Never clicks. */
export async function activateByController(
  page: Page,
  name: string | RegExp,
  options: { direction?: "next" | "previous"; limit?: number } = {}
) {
  await focusControllerButton(page, name, options);
  await page.keyboard.press("Enter");
}

/** Title -> scenario -> guild, with zero mouse input. */
export async function startExpeditionByController(page: Page, options: { scenario?: string | RegExp } = {}) {
  await page.addInitScript(() => {
    window.localStorage.setItem("black-stela:settings:instant-combat-log", "on");
    window.localStorage.setItem("black-stela:settings:confirm-round", "off");
  });
  await page.goto("/");
  await activateByController(page, "New expedition");
  // With more than one scenario registered this opens the scenario picker, which a
  // controller must also be able to answer.
  const picker = page.getByTestId("scenario-card-default");
  if (await picker.isVisible().catch(() => false)) {
    await activateByController(page, options.scenario ?? /Black Stela|黒碑/);
  }
}

/** Recruit six adventurers through the Guild Master, with zero mouse input. */
export async function createStarterPartyByController(page: Page, locale: "en" | "ja" = "en") {
  const labels =
    locale === "ja"
      ? { skip: "説明を聞かない", yes: "はい", proposal: "こいつはどうだ？" }
      : { skip: "Skip explanation", yes: "Yes", proposal: "How about this one?" };

  for (let index = 0; index < 6; index += 1) {
    await activateByController(page, labels.yes);
    await expect(page.getByTestId("guild-suggestion")).toContainText(labels.proposal);
    await activateByController(page, labels.yes);
    await expect(page.getByText(`${index + 1}/6`)).toBeVisible();
  }
}
