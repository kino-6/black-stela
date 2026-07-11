// Art assets live in the scenario content, not in src — they are authored/generated
// alongside the rest of the world data (content/worlds/default/assets/**). A single
// glob pulls every file through Vite's asset pipeline (hashed, bundled, CSP-safe);
// the maps below bind catalog ids / enemy ids / portrait keys to files by name. To
// add or replace art, drop a file in content/ and point a map entry at its basename.
const assetModules = import.meta.glob("../../content/worlds/default/assets/**/*.{png,jpg}", {
  eager: true,
  query: "?url",
  import: "default"
}) as Record<string, string>;

const assetByName: Record<string, string> = {};
for (const [path, url] of Object.entries(assetModules)) {
  const name = path.slice(path.lastIndexOf("/") + 1).replace(/\.(png|jpg)$/i, "");
  assetByName[name] = url;
}

// Resolve an asset by file basename (no extension). Throws loudly if missing so a
// broken map entry fails at load, not silently as a blank image.
export function asset(name: string): string {
  const url = assetByName[name];
  if (!url) {
    throw new Error(`Missing art asset: ${name} (content/worlds/default/assets/**)`);
  }
  return url;
}

export const portraitAssetUrls: Record<string, string> = {
  cloak: asset("cloak"),
  coin: asset("coin"),
  dock: asset("dock"),
  gate: asset("gate"),
  grave: asset("grave"),
  ink: asset("ink"),
  map: asset("map"),
  pit: asset("pit"),
  road: asset("road"),
  ruin: asset("ruin"),
  vial: asset("vial"),
  ward: asset("ward")
};

export const catalogIconUrls: Record<string, string> = {
  "equip.ashwood-staff": asset("equip-ashwood-staff"),
  "equip.black-thread-ring": asset("equip-black-thread-ring"),
  "equip.candle-ward": asset("equip-candle-ward"),
  "equip.chalk-cord": asset("equip-chalk-cord"),
  "equip.grip-gloves": asset("equip-grip-gloves"),
  "equip.iron-cap": asset("equip-iron-cap"),
  "equip.militia-sabre": asset("equip-militia-sabre"),
  // Placeholder icons for the reach weapons (bow / long spear) — real art tracked in
  // Art.md. Reuse existing weapon icons so the catalog-icon Gate stays green.
  "equip.short-bow": asset("equip-rusted-dirk"),
  "equip.long-spear": asset("equip-militia-sabre"),
  "equip.padded-jack": asset("equip-padded-jack"),
  "equip.ring-mail": asset("equip-ring-mail"),
  "equip.rusted-dirk": asset("equip-rusted-dirk"),
  "equip.split-buckler": asset("equip-split-buckler"),
  // Tier 2/3 expansion — placeholder icons reusing existing art (real icons tracked
  // in Art.md); keeps the catalog-icon Gate green.
  "equip.steel-sabre": asset("equip-militia-sabre"),
  "equip.war-spear": asset("equip-militia-sabre"),
  "equip.hunting-bow": asset("equip-rusted-dirk"),
  "equip.rune-staff": asset("equip-ashwood-staff"),
  "equip.scale-mail": asset("equip-ring-mail"),
  "equip.war-helm": asset("equip-iron-cap"),
  "equip.steel-gauntlets": asset("equip-grip-gloves"),
  "equip.tower-shield": asset("equip-split-buckler"),
  "equip.vitality-charm": asset("equip-black-thread-ring"),
  "equip.focus-band": asset("equip-chalk-cord"),
  "equip.antivenom-ring": asset("equip-black-thread-ring"),
  "equip.dreamward-amulet": asset("equip-chalk-cord"),
  "equip.swift-anklet": asset("equip-black-thread-ring"),
  "equip.knight-plate": asset("equip-padded-jack"),
  "equip.warlord-blade": asset("equip-militia-sabre"),
  "item.ashen-key": asset("item-ashen-key"),
  "item.healing-draught": asset("item-healing-draught"),
  // Consumable expansion — placeholder icons reuse the draught/oil art (Art.md).
  "item.greater-draught": asset("item-healing-draught"),
  "item.antidote": asset("item-healing-draught"),
  "item.clarity-draught": asset("item-healing-draught"),
  "item.calm-draught": asset("item-healing-draught"),
  "item.spirit-tonic": asset("item-lantern-oil"),
  "item.lantern-oil": asset("item-lantern-oil"),
  "item.return-charm": asset("item-return-charm"),
  "item.stela-shard": asset("item-stela-shard")
};

export const dungeonBlockTextureUrls = {
  block1: { wall: asset("stone-wall-block1"), floor: asset("stone-floor-block1") },
  block2: { wall: asset("stone-wall-block2"), floor: asset("stone-floor-block2") },
  block3: { wall: asset("stone-wall-block3"), floor: asset("stone-floor-block3") }
} as const;

// Combat sprite per enemy id. Ash Slime doubles as the fallback so an enemy
// without a dedicated sprite (e.g. a scenario pack's custom foe) still draws
// something rather than crashing.
export const ENEMY_SPRITE_FALLBACK_URL = asset("ash-slime");

export const enemySpriteTextureUrls: Record<string, string> = {
  "enemy.b1f.ash-slime": asset("ash-slime"),
  "enemy.b1f.dust-crawler": asset("dust-crawler"),
  "enemy.b2f.hook-rat": asset("hook-rat"),
  // Squad pair — reuse themed sprites (warden construct / caster mote) until dedicated art lands.
  "enemy.b2f.ash-warden": asset("cistern-warden"),
  "enemy.b2f.ash-caller": asset("bitter-mote"),
  "enemy.b3f.bitter-mote": asset("bitter-mote"),
  "enemy.b4f.lantern-ward": asset("lantern-ward"),
  "enemy.b6f.oath-cutter": asset("oath-cutter"),
  "enemy.b7f.vault-husk": asset("vault-husk"),
  "enemy.b3f.cistern-warden": asset("cistern-warden"),
  "enemy.b5f.cinder-keeper": asset("cinder-keeper"),
  "enemy.b6f.oath-warden": asset("oath-warden"),
  "enemy.b8f.ash-votary": asset("ash-votary")
};

export function getEnemySpriteTextureUrl(enemyId: string) {
  return enemySpriteTextureUrls[enemyId] ?? ENEMY_SPRITE_FALLBACK_URL;
}

export function hasEnemySpriteTexture(enemyId: string) {
  return Object.hasOwn(enemySpriteTextureUrls, enemyId);
}
