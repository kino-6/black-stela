extends SceneTree
## VISUAL check for the 玄室 read: a chamber must be told apart by its SEALED DOOR (and taller walls), not
## by a recoloured floor. Party stands one cell before a chamber door and looks at it. Run WITHOUT --headless:
##   godot --path godot/ --script res://tests/capture_chamber.gd
## Writes tests/_ux_chamber-sealed.png — expect a CLOSED door ahead, ordinary floor underfoot.

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
				{"id": "a", "x": 5, "y": 4, "roomId": "ra", "edges": {
					"north": {"kind": "wall"}, "south": {"kind": "open"},
					"east": {"kind": "wall"}, "west": {"kind": "wall"}}},
				{"id": "c", "x": 5, "y": 5, "roomId": "ra", "edges": {
					"north": {"kind": "open"}, "south": {"kind": "door"},
					"east": {"kind": "wall"}, "west": {"kind": "wall"}}},
				{"id": "b", "x": 5, "y": 6, "roomId": "rk", "edges": {
					"north": {"kind": "door"}, "south": {"kind": "wall"},
					"east": {"kind": "wall"}, "west": {"kind": "wall"}}},
			]},
		}],
	}
	var state := {
		"phase": "dungeon",
		"map": {"floorId": "g1f", "visitedCells": ["a", "b"]},
		"position": {"cellId": "a", "facing": "south"},
		"openedDoors": [], "floorClaimedTreasures": [], "chests": [],
	}

	get_root().size = Vector2i(1280, 720)
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(1280, 720))
	var container: Control = built["container"]
	get_root().add_child(container)
	for i in 3:
		await process_frame

	var cam: Camera3D = built["camera"]
	var base := Vector3(5 * CELL, EYE, 4 * CELL)   # standing cell "a" is at (5,4)
	cam.position = base
	cam.look_at(base + Vector3(0, 0, 1), Vector3.UP)   # facing south = +Z toward the chamber door
	var torch: OmniLight3D = built["torch"]
	torch.position = base + Vector3(0, 0, 0.4)

	for i in 12:
		await process_frame

	var img := get_root().get_texture().get_image()
	if img == null:
		push_error("[chamber] NULL image — re-run WITHOUT --headless")
		quit(1)
		return
	img.save_png("res://tests/_ux_chamber-sealed.png")
	print("[chamber] wrote tests/_ux_chamber-sealed.png (%dx%d)" % [img.get_width(), img.get_height()])
	quit(0)
