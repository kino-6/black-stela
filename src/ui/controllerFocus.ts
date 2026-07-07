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

  return surfaces[0] ?? null;
}

function getActiveControllerSurfaces() {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(document.querySelectorAll<HTMLElement>(controllerSurfaceSelector));
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

  const [first] = focusable;
  first?.focus();
  return Boolean(first);
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

export function activateControllerCancel() {
  const surface = getActiveControllerSurface();
  const cancel = surface?.querySelector<HTMLButtonElement>("[data-controller-cancel]:not([disabled])");
  if (!cancel) {
    return false;
  }

  cancel.click();
  return true;
}

export function isControllerInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("button, input, select, textarea, [tabindex]:not([tabindex='-1'])"));
}
