import { executeCommand, meleeTargetableGroup } from "./rulesEngine";
import { weaponReaches } from "./economy";
import { getGridEdge, getRoom } from "./scenario";
import { combatLoadout } from "./vocations";
import { resolveTechniqueCatalog, type Technique } from "./techniques";
import { spellTargeting } from "./spells";
import type { Character, CombatActionDeclaration, CombatStatus, GameState, ScenarioWorld } from "./types";
import type { Translator } from "../i18n";

/** Which auto-battle strategy a tempo loop runs: aggressive (attack) or supportive (ward/heal). */
export type AutoStrategy = "attack" | "defense";

// A member who can actually take an action THIS round: alive, not down-with-injury, and not asleep
// (a sleeper is skipped by the resolver, so assigning it the heal would just waste the role — the auto
// re-generates every round, so the moment it wakes it acts again). Silence only blocks 呪文, so a
// silenced member is still "able" (it can attack); the resolver drops any spell it cannot cast.
function canAct(member: { hp: number; injury?: unknown; status?: CombatStatus[] }): boolean {
  return member.hp > 0 && !member.injury && !(member.status ?? []).includes("sleep");
}

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
  // Which selector the combat loop uses. "attack" (default) hammers the front line and honours the
  // safety stops; "defense" wards/cures/heals first and PUSHES THROUGH danger (recovering is its job).
  strategy?: AutoStrategy;
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
  const activeParty = state.party.filter(canAct);
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

const DEFENSE_HEAL_THRESHOLD = 0.5; // heal an ally at or below half HP
const CURABLE_STATUSES: CombatStatus[] = ["poison", "fear", "silence", "sleep"]; // ward is a buff, not curable

function healAmountOf(technique: Technique): number {
  const effect = technique.effects.find((candidate) => candidate.kind === "heal");
  return effect && effect.kind === "heal" ? effect.amount : 0;
}

// A cast action, targeted per the technique's SCOPE (ally → a chosen ally; self/party/allEnemies → the
// resolver derives the subjects, so no target is attached). Mirrors CombatCommandMenu's queueSpell.
function castAction(member: Character, technique: Technique, ally: Character): CombatActionDeclaration {
  if (spellTargeting(technique.target) === "ally") {
    return { actorId: member.id, action: "cast", spellId: technique.id, targetCharacterId: ally.id };
  }
  return { actorId: member.id, action: "cast", spellId: technique.id };
}

// The DEFENSE/RECOVERY auto move for a round. Per able member, in priority order: raise a ward, lift an
// ally's affliction, heal the worst-hurt (technique or item), a back-row member defends, else attack. It
// only emits actions the shared engine already resolves (cast/use_item/defend/attack), so it needs no
// parity mirror. Attack is the fallback, so the fight still progresses and ends.
export function chooseDefensiveRoundActions(state: GameState, world: ScenarioWorld): CombatActionDeclaration[] {
  if (state.phase !== "combat" || !state.combat) {
    return [];
  }
  const groups = state.combat.enemyGroups;
  const target = groups.find((group) => meleeTargetableGroup(group, groups)) ?? groups.find((group) => group.count > 0);
  // Two sets: who can ACT this round (canAct — excludes asleep), and every valid RECOVERY TARGET (any
  // living, non-injured ally — INCLUDING a sleeping one, since a sleeper is exactly who most needs the
  // ward/cure/heal that another member casts on them).
  const actors = state.party.filter(canAct);
  const living = state.party.filter((member) => member.hp > 0 && !member.injury);
  if (!target || actors.length === 0) {
    return [];
  }

  const catalog = resolveTechniqueCatalog(world);
  const hasStandingFront = living.some((member) => member.row === "front");
  const worstHurt = [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const someoneHurt = living.some((member) => member.hp <= Math.ceil(member.maxHp * DEFENSE_HEAL_THRESHOLD));
  const afflicted = living.find((member) => (member.status ?? []).some((status) => CURABLE_STATUSES.includes(status)));

  // Allies already covered by a ward this round (seed with those who already carry it), so several
  // warders do not redundantly re-cast the same cover.
  const warded = new Set(living.filter((member) => (member.status ?? []).includes("ward")).map((member) => member.id));
  const actions: CombatActionDeclaration[] = [];

  for (const member of actors) {
    const techniques = combatLoadout(member, world)
      .map((id) => catalog[id])
      .filter((technique): technique is Technique => Boolean(technique));
    const affordable = (technique: Technique) => member.mp >= (technique.cost.mp ?? 0);

    // 1. Ward — cover before the enemy acts (self or party scope).
    const ward = techniques.find((technique) => technique.effects.some((effect) => effect.kind === "ward") && affordable(technique));
    if (ward) {
      const covers = ward.target === "party" ? living.map((member) => member.id) : [member.id];
      if (covers.some((id) => !warded.has(id))) {
        covers.forEach((id) => warded.add(id));
        actions.push(castAction(member, ward, member));
        continue;
      }
    }
    // 2. Cure — lift an ally's affliction.
    if (afflicted) {
      const cure = techniques.find((technique) => technique.effects.some((effect) => effect.kind === "cure") && affordable(technique));
      if (cure) {
        actions.push(castAction(member, cure, afflicted));
        continue;
      }
    }
    // 3. Heal — the worst-hurt ally, biggest heal first; else a carried healing item.
    if (someoneHurt) {
      const heal = techniques
        .filter((technique) => technique.effects.some((effect) => effect.kind === "heal") && spellTargeting(technique.target) !== "group" && affordable(technique))
        .sort((a, b) => healAmountOf(b) - healAmountOf(a))[0];
      if (heal) {
        actions.push(castAction(member, heal, worstHurt));
        continue;
      }
      const potion = state.inventory.find((item) => item.kind === "healing" && item.quantity > 0);
      if (potion) {
        actions.push({ actorId: member.id, action: "use_item", itemId: potion.id, targetCharacterId: worstHurt.id });
        continue;
      }
    }
    // 4. Defend — a back-row member with no reach behind a standing front line.
    if (member.row !== "front" && hasStandingFront && !weaponReaches(member, world)) {
      actions.push({ actorId: member.id, action: "defend" });
      continue;
    }
    // 5. Attack.
    actions.push({ actorId: member.id, action: "attack", targetGroupId: target.id });
  }
  return actions;
}

// Whether auto-battle should hand control back BEFORE resolving another round, and
// the status line to show. Returns null to keep going. Used by the paced auto path.
export function autoCombatStopStatus(state: GameState, options: TempoOptions, t: Translator): string | null {
  if (state.phase !== "combat" || !state.combat) {
    return t("tempo.autoStoppedClear");
  }
  // The defense loop ignores discretionary safety stops (it heals through danger); only a wipe stops it.
  if ((options.strategy ?? "attack") === "attack" && options.safetyStops) {
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

  const strategy = options.strategy ?? "attack";
  // Discretionary safety stops (boss / tactical squad / party danger) apply to the ATTACK loop only —
  // the DEFENSE loop pushes through danger because recovering the party is exactly its job. A full wipe
  // still stops either loop (checked after the round). The player toggles safety in Config.
  if (strategy === "attack" && options.safetyStops) {
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

  const actions = strategy === "defense" ? chooseDefensiveRoundActions(state, world) : chooseAutoRoundActions(state, world);
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

  if (strategy === "attack" && options.safetyStops && next.party.some((member) => member.injury || member.hp <= Math.ceil(member.maxHp * 0.35))) {
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
