import { describe, expect, it } from "vitest";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { importAdventurer, toPortableAdventurer } from "../src/domain/characterCreation";
import { defaultWorld } from "../src/data/defaultWorld";
import { fromSaveDataV1, toSaveDataV1 } from "../src/domain/saveData";
import {
  normalizeVisualProfile,
  resolveCharacterVisual,
  shiftVisualFocus
} from "../src/ui/characterVisual";

describe("portable adventurer visual profile", () => {
  it("upgrades a legacy portrait into a one-image profile", () => {
    expect(normalizeVisualProfile(undefined, "data:image/png;base64,LEGACY")).toEqual({
      baseRef: "data:image/png;base64,LEGACY",
      focusX: 50,
      focusY: 38
    });
  });

  it("uses optional battle art and clamps focus movement", () => {
    const profile = {
      baseRef: "data:image/png;base64,BASE",
      battleRef: "data:image/png;base64,BATTLE",
      focusX: 98,
      focusY: 4
    };

    expect(resolveCharacterVisual(profile, "battle").src).toBe(profile.battleRef);
    expect(resolveCharacterVisual(profile, "token").src).toBe(profile.baseRef);
    expect(shiftVisualFocus(profile, 10, -10)).toMatchObject({ focusX: 100, focusY: 0 });
  });

  it("preserves embedded art and crop metadata through vault export and import", () => {
    const character = createCharacter({ name: "Mira", notes: "Keeps the map" });
    character.visualProfile = {
      baseRef: "data:image/png;base64,BASE",
      battleRef: "data:image/png;base64,BATTLE",
      focusX: 42,
      focusY: 31
    };
    const portable = toPortableAdventurer(character, defaultWorld, {
      exportedAt: "2026-07-15T00:00:00.000Z"
    });

    expect(portable.identity.visualProfile).toEqual(character.visualProfile);
    expect(importAdventurer(portable, defaultWorld).character.visualProfile).toEqual(character.visualProfile);
  });

  it("preserves embedded art and crop metadata through a save round trip", () => {
    const character = createCharacter({ name: "Mira", notes: "" });
    character.visualProfile = {
      baseRef: "data:image/png;base64,BASE",
      battleRef: "data:image/png;base64,BATTLE",
      focusX: 61,
      focusY: 29
    };
    const state = addCharacter(createInitialGameState(), character);

    const restored = fromSaveDataV1(
      toSaveDataV1(state, defaultWorld, { savedAt: "2026-07-15T00:00:00.000Z" })
    );

    expect(restored.party[0].visualProfile).toEqual(character.visualProfile);
  });
});
