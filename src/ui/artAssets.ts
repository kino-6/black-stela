// Art asset resolver. All art lives under content/worlds/<pack>/assets/** and is
// pulled through Vite (hashed/bundled/CSP-safe) by a single glob that covers EVERY
// pack — so a scenario/world can ship its own atmosphere pack, and the active one is
// chosen at runtime via setActiveArtPack.
//
// Resolution is OWN-BASENAME-FIRST: an id resolves to a file whose basename matches
// the id (dots→dashes) if one exists, otherwise to a placeholder mapping. So dropping
// `content/worlds/default/assets/icons/equip-steel-sabre.png` and rebuilding makes it
// used with no code change; until then the placeholder shows. (Vite's glob is
// build-time, so "drop a file" always implies a rebuild — there is no runtime folder
// scan.)
const assetModules = import.meta.glob("../../content/worlds/*/assets/**/*.{png,jpg}", {
  eager: true,
  query: "?url",
  import: "default"
}) as Record<string, string>;

// pack (world folder) -> basename (no extension) -> hashed url
const byPack: Record<string, Record<string, string>> = {};
for (const [path, url] of Object.entries(assetModules)) {
  const match = path.match(/\/worlds\/([^/]+)\/assets\/(?:.*\/)?([^/]+)\.(?:png|jpg)$/i);
  if (!match) {
    continue;
  }
  const [, pack, name] = match;
  (byPack[pack] ??= {})[name] = url;
}

const DEFAULT_PACK = "default";
let activePack = DEFAULT_PACK;

// Point the resolver at a scenario's art pack (its content/worlds/<pack>/assets folder).
// Unknown assets fall back to the default pack, so a partial pack still renders.
export function setActiveArtPack(pack: string): void {
  activePack = pack || DEFAULT_PACK;
}

function resolveOrNull(name: string, pack: string = activePack): string | null {
  return byPack[pack]?.[name] ?? byPack[DEFAULT_PACK]?.[name] ?? null;
}

// Resolve an asset by basename, or undefined if it isn't in this pack or the default.
// Use for OPTIONAL art (a prop/FX that has a geometry or CSS fallback) so a missing
// file degrades instead of throwing.
export function assetOrNull(name: string, pack: string = activePack): string | undefined {
  return resolveOrNull(name, pack) ?? undefined;
}

// Resolve an asset by file basename (throws loudly if missing anywhere).
export function asset(name: string, pack: string = activePack): string {
  const url = resolveOrNull(name, pack);
  if (!url) {
    throw new Error(`Missing art asset: ${name} (content/worlds/*/assets/**)`);
  }
  return url;
}

const idToBasename = (id: string) => id.replace(/\./g, "-");

// ---- Icons (equipment / items) ----------------------------------------------------
// Convention: basename === id with dots→dashes (equip.steel-sabre → equip-steel-sabre).
// Placeholders point new ids at an existing icon until real art is dropped in; the
// own-basename file always wins over the placeholder.
export const ICON_PLACEHOLDER: Record<string, string> = {
  "equip.short-bow": "equip-rusted-dirk",
  "equip.long-spear": "equip-militia-sabre",
  "equip.steel-sabre": "equip-militia-sabre",
  "equip.war-spear": "equip-militia-sabre",
  "equip.hunting-bow": "equip-rusted-dirk",
  "equip.rune-staff": "equip-ashwood-staff",
  "equip.scale-mail": "equip-ring-mail",
  "equip.war-helm": "equip-iron-cap",
  "equip.steel-gauntlets": "equip-grip-gloves",
  "equip.tower-shield": "equip-split-buckler",
  "equip.vitality-charm": "equip-black-thread-ring",
  "equip.focus-band": "equip-chalk-cord",
  "equip.antivenom-ring": "equip-black-thread-ring",
  "equip.dreamward-amulet": "equip-chalk-cord",
  "equip.swift-anklet": "equip-black-thread-ring",
  "equip.knight-plate": "equip-padded-jack",
  "equip.warlord-blade": "equip-militia-sabre",
  "item.greater-draught": "item-healing-draught",
  "item.antidote": "item-healing-draught",
  "item.clarity-draught": "item-healing-draught",
  "item.calm-draught": "item-healing-draught",
  "item.spirit-tonic": "item-lantern-oil"
};

export function catalogIconUrl(id: string, pack: string = activePack): string | undefined {
  const placeholder = ICON_PLACEHOLDER[id];
  return resolveOrNull(idToBasename(id), pack) ?? (placeholder ? resolveOrNull(placeholder, pack) : null) ?? undefined;
}

// ---- Portraits (bare keys: cloak, coin, gate…) ------------------------------------
export function portraitUrl(key: string, pack: string = activePack): string | undefined {
  return resolveOrNull(key, pack) ?? undefined;
}

// ---- Dungeon block textures (themed wall/floor sets) ------------------------------
export function blockTextures(pack: string = activePack) {
  return {
    block1: { wall: asset("stone-wall-block1", pack), floor: asset("stone-floor-block1", pack) },
    block2: { wall: asset("stone-wall-block2", pack), floor: asset("stone-floor-block2", pack) },
    block3: { wall: asset("stone-wall-block3", pack), floor: asset("stone-floor-block3", pack) }
  };
}

// ---- Enemy sprites -----------------------------------------------------------------
// Enemy sprite files use short names, so a per-id map is needed; but an id-basename
// file (enemy-b1f-foo.png) still wins first, so new foes are drop-in too.
const ENEMY_SPRITE_SHORT: Record<string, string> = {
  "enemy.b1f.ash-slime": "ash-slime",
  "enemy.b1f.dust-crawler": "dust-crawler",
  "enemy.b2f.hook-rat": "hook-rat",
  "enemy.b2f.ash-warden": "cistern-warden",
  "enemy.b2f.ash-caller": "bitter-mote",
  "enemy.b3f.bitter-mote": "bitter-mote",
  "enemy.b4f.lantern-ward": "lantern-ward",
  "enemy.b6f.oath-cutter": "oath-cutter",
  "enemy.b7f.vault-husk": "vault-husk",
  "enemy.b3f.cistern-warden": "cistern-warden",
  "enemy.b5f.cinder-keeper": "cinder-keeper",
  "enemy.b6f.oath-warden": "oath-warden",
  "enemy.b8f.ash-votary": "ash-votary"
};

export function getEnemySpriteTextureUrl(enemyId: string, pack: string = activePack): string {
  const short = ENEMY_SPRITE_SHORT[enemyId];
  return (
    resolveOrNull(idToBasename(enemyId), pack) ??
    (short ? resolveOrNull(short, pack) : null) ??
    asset("ash-slime", pack) // fallback sprite
  );
}

export function hasEnemySpriteTexture(enemyId: string, pack: string = activePack): boolean {
  return resolveOrNull(idToBasename(enemyId), pack) !== null || Boolean(ENEMY_SPRITE_SHORT[enemyId]);
}

// ---- CSS-referenced art -----------------------------------------------------------
// Minimap markers, the title key art, and the combat vignette used to be hard-coded
// content/ paths inside styles.css. They now resolve through THIS resolver too: App
// sets these as CSS custom properties on :root, so they are drop-in and pack-scoped
// exactly like the icons/sprites, instead of being pinned to one world's filenames.
const CSS_ART: Record<string, string> = {
  "--art-marker-return": "marker-return",
  "--art-marker-stairs": "marker-stairs",
  "--art-marker-spinner": "marker-spinner",
  "--art-marker-teleporter": "marker-teleporter",
  "--art-marker-hazard": "marker-hazard",
  "--art-marker-gather": "marker-gather",
  "--art-marker-event": "marker-event",
  "--art-marker-treasure": "marker-treasure",
  "--art-marker-trap": "marker-trap",
  "--art-title": "black-stela-title",
  "--art-combat-vignette": "combat-vignette",
  "--art-guild-hall": "guild-hall",
  "--art-town-hub": "town-hub"
};

export function cssArtVariables(pack: string = activePack): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [cssVar, name] of Object.entries(CSS_ART)) {
    const url = resolveOrNull(name, pack);
    if (url) {
      vars[cssVar] = `url("${url}")`;
    }
  }
  return vars;
}
