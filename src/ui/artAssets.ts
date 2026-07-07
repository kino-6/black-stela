import stoneFloorBlock1Url from "../assets/dungeon/stone-floor-block1.jpg";
import stoneFloorBlock2Url from "../assets/dungeon/stone-floor-block2.jpg";
import stoneFloorBlock3Url from "../assets/dungeon/stone-floor-block3.jpg";
import stoneWallBlock1Url from "../assets/dungeon/stone-wall-block1.jpg";
import stoneWallBlock2Url from "../assets/dungeon/stone-wall-block2.jpg";
import stoneWallBlock3Url from "../assets/dungeon/stone-wall-block3.jpg";
import ashSlimeTextureUrl from "../assets/dungeon/ash-slime.png";
import ashVotaryTextureUrl from "../assets/dungeon/ash-votary.png";
import bitterMoteTextureUrl from "../assets/dungeon/bitter-mote.png";
import cinderKeeperTextureUrl from "../assets/dungeon/cinder-keeper.png";
import cisternWardenTextureUrl from "../assets/dungeon/cistern-warden.png";
import dustCrawlerTextureUrl from "../assets/dungeon/dust-crawler.png";
import hookRatTextureUrl from "../assets/dungeon/hook-rat.png";
import lanternWardTextureUrl from "../assets/dungeon/lantern-ward.png";
import oathCutterTextureUrl from "../assets/dungeon/oath-cutter.png";
import oathWardenTextureUrl from "../assets/dungeon/oath-warden.png";
import vaultHuskTextureUrl from "../assets/dungeon/vault-husk.png";
import equipAshwoodStaffUrl from "../assets/icons/equip-ashwood-staff.png";
import equipBlackThreadRingUrl from "../assets/icons/equip-black-thread-ring.png";
import equipCandleWardUrl from "../assets/icons/equip-candle-ward.png";
import equipChalkCordUrl from "../assets/icons/equip-chalk-cord.png";
import equipGripGlovesUrl from "../assets/icons/equip-grip-gloves.png";
import equipIronCapUrl from "../assets/icons/equip-iron-cap.png";
import equipMilitiaSabreUrl from "../assets/icons/equip-militia-sabre.png";
import equipPaddedJackUrl from "../assets/icons/equip-padded-jack.png";
import equipRingMailUrl from "../assets/icons/equip-ring-mail.png";
import equipRustedDirkUrl from "../assets/icons/equip-rusted-dirk.png";
import equipSplitBucklerUrl from "../assets/icons/equip-split-buckler.png";
import itemAshenKeyUrl from "../assets/icons/item-ashen-key.png";
import itemHealingDraughtUrl from "../assets/icons/item-healing-draught.png";
import itemLanternOilUrl from "../assets/icons/item-lantern-oil.png";
import itemReturnCharmUrl from "../assets/icons/item-return-charm.png";
import itemStelaShardUrl from "../assets/icons/item-stela-shard.png";
import cloakPortraitUrl from "../assets/portraits/cloak.png";
import coinPortraitUrl from "../assets/portraits/coin.png";
import dockPortraitUrl from "../assets/portraits/dock.png";
import gatePortraitUrl from "../assets/portraits/gate.png";
import gravePortraitUrl from "../assets/portraits/grave.png";
import inkPortraitUrl from "../assets/portraits/ink.png";
import mapPortraitUrl from "../assets/portraits/map.png";
import pitPortraitUrl from "../assets/portraits/pit.png";
import roadPortraitUrl from "../assets/portraits/road.png";
import ruinPortraitUrl from "../assets/portraits/ruin.png";
import vialPortraitUrl from "../assets/portraits/vial.png";
import wardPortraitUrl from "../assets/portraits/ward.png";

export const portraitAssetUrls: Record<string, string> = {
  cloak: cloakPortraitUrl,
  coin: coinPortraitUrl,
  dock: dockPortraitUrl,
  gate: gatePortraitUrl,
  grave: gravePortraitUrl,
  ink: inkPortraitUrl,
  map: mapPortraitUrl,
  pit: pitPortraitUrl,
  road: roadPortraitUrl,
  ruin: ruinPortraitUrl,
  vial: vialPortraitUrl,
  ward: wardPortraitUrl
};

export const catalogIconUrls: Record<string, string> = {
  "equip.ashwood-staff": equipAshwoodStaffUrl,
  "equip.black-thread-ring": equipBlackThreadRingUrl,
  "equip.candle-ward": equipCandleWardUrl,
  "equip.chalk-cord": equipChalkCordUrl,
  "equip.grip-gloves": equipGripGlovesUrl,
  "equip.iron-cap": equipIronCapUrl,
  "equip.militia-sabre": equipMilitiaSabreUrl,
  "equip.padded-jack": equipPaddedJackUrl,
  "equip.ring-mail": equipRingMailUrl,
  "equip.rusted-dirk": equipRustedDirkUrl,
  "equip.split-buckler": equipSplitBucklerUrl,
  "item.ashen-key": itemAshenKeyUrl,
  "item.healing-draught": itemHealingDraughtUrl,
  "item.lantern-oil": itemLanternOilUrl,
  "item.return-charm": itemReturnCharmUrl,
  "item.stela-shard": itemStelaShardUrl
};

export const dungeonBlockTextureUrls = {
  block1: { wall: stoneWallBlock1Url, floor: stoneFloorBlock1Url },
  block2: { wall: stoneWallBlock2Url, floor: stoneFloorBlock2Url },
  block3: { wall: stoneWallBlock3Url, floor: stoneFloorBlock3Url }
} as const;

// Combat sprite per enemy id. Ash Slime doubles as the fallback so an enemy
// without a dedicated sprite (e.g. a scenario pack's custom foe) still draws
// something rather than crashing.
export const ENEMY_SPRITE_FALLBACK_URL = ashSlimeTextureUrl;

export const enemySpriteTextureUrls: Record<string, string> = {
  "enemy.b1f.ash-slime": ashSlimeTextureUrl,
  "enemy.b1f.dust-crawler": dustCrawlerTextureUrl,
  "enemy.b2f.hook-rat": hookRatTextureUrl,
  "enemy.b3f.bitter-mote": bitterMoteTextureUrl,
  "enemy.b4f.lantern-ward": lanternWardTextureUrl,
  "enemy.b6f.oath-cutter": oathCutterTextureUrl,
  "enemy.b7f.vault-husk": vaultHuskTextureUrl,
  "enemy.b3f.cistern-warden": cisternWardenTextureUrl,
  "enemy.b5f.cinder-keeper": cinderKeeperTextureUrl,
  "enemy.b6f.oath-warden": oathWardenTextureUrl,
  "enemy.b8f.ash-votary": ashVotaryTextureUrl
};

export function getEnemySpriteTextureUrl(enemyId: string) {
  return enemySpriteTextureUrls[enemyId] ?? ENEMY_SPRITE_FALLBACK_URL;
}

export function hasEnemySpriteTexture(enemyId: string) {
  return Object.hasOwn(enemySpriteTextureUrls, enemyId);
}
