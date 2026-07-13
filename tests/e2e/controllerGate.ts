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

// ---------------------------------------------------------------------------
// "No mouse" must be MEASURED, not merely declared.
//
// A comment saying a route is controller-only rots the moment a helper quietly reverts to
// locator.click(). Count real pointer events instead: keyboard Enter on a focused button
// fires a `click`, but never a `pointerdown`/`mousedown` — so those two are an exact detector
// of an actual mouse, with no false positives from keyboard activation.
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __mouseEvents?: number;
  }
}

export async function installMouseSpy(page: Page) {
  await page.addInitScript(() => {
    window.__mouseEvents = 0;
    for (const type of ["pointerdown", "mousedown"]) {
      window.addEventListener(
        type,
        (event) => {
          if (event.isTrusted) {
            window.__mouseEvents = (window.__mouseEvents ?? 0) + 1;
          }
        },
        true
      );
    }
  });
}

export async function expectNoMouseUsed(page: Page, where: string) {
  const count = await page.evaluate(() => window.__mouseEvents ?? 0);
  expect(
    count,
    `${where}: ${count} real pointer events fired — this route claims to be controller-only, ` +
      `so a click here means the Gate has quietly gone back to proving nothing`
  ).toBe(0);
}

// ---------------------------------------------------------------------------
// Focus truth
// ---------------------------------------------------------------------------

interface FocusInfo {
  tag: string;
  label: string;
  surface: string | null;
  /** The surface is registered AND currently active. */
  surfaceActive: boolean;
  disabled: boolean;
  /** Rendered, on screen, and not clipped away by an ancestor's overflow. */
  reachable: boolean;
  /** Hidden from the accessibility tree / inert — a cursor here is a cursor nowhere. */
  inert: boolean;
  activeSurfaceCount: number;
}

export async function readFocus(page: Page): Promise<FocusInfo> {
  return page.evaluate(() => {
    const activeSurfaceCount = document.querySelectorAll(
      '[data-controller-surface][data-controller-active="true"]'
    ).length;
    const el = document.activeElement as HTMLElement | null;
    const empty = {
      tag: el?.tagName ?? "NONE",
      label: "",
      surface: null,
      surfaceActive: false,
      disabled: false,
      reachable: false,
      inert: false,
      activeSurfaceCount
    };
    if (!el || el === document.body || el === document.documentElement) {
      return empty;
    }

    const surface = el.closest("[data-controller-surface]");
    const box = el.getBoundingClientRect();
    const onScreen =
      box.width > 0 &&
      box.height > 0 &&
      box.bottom > 0 &&
      box.right > 0 &&
      box.top < window.innerHeight &&
      box.left < window.innerWidth;
    // Clipped away by a scrolling/overflowing ancestor? Then it is on screen only in theory.
    let clipped = false;
    for (let node = el.parentElement; node; node = node.parentElement) {
      const style = window.getComputedStyle(node);
      if (style.overflow === "visible" && style.overflowY === "visible" && style.overflowX === "visible") {
        continue;
      }
      const clip = node.getBoundingClientRect();
      if (box.bottom <= clip.top || box.top >= clip.bottom || box.right <= clip.left || box.left >= clip.right) {
        clipped = true;
        break;
      }
    }

    return {
      tag: el.tagName,
      label: (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      surface: surface?.getAttribute("data-controller-surface") ?? null,
      surfaceActive: surface?.getAttribute("data-controller-active") === "true",
      disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true",
      reachable: onScreen && !clipped,
      inert: Boolean(el.closest("[inert]") || el.closest('[aria-hidden="true"]')),
      activeSurfaceCount
    };
  });
}

/**
 * A player holding a controller must always have a cursor, and the cursor must be on something
 * they can actually use. Focus resting on BODY means the screen is dead to directional input —
 * the exact failure the playtest hit on the scenario picker and again after a guild recruit.
 * Focus resting on a disabled, off-screen, clipped or aria-hidden element is the same failure
 * wearing a disguise.
 */
export async function expectControllerFocus(
  page: Page,
  where: string,
  options: { surface?: string; exclusive?: boolean } = {}
) {
  // Poll: focus is claimed on the next animation frame after a screen mounts, so reading it in
  // the same tick would measure a frame no player ever sees. What must hold is that a cursor
  // ARRIVES — not that it is there within 5ms.
  await expect
    .poll(async () => (await readFocus(page)).tag, {
      message: `${where}: nothing is focused — the screen is dead to a controller`,
      timeout: 2000
    })
    .not.toMatch(/^(BODY|NONE)$/);

  const focus = await readFocus(page);
  expect(focus.surface, `${where}: focus is on "${focus.label}", outside any controller surface`).not.toBeNull();
  expect(
    focus.surfaceActive,
    `${where}: focus is on "${focus.label}", inside the INACTIVE surface "${focus.surface}"`
  ).toBe(true);
  expect(focus.disabled, `${where}: the cursor sits on the disabled command "${focus.label}"`).toBe(false);
  expect(focus.inert, `${where}: the cursor sits inside an aria-hidden/inert region ("${focus.label}")`).toBe(false);
  expect(
    focus.reachable,
    `${where}: the focused command "${focus.label}" is off screen or clipped by an ancestor — ` +
      `the cursor exists but the player cannot see it`
  ).toBe(true);
  if (options.surface) {
    expect(focus.surface, `${where}: focus escaped to the "${focus.surface}" surface`).toBe(options.surface);
  }
  if (options.exclusive) {
    // Sibling surfaces flatten into ONE focus ring (src/ui/controllerFocus.ts), so a screen
    // that leaves a second surface active lets the cursor wander out of the step the player is
    // actually on. Nested surfaces are fine — the ring de-dupes them.
    expect(
      focus.activeSurfaceCount,
      `${where}: ${focus.activeSurfaceCount} controller surfaces are active at once — ` +
        `the cursor can wander out of the command the player is being asked for`
    ).toBe(1);
  }
}

/**
 * Everything the player must be able to reach has to BE on screen — on ALL four edges, and not
 * only the container: each command inside it must be reachable too, since an ancestor's
 * overflow can swallow a button while the panel itself measures as fitting.
 */
export async function expectFitsViewport(page: Page, where: string) {
  const report = await page.evaluate(() => {
    const doc = document.documentElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const surfaces = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-controller-surface], .command-dock, .combat-command-zone, .town-service-menu, .guild-stepper'
      )
    ).filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height > 0);

    const outside = (box: DOMRect) =>
      box.bottom > height + 1 || box.top < -1 || box.right > width + 1 || box.left < -1;

    const clipped: string[] = [];
    for (const surface of surfaces) {
      const box = surface.getBoundingClientRect();
      if (outside(box)) {
        clipped.push(
          `${surface.className || surface.tagName} spans ` +
            `${Math.round(box.left)},${Math.round(box.top)} → ${Math.round(box.right)},${Math.round(box.bottom)}`
        );
      }
      // …and every command the player is expected to reach INSIDE it.
      for (const node of Array.from(surface.querySelectorAll<HTMLElement>("button:not([disabled])"))) {
        if (node.offsetParent === null) {
          continue;
        }
        const nodeBox = node.getBoundingClientRect();
        if (nodeBox.height === 0) {
          continue;
        }
        if (outside(nodeBox)) {
          clipped.push(
            `command "${(node.textContent || "").trim().slice(0, 24)}" ends at ` +
              `${Math.round(nodeBox.bottom)} (viewport ${height})`
          );
        }
      }
    }

    return {
      width,
      height,
      clipped: Array.from(new Set(clipped)),
      pageScrolls: doc.scrollHeight > doc.clientHeight + 1,
      scrollHeight: doc.scrollHeight,
      clientHeight: doc.clientHeight
    };
  });

  expect(
    report.clipped,
    `${where}: commands fall outside the ${report.width}x${report.height} viewport — ${report.clipped.join("; ")}`
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
