import { executeCommand, meleeTargetableGroup } from "./rulesEngine";
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

export interface TempoOptions {
  // When true, auto-battle hands control back at each risk point (boss / tactical
  // squad / party danger). Default false — auto just runs.
  safetyStops?: boolean;
}

// The auto-battle move for a round: every able member attacks the first living
// group; a back-row member with no reach and a standing front line defends. Shared
// by the instant tempo step and the paced (playback) auto path in the view.
export function chooseAutoRoundActions(state: GameState, world: ScenarioWorld): CombatActionDeclaration[] {
  if (state.phase !== "combat" || !state.combat) {
    return [];
  }
  // Target a group a melee swing can actually LAND on — the reachable front line first.
  // Blindly taking the first living group made auto-battle hammer a shielded back-row group
  // (a front blocker still standing) forever: every swing was blocked, no damage landed, and the
  // fight never ended. The enemy turn also re-sorts the groups by speed, so "first living" could
  // become the shielded caster after round one. Once the front falls, the back becomes targetable.
  const groups = state.combat.enemyGroups;
  const target = groups.find((group) => meleeTargetableGroup(group, groups)) ?? groups.find((group) => group.count > 0);
  const activeParty = state.party.filter((member) => member.hp > 0 && !member.injury);
  if (!target || activeParty.length === 0) {
    return [];
  }
  const hasStandingFront = activeParty.some((member) => member.row === "front");
  return activeParty.map((member) =>
    member.row === "front" || !hasStandingFront || weaponReaches(member, world)
      ? { actorId: member.id, action: "attack", targetGroupId: target.id }
      : { actorId: member.id, action: "defend" }
  );
}

// Whether auto-battle should hand control back BEFORE resolving another round, and
// the status line to show. Returns null to keep going. Used by the paced auto path.
export function autoCombatStopStatus(state: GameState, options: TempoOptions, t: Translator): string | null {
  if (state.phase !== "combat" || !state.combat) {
    return t("tempo.autoStoppedClear");
  }
  if (options.safetyStops) {
    if (state.combat.enemy.isBoss || state.combat.enemy.role === "boss" || state.combat.enemy.role === "miniboss") {
      return t("tempo.autoStoppedBoss");
    }
    const tacticalSquad = state.combat.enemyGroups.some(
      (group) =>
        group.count > 0 &&
        (group.role === "blocker" || group.role === "caster" || group.elevation === "air" || group.elevation === "mid")
    );
    if (tacticalSquad) {
      return t("tempo.autoStoppedTactical");
    }
    if (state.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
      return t("tempo.autoStoppedDanger");
    }
  }
  if (state.party.filter((member) => member.hp > 0 && !member.injury).length === 0) {
    return t("tempo.autoStoppedDanger");
  }
  return null;
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
  t: Translator,
  options: TempoOptions = {}
): TempoStepResult {
  if (mode === "combat") {
    return runTempoCombatStep(state, world, t, options);
  }

  return runTempoDungeonStep(state, world, t);
}

function runTempoCombatStep(
  state: GameState,
  world: ScenarioWorld,
  t: Translator,
  options: TempoOptions
): TempoStepResult {
  if (state.phase !== "combat" || !state.combat) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedClear") };
  }

  // Discretionary safety stops (boss / tactical squad / party danger) are OFF by
  // default — auto-battle just runs until the fight ends or no one can act. A player
  // can re-enable them in Config (they hand control back at each risk point).
  if (options.safetyStops) {
    if (state.combat.enemy.isBoss || state.combat.enemy.role === "boss" || state.combat.enemy.role === "miniboss") {
      return { state, keepRunning: false, status: t("tempo.autoStoppedBoss") };
    }
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
  }

  const actions = chooseAutoRoundActions(state, world);
  if (actions.length === 0) {
    return { state, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }
  const next = executeCommand(state, world, {
    type: "declare_round",
    actions
  });

  if (next.phase !== "combat") {
    return { state: next, keepRunning: false, status: t("tempo.autoStoppedClear") };
  }

  if (options.safetyStops && next.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
    return { state: next, keepRunning: false, status: t("tempo.autoStoppedDanger") };
  }

  // Wiped (no one can still act) — auto must stop even with safety stops off.
  if (next.phase === "combat" && next.party.every((member) => member.hp <= 0 || member.injury)) {
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
