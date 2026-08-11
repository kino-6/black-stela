// One-shot: emit content/worlds/terminal-line/techniques.md from the live firearm factory output,
// so the authored data is byte-equivalent to the code it replaces (Phase 5, risk #1 mitigation).
import { writeFileSync } from "node:fs";
import yaml from "js-yaml";
import { TECHNIQUES } from "../src/domain/techniques";
import { SPELL_LABEL } from "../src/domain/combatBeatText";
import { en } from "../src/i18n/en";
import { ja } from "../src/i18n/ja";

function labelFor(id: string, dict: any): string {
  const key = SPELL_LABEL[id];
  if (!key) throw new Error(`no SPELL_LABEL for ${id}`);
  const [ns, leaf] = key.split(".");
  const name = dict[ns]?.[leaf];
  if (!name) throw new Error(`no i18n for ${key}`);
  return name;
}

// Firearm techniques = active (tag "firearm", non-passive) + the 6 passives (kind "passive").
const firearmActives = Object.values(TECHNIQUES).filter((t) => t.kind !== "passive" && t.tags?.includes("firearm"));
const firearmPassives = Object.values(TECHNIQUES).filter((t) => t.kind === "passive");

const techniques = [...firearmActives, ...firearmPassives].map((t) => {
  const entry: Record<string, unknown> = {
    id: t.id,
    kind: t.kind,
    target: t.target,
    cost: t.cost,
    effects: t.effects,
    duration: t.duration,
    tags: t.tags,
    locales: { en: { name: labelFor(t.id, en) }, ja: { name: labelFor(t.id, ja) } }
  };
  if (t.passiveBonus) entry.passiveBonus = t.passiveBonus;
  return entry;
});

const body = yaml.dump({ techniques }, { lineWidth: 200, noRefs: true, sortKeys: false });
const md = `---\n${body}---\n\n# Terminal Line — firearm techniques\n\nThe pistol / rifle / SMG / shotgun maneuvers (40 active + 6 gear passives) granted by equipped weapons\n(see items.md). Authored as DATA: the engine defines no firearm technique — this world does. Externalised\nfrom src/domain/techniques.ts in the technique-catalog externalisation slice.\n`;

const path = new URL("../content/worlds/terminal-line/techniques.md", import.meta.url).pathname;
writeFileSync(path, md);
// Also emit the JSON snapshot for the equivalence test.
writeFileSync(new URL("../scratchpad/firearm-snapshot.json", import.meta.url).pathname, JSON.stringify(techniques, null, 2));
console.log(`wrote ${techniques.length} firearm techniques → ${path}`);
console.log(`actives=${firearmActives.length} passives=${firearmPassives.length}`);
