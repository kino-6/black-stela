import { noChange, withEvents } from "../commandResult";
import type { CommandResult } from "../commandResult";
import {
  canAdoptVocation,
  changeCharacterVocation,
  findVocation,
  localizedVocationName,
  resolveVocationState,
  setLoadout
} from "../vocations";
import type { GameState, ScenarioWorld } from "../types";

// IMP-021C town vocation commands — change an adventurer's vocation and set their bounded combat
// loadout. Extracted from rulesEngine as one cohesive group; both are town-only.

// Change an adventurer's vocation in town. Only if its prerequisites are met; keeps level and every
// learned technique (changeCharacterVocation). A basic vocation reclasses the base stats; an advanced
// one layers its modifiers.
export function changeVocationCommand(state: GameState, world: ScenarioWorld, characterId: string, vocationId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  const vocation = findVocation(world, vocationId);
  if (!member || !vocation || !canAdoptVocation(member, vocationId, world)) {
    return noChange(state);
  }
  if (resolveVocationState(member).current === vocationId) {
    return noChange(state);
  }
  const changed = changeCharacterVocation(member, vocation, world);
  const next: GameState = {
    ...state,
    party: state.party.map((candidate) => (candidate.id === characterId ? changed : candidate)),
    turn: state.turn + 1
  };
  return withEvents(next, [
    { type: "vocation_changed", characterId, characterName: member.name, vocationId, vocationName: localizedVocationName(world, vocationId, "en") }
  ]);
}

// Set an adventurer's bounded combat loadout (a subset of learned techniques). Town only.
export function setLoadoutCommand(state: GameState, characterId: string, loadout: string[]): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  if (!member) {
    return noChange(state);
  }
  const nextVocation = setLoadout(resolveVocationState(member), loadout);
  return {
    state: {
      ...state,
      party: state.party.map((candidate) => (candidate.id === characterId ? { ...candidate, vocation: nextVocation } : candidate))
    },
    events: []
  };
}
