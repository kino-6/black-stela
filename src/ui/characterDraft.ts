import {
  backgroundCatalog,
  classCatalog,
  createGuildCharacter,
  findBackground,
  traitCatalog
} from "../domain/characterCreation";
import { createIdentitySuggestion } from "../domain/identitySuggestion";
import type {
  Character,
  CharacterAptitudes,
  CharacterBackgroundId,
  CharacterClassId,
  CharacterTraitId,
  CharacterVisualProfile
} from "../domain/types";
import type { Locale } from "../i18n";

// The in-progress recruit the guild-creation surface edits before it is committed
// to the roster. Pure data + pure derivations live here; the React wiring stays
// in App.
export interface CharacterDraft {
  name: string;
  notes: string;
  title: string;
  classId: CharacterClassId;
  backgroundId: CharacterBackgroundId;
  traitId: CharacterTraitId;
  aptitudeFocus: "balanced" | "might" | "agility" | "spirit" | "wit" | "luck";
  bonusPool: number;
  bonusAptitude: CharacterAptitudes;
  bonusSeed: number;
  originSeed: number;
  identitySeed: number;
  accentColor: string;
  portraitRef?: string;
  visualProfile?: CharacterVisualProfile;
}

export const aptitudeKeys: (keyof CharacterAptitudes)[] = ["might", "agility", "spirit", "wit", "luck"];

export const defaultDraft: CharacterDraft = {
  name: "",
  notes: "",
  title: "",
  classId: "vanguard",
  backgroundId: "watch",
  traitId: "steady",
  aptitudeFocus: "balanced",
  bonusPool: 5,
  bonusAptitude: { might: 0, agility: 0, spirit: 0, wit: 0, luck: 0 },
  bonusSeed: 1,
  originSeed: 1,
  identitySeed: 1,
  accentColor: "#c9a765"
};

export function createFreshDraft(overrides: Partial<CharacterDraft> = {}): CharacterDraft {
  const seed = overrides.bonusSeed ?? Date.now();
  const backgroundId = overrides.backgroundId ?? defaultDraft.backgroundId;
  const background = findBackground(backgroundId);
  return {
    ...defaultDraft,
    backgroundId,
    bonusSeed: seed,
    originSeed: overrides.originSeed ?? seed,
    identitySeed: overrides.identitySeed ?? seed,
    bonusPool: rollBonusPool(seed),
    bonusAptitude: createEmptyBonusAptitude(),
    ...overrides,
    accentColor: overrides.accentColor ?? background.accentColor
  };
}

export function createEmptyBonusAptitude(): CharacterAptitudes {
  return { might: 0, agility: 0, spirit: 0, wit: 0, luck: 0 };
}

export function rollBonusPool(seed: number) {
  return 4 + (Math.floor(Math.abs(Math.sin(seed * 12.9898) * 10_000)) % 5);
}

export function getAllocatedBonusPoints(bonus: CharacterAptitudes) {
  return aptitudeKeys.reduce((total, key) => total + bonus[key], 0);
}

// Suggest the next recruit that best rounds out the current party's coverage.
export function createSuggestedRecruitForParty(party: Character[], turn: number, locale: Locale) {
  const classId = chooseSuggestedClassId(party);
  const background = backgroundCatalog[(party.length + turn) % backgroundCatalog.length];
  const trait = traitCatalog[(party.length * 3 + turn + 1) % traitCatalog.length];
  const identity = createIdentitySuggestion({
    seed: turn + party.length * 19 + classCatalog.findIndex((classDef) => classDef.id === classId) * 5,
    locale,
    classId,
    backgroundId: background.id,
    traitId: trait.id
  });

  return createGuildCharacter({
    ...identity,
    classId,
    backgroundId: background.id,
    traitIds: [trait.id],
    method: "quick",
    seed: `guild-suggestion:${turn}:${party.length}:${classId}`,
    registeredAtTurn: turn
  });
}

export function chooseSuggestedClassId(party: Character[]): CharacterClassId {
  const roleCount = (role: string) => party.filter((member) => member.roleTags.includes(role)).length;
  const frontCount = party.filter((member) => member.row === "front").length;
  const backCount = party.filter((member) => member.row === "back").length;
  const partyIndex = party.length % 3;

  if (frontCount < 2) {
    return ["vanguard", "bulwark", "sellsword"][partyIndex] as CharacterClassId;
  }

  if (roleCount("healing") < 1) {
    return party.some((member) => member.classId === "mender") ? "chanter" : "mender";
  }

  if (roleCount("trap_handling") < 1) {
    return party.some((member) => member.classId === "cutpurse") ? "seeker" : "cutpurse";
  }

  if (roleCount("mapping") < 1) {
    return backCount <= frontCount ? "wayfinder" : "scout";
  }

  if (roleCount("damage") < 2) {
    return frontCount < 3 ? "duelist" : "arcanist";
  }

  if (roleCount("status_safety") < 1) {
    return "occultist";
  }

  return backCount < 3 ? "arcanist" : "sellsword";
}
