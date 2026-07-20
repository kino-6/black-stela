extends CanvasLayer
## Godot port of the React DebugPanel — developer tooling, NEVER part of normal play.
##
## AGENTS.md bars debug UI, implementation wording and arbitrary save/load from the player's game, so
## this is OFF unless explicitly asked for: run with `--debug-mode`, or press F12. It is a CanvasLayer
## so it floats over whatever scene is running, and it drives the SAME ported commands the game does —
## a debug jump that took a different code path would not be testing the game.
##
## Ports: seeded progress starts (debug.ready / after_encounter / return_ready / floor_N), scenario
## switch, force victory, full revive, and the reachability readout.

const I18n := preload("res://scripts/i18n.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const SliceRules := preload("res://scripts/rules/slice_rules.gd")

const PROGRESS_VALUES := ["ready", "after_encounter", "return_ready", "floor_2", "floor_3", "floor_4", "floor_5", "floor_6", "floor_7", "floor_8"]

var _open := false
var _panel: PanelContainer = null
var _progress := "ready"

static func enabled() -> bool:
	return OS.get_cmdline_args().has("--debug-mode") or OS.is_debug_build() and OS.get_cmdline_args().has("--debug-panel")

func _ready() -> void:
	layer = 128
	_build()

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and (event as InputEventKey).keycode == KEY_F12:
		_open = not _open
		_build()
		get_viewport().set_input_as_handled()

func _run() -> Node:
	return get_node_or_null("/root/Run")

func _build() -> void:
	for child in get_children():
		child.queue_free()
	_panel = PanelContainer.new()
	_panel.add_theme_stylebox_override("panel", UI.panel_style(Color("101418f2"), Color("5a6a8a")))
	_panel.position = Vector2(24, 24)
	add_child(_panel)

	var root := UI.col(6)
	_panel.add_child(root)

	var head := UI.row()
	head.add_child(UI.label(I18n.t("debug.heading"), 18, Color("9fb6d8")))
	head.add_child(UI.button(I18n.t("debug.collapse") if _open else I18n.t("debug.expand"), func(): _toggle(), Vector2(120, 30), 13))
	root.add_child(head)

	var run := _run()
	if run:
		var state: Dictionary = run.state
		var visited: int = (state.get("map", {}) as Dictionary).get("visitedRooms", []).size()
		var total := 0
		for dungeon in (run.world as Dictionary).get("dungeons", []):
			total += (dungeon.get("rooms", []) as Array).size()
		root.add_child(UI.label(I18n.t("debug.visited", {"visited": visited, "total": total, "phase": String(state.get("phase", "?"))}), 13, UI.DIM))
	if not _open:
		return

	# Scenario switch
	var scenarios := UI.row()
	scenarios.add_child(UI.label(I18n.t("debug.scenario"), 13, UI.DIM))
	for world_id in _world_ids():
		var wid := String(world_id)
		var b := UI.button(wid, func(): _switch_world(wid), Vector2(110, 30), 13)
		if run and String(run.world_id) == wid:
			b.add_theme_color_override("font_color", UI.GOLD)
		scenarios.add_child(b)
	root.add_child(scenarios)

	# Seeded progress
	var progress_row := UI.col(3)
	progress_row.add_child(UI.label(I18n.t("debug.progress"), 13, UI.DIM))
	var grid := UI.row()
	for value in PROGRESS_VALUES:
		var v := String(value)
		var b := UI.button(_progress_label(v), func(): _progress = v; _build(), Vector2(96, 28), 12)
		if v == _progress:
			b.add_theme_color_override("font_color", UI.GOLD)
		grid.add_child(b)
	progress_row.add_child(grid)
	progress_row.add_child(UI.button(I18n.t("debug.loadProgress"), func(): _load_progress(), Vector2(180, 32), 14))
	root.add_child(progress_row)

	# In-run helpers, each routed through the ported commands
	var actions := UI.row()
	actions.add_child(UI.button(I18n.t("debug.reviveParty"), func(): _dispatch({"type": "debug_revive_party"}), Vector2(150, 32), 13))
	actions.add_child(UI.button(I18n.t("debug.forceVictory"), func(): _dispatch({"type": "debug_force_victory"}), Vector2(130, 32), 13))
	actions.add_child(UI.button(I18n.t("debug.headlessReachability"), func(): _reachability(), Vector2(170, 32), 13))
	root.add_child(actions)

	if _reach_text != "":
		root.add_child(UI.label(_reach_text, 13, UI.OK))

var _reach_text := ""

func _progress_label(value: String) -> String:
	match value:
		"ready": return I18n.t("debug.ready")
		"after_encounter": return I18n.t("debug.afterEncounter")
		"return_ready": return I18n.t("debug.returnReady")
	return I18n.t("debug.floorStart", {"floor": value.replace("floor_", "B") + "F"})

func _world_ids() -> Array:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/index.json"))
	return (parsed as Dictionary).get("worlds", []) if typeof(parsed) == TYPE_DICTIONARY else []

func _toggle() -> void:
	_open = not _open
	_build()

func _switch_world(world_id: String) -> void:
	var run := _run()
	if run == null:
		return
	run.world_id = world_id
	run.reset()
	get_tree().change_scene_to_file("res://scenes/town.tscn")

# The seeded starts the React debug panel offers. The fixtures are the SAME ones the parity gate uses,
# so a debug jump lands on a state the oracle has already agreed with.
func _load_progress() -> void:
	var run := _run()
	if run == null:
		return
	var trace := "b1f-exploration"
	match _progress:
		"ready": trace = "expedition"
		"return_ready": trace = "b1f-return"
		"floor_2": trace = "b2f-hazard"
		"floor_3": trace = "b3f-gather"
		"floor_4": trace = "b4f-spinner"
	var path := "res://data/traces/%s.json" % trace
	if not FileAccess.file_exists(path):
		path = "res://data/traces/b1f-exploration.json"
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(doc) != TYPE_DICTIONARY:
		return
	run.state = (doc.get("initialState", {}) as Dictionary).duplicate(true)
	var phase := String(run.state.get("phase", "town"))
	get_tree().change_scene_to_file("res://scenes/dungeon.tscn" if phase == "dungeon" else "res://scenes/town.tscn")

func _dispatch(command: Dictionary) -> void:
	var run := _run()
	if run == null:
		return
	run.dispatch(command)
	_build()

# How far the ported rules can drive the run from here, headlessly — the same reachability readout the
# React panel gives, so a soft-lock shows up as a number instead of a stuck player.
func _reachability() -> void:
	var run := _run()
	if run == null:
		return
	var state: Dictionary = (run.state as Dictionary).duplicate(true)
	var commands := 0
	for i in 400:
		var before := JSON.stringify(state)
		var command := {"type": "move_forward"} if state.get("phase", "") == "dungeon" else {"type": "turn_left"}
		state = SliceRules.resolve(state, command, run.world, run.engine).get("state", state)
		commands += 1
		if JSON.stringify(state) == before:
			break
	_reach_text = I18n.t("debug.headlessReachabilityStatus", {"reason": String(state.get("phase", "?")), "count": commands})
	_build()
