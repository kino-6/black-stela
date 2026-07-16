// IMP-022D — the enemy record (bestiary). Observations accumulate as the party fights; defeating an
// enemy reveals its weaknesses and where its rare drops come from. This never exposes exact HP or
// raw internal coefficients — only coarse, earned knowledge. See Improve.md IMP-022D.
import type { EnemyRecordEntry, ItemRarity, ScenarioWorld } from "./types";

export type EnemyRecord = Record<string, EnemyRecordEntry>;

function bump(record: EnemyRecord, enemyId: string, field: keyof EnemyRecordEntry): EnemyRecord {
  const entry = record[enemyId] ?? { encountered: 0, defeated: 0 };
  return { ...record, [enemyId]: { ...entry, [field]: entry[field] + 1 } };
}

export function recordEncounters(record: EnemyRecord | undefined, enemyIds: string[]): EnemyRecord {
  return enemyIds.reduce((acc, id) => bump(acc, id, "encountered"), record ?? {});
}

export function recordDefeats(record: EnemyRecord | undefined, enemyIds: string[]): EnemyRecord {
  return enemyIds.reduce((acc, id) => bump(acc, id, "defeated"), record ?? {});
}

export interface BestiaryEntry {
  enemyId: string;
  name: string;
  encountered: number;
  defeated: number;
  /** Coarse threat rating (the authored dangerTier), NOT exact stats. */
  threat: number;
  /** Revealed once the enemy has been defeated at least once. */
  known: boolean;
  weaknesses: { element: string; label: string }[];
  drops: { itemId: string; name: string; rarity: ItemRarity }[];
}

// The discovered bestiary: one entry per enemy the party has ENCOUNTERED, most-fought first. Only a
// defeated enemy reveals its weaknesses and drop sources (`known`).
export function bestiaryEntries(world: ScenarioWorld, record: EnemyRecord | undefined, locale: string): BestiaryEntry[] {
  const rec = record ?? {};
  const elementLabel = (id: string): string => {
    const element = (world.elements ?? []).find((candidate) => candidate.id === id);
    return element?.locales?.[locale]?.label ?? element?.label ?? id;
  };
  const itemName = (itemId: string): { name: string; rarity: ItemRarity } => {
    const item = world.items.find((candidate) => candidate.id === itemId);
    const equip = world.equipment.find((candidate) => candidate.id === itemId);
    const name = item?.locales?.[locale]?.name ?? item?.name ?? equip?.locales?.[locale]?.name ?? equip?.name ?? itemId;
    // Base catalog items carry no rarity; a "rare drop source" is one whose base tier is high.
    const tier = item?.tier ?? equip?.tier ?? 0;
    const rarity: ItemRarity = tier >= 5 ? "epic" : tier >= 3 ? "rare" : "common";
    return { name, rarity };
  };

  return world.enemies
    .filter((enemy) => (rec[enemy.id]?.encountered ?? 0) > 0 || (rec[enemy.id]?.defeated ?? 0) > 0)
    .map((enemy) => {
      const entry = rec[enemy.id] ?? { encountered: 0, defeated: 0 };
      const known = entry.defeated > 0;
      return {
        enemyId: enemy.id,
        name: enemy.locales?.[locale]?.name ?? enemy.name,
        encountered: entry.encountered,
        defeated: entry.defeated,
        threat: enemy.dangerTier ?? 1,
        known,
        weaknesses: known
          ? Object.entries(enemy.weaknesses ?? {})
              .filter(([, mult]) => (mult ?? 1) > 1)
              .map(([element]) => ({ element, label: elementLabel(element) }))
          : [],
        drops: known
          ? (enemy.drops ?? []).map((itemId) => ({ itemId, ...itemName(itemId) }))
          : []
      };
    })
    .sort((a, b) => b.defeated - a.defeated || b.encountered - a.encountered);
}
