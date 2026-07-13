/**
 * Controller / keyboard focus helpers for the D-pad-style navigation of
 * "controller surfaces" (elements tagged `data-controller-surface`). Pure DOM
 * utilities, kept out of the App component.
 */

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

const controllerSurfaceSelector = "[data-controller-surface][data-controller-active='true']";
const controllerFocusableSelector = [
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function getActiveControllerSurface() {
  if (typeof document === "undefined") {
    return null;
  }

  const surfaces = getActiveControllerSurfaces();
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    const containingSurface = surfaces.find((surface) => surface.contains(active));
    if (containingSurface) {
      return containingSurface;
    }
  }

  // Fall back to the screen the player is ON, never to the chrome bar. Escape inside a text
  // field blurs first, so by the time Cancel is resolved the cursor is on BODY — and taking the
  // first surface in DOM order then meant Escape in a NAME FIELD walked the player out of the
  // guild entirely, instead of stepping back one panel.
  return getPrimaryControllerSurfaces()[0] ?? surfaces[0] ?? null;
}

function getActiveControllerSurfaces() {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(document.querySelectorAll<HTMLElement>(controllerSurfaceSelector));
}

// Chrome — an always-present "back" bar — belongs in the focus RING (you must be able to reach
// it), but never in the CURSOR'S STARTING PLACE. It sits first in the DOM, so without this every
// screen transition parked the cursor on "Back to town" instead of on the thing the screen is
// actually asking for.
function getPrimaryControllerSurfaces() {
  const surfaces = getActiveControllerSurfaces();
  const primary = surfaces.filter((surface) => surface.dataset.controllerChrome !== "true");
  return primary.length > 0 ? primary : surfaces;
}

function getControllerFocusableElements(surface: HTMLElement) {
  return Array.from(surface.querySelectorAll<HTMLElement>(controllerFocusableSelector)).filter((element) => {
    const style = window.getComputedStyle(element);
    return element.offsetParent !== null && style.visibility !== "hidden" && style.display !== "none";
  });
}

function getAllControllerFocusableElements() {
  const seen = new Set<HTMLElement>();
  return getActiveControllerSurfaces().flatMap((surface) =>
    getControllerFocusableElements(surface).filter((element) => {
      if (seen.has(element)) {
        return false;
      }

      seen.add(element);
      return true;
    })
  );
}

export function focusFirstControllerChoice() {
  const active = document.activeElement;
  const focusable = getAllControllerFocusableElements();
  if (active instanceof HTMLElement && focusable.includes(active) && isControllerInteractiveTarget(active)) {
    return true;
  }

  // Start the cursor on what the screen is ASKING for, not on the way out of it. Chrome (the
  // "back to town" bar) is first in the DOM, so taking the first focusable of the whole ring
  // parked the cursor on Back after every transition.
  const [first] = getPrimaryControllerSurfaces().flatMap((surface) => getControllerFocusableElements(surface));
  const fallback = first ?? focusable[0];
  fallback?.focus();
  return Boolean(fallback);
}

export function moveControllerFocus(step: 1 | -1) {
  const focusable = getAllControllerFocusableElements();
  if (focusable.length === 0) {
    return false;
  }

  const currentIndex = document.activeElement instanceof HTMLElement ? focusable.indexOf(document.activeElement) : -1;
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + step + focusable.length) % focusable.length;
  focusable[nextIndex]?.focus();
  return true;
}

/**
 * Directional (spatial) focus: pick the nearest focusable that actually lies in
 * the pressed direction, comparing on-screen positions. This makes a 2-D grid
 * (e.g. the class cards) navigate the way it looks — Down moves to the card
 * below, not the next element in DOM order. Falls back to the linear ring at the
 * edges so reaching neighbouring controls (Back/Next) still works and the arrow
 * keys keep capturing exactly as before.
 */
export function moveControllerFocusDirection(direction: "up" | "down" | "left" | "right") {
  const focusable = getAllControllerFocusableElements();
  if (focusable.length === 0) {
    return false;
  }

  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !focusable.includes(active)) {
    focusable[0]?.focus();
    return true;
  }

  const current = active.getBoundingClientRect();
  const cx = current.left + current.width / 2;
  const cy = current.top + current.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const element of focusable) {
    if (element === active) {
      continue;
    }

    const rect = element.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - cx;
    const dy = rect.top + rect.height / 2 - cy;

    let primary: number;
    let cross: number;
    if (direction === "up") {
      if (dy >= -1) continue;
      primary = -dy;
      cross = Math.abs(dx);
    } else if (direction === "down") {
      if (dy <= 1) continue;
      primary = dy;
      cross = Math.abs(dx);
    } else if (direction === "left") {
      if (dx >= -1) continue;
      primary = -dx;
      cross = Math.abs(dy);
    } else {
      if (dx <= 1) continue;
      primary = dx;
      cross = Math.abs(dy);
    }

    // Weight cross-axis drift heavily so focus stays in the same row/column.
    const score = primary + cross * 2;
    if (score < bestScore) {
      bestScore = score;
      best = element;
    }
  }

  if (best) {
    best.focus();
    return true;
  }

  // No candidate in that direction — keep the old wrap-around ring behaviour.
  return moveControllerFocus(direction === "up" || direction === "left" ? -1 : 1);
}

export function activateControllerCancel() {
  const surface = getActiveControllerSurface();
  const cancel = surface?.querySelector<HTMLButtonElement>("[data-controller-cancel]:not([disabled])");
  if (cancel) {
    cancel.click();
    return true;
  }

  // Nothing to cancel inside the surface the cursor is in — so Cancel means "leave this screen".
  // The way out lives in the chrome bar, and a player must never have to hunt for it by walking
  // a focus ring that a full roster has made 30 stops long.
  const chromeCancel = document.querySelector<HTMLButtonElement>(
    '[data-controller-surface][data-controller-active="true"][data-controller-chrome="true"] ' +
      "[data-controller-cancel]:not([disabled])"
  );
  if (!chromeCancel) {
    return false;
  }

  chromeCancel.click();
  return true;
}

export function isControllerInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("button, input, select, textarea, [tabindex]:not([tabindex='-1'])"));
}
