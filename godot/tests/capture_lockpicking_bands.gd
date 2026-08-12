extends SceneTree
## D6 visual proof. Captures Terminal Line F1's authored locked locker in its handler-selection state:
## the specialist handler is focused, while the player can compare ordinary hands and each carried tool.
## Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_lockpicking_bands.gd

func _initialize() -> void:
	get_root().size = Vector2i(1280, 720)
	var sfx := get_root().get_node_or_null("Sfx")
	if sfx != null and sfx.has_method("set_enabled"):
		sfx.call("set_enabled", false)
	var run := get_root().get_node_or_null("Run")
	if run == null:
		push_error("[capture-lockpicking-bands] Run autoload is unavailable")
		quit(1)
		return
	run.world_id = "terminal-line"
	run.reset()
	var cell := _cell_for_room(run.world, "room.tl1f.key-locker")
	if cell.is_empty():
		push_error("[capture-lockpicking-bands] F1 Operations Locker is missing")
		quit(1)
		return
	var dungeon := (load("res://scenes/dungeon.tscn") as PackedScene).instantiate()
	get_root().add_child(dungeon)
	for i in 10:
		await process_frame
	var state: Dictionary = run.state.duplicate(true)
	state["phase"] = "dungeon"
	state["combat"] = null
	state["position"] = {"cellId": String(cell.get("id", "")), "roomId": "room.tl1f.key-locker", "facing": "east"}
	state["map"] = {
		"floorId": "dungeon.tl1f", "currentCellId": String(cell.get("id", "")), "currentRoomId": "room.tl1f.key-locker", "currentFacing": "east",
		"visitedCells": [String(cell.get("id", ""))], "visitedRooms": ["room.tl1f.key-locker"], "knownExits": {}, "secretCandidates": {}, "blockedExits": {},
	}
	state["chests"] = [{
		"cellId": String(cell.get("id", "")), "roomId": "room.tl1f.key-locker", "treasureTable": "treasure.tl1f.station-office",
		"trap": null, "lock": {"difficulty": 8}, "phase": "closed", "investigated": false, "investigateResult": null,
		"disarmAttempted": false, "disarmed": false, "unlockAttempted": false, "unlocked": false, "sprung": false,
	}]
	# Deliberately ordinary matching recruits: the screen must recommend the specialist candidate even when
	# they appear after the untrained one in formation order.
	state["party"] = [
		{"id": "lock-band-untrained", "name": "ユノ", "classId": "warrior", "level": 1, "hp": 20, "maxHp": 20, "mp": 4, "maxMp": 4, "row": "front", "injury": null, "roleTags": [], "aptitude": {"agility": 5, "wit": 5, "luck": 5}},
		{"id": "lock-band-specialist", "name": "カイ", "classId": "thief", "level": 1, "hp": 18, "maxHp": 18, "mp": 6, "maxMp": 6, "row": "back", "injury": null, "roleTags": [], "aptitude": {"agility": 5, "wit": 5, "luck": 5}},
	]
	# Both aids make their distinct rates visible; the specialist handler must still receive default focus.
	state["inventory"] = [
		{"id": "item.tl-maintenance-multitool", "quantity": 1},
		{"id": "item.tl-breach-wedge", "quantity": 1},
	]
	dungeon.set("_state", state)
	dungeon.set("_rendered_floor", "")
	dungeon.set("_chest_pending_action", "unlock")
	dungeon.call("_update_view", false)
	dungeon.call("_rebuild_dock")
	for i in 10:
		await process_frame
	var focus := get_root().get_viewport().gui_get_focus_owner()
	if not (focus is Button) or not (focus as Button).text.contains("成功率 60%"):
		var focus_text := (focus as Button).text if focus is Button else "<none>"
		push_error("[capture-lockpicking-bands] specialist 60%% handler did not receive focus (got %s)" % focus_text)
		quit(1)
		return
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[capture-lockpicking-bands] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_lockpicking-bands-1280.png")
	print("[capture-lockpicking-bands] -> res://tests/_lockpicking-bands-1280.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)

func _cell_for_room(world: Dictionary, room_id: String) -> Dictionary:
	for dungeon in world.get("dungeons", []):
		for cell in ((dungeon as Dictionary).get("grid", {}) as Dictionary).get("cells", []):
			if String((cell as Dictionary).get("roomId", "")) == room_id:
				return cell
	return {}
