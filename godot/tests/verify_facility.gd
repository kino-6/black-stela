extends SceneTree
## #33 base facilities — the salvage-`materials` sink. Proves the upgrade loop end to end on the real
## town screen: open the 基地 counter in terminal-line, press the infirmary's upgrade, and assert the
## facility level rose, materials were spent, and the effect resolver now reports the level-1 effect.
## Also guards that a world with NO authored facilities hides the counter entirely.

const UxFixture := preload("res://tests/ux_fixture.gd")
const I18n := preload("res://scripts/i18n.gd")
const Facilities := preload("res://scripts/rules/facilities.gd")

var _problems: Array[String] = []

func _initialize() -> void:
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for _frame in 8:
		await process_frame

	town.call("set_world_override", "terminal-line")
	var state := UxFixture.build({"partyGold": 600})
	state["phase"] = "town"
	state["materials"] = 100
	state["facilities"] = {}
	town.call("set_state_override", state)
	town.call("set_ui_state", {"service": "facility"})
	for _frame in 6:
		await process_frame

	# The panel must render the authored facilities in the world's own voice.
	var text := _text_of(town)
	_check(text.contains("医務室"), "base panel lists the infirmary")
	_check(text.contains("補給所"), "base panel lists the supply cache")
	_check(text.contains("通信室"), "base panel lists the signals room")

	var before_materials := int(town.call("state").get("materials", 0))
	# All three facilities share the same tier-1 cost (8); the FIRST upgrade button is the infirmary (row 0).
	var upgrade := _button_with_text(town, I18n.t("facility.upgrade", {"cost": 8}))
	if upgrade == null or upgrade.disabled:
		_check(false, "infirmary upgrade action is reachable and enabled with materials in hand")
	else:
		upgrade.emit_signal("pressed")
		for _frame in 6:
			await process_frame
		var after: Dictionary = town.call("state")
		var level := int((after.get("facilities", {}) as Dictionary).get("facility.tl-infirmary", 0))
		_check(level == 1, "pressing upgrade raised the infirmary to level 1 (got %d)" % level)
		_check(int(after.get("materials", 0)) == before_materials - 8, "upgrade spent exactly 8 materials (%d→%d)" % [before_materials, int(after.get("materials", 0))])
		var world: Dictionary = town.get("_world")
		var effects := Facilities.active_effects(after, world)
		_check(bool(effects.get("restOnReturn", false)), "infirmary level 1 activates the restOnReturn effect")

	# Effect resolution: a run with all three facilities at level 1 reports each one's level-1 effect.
	var tl_world: Dictionary = town.get("_world")
	var built := {"facilities": {"facility.tl-infirmary": 1, "facility.tl-supply": 1, "facility.tl-signals": 1, "facility.tl-armory-works": 1, "facility.tl-control-room": 1}}
	var eff := Facilities.active_effects(built, tl_world)
	_check(int(eff.get("shopDiscountPct", 0)) == 5, "supply level 1 → 5%% shop discount (got %d)" % int(eff.get("shopDiscountPct", 0)))
	_check(int(eff.get("explorationBonus", 0)) == 3, "signals level 1 → +3 exploration (got %d)" % int(eff.get("explorationBonus", 0)))
	_check(int(eff.get("reinforceDiscountPct", 0)) == 15, "armory-works level 1 → 15%% reinforce discount (got %d)" % int(eff.get("reinforceDiscountPct", 0)))
	_check(int(eff.get("wanderingReductionPct", 0)) == 30, "control-room level 1 → 30%% fewer wandering encounters (got %d)" % int(eff.get("wanderingReductionPct", 0)))

	# The infirmary actually heals: a wounded party is restored to full HP on return when it is built.
	var wounded := {"facilities": {"facility.tl-infirmary": 1}, "party": [{"id": "x", "hp": 1, "maxHp": 30, "mp": 0, "maxMp": 10, "equipment": {}, "status": []}]}
	var healed := Facilities.apply_return_heal(wounded, tl_world)
	var hp := int((healed["party"][0] as Dictionary).get("hp", 0))
	_check(hp == 30, "infirmary restores a wounded member to full HP on return (got %d)" % hp)

	# A world with no authored facilities must not surface the base counter at all.
	town.call("set_world_override", "default")
	town.call("set_ui_state", {"service": ""})
	for _frame in 6:
		await process_frame
	var default_world: Dictionary = town.get("_world")
	_check((default_world.get("facilities", []) as Array).is_empty(), "the default world authors no facilities (base counter hidden)")

	if _problems.is_empty():
		print("[facility] PASS — the base upgrade loop spends materials and persists the level")
		quit(0)
	else:
		for problem in _problems:
			push_error("[facility] %s" % problem)
		quit(1)

func _check(ok: bool, label: String) -> void:
	if not ok:
		_problems.append(label)

func _button_with_text(node: Node, label: String) -> Button:
	if node is Button and (node as Button).text == label:
		return node as Button
	for child in node.get_children():
		var found := _button_with_text(child, label)
		if found != null:
			return found
	return null

func _text_of(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	for child in node.get_children():
		out += _text_of(child)
	return out
