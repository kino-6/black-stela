// The default scenario. Content now flows through the world registry (which globs
// every content/worlds/<id>/), but `defaultWorld` stays exported so existing code
// and tests that only need the built-in world keep working unchanged.
import { worldRegistry, DEFAULT_WORLD_ID } from "./worldRegistry";

const world = worldRegistry[DEFAULT_WORLD_ID];
if (!world) {
  throw new Error(`Default world "${DEFAULT_WORLD_ID}" not found in content/worlds/`);
}

export const defaultWorld = world;
