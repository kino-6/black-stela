extends RefCounted
## Turns a room's AUTHORED encounter into a live CombatState on the run state — the SAME party that
## walked the maze becomes the party in the fight. In the full runtime this is beginRoomEncounter →
## createCombatState → createEnemyGroup (plus the wandering-encounter RNG branch); the slice ports the
## authored branch only: read `room.encounter.id`, build that enemy's group from the world catalog, and
## attach a one-group combat. That is enough for the parity-proven CombatRound victory path (a one-round
## front-line win before any enemy turn). The wandering-RNG branch + scaledEncounterCount are Phase-3.

const ENCOUNTER_ENEMY_ID := "enemy.b1f.ash-slime"

# The slice's first-fight enemy per world (a low-HP tier-1 the six-member party one-rounds before any
# enemy turn — all that CombatRound has ported). Default fires it as room.002's AUTHORED encounter; a
# world without authored encounters (verdant is wandering-only, unported) uses this to demo its combat.
const FIRST_ENEMY := {
	"default": "enemy.b1f.ash-slime",
	"verdant": "enemy.verdant.g1.spore-gnat",
}

static func first_enemy_id(world_id: String) -> String:
	return FIRST_ENEMY.get(world_id, ENCOUNTER_ENEMY_ID)

# The enemy id a room's authored encounter fields to, or "" if the room has no authored fight.
static func room_encounter_enemy_id(room: Dictionary) -> String:
	var enc: Variant = room.get("encounter", null)
	if typeof(enc) == TYPE_DICTIONARY and typeof(enc.get("id", null)) == TYPE_STRING:
		return enc["id"]
	return ""

# Mutate `state` into a combat against a single `enemy_id` in `room_id`, returning the same dict.
static func begin(state: Dictionary, world: Dictionary, room_id: String, enemy_id: String) -> Dictionary:
	state["phase"] = "combat"
	state["combat"] = {
		"enemyGroups": [_group_from_enemy(world, enemy_id)],
		"round": 1,
		"roomId": room_id,
		"pendingActions": [],
		"selectedTargetId": null,
	}
	return state

# Convenience for scenes launched straight into combat with no walked-in encounter.
static func begin_ash_slime(state: Dictionary, world: Dictionary, room_id: String) -> Dictionary:
	return begin(state, world, room_id, ENCOUNTER_ENEMY_ID)

static func _group_from_enemy(world: Dictionary, enemy_id: String) -> Dictionary:
	var enemy: Dictionary = {}
	for e in world.get("enemies", []):
		if typeof(e) == TYPE_DICTIONARY and e.get("id", "") == enemy_id:
			enemy = e
			break
	var hp := int(enemy.get("hp", 4))
	return {
		"id": "group.%s" % enemy_id,
		"enemyId": enemy_id,
		"name": enemy.get("name", "Enemy"),
		"locales": enemy.get("locales", {}),
		"count": 1,
		"initialCount": 1,
		"hpEach": hp,
		"maxHpEach": hp,
		"accuracy": int(enemy.get("accuracy", 70)),
		"armor": int(enemy.get("armor", 0)),
		"attack": int(enemy.get("attack", 0)),
		"damageMin": int(enemy.get("damageMin", 1)),
		"damageMax": int(enemy.get("damageMax", 1)),
		"dangerTier": int(enemy.get("dangerTier", 1)),
		"gold": int(enemy.get("gold", 0)),
		"xp": int(enemy.get("xp", 0)),
		"morale": int(enemy.get("morale", 5)),
		"role": enemy.get("role", "attrition"),
		"speed": int(enemy.get("speed", 4)),
		"weaknesses": enemy.get("weaknesses", {}),
		"status": [],
	}
