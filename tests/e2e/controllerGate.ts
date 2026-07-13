import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Gate primitives for the rules AGENTS.md calls blocking but the suite never proved.
//
// The 2026-07-13 hand playtest found the gate green while the game was broken: the browser
// self-play route navigates with locator.click() end to end, so a screen with NO keyboard
// entry point passes it, and the only overflow assertion checks the HORIZONTAL axis, so the
// combat command dock could sit below the fold unnoticed. (My own combat-stage.spec.ts had
// the same hole — it asserted the layout does not MOVE, never that it FITS.)
//
// These helpers assert the two things the report says the gate cannot see:
//   · controller truth — where DOM focus actually is, screen by screen
//   · viewport truth   — that commands are on screen at all
//
// Playwright's Desktop Chrome default viewport is 1280x720 — the same size as the hand
// playtest — so every spec that imports these is already checking the reported size.

export const CONTROLLER_VIEWPORT = { width: 1280, height: 720 };

/** Confirm — the controller's "advance" button. */
export async function pressConfirm(page: Page) {
  await page.keyboard.press("Enter");
}

/** Cancel / back one step. */
export async function pressCancel(page: Page) {
  await page.keyboard.press("Escape");
}

export async function moveFocus(page: Page, direction: "up" | "down" | "left" | "right", times = 1) {
  const key = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[direction];
  for (let i = 0; i < times; i += 1) {
    await page.keyboard.press(key);
    await page.waitForTimeout(40);
  }
}

interface FocusInfo {
  tag: string;
  label: string;
  surface: string | null;
  disabled: boolean;
}

export async function readFocus(page: Page): Promise<FocusInfo> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body || el === document.documentElement) {
      return { tag: el?.tagName ?? "NONE", label: "", surface: null, disabled: false };
    }
    const surface = el.closest("[data-controller-surface]");
    return {
      tag: el.tagName,
      label: (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      surface: surface?.getAttribute("data-controller-surface") ?? null,
      disabled: el.hasAttribute("disabled")
    };
  });
}

/**
 * A player holding a controller must always have a cursor somewhere. Focus resting on BODY
 * means the screen is dead to directional input — the exact failure the playtest hit on the
 * scenario picker and again after accepting a guild recruit.
 */
export async function expectControllerFocus(page: Page, where: string, options: { surface?: string } = {}) {
  const focus = await readFocus(page);
  expect(focus.tag, `${where}: nothing is focused — the screen is dead to a controller`).not.toBe("BODY");
  expect(focus.tag, `${where}: nothing is focused — the screen is dead to a controller`).not.toBe("NONE");
  expect(focus.surface, `${where}: focus is on "${focus.label}", outside any controller surface`).not.toBeNull();
  if (options.surface) {
    expect(focus.surface, `${where}: focus escaped to the "${focus.surface}" surface`).toBe(options.surface);
  }
}

/**
 * Everything the player must be able to reach has to BE on screen. The command dock was
 * measured at y=719 with its bottom at 786 in a 720px viewport, and the page does not
 * scroll — so オート / リピート / 退却 were simply unreachable while every test stayed green.
 */
export async function expectFitsViewport(page: Page, where: string) {
  const report = await page.evaluate(() => {
    const doc = document.documentElement;
    const height = window.innerHeight;
    // Every surface a player is expected to command from.
    const selectors = [
      "[data-controller-surface]",
      ".command-dock",
      ".combat-command-zone",
      ".town-service-menu",
      ".guild-stepper"
    ];
    const clipped: { selector: string; bottom: number }[] = [];
    for (const selector of selectors) {
      for (const node of Array.from(document.querySelectorAll(selector))) {
        const el = node as HTMLElement;
        if (el.offsetParent === null) {
          continue; // not rendered
        }
        const box = el.getBoundingClientRect();
        if (box.height === 0) {
          continue;
        }
        if (box.bottom > height + 1) {
          clipped.push({ selector: el.className || selector, bottom: Math.round(box.bottom) });
        }
      }
    }
    return {
      height,
      clipped,
      pageScrolls: doc.scrollHeight > doc.clientHeight + 1,
      scrollHeight: doc.scrollHeight,
      clientHeight: doc.clientHeight
    };
  });

  expect(
    report.clipped,
    `${where}: command surfaces hang below the ${report.height}px viewport — ` +
      report.clipped.map((c) => `${c.selector} ends at ${c.bottom}`).join("; ")
  ).toEqual([]);
  expect(
    report.pageScrolls,
    `${where}: the page scrolls vertically (${report.scrollHeight} > ${report.clientHeight}) — a DRPG screen must fit`
  ).toBe(false);
}

/**
 * The town showed "Enter dungeon" in gold while focus sat on "Guild", so Enter opened the
 * guild. If a command LOOKS chosen, it must BE the chosen one — otherwise the visible cursor
 * is a lie and the controller cannot be trusted.
 */
export async function expectSelectionMatchesFocus(page: Page, where: string) {
  const mismatch = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    // Elements the UI paints as "the chosen command".
    const selected = Array.from(
      document.querySelectorAll('[aria-current="true"], .combat-menu-row.selected, .primary-action')
    ).filter((node) => (node as HTMLElement).offsetParent !== null);
    if (selected.length === 0) {
      return null;
    }
    if (selected.length > 1) {
      return {
        reason: "more than one command is painted as selected",
        labels: selected.map((n) => (n.textContent || "").trim().slice(0, 30))
      };
    }
    const only = selected[0] as HTMLElement;
    if (active && (only === active || only.contains(active))) {
      return null;
    }
    return {
      reason: "the command painted as selected is not the focused one",
      labels: [
        `styled: ${(only.textContent || "").trim().slice(0, 30)}`,
        `focused: ${(active?.textContent || active?.tagName || "nothing").trim().slice(0, 30)}`
      ]
    };
  });

  expect(mismatch, `${where}: ${mismatch?.reason} — ${mismatch?.labels.join(" / ")}`).toBeNull();
}
