import type {
  Character,
  CharacterAptitudes,
  CharacterBackgroundId,
  CharacterClassId,
  CharacterCreationMethod,
  CharacterTraitId,
  CombatRow
} from "./types";

export interface LocalizedLabel {
  en: string;
  ja: string;
}

export interface CharacterClassDefinition {
  id: CharacterClassId;
  label: LocalizedLabel;
  roleTags: string[];
  rowPreference: CombatRow;
  base: Pick<Character, "maxHp" | "attack" | "damageMin" | "damageMax" | "accuracy" | "armor" | "speed">;
  equipment: string[];
}

export interface CharacterBackgroundDefinition {
  id: CharacterBackgroundId;
  label: LocalizedLabel;
  aptitude: Partial<CharacterAptitudes>;
  notes: LocalizedLabel;
}

export interface CharacterTraitDefinition {
  id: CharacterTraitId;
  label: LocalizedLabel;
  aptitude: Partial<CharacterAptitudes>;
  equipment?: string;
}

export interface GuildCharacterInput {
  name: string;
  notes?: string;
  title?: string;
  classId?: CharacterClassId;
  backgroundId?: CharacterBackgroundId;
  traitIds?: CharacterTraitId[];
  aptitudeFocus?: keyof CharacterAptitudes | "balanced";
  portraitRef?: string;
  accentColor?: string;
  method?: CharacterCreationMethod;
  seed?: string;
  registeredAtTurn?: number;
}

export interface PartyCoverageItem {
  id: string;
  label: string;
  status: "covered" | "thin" | "missing";
}

export type StarterTemplateId = "balanced" | "cautious" | "treasure" | "aggressive" | "beginner";

export const PARTY_SIZE_LIMIT = 6;

export const classCatalog: CharacterClassDefinition[] = [
  {
    id: "vanguard",
    label: { en: "Vanguard", ja: "前衛" },
    roleTags: ["front_line", "damage", "retreat_guard"],
    rowPreference: "front",
    base: { maxHp: 15, attack: 5, damageMin: 4, damageMax: 6, accuracy: 76, armor: 2, speed: 5 },
    equipment: ["worn mail", "short sword"]
  },
  {
    id: "seeker",
    label: { en: "Seeker", ja: "探索者" },
    roleTags: ["trap_handling", "mapping", "damage"],
    rowPreference: "front",
    base: { maxHp: 11, attack: 4, damageMin: 3, damageMax: 5, accuracy: 84, armor: 1, speed: 9 },
    equipment: ["knife", "chalk cord"]
  },
  {
    id: "mender",
    label: { en: "Mender", ja: "癒し手" },
    roleTags: ["healing", "status_safety"],
    rowPreference: "back",
    base: { maxHp: 10, attack: 3, damageMin: 2, damageMax: 4, accuracy: 76, armor: 0, speed: 6 },
    equipment: ["salve kit", "oath bell"]
  },
  {
    id: "occultist",
    label: { en: "Occultist", ja: "秘術師" },
    roleTags: ["status_safety", "damage", "mapping"],
    rowPreference: "back",
    base: { maxHp: 9, attack: 3, damageMin: 2, damageMax: 5, accuracy: 78, armor: 0, speed: 7 },
    equipment: ["black primer", "wax charm"]
  }
];

export const backgroundCatalog: CharacterBackgroundDefinition[] = [
  {
    id: "watch",
    label: { en: "Gate Watch", ja: "門衛上がり" },
    aptitude: { might: 1, spirit: 1 },
    notes: { en: "Used to holding a line.", ja: "退かずに立つことを知っている。" }
  },
  {
    id: "ruinborn",
    label: { en: "Ruinborn", ja: "廃墟育ち" },
    aptitude: { agility: 1, luck: 1 },
    notes: { en: "Reads danger from small marks.", ja: "小さな痕跡から危険を読む。" }
  },
  {
    id: "apothecary",
    label: { en: "Apothecary", ja: "薬師見習い" },
    aptitude: { spirit: 1, wit: 1 },
    notes: { en: "Knows what keeps a body moving.", ja: "身体を動かし続ける術を知る。" }
  },
  {
    id: "debtor",
    label: { en: "Debtor", ja: "借財持ち" },
    aptitude: { might: 1, luck: 1 },
    notes: { en: "Needs coin badly enough to descend.", ja: "降りる理由には困っていない。" }
  },
  {
    id: "cartographer",
    label: { en: "Cartographer", ja: "地図師" },
    aptitude: { wit: 2 },
    notes: { en: "Turns fear into mapped lines.", ja: "恐怖を線に置き換える。" }
  }
];

export const traitCatalog: CharacterTraitDefinition[] = [
  { id: "steady", label: { en: "Steady", ja: "冷静" }, aptitude: { spirit: 1 } },
  { id: "scarred", label: { en: "Scarred", ja: "古傷" }, aptitude: { might: 1 }, equipment: "bandage roll" },
  { id: "lucky", label: { en: "Lucky", ja: "強運" }, aptitude: { luck: 2 } },
  { id: "grim", label: { en: "Grim", ja: "寡黙" }, aptitude: { might: 1, spirit: 1 } },
  { id: "curious", label: { en: "Curious", ja: "好奇心" }, aptitude: { wit: 1, agility: 1 } }
];

export const starterTemplates: Record<StarterTemplateId, { label: LocalizedLabel; members: GuildCharacterInput[] }> = {
  balanced: {
    label: { en: "Balanced", ja: "均衡" },
    members: [
      { name: "Rook", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"], method: "template" },
      { name: "Bran", classId: "vanguard", backgroundId: "debtor", traitIds: ["scarred"], method: "template" },
      { name: "Vale", classId: "seeker", backgroundId: "ruinborn", traitIds: ["curious"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Mira", classId: "occultist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" },
      { name: "Lio", classId: "mender", backgroundId: "cartographer", traitIds: ["curious"], method: "template" }
    ]
  },
  cautious: {
    label: { en: "Cautious", ja: "慎重" },
    members: [
      { name: "Rook", classId: "vanguard", backgroundId: "watch", traitIds: ["scarred"], method: "template" },
      { name: "Bran", classId: "vanguard", backgroundId: "debtor", traitIds: ["steady"], method: "template" },
      { name: "Kest", classId: "seeker", backgroundId: "cartographer", traitIds: ["curious"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Mira", classId: "occultist", backgroundId: "cartographer", traitIds: ["grim"], method: "template" },
      { name: "Nera", classId: "mender", backgroundId: "watch", traitIds: ["steady"], method: "template" }
    ]
  },
  treasure: {
    label: { en: "Treasure Hunters", ja: "財宝狙い" },
    members: [
      { name: "Vale", classId: "seeker", backgroundId: "ruinborn", traitIds: ["lucky"], method: "template" },
      { name: "Kest", classId: "seeker", backgroundId: "cartographer", traitIds: ["curious"], method: "template" },
      { name: "Rook", classId: "vanguard", backgroundId: "debtor", traitIds: ["grim"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Mira", classId: "occultist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" },
      { name: "Lio", classId: "mender", backgroundId: "watch", traitIds: ["curious"], method: "template" }
    ]
  },
  aggressive: {
    label: { en: "Aggressive", ja: "強襲" },
    members: [
      { name: "Rook", classId: "vanguard", backgroundId: "debtor", traitIds: ["scarred"], method: "template" },
      { name: "Ash", classId: "vanguard", backgroundId: "watch", traitIds: ["grim"], method: "template" },
      { name: "Vale", classId: "seeker", backgroundId: "ruinborn", traitIds: ["curious"], method: "template" },
      { name: "Mira", classId: "occultist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Nera", classId: "occultist", backgroundId: "watch", traitIds: ["grim"], method: "template" }
    ]
  },
  beginner: {
    label: { en: "Beginner Safe", ja: "初心者向け" },
    members: [
      { name: "Rook", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"], method: "template" },
      { name: "Vale", classId: "seeker", backgroundId: "ruinborn", traitIds: ["lucky"], method: "template" },
      { name: "Bran", classId: "vanguard", backgroundId: "debtor", traitIds: ["steady"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Lio", classId: "mender", backgroundId: "cartographer", traitIds: ["curious"], method: "template" },
      { name: "Mira", classId: "occultist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" }
    ]
  }
};

const defaultAptitude: CharacterAptitudes = { might: 2, agility: 2, spirit: 2, wit: 2, luck: 2 };
const accentColors = ["#c9a765", "#8ea87a", "#b66f4d", "#7a9bbd", "#a784b8"];
const quickNames = ["Mira", "Rook", "Vale", "Sei", "Bran", "Kest", "Lio", "Ash"];

export function createGuildCharacter(input: GuildCharacterInput): Character {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error("Character name is required.");
  }

  const classDef = findClass(input.classId ?? "vanguard");
  const background = findBackground(input.backgroundId ?? "watch");
  const traitIds: CharacterTraitId[] = input.traitIds?.length ? input.traitIds.slice(0, 2) : ["steady"];
  const traits = traitIds.map(findTrait);
  const aptitude = buildAptitude(input.aptitudeFocus ?? "balanced", background, traits);
  const stats = deriveStats(classDef, aptitude);
  const equipment = Array.from(new Set([...classDef.equipment, ...traits.flatMap((trait) => trait.equipment ? [trait.equipment] : [])]));

  return {
    id: crypto.randomUUID(),
    name: trimmedName,
    notes: input.notes?.trim() || background.notes.en,
    title: input.title?.trim() || classDef.label.en,
    classId: classDef.id,
    roleTags: classDef.roleTags,
    rowPreference: classDef.rowPreference,
    backgroundId: background.id,
    aptitude,
    traitIds,
    accentColor: input.accentColor ?? accentColors[hashSeed(trimmedName) % accentColors.length],
    startingEquipment: equipment,
    equipment: {},
    creation: {
      method: input.method ?? "detailed",
      seed: input.seed,
      registeredAtTurn: input.registeredAtTurn ?? 0
    },
    memory: createEmptyRosterMemory(),
    portraitRef: input.portraitRef,
    row: classDef.rowPreference,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    attack: stats.attack,
    damageMin: stats.damageMin,
    damageMax: stats.damageMax,
    accuracy: stats.accuracy,
    armor: stats.armor,
    speed: stats.speed,
    xp: 0,
    gold: 0,
    status: [],
    injury: undefined
  };
}

export function createLegacyGuildCharacter(input: { name: string; notes: string; portraitRef?: string }): Character {
  return createGuildCharacter({
    ...input,
    classId: "vanguard",
    backgroundId: "watch",
    traitIds: ["steady"],
    method: "legacy"
  });
}

export function createQuickRecruit(seed: string, registeredAtTurn = 0): Character {
  const roll = hashSeed(seed);
  const classDef = classCatalog[roll % classCatalog.length];
  const background = backgroundCatalog[Math.floor(roll / 3) % backgroundCatalog.length];
  const trait = traitCatalog[Math.floor(roll / 7) % traitCatalog.length];
  const name = quickNames[roll % quickNames.length];

  return createGuildCharacter({
    name,
    classId: classDef.id,
    backgroundId: background.id,
    traitIds: [trait.id],
    method: "quick",
    seed,
    registeredAtTurn
  });
}

export function createStarterParty(templateId: StarterTemplateId, registeredAtTurn = 0): Character[] {
  return starterTemplates[templateId].members.map((member, index) =>
    createGuildCharacter({
      ...member,
      seed: `${templateId}:${index}`,
      registeredAtTurn,
      method: "template"
    })
  );
}

export function analyzePartyCoverage(party: Character[]): PartyCoverageItem[] {
  const roleCount = (role: string) => party.filter((member) => member.roleTags.includes(role)).length;
  const frontCount = party.filter((member) => member.row === "front").length;

  return [
    coverage("front_line", "Front line", frontCount >= 2 ? "covered" : frontCount === 1 ? "thin" : "missing"),
    coverage("healing", "Healing", roleCount("healing") >= 1 ? "covered" : "missing"),
    coverage("trap_handling", "Trap handling", roleCount("trap_handling") >= 1 ? "covered" : "missing"),
    coverage("mapping", "Mapping", roleCount("mapping") >= 1 ? "covered" : "thin"),
    coverage("damage", "Damage", roleCount("damage") >= 2 ? "covered" : roleCount("damage") === 1 ? "thin" : "missing"),
    coverage("status_safety", "Status safety", roleCount("status_safety") >= 1 ? "covered" : "thin"),
    coverage("retreat_guard", "Retreat guard", roleCount("retreat_guard") >= 1 ? "covered" : "thin")
  ];
}

export function createEmptyRosterMemory() {
  return {
    injuries: 0,
    retreats: 0,
    notableVictories: [],
    deeds: []
  };
}

export function findClass(id: CharacterClassId) {
  return classCatalog.find((candidate) => candidate.id === id) ?? classCatalog[0];
}

export function findBackground(id: CharacterBackgroundId) {
  return backgroundCatalog.find((candidate) => candidate.id === id) ?? backgroundCatalog[0];
}

export function findTrait(id: CharacterTraitId) {
  return traitCatalog.find((candidate) => candidate.id === id) ?? traitCatalog[0];
}

function buildAptitude(
  focus: keyof CharacterAptitudes | "balanced",
  background: CharacterBackgroundDefinition,
  traits: CharacterTraitDefinition[]
) {
  const aptitude = { ...defaultAptitude };
  if (focus !== "balanced") {
    aptitude[focus] += 2;
  }

  for (const [key, value] of Object.entries(background.aptitude)) {
    aptitude[key as keyof CharacterAptitudes] += value ?? 0;
  }

  for (const trait of traits) {
    for (const [key, value] of Object.entries(trait.aptitude)) {
      aptitude[key as keyof CharacterAptitudes] += value ?? 0;
    }
  }

  return aptitude;
}

function deriveStats(classDef: CharacterClassDefinition, aptitude: CharacterAptitudes) {
  return {
    maxHp: classDef.base.maxHp + aptitude.might + Math.floor(aptitude.spirit / 2),
    attack: classDef.base.attack + Math.floor(aptitude.might / 2),
    damageMin: classDef.base.damageMin + Math.floor(aptitude.might / 3),
    damageMax: classDef.base.damageMax + Math.floor((aptitude.might + aptitude.luck) / 3),
    accuracy: Math.min(95, classDef.base.accuracy + aptitude.agility + Math.floor(aptitude.luck / 2)),
    armor: classDef.base.armor + Math.floor(aptitude.spirit / 4),
    speed: classDef.base.speed + aptitude.agility
  };
}

function coverage(id: string, label: string, status: PartyCoverageItem["status"]): PartyCoverageItem {
  return { id, label, status };
}

function hashSeed(seed: string) {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
