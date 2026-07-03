import { describe, expect, it } from "vitest";
import { createCharacter } from "../src/domain/gameState";
import { bindPortraitReference, resolvePortraitSource } from "../src/services/portraitManager";

describe("portrait manager", () => {
  it("stores an imported portrait reference on its character", () => {
    const character = createCharacter({ name: "Sei", notes: "Keeps the lamp" });
    const updated = bindPortraitReference(character, {
      id: "portrait-1",
      characterId: character.id,
      dataUrl: "data:image/png;base64,AAAA",
      fileName: "sei.png",
      storagePath: "portrait://portrait-1/sei.png"
    });

    expect(updated.portraitRef).toBe("portrait://portrait-1/sei.png");
    expect(resolvePortraitSource(updated.portraitRef, {
      "portrait://portrait-1/sei.png": {
        id: "portrait-1",
        characterId: character.id,
        dataUrl: "data:image/png;base64,AAAA",
        fileName: "sei.png",
        storagePath: "portrait://portrait-1/sei.png"
      }
    })).toBe("data:image/png;base64,AAAA");
  });

  it("rejects binding a portrait to another character", () => {
    const character = createCharacter({ name: "Sei", notes: "" });

    expect(() =>
      bindPortraitReference(character, {
        id: "portrait-1",
        characterId: "other",
        dataUrl: "data:image/png;base64,AAAA",
        fileName: "sei.png",
        storagePath: "portrait://portrait-1/sei.png"
      })
    ).toThrow(/owning character/i);
  });

  it("falls back without crashing when a portrait asset is missing", () => {
    expect(resolvePortraitSource("portrait://missing/sei.png", {})).toBeNull();
  });
});
