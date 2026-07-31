extends SceneTree
## Visual evidence for the guardian chamber floor. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_chamber_floor.gd
## The seal must read as a small, grounded stone construction detail — never a bright, floating magic ring.

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")
const CELL := 3.0
const EYE := 1.6

func _initialize() -> void:
	var world := {
		"id": "world.verdant",
		"palette": {
			"ambient": "3a4a30", "ambientEnergy": 0.7, "torch": "cfe0a0", "ceiling": "2a3a24",
			"floor": "5a5040", "wall": "6a6250",
			"chamberFloor": "7a8a50", "chamberWall": "8a7a40", "chamberAccent": "d0c060",
		},
		"dungeons": [{
			"id": "g1f",
			"rooms": [{"id": "ra"}, {"id": "rk", "chamberGuardian": true}],
			"grid": {"cells": [
				{"id": "a", "x": 5, "y": 4, "roomId": "ra", "edges": {"north": {"kind": "wall"}, "south": {"kind": "open"}, "east": {"kind": "wall"}, "west": {"kind": "wall"}}},
			{"id": "c", "x": 5, "y": 5, "roomId": "ra", "edges": {"north": {"kind": "open"}, "south": {"kind": "open"}, "east": {"kind": "wall"}, "west": {"kind": "wall"}}},
			{"id": "b", "x": 5, "y": 6, "roomId": "rk", "edges": {"north": {"kind": "open"}, "south": {"kind": "wall"}, "east": {"kind": "wall"}, "west": {"kind": "wall"}}},
			]},
		}],
	}
	var state := {
		"phase": "dungeon", "map": {"floorId": "g1f", "visitedCells": ["a", "c", "b"]},
		"position": {"cellId": "b", "facing": "south"},
		"openedDoors": [], "floorClaimedTreasures": [], "chests": [],
	}
	get_root().size = Vector2i(1280, 720)
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(1280, 720))
	get_root().add_child(built["container"])
	for i in 3:
		await process_frame
	# Look through the open threshold at the chamber floor. This isolates the landmark from door props
	# while keeping the in-game first-person renderer and lighting intact.
	var base := Vector3(5 * CELL, EYE, 5 * CELL)
	var camera: Camera3D = built["camera"]
	camera.position = base
	camera.look_at(Vector3(5 * CELL, 0.12, 6 * CELL), Vector3.UP)
	var torch: OmniLight3D = built["torch"]
	torch.position = base + Vector3(0, 0.2, 0.6)
	for i in 12:
		await process_frame
	var image := get_root().get_texture().get_image()
	if image == null:
		push_error("[chamber-floor] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	image.save_png("res://tests/_ux_chamber-floor-seal.png")
	print("[chamber-floor] wrote tests/_ux_chamber-floor-seal.png (%dx%d)" % [image.get_width(), image.get_height()])
	quit(0)
