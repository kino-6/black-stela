import type { Character, GameState } from "../domain/types";

export interface NarrationSubject {
  id: string;
  name: string;
  title: string;
  backgroundId: Character["backgroundId"];
  traitIds: Character["traitIds"];
  condition: "able" | "wounded" | "down";
  deeds: string[];
}

export function selectNarrationSubject(state: GameState, contextKey: string): Character | null {
  const able = state.party.filter((member) => member.hp > 0 && !member.injury);
  if (able.length === 0) {
    return null;
  }
  return able[hash(contextKey) % able.length];
}

export function buildNarrationSubject(character: Character): NarrationSubject {
  return {
    id: character.id,
    name: boundedText(character.name, 48),
    title: boundedText(character.title, 64),
    backgroundId: character.backgroundId,
    traitIds: character.traitIds.slice(0, 2),
    condition: character.hp <= 0 ? "down" : character.injury ? "wounded" : "able",
    deeds: character.memory.deeds.slice(-3).map((deed) => boundedText(deed, 96))
  };
}

function boundedText(value: string, limit: number) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
