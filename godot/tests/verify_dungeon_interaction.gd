extends SceneTree
## #39g — the dungeon DECIDE cluster. Locks the three defects the 2026-08-14 play:late run hit:
##   (1) 帰還 label — a 非常電話 (returnStyle != stairs) reads the generic "町へ戻る", never "階段で".
##   (2) confirm — 決定 on a return point RAISES a centred confirm and does NOT silently exit to town.
##   (3) A1 facing-aware — facing a closed door, 決定 addresses the DOOR (advance), so a return point on
##       the same cell can no longer shadow it. Facing away (no door), 決定 falls back to 帰還.
## Usage: godot --headless --path godot/ --script res://tests/verify_dungeon_interaction.gd

var _fail := 0

func _initialize() -> void:
	await _run_checks()
	print("[dungeon-interaction] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(1 if _fail > 0 else 0)

func _run_checks() -> void:
	# (1)+(2) — terminal-line 非常電話 return point.
	var d1 := await _boot("terminal-line", "cell.tl1f.return-marker", "north")
	var label := String(d1._return_label())
	_check(label == I18n_generic(), "帰還 label is the generic 町へ戻る (got '%s')" % label)
	_check(label.find("階段") == -1, "帰還 label at a 非常電話 never says 階段で")
	_check(String(d1._context_command()) == "return", "決定 on the return cell (facing away from any door) resolves to 帰還")
	d1._on_command("return")
	for i in 6:
		await process_frame
	_check(d1._confirm_overlay != null and is_instance_valid(d1._confirm_overlay), "決定 on a return point RAISES a confirm overlay")
	_check(String((d1.get_node("/root/Run").state as Dictionary).get("phase", "")) == "dungeon", "the party does NOT silently return — still in the dungeon until はい")
	# Cancel dismisses without leaving.
	d1._hide_confirm()
	for i in 3:
		await process_frame
	_check(d1._confirm_overlay == null, "declining the confirm dismisses it (no exit)")
	d1.queue_free()
	for i in 3:
		await process_frame

	# (3) — A1 facing a closed door: 決定 addresses the door, not the cell.
	var d2 := await _boot("default", "cell.b2f.c5_4", "south")
	_check(typeof(d2._faced_interactable_edge()) == TYPE_DICTIONARY, "a faced closed door is recognised as an interactable edge")
	_check(String(d2._context_command()) == "advance", "facing a closed door, 決定 = advance (open/inspect the way), not search/return")
	d2.queue_free()
	for i in 3:
		await process_frame

	# (4) — A1 facing a ROOM-GATED way (the tl1f shutter: kind "open", sealed by flag): 決定 inspects it,
	#       and the minimap draws that direction as BLOCKED (not open corridor) — "map tells the truth".
	var d3 := await _boot("terminal-line", "cell.tl1f.return-marker", "south")
	_check(String(d3._context_command()) == "advance", "facing a sealed gate (shutter), 決定 inspects it — the 帰還 point no longer shadows it")
	var run := d3.get_node("/root/Run")
	var mm := preload("res://scripts/minimap.gd").new()
	mm.setup(run.world, run.state)
	var room: Variant = mm._room("room.tl1f.return-marker")
	_check(mm._gate_closed(room, "south"), "minimap reads the sealed shutter as a BLOCKED direction (not open passage)")
	# route the signal → the same direction is now open on the map (no false red bar once passable).
	var opened: Dictionary = (run.state as Dictionary).duplicate(true)
	opened["discoveredSecrets"] = ["flag.tl1f.signal-routed"]
	mm.refresh(opened)
	_check(not mm._gate_closed(room, "south"), "once the flag is routed, the shutter reads as open (the map keeps up)")
	mm.free()
	d3.queue_free()
	for i in 3:
		await process_frame

func I18n_generic() -> String:
	var I18n := preload("res://scripts/i18n.gd")
	return I18n.t("play.returnToTown")

func _boot(world_id: String, cell_id: String, facing: String) -> Node:
	var run := get_root().get_node_or_null("Run")
	run.world_id = world_id
	run.reset()
	var cell := _cell(run.world, cell_id)
	var floor_id := _floor_of(run.world, cell_id)
	var state: Dictionary = run.state.duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": cell_id, "roomId": String(cell.get("roomId", "")), "facing": facing}
	state["map"] = {"floorId": floor_id, "visitedCells": [cell_id], "visitedRooms": [String(cell.get("roomId", ""))], "knownExits": {}, "blockedExits": {}, "secretCandidates": {}}
	run.state = state
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 12:
		await process_frame
	return dungeon

func _cell(world: Dictionary, cell_id: String) -> Dictionary:
	for floor in world.get("dungeons", []):
		for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
			if String(cell.get("id", "")) == cell_id:
				return cell
	return {}

func _floor_of(world: Dictionary, cell_id: String) -> String:
	for floor in world.get("dungeons", []):
		for cell in (floor.get("grid", {}) as Dictionary).get("cells", []):
			if String(cell.get("id", "")) == cell_id:
				return String(floor.get("id", ""))
	return ""

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[dungeon-interaction] ok: %s" % label)
	else:
		_fail += 1
		push_error("[dungeon-interaction] FAIL: %s" % label)
		print("[dungeon-interaction] FAIL: %s" % label)
