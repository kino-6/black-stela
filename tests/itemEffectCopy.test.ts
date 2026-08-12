import { describe, expect, it } from "vitest";
import { worldRegistry } from "../src/data/worldRegistry";
import { createTranslator, type TranslationKey } from "../src/i18n";
import { describeConsumable } from "../src/ui/catalog";
import type { InventoryItem } from "../src/domain/types";

/**
 * #19 — flavour and effect are DISTINCT, and the effect is never left unsaid.
 *
 * The item detail used to show the authored flavour OR the generated effect, so a consumable WITH flavour
 * ("外傷封止材" — 圧着すると深い傷を…) rendered its mood and never said HP回復 36; a cure ("チャイム遮断栓")
 * never named which status it removes. The panels now show both, and describeConsumable is the generated
 * effect line. This gate fails the day a catalogued effect stops being stated — especially a cure that does
 * not name what it cures. It covers EVERY shipped world (terminal-line included, where the report came from).
 */
const t = createTranslator("ja");

const worlds = Object.entries(worldRegistry);

describe("#19 item effect copy — an effect is always stated, never hidden by flavour", () => {
  it("covers more than the two base worlds (terminal-line is in the registry)", () => {
    expect(worlds.map(([id]) => id)).toContain("terminal-line");
  });

  for (const [worldId, world] of worlds) {
    it(`${worldId}: every item that HAS an effect states it (never flavour-only)`, () => {
      const silent: string[] = [];
      for (const item of world.items ?? []) {
        const hasEffect = Boolean(item.healAmount || item.restoreMp || item.curesStatuses?.length);
        if (!hasEffect) continue;
        if (!describeConsumable(item as unknown as InventoryItem, t).trim()) silent.push(item.id);
      }
      expect(silent, `${worldId}: items with an effect but an empty effect line: ${silent.join(", ")}`).toEqual([]);
    });

    it(`${worldId}: every cure item NAMES each status it removes`, () => {
      const problems: string[] = [];
      for (const item of world.items ?? []) {
        if (!item.curesStatuses?.length) continue;
        const effect = describeConsumable(item as unknown as InventoryItem, t);
        for (const status of item.curesStatuses) {
          const statusName = t(`partyMenu.status.${status}` as TranslationKey);
          if (!effect.includes(statusName)) problems.push(`${item.id} does not name «${status}» (${statusName})`);
        }
      }
      expect(problems, `${worldId}: cure items that hide what they cure: ${problems.join("; ")}`).toEqual([]);
    });
  }
});
