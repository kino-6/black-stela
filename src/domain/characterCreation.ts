import type {
  Character,
  CharacterAptitudes,
  CharacterBackgroundId,
  CharacterClassId,
  CharacterCreationMethod,
  CharacterTraitId,
  CombatRow,
  EquipmentSlot
} from "./types";

export interface LocalizedLabel {
  en: string;
  ja: string;
}

export interface CharacterClassDefinition {
  id: CharacterClassId;
  label: LocalizedLabel;
  description: LocalizedLabel;
  roleTags: string[];
  rowPreference: CombatRow;
  aptitude: Partial<CharacterAptitudes>;
  base: Pick<Character, "maxHp" | "attack" | "damageMin" | "damageMax" | "accuracy" | "armor" | "speed">;
  equipment: Partial<Record<EquipmentSlot, string>>;
}

export interface CharacterBackgroundDefinition {
  id: CharacterBackgroundId;
  label: LocalizedLabel;
  aptitude: Partial<CharacterAptitudes>;
  notes: LocalizedLabel;
  accentColor: string;
  portraitKey: string;
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
  bonusAptitude?: Partial<CharacterAptitudes>;
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
    label: { en: "Vanguard", ja: "先鋒" },
    description: {
      en: "Takes the first blow and keeps the line from breaking.",
      ja: "最初の一撃を受け、列を崩さず押し返す。"
    },
    roleTags: ["front_line", "damage", "retreat_guard"],
    rowPreference: "front",
    aptitude: { might: 2, spirit: 1 },
    base: { maxHp: 15, attack: 5, damageMin: 4, damageMax: 6, accuracy: 76, armor: 2, speed: 5 },
    equipment: { weapon: "equip.militia-sabre", body: "equip.padded-jack" }
  },
  {
    id: "sellsword",
    label: { en: "Sellsword", ja: "傭兵" },
    description: {
      en: "Cuts steadily for coin; plain, durable, and hard to surprise.",
      ja: "金で刃を振るう。地味だが崩れず、不意にも強い。"
    },
    roleTags: ["front_line", "damage"],
    rowPreference: "front",
    aptitude: { might: 2, agility: 1 },
    base: { maxHp: 14, attack: 5, damageMin: 4, damageMax: 7, accuracy: 78, armor: 1, speed: 6 },
    equipment: { weapon: "equip.militia-sabre", body: "equip.padded-jack" }
  },
  {
    id: "bulwark",
    label: { en: "Bulwark", ja: "盾守" },
    description: {
      en: "Stands in the door and turns bad rounds into survivable ones.",
      ja: "扉口に立ち、悪い流れを耐えられる傷に抑える。"
    },
    roleTags: ["front_line", "retreat_guard", "status_safety"],
    rowPreference: "front",
    aptitude: { might: 2, spirit: 2 },
    base: { maxHp: 17, attack: 4, damageMin: 3, damageMax: 5, accuracy: 72, armor: 3, speed: 3 },
    equipment: { offhand: "equip.split-buckler", body: "equip.padded-jack" }
  },
  {
    id: "duelist",
    label: { en: "Duelist", ja: "剣客" },
    description: {
      en: "Finds one opening and ends weak foes before they gather.",
      ja: "一つの隙を拾い、弱い敵が群れる前に落とす。"
    },
    roleTags: ["damage"],
    rowPreference: "front",
    aptitude: { might: 1, agility: 2 },
    base: { maxHp: 12, attack: 5, damageMin: 3, damageMax: 8, accuracy: 86, armor: 0, speed: 10 },
    equipment: { weapon: "equip.militia-sabre", hands: "equip.grip-gloves" }
  },
  {
    id: "seeker",
    label: { en: "Seeker", ja: "探索者" },
    description: {
      en: "Reads hinges, dust, and floor scars before the party steps in.",
      ja: "蝶番、埃、床の傷を読み、踏み込む前に危険を拾う。"
    },
    roleTags: ["trap_handling", "mapping", "damage"],
    rowPreference: "front",
    aptitude: { agility: 2, wit: 1 },
    base: { maxHp: 11, attack: 4, damageMin: 3, damageMax: 5, accuracy: 84, armor: 1, speed: 9 },
    equipment: { weapon: "equip.rusted-dirk", accessory: "equip.chalk-cord" }
  },
  {
    id: "scout",
    label: { en: "Scout", ja: "斥候" },
    description: {
      en: "Moves ahead by a step, marks turns, and hears trouble early.",
      ja: "半歩先を取り、角を印し、まずい音を先に聞く。"
    },
    roleTags: ["mapping", "retreat_guard", "trap_handling"],
    rowPreference: "front",
    aptitude: { agility: 2, wit: 1, luck: 1 },
    base: { maxHp: 10, attack: 3, damageMin: 2, damageMax: 5, accuracy: 86, armor: 0, speed: 11 },
    equipment: { weapon: "equip.rusted-dirk", accessory: "equip.chalk-cord" }
  },
  {
    id: "cutpurse",
    label: { en: "Cutpurse", ja: "鍵師" },
    description: {
      en: "Works locks and pockets; treasure comes safer, never clean.",
      ja: "鍵と懐に手を入れる。宝は安全に近づくが、手は汚れる。"
    },
    roleTags: ["trap_handling", "damage"],
    rowPreference: "front",
    aptitude: { agility: 2, luck: 1 },
    base: { maxHp: 10, attack: 4, damageMin: 2, damageMax: 6, accuracy: 88, armor: 0, speed: 10 },
    equipment: { weapon: "equip.rusted-dirk", hands: "equip.grip-gloves" }
  },
  {
    id: "mender",
    label: { en: "Mender", ja: "癒し手" },
    description: {
      en: "Keeps breath in the wounded and spends light when panic spreads.",
      ja: "倒れかけた者の息を繋ぎ、恐慌には灯を使う。"
    },
    roleTags: ["healing", "status_safety"],
    rowPreference: "back",
    aptitude: { spirit: 2, wit: 1 },
    base: { maxHp: 10, attack: 3, damageMin: 2, damageMax: 4, accuracy: 76, armor: 0, speed: 6 },
    equipment: { weapon: "equip.ashwood-staff", offhand: "equip.candle-ward" }
  },
  {
    id: "chanter",
    label: { en: "Chanter", ja: "祈祷師" },
    description: {
      en: "Sets wards before the fear arrives and steadies shaken hands.",
      ja: "恐怖が来る前に札を置き、震える手を止める。"
    },
    roleTags: ["healing", "status_safety", "retreat_guard"],
    rowPreference: "back",
    aptitude: { spirit: 3 },
    base: { maxHp: 11, attack: 2, damageMin: 1, damageMax: 4, accuracy: 78, armor: 1, speed: 5 },
    equipment: { weapon: "equip.ashwood-staff", offhand: "equip.candle-ward" }
  },
  {
    id: "occultist",
    label: { en: "Occultist", ja: "秘術師" },
    description: {
      en: "Breaks nerve and sleep from the back row when steel is too loud.",
      ja: "刃が届かぬ時、後列から眠りと怯えを差し込む。"
    },
    roleTags: ["status_safety", "damage", "mapping"],
    rowPreference: "back",
    aptitude: { spirit: 1, wit: 2 },
    base: { maxHp: 9, attack: 3, damageMin: 2, damageMax: 5, accuracy: 78, armor: 0, speed: 7 },
    equipment: { weapon: "equip.ashwood-staff", accessory: "equip.black-thread-ring" }
  },
  {
    id: "arcanist",
    label: { en: "Arcanist", ja: "灰術師" },
    description: {
      en: "Burns signs into the air; fragile, but ends clustered threats.",
      ja: "空に灰の印を焼く。脆いが、群れをまとめて崩す。"
    },
    roleTags: ["damage", "status_safety"],
    rowPreference: "back",
    aptitude: { wit: 3 },
    base: { maxHp: 8, attack: 4, damageMin: 2, damageMax: 7, accuracy: 80, armor: 0, speed: 6 },
    equipment: { weapon: "equip.ashwood-staff", accessory: "equip.black-thread-ring" }
  },
  {
    id: "wayfinder",
    label: { en: "Wayfinder", ja: "道標師" },
    description: {
      en: "Keeps the route in mind and knows when a bad delve must turn back.",
      ja: "帰り道を頭に残し、退くべき探索を見誤らない。"
    },
    roleTags: ["mapping", "retreat_guard", "status_safety"],
    rowPreference: "back",
    aptitude: { agility: 1, spirit: 1, wit: 2 },
    base: { maxHp: 10, attack: 3, damageMin: 2, damageMax: 5, accuracy: 82, armor: 0, speed: 8 },
    equipment: { accessory: "equip.chalk-cord", offhand: "equip.candle-ward" }
  }
];

export const backgroundCatalog: CharacterBackgroundDefinition[] = [
  {
    id: "watch",
    label: { en: "Gate Watch", ja: "門衛上がり" },
    aptitude: { might: 1, spirit: 1 },
    notes: { en: "Used to holding a line.", ja: "退かずに立つことを知っている。" },
    accentColor: "#c9a765",
    portraitKey: "gate"
  },
  {
    id: "ruinborn",
    label: { en: "Ruinborn", ja: "廃墟育ち" },
    aptitude: { agility: 1, luck: 1 },
    notes: { en: "Reads danger from small marks.", ja: "小さな痕跡から危険を読む。" },
    accentColor: "#8ea87a",
    portraitKey: "ruin"
  },
  {
    id: "apothecary",
    label: { en: "Apothecary", ja: "薬師見習い" },
    aptitude: { spirit: 1, wit: 1 },
    notes: { en: "Knows what keeps a body moving.", ja: "身体を動かし続ける術を知る。" },
    accentColor: "#7a9bbd",
    portraitKey: "vial"
  },
  {
    id: "debtor",
    label: { en: "Debtor", ja: "借財持ち" },
    aptitude: { might: 1, luck: 1 },
    notes: { en: "Needs coin badly enough to descend.", ja: "降りる理由には困っていない。" },
    accentColor: "#b66f4d",
    portraitKey: "coin"
  },
  {
    id: "cartographer",
    label: { en: "Cartographer", ja: "地図師" },
    aptitude: { wit: 2 },
    notes: { en: "Turns fear into mapped lines.", ja: "恐怖を線に置き換える。" },
    accentColor: "#a784b8",
    portraitKey: "map"
  },
  {
    id: "shrine_ward",
    label: { en: "Shrine Ward", ja: "祠守の子" },
    aptitude: { spirit: 2 },
    notes: { en: "Grew up counting charms and bad omens.", ja: "札と凶兆の数を覚えて育った。" },
    accentColor: "#d5b56d",
    portraitKey: "ward"
  },
  {
    id: "caravan_guard",
    label: { en: "Caravan Guard", ja: "隊商護衛" },
    aptitude: { might: 1, agility: 1 },
    notes: { en: "Knows how ambushes begin.", ja: "襲撃の始まり方を知っている。" },
    accentColor: "#9f8f68",
    portraitKey: "road"
  },
  {
    id: "pit_fighter",
    label: { en: "Pit Fighter", ja: "闘場上がり" },
    aptitude: { might: 2 },
    notes: { en: "Survived noise, blood, and close walls.", ja: "歓声と血と狭い壁を生き残った。" },
    accentColor: "#b45d55",
    portraitKey: "pit"
  },
  {
    id: "scriptorium",
    label: { en: "Scriptorium Hand", ja: "写字生" },
    aptitude: { wit: 1, spirit: 1 },
    notes: { en: "Reads fast and forgets little.", ja: "読むのが速く、忘れることが少ない。" },
    accentColor: "#8f83a8",
    portraitKey: "ink"
  },
  {
    id: "grave_tender",
    label: { en: "Grave Tender", ja: "墓守" },
    aptitude: { spirit: 1, luck: 1 },
    notes: { en: "Does not flinch at the still or the cold.", ja: "静かなものと冷たいものに怯まない。" },
    accentColor: "#899083",
    portraitKey: "grave"
  },
  {
    id: "dock_rat",
    label: { en: "Dock Rat", ja: "波止場育ち" },
    aptitude: { agility: 2 },
    notes: { en: "Slips through crowds and bad bargains.", ja: "人混みと悪い取引をすり抜ける。" },
    accentColor: "#6f95a6",
    portraitKey: "dock"
  },
  {
    id: "deserter",
    label: { en: "Deserter", ja: "脱走兵" },
    aptitude: { agility: 1, wit: 1 },
    notes: { en: "Knows when orders will get people killed.", ja: "命を捨てる命令の匂いを知っている。" },
    accentColor: "#a07859",
    portraitKey: "cloak"
  }
];

export const traitCatalog: CharacterTraitDefinition[] = [
  { id: "steady", label: { en: "Steady", ja: "冷静" }, aptitude: { spirit: 1 } },
  { id: "scarred", label: { en: "Scarred", ja: "古傷" }, aptitude: { might: 1 }, equipment: "bandage roll" },
  { id: "lucky", label: { en: "Lucky", ja: "強運" }, aptitude: { luck: 2 } },
  { id: "grim", label: { en: "Grim", ja: "寡黙" }, aptitude: { might: 1, spirit: 1 } },
  { id: "curious", label: { en: "Curious", ja: "好奇心" }, aptitude: { wit: 1, agility: 1 } },
  { id: "cautious", label: { en: "Cautious", ja: "用心深い" }, aptitude: { wit: 1 } },
  { id: "bold", label: { en: "Bold", ja: "大胆" }, aptitude: { might: 1, luck: 1 } },
  { id: "devout", label: { en: "Devout", ja: "信心深い" }, aptitude: { spirit: 2 } },
  { id: "nimble", label: { en: "Nimble", ja: "身軽" }, aptitude: { agility: 2 } },
  { id: "stubborn", label: { en: "Stubborn", ja: "頑固" }, aptitude: { might: 1, spirit: 1 } },
  { id: "sharp_eyed", label: { en: "Sharp-eyed", ja: "目ざとい" }, aptitude: { wit: 1, luck: 1 } },
  { id: "soft_spoken", label: { en: "Soft-spoken", ja: "物静か" }, aptitude: { spirit: 1, wit: 1 } }
];

export const starterTemplates: Record<StarterTemplateId, { label: LocalizedLabel; members: GuildCharacterInput[] }> = {
  balanced: {
    label: { en: "Balanced", ja: "均衡" },
    members: [
      { name: "Rook", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"], method: "template" },
      { name: "Bran", classId: "bulwark", backgroundId: "debtor", traitIds: ["scarred"], method: "template" },
      { name: "Vale", classId: "cutpurse", backgroundId: "ruinborn", traitIds: ["curious"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Mira", classId: "arcanist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" },
      { name: "Lio", classId: "wayfinder", backgroundId: "cartographer", traitIds: ["curious"], method: "template" }
    ]
  },
  cautious: {
    label: { en: "Cautious", ja: "慎重" },
    members: [
      { name: "Rook", classId: "bulwark", backgroundId: "watch", traitIds: ["scarred"], method: "template" },
      { name: "Bran", classId: "sellsword", backgroundId: "debtor", traitIds: ["steady"], method: "template" },
      { name: "Kest", classId: "scout", backgroundId: "cartographer", traitIds: ["curious"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Mira", classId: "chanter", backgroundId: "cartographer", traitIds: ["grim"], method: "template" },
      { name: "Nera", classId: "wayfinder", backgroundId: "watch", traitIds: ["steady"], method: "template" }
    ]
  },
  treasure: {
    label: { en: "Treasure Hunters", ja: "財宝狙い" },
    members: [
      { name: "Vale", classId: "cutpurse", backgroundId: "ruinborn", traitIds: ["lucky"], method: "template" },
      { name: "Kest", classId: "seeker", backgroundId: "cartographer", traitIds: ["curious"], method: "template" },
      { name: "Rook", classId: "duelist", backgroundId: "debtor", traitIds: ["grim"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Mira", classId: "occultist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" },
      { name: "Lio", classId: "wayfinder", backgroundId: "watch", traitIds: ["curious"], method: "template" }
    ]
  },
  aggressive: {
    label: { en: "Aggressive", ja: "強襲" },
    members: [
      { name: "Rook", classId: "sellsword", backgroundId: "debtor", traitIds: ["scarred"], method: "template" },
      { name: "Ash", classId: "duelist", backgroundId: "watch", traitIds: ["grim"], method: "template" },
      { name: "Vale", classId: "vanguard", backgroundId: "ruinborn", traitIds: ["curious"], method: "template" },
      { name: "Mira", classId: "arcanist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" },
      { name: "Sei", classId: "chanter", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Nera", classId: "occultist", backgroundId: "watch", traitIds: ["grim"], method: "template" }
    ]
  },
  beginner: {
    label: { en: "Beginner Safe", ja: "初心者向け" },
    members: [
      { name: "Rook", classId: "vanguard", backgroundId: "watch", traitIds: ["steady"], method: "template" },
      { name: "Vale", classId: "seeker", backgroundId: "ruinborn", traitIds: ["lucky"], method: "template" },
      { name: "Bran", classId: "bulwark", backgroundId: "debtor", traitIds: ["steady"], method: "template" },
      { name: "Sei", classId: "mender", backgroundId: "apothecary", traitIds: ["steady"], method: "template" },
      { name: "Lio", classId: "wayfinder", backgroundId: "cartographer", traitIds: ["curious"], method: "template" },
      { name: "Mira", classId: "arcanist", backgroundId: "cartographer", traitIds: ["lucky"], method: "template" }
    ]
  }
};

const defaultAptitude: CharacterAptitudes = { might: 2, agility: 2, spirit: 2, wit: 2, luck: 2 };
const quickNames = ["Mira", "Rook", "Vale", "Sei", "Bran", "Kest", "Lio", "Ash", "Nera", "Orn", "Tess", "Galt"];

export function createGuildCharacter(input: GuildCharacterInput): Character {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error("Character name is required.");
  }

  const classDef = findClass(input.classId ?? "vanguard");
  const background = findBackground(input.backgroundId ?? "watch");
  const traitIds: CharacterTraitId[] = input.traitIds?.length ? input.traitIds.slice(0, 2) : ["steady"];
  const traits = traitIds.map(findTrait);
  const aptitude = buildAptitude(classDef, input.aptitudeFocus ?? "balanced", background, traits, input.bonusAptitude);
  const stats = deriveStats(classDef, aptitude);
  const loadout: Partial<Record<EquipmentSlot, string>> = { ...classDef.equipment };

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
    accentColor: input.accentColor ?? background.accentColor,
    startingEquipment: Object.values(loadout),
    equipment: loadout,
    creation: {
      method: input.method ?? "detailed",
      seed: input.seed,
      registeredAtTurn: input.registeredAtTurn ?? 0
    },
    memory: createEmptyRosterMemory(),
    portraitRef: input.portraitRef,
    row: classDef.rowPreference,
    level: 1,
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
  classDef: CharacterClassDefinition,
  focus: keyof CharacterAptitudes | "balanced",
  background: CharacterBackgroundDefinition,
  traits: CharacterTraitDefinition[],
  bonusAptitude: Partial<CharacterAptitudes> = {}
) {
  const aptitude = { ...defaultAptitude };
  for (const [key, value] of Object.entries(classDef.aptitude)) {
    aptitude[key as keyof CharacterAptitudes] += value ?? 0;
  }

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

  for (const [key, value] of Object.entries(bonusAptitude)) {
    aptitude[key as keyof CharacterAptitudes] += value ?? 0;
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
