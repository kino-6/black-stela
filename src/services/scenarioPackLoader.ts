import { getExit, parseScenarioWorld } from "../domain/scenario";
import { parseScenarioPackManifest, type ScenarioPackManifest, type ScenarioValidationError } from "../domain/scenarioPack";
import type { ScenarioWorld } from "../domain/types";

export interface ScenarioPackFiles {
  [path: string]: string;
}

export type ScenarioPackLoadResult =
  | { ok: true; manifest: ScenarioPackManifest; world: ScenarioWorld }
  | { ok: false; errors: ScenarioValidationError[] };

export function loadScenarioPack(files: ScenarioPackFiles, rootPath = ""): ScenarioPackLoadResult {
  const errors: ScenarioValidationError[] = [];
  const manifestPath = joinPath(rootPath, "manifest.md");
  const manifestMarkdown = files[manifestPath];
  if (!manifestMarkdown) {
    return {
      ok: false,
      errors: [{ filePath: manifestPath, fieldPath: "manifest", reason: "Missing scenario pack manifest." }]
    };
  }

  const manifest = parseWithContext(manifestPath, () => parseScenarioPackManifest(manifestMarkdown), errors);
  if (!manifest) {
    return { ok: false, errors };
  }

  const worldPath = joinPath(rootPath, manifest.entryWorld);
  const worldMarkdown = files[worldPath];
  if (!worldMarkdown) {
    errors.push({ filePath: worldPath, fieldPath: "entryWorld", reason: "Missing entry world file." });
  }

  const dungeonMarkdowns = manifest.dungeons.flatMap((path) => {
    const fullPath = joinPath(rootPath, path);
    const markdown = files[fullPath];
    if (!markdown) {
      errors.push({ filePath: fullPath, fieldPath: "dungeons", reason: "Missing dungeon file." });
      return [];
    }

    return [markdown];
  });

  if (!worldMarkdown || errors.length > 0) {
    return { ok: false, errors };
  }

  const world = parseWithContext(worldPath, () => parseScenarioWorld(worldMarkdown, dungeonMarkdowns), errors);
  if (!world) {
    return { ok: false, errors };
  }

  errors.push(...validateScenarioGraph(world, worldPath));

  return errors.length > 0 ? { ok: false, errors } : { ok: true, manifest, world };
}

export function validateScenarioGraph(world: ScenarioWorld, filePath = "world.md"): ScenarioValidationError[] {
  const errors: ScenarioValidationError[] = [];
  const roomIds = new Set(world.dungeons.flatMap((dungeon) => dungeon.rooms.map((room) => room.id)));

  if (!world.aiPolicy.allowed.length && !world.aiPolicy.forbidden.length) {
    errors.push({ filePath, fieldPath: "aiPolicy", reason: "AI policy must declare allowed or forbidden behavior." });
  }

  for (const dungeon of world.dungeons) {
    if (!roomIds.has(dungeon.startRoom)) {
      errors.push({ filePath, fieldPath: `${dungeon.id}.startRoom`, reason: `Unknown start room: ${dungeon.startRoom}` });
    }

    for (const room of dungeon.rooms) {
      for (const direction of ["north", "east", "south", "west"] as const) {
        const target = getExit(world, room.id, direction);
        if (target && !roomIds.has(target)) {
          errors.push({
            filePath,
            fieldPath: `${room.id}.exits.${direction}`,
            reason: `Exit references unknown room: ${target}`
          });
        }
      }
    }
  }

  return errors;
}

function parseWithContext<T>(
  filePath: string,
  parse: () => T,
  errors: ScenarioValidationError[]
): T | null {
  try {
    return parse();
  } catch (error) {
    errors.push({
      filePath,
      fieldPath: "yaml",
      reason: error instanceof Error ? error.message : "Unable to parse scenario document."
    });
    return null;
  }
}

function joinPath(rootPath: string, path: string) {
  return rootPath ? `${rootPath.replace(/\/$/, "")}/${path}` : path;
}
