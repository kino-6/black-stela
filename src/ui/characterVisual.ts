import type { CharacterVisualProfile } from "../domain/types";

export type CharacterVisualContext = "token" | "profile" | "battle";

const DEFAULT_FOCUS = { focusX: 50, focusY: 38 } as const;

export function normalizeVisualProfile(
  profile?: CharacterVisualProfile,
  legacyPortraitRef?: string
): CharacterVisualProfile {
  return {
    ...(legacyPortraitRef ? { baseRef: legacyPortraitRef } : {}),
    ...profile,
    focusX: clampFocus(profile?.focusX ?? DEFAULT_FOCUS.focusX),
    focusY: clampFocus(profile?.focusY ?? DEFAULT_FOCUS.focusY)
  };
}

export function shiftVisualFocus(
  profile: CharacterVisualProfile,
  deltaX: number,
  deltaY: number
): CharacterVisualProfile {
  return {
    ...profile,
    focusX: clampFocus(profile.focusX + deltaX),
    focusY: clampFocus(profile.focusY + deltaY)
  };
}

export function resolveCharacterVisual(
  profile: CharacterVisualProfile | undefined,
  context: CharacterVisualContext,
  legacyPortraitRef?: string
) {
  const normalized = normalizeVisualProfile(profile, legacyPortraitRef);
  return {
    src: context === "battle" ? normalized.battleRef ?? normalized.baseRef : normalized.baseRef,
    objectPosition: `${normalized.focusX}% ${normalized.focusY}%`
  };
}

function clampFocus(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
