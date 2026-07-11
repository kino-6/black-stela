// World registry: every scenario under content/worlds/<id>/ becomes a ScenarioWorld,
// so the game is no longer pinned to a single hard-coded world. A build-time glob
// pulls every world's markdown (Vite ?raw, eager), groups files by world-folder id,
// and parses each into a ScenarioWorld. See docs/design/scenario-switching.md.
import {
  parseScenarioEncounters,
  parseScenarioEnemies,
  parseScenarioItems,
  parseScenarioProgression,
  parseScenarioTreasure,
  parseScenarioWorld
} from "../domain/scenario";
import type { ScenarioWorld } from "../domain/types";

const markdownFiles = import.meta.glob("../../content/worlds/*/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default"
}) as Record<string, string>;

// worldId (folder) -> relative-key (no .md) -> markdown. Relative keys are e.g.
// "world", "items", "dungeons/b1f". Unknown files (rules/town/manifest/…) are kept
// but only known sections + dungeons/* are consumed.
const byWorld: Record<string, Record<string, string>> = {};
for (const [path, markdown] of Object.entries(markdownFiles)) {
  const match = path.match(/\/worlds\/([^/]+)\/(.+)\.md$/i);
  if (!match) {
    continue;
  }
  const [, worldId, relKey] = match;
  (byWorld[worldId] ??= {})[relKey] = markdown;
}

const floorLevel = (markdown: string): number => Number(markdown.match(/^level:\s*(\d+)/m)?.[1] ?? Number.MAX_SAFE_INTEGER);

function buildWorld(worldId: string, files: Record<string, string>): ScenarioWorld {
  const worldMarkdown = files["world"];
  if (!worldMarkdown) {
    throw new Error(`World "${worldId}" is missing world.md`);
  }

  // Optional data sections — a minimal scenario may ship only world.md + dungeons.
  const items = files["items"] ? parseScenarioItems(files["items"]) : { items: [], equipment: [], shops: [] };
  const enemies = files["enemies"] ? parseScenarioEnemies(files["enemies"]) : { enemies: [] };
  const encounters = files["encounters"] ? parseScenarioEncounters(files["encounters"]) : { encounterTables: [] };
  const treasure = files["treasure"] ? parseScenarioTreasure(files["treasure"]) : { treasureTables: [] };
  const progression = files["progression"] ? parseScenarioProgression(files["progression"]) : { progressionFlags: [] };

  // Dungeons in descent order: by each floor's `level` front-matter, then by name.
  const dungeonMarkdowns = Object.entries(files)
    .filter(([relKey]) => relKey.startsWith("dungeons/"))
    .sort(([aKey, aMd], [bKey, bMd]) => floorLevel(aMd) - floorLevel(bMd) || aKey.localeCompare(bKey))
    .map(([, markdown]) => markdown);

  const world = parseScenarioWorld(worldMarkdown, dungeonMarkdowns, {
    items: items.items,
    equipment: items.equipment,
    shops: items.shops,
    enemies: enemies.enemies,
    encounterTables: encounters.encounterTables,
    treasureTables: treasure.treasureTables,
    progressionFlags: progression.progressionFlags
  });

  // A scenario's art pack defaults to its OWN folder (its content/worlds/<id>/assets),
  // so each world carries its own atmosphere; missing basenames still fall back to the
  // "default" pack in the resolver.
  return { ...world, assetPack: world.assetPack ?? worldId };
}

export const worldRegistry: Record<string, ScenarioWorld> = Object.fromEntries(
  Object.entries(byWorld).map(([worldId, files]) => [worldId, buildWorld(worldId, files)])
);

export interface ScenarioListing {
  worldId: string;
  title: string;
  assetPack: string;
}

// Scenarios for the picker. Default sorts first, then alphabetical by title.
export function listScenarios(): ScenarioListing[] {
  return Object.entries(worldRegistry)
    .map(([worldId, world]) => ({ worldId, title: world.title, assetPack: world.assetPack ?? worldId }))
    .sort((a, b) => Number(b.worldId === "default") - Number(a.worldId === "default") || a.title.localeCompare(b.title));
}

export const DEFAULT_WORLD_ID = "default";

export function getWorldById(worldId: string): ScenarioWorld | undefined {
  return worldRegistry[worldId];
}
