import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { executeCommand } from "../src/domain/rulesEngine";
import type { CombatEnemyGroup, Enemy, GameState } from "../src/domain/types";

function combatStateFor(enemy: Enemy): GameState {
  const party = [
    { ...createCharacter({ name: "Rook", notes: "Front line probe" }), id: "probe.rook", row: "front" as const, attack: 5, damageMin: 4, damageMax: 6, armor: 2 },
    { ...createCharacter({ name: "Vale", notes: "Scout probe" }), id: "probe.vale", row: "front" as const, attack: 3, damageMin: 2, damageMax: 4, armor: 1 },
    { ...createCharacter({ name: "Mira", notes: "Back line probe" }), id: "probe.mira", row: "back" as const, attack: 4, damageMin: 3, damageMax: 5, armor: 0 }
  ];
  const group: CombatEnemyGroup = {
    id: `probe.${enemy.id}`,
    enemyId: enemy.id,
    name: enemy.name,
    count: enemy.role === "boss" || enemy.role === "miniboss" ? 1 : 2,
    hpEach: enemy.hp,
    maxHpEach: enemy.hp,
    attack: enemy.attack,
    armor: enemy.armor ?? 0,
    accuracy: enemy.accuracy ?? 70,
    damageMin: enemy.damageMin ?? Math.max(1, enemy.attack - 1),
    damageMax: enemy.damageMax ?? Math.max(1, enemy.attack + 1),
    speed: enemy.speed ?? 4,
    morale: enemy.morale ?? 7,
    xp: enemy.xp ?? 1,
    gold: enemy.gold ?? 0,
    role: enemy.role
  };

  return {
    ...party.reduce((state, member) => addCharacter(state, member), createInitialGameState()),
    phase: "combat",
    position: { roomId: "probe.room", facing: "east" },
    combat: {
      enemy,
      roomId: "probe.room",
      round: 1,
      enemyGroups: [group],
      pendingActions: [],
      selectedActorId: party[0].id,
      selectedTargetId: group.id
    }
  };
}

const report = defaultWorld.enemies.map((enemy) => {
  let state = combatStateFor(enemy);
  let roundsResolved = 0;
  for (let round = 0; round < 16 && state.phase === "combat"; round += 1) {
    const target = state.combat?.enemyGroups.find((group) => group.count > 0);
    const frontActors = state.party.filter((member) => member.row === "front" && !member.injury && member.hp > 0);
    const actors = frontActors.length > 0 ? frontActors : state.party.filter((member) => !member.injury && member.hp > 0);
    if (actors.length === 0 || !target) {
      break;
    }
    state = executeCommand(state, defaultWorld, {
      type: "declare_round",
      actions: actors.map((actor) => ({ actorId: actor.id, action: "attack", targetGroupId: target.id }))
    });
    roundsResolved += 1;
  }

  return {
    enemy: enemy.id,
    role: enemy.role ?? "attrition",
    cleared: state.phase !== "combat",
    rounds: roundsResolved,
    injuries: state.party.filter((member) => member.injury).length,
    hp: state.party.map((member) => ({ name: member.name, hp: member.hp, maxHp: member.maxHp }))
  };
});

console.log(JSON.stringify(report, null, 2));

if (report.some((probe) => !probe.cleared)) {
  process.exitCode = 1;
}
