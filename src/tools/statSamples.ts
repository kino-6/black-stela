import { createGuildCharacter } from "../domain/characterCreation";
import { getEffectiveCharacterStats } from "../domain/economy";
import { withDeterministicIds } from "../domain/ids";
import { worldRegistry } from "../data/worldRegistry";
import { canonicalize } from "./packExport";
import type { Character } from "../domain/types";

// S3 chunk 3a: export getEffectiveCharacterStats samples so the GDScript port (equipment + plus + affix
// + vocation layering) can be proven byte-for-byte. Covers the b1f-combat-victory hero (no affix/plus),
// a +2 weapon (the plus branch), and an authored affix (the affix branch).

export const STAT_SAMPLES_SCHEMA_VERSION = 1;

function vanguard(): Character {
  return { ...createGuildCharacter({ name: "Rook", classId: "vanguard", seed: "slice" }), row: "front" };
}

export function buildStatSamples(worldId = "default") {
  // Deterministic ids so the character embedded in each sample (and the exported JSON) reproduces
  // byte-for-byte across runs — the stat computation itself does not depend on the id.
  return withDeterministicIds("stats", () => buildStatSamplesInner(worldId));
}

function buildStatSamplesInner(worldId: string) {
  const world = worldRegistry[worldId];
  const base = vanguard();
  const plussed: Character = {
    ...base,
    equipment: { weapon: { id: "equip.militia-sabre", plus: 2 }, body: { id: "equip.padded-jack" } }
  };
  const affixed: Character = {
    ...base,
    equipment: { weapon: { id: "equip.militia-sabre", affix: "affix.saltbitten" }, body: { id: "equip.padded-jack" } }
  };

  const samples = [
    { name: "vanguard-base", character: base },
    { name: "vanguard-plus2-weapon", character: plussed },
    { name: "vanguard-saltbitten-weapon", character: affixed }
  ].map((entry) => ({
    name: entry.name,
    character: canonicalize(entry.character),
    stats: canonicalize(getEffectiveCharacterStats(entry.character, world))
  }));

  return { schemaVersion: STAT_SAMPLES_SCHEMA_VERSION, worldId, samples };
}

export function statSamplesToJson(worldId = "default") {
  return `${JSON.stringify(buildStatSamples(worldId), null, 2)}\n`;
}
