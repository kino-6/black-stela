// Re-runnable difficulty tuner: set hp/attack/damageMin/damageMax per enemy id.
// Edit TUNE and run `node scripts/tuneEnemies.mjs` to re-apply from the committed base.
import { readFileSync, writeFileSync } from "node:fs";
const path = "content/worlds/default/enemies.md";
let txt = readFileSync(path, "utf8");
const TUNE = {
  // B1F stays gentle (tutorial). Deeper floors + bosses bite.
  "enemy.b1f.dust-crawler": { damageMin: 2, damageMax: 4, attack: 3 },
  "enemy.b2f.hook-rat":     { damageMin: 2, damageMax: 4, attack: 3 },
  "enemy.b2f.ash-warden":   { hp: 16, damageMin: 2, damageMax: 4, attack: 3 },
  "enemy.b2f.ash-caller":   { damageMin: 2, damageMax: 3, attack: 2 },
  "enemy.b3f.bitter-mote":  { damageMin: 2, damageMax: 4, attack: 3 },
  "enemy.b3f.cistern-warden": { hp: 17, damageMin: 4, damageMax: 7, attack: 5, accuracy: 82 },
  "enemy.b4f.lantern-ward": { hp: 10, damageMin: 3, damageMax: 6, attack: 4 },
  "enemy.b5f.cinder-keeper": { hp: 22, damageMin: 4, damageMax: 7, attack: 5, accuracy: 82 },
  "enemy.b6f.oath-warden":  { hp: 26, damageMin: 4, damageMax: 7, attack: 6, accuracy: 84 },
  "enemy.b6f.oath-cutter":  { hp: 11, damageMin: 3, damageMax: 6, attack: 4 },
  "enemy.b7f.vault-husk":   { hp: 13, damageMin: 4, damageMax: 6, attack: 5, accuracy: 74 },
  "enemy.b8f.ash-votary":   { hp: 28, damageMin: 5, damageMax: 8, attack: 6, accuracy: 84 }
};
for (const [id, fields] of Object.entries(TUNE)) {
  const start = txt.indexOf(`- id: ${id}`);
  if (start < 0) throw new Error(`missing ${id}`);
  const end = txt.indexOf("\n  - id:", start + 1);
  const block = txt.slice(start, end < 0 ? undefined : end);
  let newBlock = block;
  for (const [k, v] of Object.entries(fields)) {
    const re = new RegExp(`(\\n\\s*${k}:\\s*)\\d+`);
    if (!re.test(newBlock)) throw new Error(`${id} has no ${k}`);
    newBlock = newBlock.replace(re, `$1${v}`);
  }
  txt = txt.slice(0, start) + newBlock + (end < 0 ? "" : txt.slice(end));
}
writeFileSync(path, txt);
console.log("tuned", Object.keys(TUNE).length, "enemies");
