extends SceneTree
## One-off VISUAL check for the stair-down orientation fix: place the party one cell NORTH of a descent and
## aim the camera straight at it, so the rendered pit is dead ahead. Run WITHOUT --headless (needs a render
## viewport):  godot --path godot/ --script res://tests/capture_stairs.gd
##
## Writes tests/_ux_stairs-down.png. A correct descent lies FLAT on the floor like a hole; the bug it guards
## is the top-down pit art standing up as a billboard (playtest 2026-07-30: 階段浮いている).

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")
const CELL := 3.0
const EYE := 1.6

func _initialize() -> void:
	var world := {
		"id": "world.verdant",
		"palette": {"ambient": "3a4a30", "ambientEnergy": 0.7, "torch": "cfe0a0", "ceiling": "2a3a24"},
		"dungeons": [{
			"id": "g1f",
			"rooms": [{"id": "ra"}, {"id": "rb"}],
			"grid": {"cells": [
				{"id": "a", "x": 5, "y": 5, "roomId": "ra", "edges": {
					"north": {"kind": "wall"}, "south": {"kind": "open"},
					"east": {"kind": "wall"}, "west": {"kind": "wall"}}},
				{"id": "b", "x": 5, "y": 6, "roomId": "rb", "edges": {
					"north": {"kind": "open"}, "south": {"kind": "stairs", "targetFloorId": "g2f"},
					"east": {"kind": "wall"}, "west": {"kind": "wall"}}},
			]},
		}],
	}
	var state := {
		"phase": "dungeon",
		"map": {"floorId": "g1f", "visitedCells": ["a", "b"]},
		"position": {"cellId": "a", "facing": "south"},
	}

	get_root().size = Vector2i(1280, 720)
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(1280, 720))
	var container: Control = built["container"]
	get_root().add_child(container)
	for i in 3:
		await process_frame

	# Same camera math the dungeon scene runs each step (_update_view): eye height, look one cell ahead.
	# Camera must be in the tree before look_at, so this runs after the frames above.
	var cam: Camera3D = built["camera"]
	var base := Vector3(5 * CELL, EYE, 5 * CELL)
	cam.position = base
	cam.look_at(base + Vector3(0, 0, 1), Vector3.UP)   # facing south = +Z
	var torch: OmniLight3D = built["torch"]
	torch.position = base + Vector3(0, 0, 0.4)

	for i in 12:
		await process_frame

	var img := get_root().get_texture().get_image()
	if img == null:
		push_error("[stairs] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	img.save_png("res://tests/_ux_stairs-down.png")
	print("[stairs] wrote tests/_ux_stairs-down.png (%dx%d)" % [img.get_width(), img.get_height()])
	quit(0)
