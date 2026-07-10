import { executeCommand } from "./rulesEngine";
import { weaponReaches } from "./economy";
import { getGridEdge, getRoom } from "./scenario";
import type { CombatActionDeclaration, GameState, ScenarioWorld } from "./types";
import type { Translator } from "../i18n";

/**
 * Repeat / auto-action tempo rules: one step of the auto-runner given the
 * current state. Kept out of the view so the pacing logic is testable on its
 * own. Each step returns the next state, whether the runner should keep going,
 * and a human-facing status line for when it stops.
 */
export type TempoMode = "idle" | "dungeon" | "combat";

export interface TempoStepResult {
  state: GameState;
  keepRunning: boolean;
  status: string;
}

export function getTempoModeForPhase(phase: GameState["phase"]): TempoMode {
  if (phase === "combat") {
    return "combat";
  }

  if (phase === "dungeon") {
    return "dungeon";
  }

  return "idle";
}

export function runTempoStep(
  state: GameState,
  mode: Exclude<TempoMode, "idle">,
  world: ScenarioWorld,
  t: Translator
): TempoStepResult {
  if (mode === "combat") {
    return runTempoCombatStep(state, world, t);
  }

  return runTempoDungeonStep(state, world, t);
}

function runTempoCombatStep(state: GameState, world: ScenarioWorld, t: Translator): TempoStepResult {
  if (state.phase !== "combat" || !state.combat) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedClear") };
  }

  if (state.combat.enemy.isBoss || state.combat.enemy.role === "boss" || state.combat.enemy.role === "miniboss") {
    return { state, keepRunning: false, status: t("tempo.autoStoppedBoss") };
  }

  // A tactical squad (a shielding front line or a back-line caster) can't be won by
  // mashing Repeat — hand control back so the player targets and casts deliberately.
  const tacticalSquad = state.combat.enemyGroups.some(
    (group) =>
      group.count > 0 &&
      (group.role === "blocker" || group.role === "caster" || group.elevation === "air" || group.elevation === "mid")
  );
  if (tacticalSquad) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedTactical") };
  }

  if (state.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  const target = state.combat.enemyGroups.find((group) => group.count > 0);
  const activeParty = state.party.filter((member) => member.hp > 0 && !member.injury);
  if (activeParty.length === 0 || !target) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  const hasStandingFront = activeParty.some((member) => member.row === "front");
  const actions: CombatActionDeclaration[] = activeParty.map((member) =>
    member.row === "front" || !hasStandingFront || weaponReaches(member, world)
      ? { actorId: member.id, action: "attack", targetGroupId: target.id }
      : { actorId: member.id, action: "defend" }
  );
  const next = executeCommand(state, world, {
    type: "declare_round",
    actions
  });

  if (next.phase !== "combat") {
    return { state: next, keepRunning: false, status: t("tempo.autoStoppedClear") };
  }

  if (next.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
    return { state: next, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  return { state: next, keepRunning: true, status: "" };
}

function runTempoDungeonStep(state: GameState, world: ScenarioWorld, t: Translator): TempoStepResult {
  if (state.phase !== "dungeon" || !state.position) {
    return { state, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  if (state.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  const room = getRoom(world, state.position.roomId);
  const exits = Object.entries(room.exits).filter(([, target]) => Boolean(target));
  const forwardEdge = getGridEdge(world, state.position.roomId, state.position.facing);
  const currentExit = room.exits[state.position.facing];
  // Stop for hazards/events on the current tile, but not merely for standing on
  // a return/rest tile — the party starts on the entrance's town gate and must
  // be able to auto-walk off it. Arriving at a return/rest tile still stops
  // (see the nextRoom check below).
  if (room.trap || room.encounter || room.event || room.gates?.length) {
    return { state, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  if (forwardEdge?.kind === "stairs") {
    return { state, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  if (!currentExit || exits.length > 2) {
    return { state, keepRunning: false, status: t("tempo.autoMoveStoppedBranch") };
  }

  const next = executeCommand(state, world, { type: "move_forward" });
  if (next === state || next.phase !== "dungeon") {
    return { state: next, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  const nextRoom = next.position ? getRoom(world, next.position.roomId) : null;
  if (nextRoom?.trap || nextRoom?.encounter || nextRoom?.event || nextRoom?.gates?.length || nextRoom?.stairsToTown || nextRoom?.restPoint) {
    return { state: next, keepRunning: false, status: t("tempo.autoMoveStoppedEvent") };
  }

  return { state: next, keepRunning: true, status: "" };
}
