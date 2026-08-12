extends SceneTree
## Terminal Line's firearm art must be reachable from both a basic attack and an equipment-granted
## shooting technique.  Asset-existence checks alone previously passed while `travel` was never drawn and
## technique beats were indistinguishable from melee.  This mounts the real combat scene, resolves real
## rules beats, then verifies every family’s arrival-trace + impact overlays were added to the live damage
## layer without adding a muzzle that is tied to an ally portrait/card.
## Usage: godot --headless --path godot/ --script res://tests/verify_firearm_fx.gd

const Encounter := preload("res://scripts/encounter.gd")
const CombatRound := preload("res://scripts/rules/combat_round.gd")

var _fail := 0

func _initialize() -> void:
	# This script itself is the SceneTree owner under `--script`; resolve the autoload relative to its
	# root rather than an absolute scene path (which Godot rejects before an active scene is mounted).
	var run := get_root().get_node_or_null("Run")
	if run == null:
		_fail_check("Run autoload is available for the real combat scene")
		_finish()
		return
	run.world_id = "terminal-line"
	run.reset()
	_prepare_shooter(run)
	var enemy: Dictionary = (run.world.get("enemies", []) as Array)[0]
	Encounter.begin(run.state, run.world, "room.tl1f.entrance", String(enemy.get("id", "")))

	var scene := (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(scene)
	for i in 12:
		await process_frame

	var actor: Dictionary = (run.state.get("party", []) as Array)[0]
	var group_id := String(((run.state.get("combat", {}) as Dictionary).get("enemyGroups", []) as Array)[0].get("id", ""))
	var basic := CombatRound.declare_round(run.state, run.world, [{"action": "attack", "actorId": String(actor.get("id", "")), "targetGroupId": group_id}], run.engine)
	var basic_beat := _first_party_beat(basic.get("events", []))
	_check(bool(basic_beat.get("firearm", false)) and String(basic_beat.get("firearmFamily", "")) == "pistol", "a pistol basic attack emits a firearm beat with its family")

	# Start a fresh group for the technique proof, so the first basic attack cannot end the only fight.
	Encounter.begin(run.state, run.world, "room.tl1f.entrance", String(enemy.get("id", "")))
	group_id = String(((run.state.get("combat", {}) as Dictionary).get("enemyGroups", []) as Array)[0].get("id", ""))
	var technique := CombatRound.declare_round(run.state, run.world, [{"action": "cast", "actorId": String(actor.get("id", "")), "spellId": "pistol-draw", "targetGroupId": group_id}], run.engine)
	var technique_beat := _first_party_beat(technique.get("events", []))
	_check(bool(technique_beat.get("firearm", false)) and String(technique_beat.get("firearmFamily", "")) == "pistol", "an equipment-granted pistol technique emits the same firearm family")

	var visual_combat: Dictionary = scene.call("_combat")
	var visual_group_id := String((visual_combat.get("enemyGroups", []) as Array)[0].get("id", ""))
	for family in ["pistol", "rifle", "smg", "shotgun"]:
		scene.call("_spawn_gun_fx", visual_group_id, family)
		await process_frame
		for kind in ["travel", "impact"]:
			_check(_has_fx(scene.get("_damage_layer"), "fx-tl-%s-%s.png" % [family, kind]), "the %s %s texture is added to the live playback layer" % [family, kind])
		_check(not _has_fx(scene.get("_damage_layer"), "fx-tl-%s-muzzle.png" % family), "the %s shot adds no portrait/card-bound muzzle overlay" % family)
	var before := _fx_count(scene.get("_damage_layer"))
	scene.call("_spawn_gun_fx", visual_group_id, "")
	await process_frame
	_check(_fx_count(scene.get("_damage_layer")) == before, "a non-firearm beat adds no firearm overlay")

	scene.free()
	_finish()

func _prepare_shooter(run: Node) -> void:
	var party: Array = (run.state.get("party", []) as Array).duplicate(true)
	var shooter: Dictionary = party[0]
	shooter["equipment"] = {"weapon": {"id": "equip.tl-service-pistol"}}
	shooter["mp"] = 99
	shooter["accuracy"] = 999 # The gate proves presentation routing; it must not depend on one random miss.
	party[0] = shooter
	run.state["party"] = party

func _first_party_beat(events: Array) -> Dictionary:
	for event in events:
		if String((event as Dictionary).get("type", "")) != "combat_round_resolved":
			continue
		for beat in (event as Dictionary).get("beats", []):
			if String((beat as Dictionary).get("actorName", "")) != "":
				return beat
	return {}

func _has_fx(node: Node, filename: String) -> bool:
	if node is TextureRect:
		var tex := (node as TextureRect).texture
		if tex != null and tex.get_size() == Vector2(512, 512) and String(node.get_meta("firearm_fx_asset", "")).ends_with(filename):
			return true
	for child in node.get_children():
		if _has_fx(child, filename):
			return true
	return false

func _fx_count(node: Node) -> int:
	var count := 1 if node is TextureRect else 0
	for child in node.get_children():
		count += _fx_count(child)
	return count

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[firearm-fx] ok: %s" % label)
	else:
		push_error("[firearm-fx] FAIL: %s" % label)
		_fail += 1

func _fail_check(label: String) -> void:
	_check(false, label)

func _finish() -> void:
	print("[firearm-fx] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)
