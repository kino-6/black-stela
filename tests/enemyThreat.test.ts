import { describe, expect, it } from "vitest";
import { chooseEnemyTargetFor } from "../src/domain/rulesEngine";
import { formatCombatBeat } from "../src/domain/combatBeatText";
import { createGuildCharacter } from "../src/domain/characterCreation";
import { getEffectiveCharacterStats } from "../src/domain/economy";
import { createTranslator } from "../src/i18n";
import { worldRegistry } from "../src/data/worldRegistry";
import type { Character, CombatBeat } from "../src/domain/types";

// Enemy threat & meaningful actions (2026-07-17). Two gaps a playtest found: enemies only ever
// hit the same front tank (the back-row casters were untouchable), and the Verdant roster did
// nothing but basic-attack. This locks the fix — abilities can reach the exposed back row, and the
// roster now carries status shutdown / poison attrition / elemental spikes with JA names.

const member = (id: string, row: "front" | "back", hp: number, injury?: "wounded") =>
  ({ id, row, hp, injury } as unknown as Character);

describe("enemy abilities target by row", () => {
  const party = [
    member("f1", "front", 30),
    member("f2", "front", 28),
    member("b1", "back", 12),
    member("b2", "back", 10)
  ];

  it("a back-targeting ability strikes an EXPOSED caster, never the front tank", () => {
    // Across many seeds it only ever lands on the back row — the threat basic melee cannot make.
    for (let i = 0; i < 50; i += 1) {
      expect(chooseEnemyTargetFor(party, "back", `seed-${i}`)?.row).toBe("back");
    }
  });

  it("a front-targeting ability stays on the front line", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(chooseEnemyTargetFor(party, "front", `s${i}`)?.row).toBe("front");
    }
  });

  it("an 'any' ability seeks the most wounded, regardless of row", () => {
    const pool = [member("f", "front", 30), member("b", "back", 3)];
    expect(chooseEnemyTargetFor(pool, "any", "x")?.id).toBe("b");
  });

  it("reaches across the line when the preferred row is empty, and skips when none stand", () => {
    expect(chooseEnemyTargetFor([member("f", "front", 20)], "back", "x")?.id).toBe("f");
    const noneStanding = [member("f", "front", 0), member("b", "back", 0, "wounded")];
    expect(chooseEnemyTargetFor(noneStanding, "back", "x")).toBeNull();
  });
});

describe("the Verdant roster acts with intent", () => {
  const enemies = worldRegistry.verdant.enemies;

  it("carries back-row shutdown, poison attrition, and elemental spikes (not all basic attacks)", () => {
    const withAbilities = enemies.filter((enemy) => (enemy.abilities?.length ?? 0) > 0);
    const withInflicts = enemies.filter((enemy) => enemy.inflicts);
    // A floor of nothing-but-basic-attacks can no longer silently regress in.
    expect(withAbilities.length).toBeGreaterThanOrEqual(5);
    expect(withInflicts.length).toBeGreaterThanOrEqual(2);
    // At least one enemy reaches the back line (the exposed-caster threat).
    expect(enemies.some((enemy) => enemy.abilities?.some((ability) => ability.target === "back"))).toBe(true);
    // At least one enemy brings an ELEMENT to resist (the defensive-counterplay hook).
    expect(enemies.some((enemy) => enemy.abilities?.some((ability) => ability.effect.kind === "damage"))).toBe(true);
  });

  it("gives every authored ability a Japanese name (no English leaking into the JA log)", () => {
    for (const enemy of enemies) {
      for (const ability of enemy.abilities ?? []) {
        expect(ability.locales?.ja?.name, `${enemy.id} / ${ability.name} needs a ja name`).toBeTruthy();
      }
    }
  });

  it("renders an enemy ability's JA name in the combat log (not raw English)", () => {
    const ja = createTranslator("ja");
    const localizeAbility = (enemyId: string | undefined, raw: string) => {
      const owner = enemies.find((enemy) => enemy.id === enemyId);
      return owner?.abilities?.find((ability) => ability.name === raw)?.locales?.ja?.name ?? raw;
    };
    const pollen = enemies.find((enemy) => enemy.id === "enemy.verdant.g4.pollen-drifter")!;
    const raw = pollen.abilities![0].name; // "Beguiling Pollen"
    const jaName = pollen.abilities![0].locales!.ja!.name!; // "惑わしの花粉"
    const beat: CombatBeat = {
      kind: "status",
      text: `${raw} fallback`,
      actorEnemyId: pollen.id,
      abilityName: raw,
      statusName: "silence",
      targetName: "Mira"
    } as CombatBeat;
    const line = formatCombatBeat(beat, ja, (id) => id ?? "", localizeAbility);
    expect(line).toContain(jaName); // localized name present
    expect(line).not.toContain(raw); // no English leak
  });

  it("offers DEFENSIVE counterplay to the wood spikes it now deals (the prepare loop closes)", () => {
    // The deep keepers deal wood + spore sleep; a ward must exist that actually blunts them, or the
    // new threat is a flat wall rather than a preparation gap (drpg-balance: threat + counter).
    const ward = worldRegistry.verdant.equipment.find(
      (item) => item.slot === "accessory" && (item.elementResist?.wood ?? 1) < 1
    );
    expect(ward, "verdant needs a wood-resist accessory to counter its wood abilities").toBeTruthy();

    const bare = createGuildCharacter({ name: "Prep", classId: "vanguard", seed: "ward" });
    const warded: Character = { ...bare, equipment: { accessory: { id: ward!.id } } };
    const stats = getEffectiveCharacterStats(warded, worldRegistry.verdant);
    expect(stats.elementResist.wood).toBeLessThan(1); // takes less wood damage
    expect(stats.resistance?.sleep ?? 0).toBeGreaterThan(0); // steadier against the spore sleep
  });
});
