// The active scenario for framework-free consumers (pure helpers like catalog.ts,
// which are called with only an itemId from many UI sites). Set once whenever a
// scenario is selected — exactly like setActiveArtPack — so those helpers resolve
// against the world currently being played instead of a hard-coded singleton.
// React components should use WorldContext / useWorld() instead of this.
// See docs/design/scenario-switching.md.
import type { ScenarioWorld } from "../domain/types";
import { defaultWorld } from "./defaultWorld";

let activeWorld: ScenarioWorld = defaultWorld;

export function setActiveWorld(world: ScenarioWorld): void {
  activeWorld = world;
}

export function getActiveWorld(): ScenarioWorld {
  return activeWorld;
}
