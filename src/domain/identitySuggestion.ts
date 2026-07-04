import type { CharacterBackgroundId, CharacterClassId, CharacterTraitId } from "./types";
import { findBackground, findClass, findTrait } from "./characterCreation";

type Locale = "en" | "ja";

interface IdentitySuggestionInput {
  seed: number;
  locale: Locale;
  classId: CharacterClassId;
  backgroundId: CharacterBackgroundId;
  traitId: CharacterTraitId;
}

interface IdentitySuggestion {
  name: string;
  title: string;
  notes: string;
}

const names = {
  en: [
    "Mira",
    "Rook",
    "Vale",
    "Sei",
    "Bran",
    "Kest",
    "Lio",
    "Ash",
    "Nera",
    "Orn",
    "Tess",
    "Galt",
    "Ira",
    "Noel",
    "Vey",
    "Sable"
  ],
  ja: [
    "ミラ",
    "ルーク",
    "ヴェイル",
    "セイ",
    "ブラン",
    "ケスト",
    "リオ",
    "アッシュ",
    "ネラ",
    "オルン",
    "テス",
    "ガルト",
    "イラ",
    "ノエル",
    "ヴェイ",
    "セーブル"
  ]
};

const titleHeads = {
  en: ["Lantern", "Ash", "Gate", "Dust", "Iron", "Quiet", "Black", "Candle", "Last", "Hollow"],
  ja: ["灯", "灰", "門", "塵", "鉄", "静", "黒", "蝋", "殿", "虚"]
};

const titleTails = {
  en: ["Hand", "Walker", "Keeper", "Knife", "Reader", "Ward", "Thread", "Step", "Eye", "Oath"],
  ja: ["の手", "歩き", "守り", "刃", "読み", "札", "糸", "足", "目", "誓い"]
};

const noteOpeners = {
  en: [
    "Keeps watch when others sleep.",
    "Counts exits before counting coin.",
    "Touches the wall before crossing a threshold.",
    "Laughs only after the danger has passed.",
    "Carries one favor owed and one favor due."
  ],
  ja: [
    "人が眠る間に見張りを続ける。",
    "金より先に出口の数を数える。",
    "敷居を越える前に壁へ触れる。",
    "危険が去ってから、ようやく笑う。",
    "貸しと借りを一つずつ抱えている。"
  ]
};

export function createIdentitySuggestion(input: IdentitySuggestionInput): IdentitySuggestion {
  const classDef = findClass(input.classId);
  const background = findBackground(input.backgroundId);
  const trait = findTrait(input.traitId);
  const seed = Math.abs(input.seed);
  const locale = input.locale;
  const name = pick(names[locale], seed);
  const title = `${pick(titleHeads[locale], seed + 3)}${pick(titleTails[locale], seed + 7)}`;
  const notes = locale === "ja"
    ? `${pick(noteOpeners.ja, seed + 11)} ${background.label.ja}で、${trait.label.ja}。${classDef.label.ja}として潜る。`
    : `${pick(noteOpeners.en, seed + 11)} ${background.label.en}; ${trait.label.en}. Delves as ${articleFor(classDef.label.en)} ${classDef.label.en}.`;

  return { name, title, notes };
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.floor(seed) % items.length];
}

function articleFor(word: string) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}
