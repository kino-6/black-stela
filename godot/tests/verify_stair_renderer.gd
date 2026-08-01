extends SceneTree
## Geometry regression for stair placement. It preserves the player-facing invariant that a stair's visible
## landmark belongs to its traversable edge, not the centre under the party camera. Run headless:
## godot --headless --path godot/ --script res://tests/verify_stair_renderer.gd

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")
const CELL := 3.0
const WALL_H := 3.2

var _fail := 0

func _initialize() -> void:
	var world := {
		"id": "world.default",
		"dungeons": [{
			"id": "dungeon.b1f",
			"rooms": [{"id": "down"}, {"id": "up"}],
			"grid": {"cells": [
				{"id": "down", "x": 4, "y": 5, "roomId": "down", "edges": {
					"north": {"kind": "wall"}, "south": {"kind": "stairs", "targetFloorId": "dungeon.b2f"},
					"east": {"kind": "wall"}, "west": {"kind": "wall"}}},
				{"id": "up", "x": 8, "y": 5, "roomId": "up", "edges": {
					"north": {"kind": "wall"}, "south": {"kind": "wall"},
					"east": {"kind": "stairs", "targetFloorId": "town"}, "west": {"kind": "wall"}}},
			]},
		}],
	}
	var state := {"phase": "dungeon", "map": {"floorId": "dungeon.b1f"}}
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(320, 180))
	var root: Node = (built["container"] as SubViewportContainer).get_child(0)
	var down := _stair(root, "down", "south")
	var up := _stair(root, "up", "east")
	_check(down != null, "descent mesh is built")
	_check(up != null, "ascent mesh is built")
	if down:
		_check(down.mesh is QuadMesh, "descent uses a wall-backed stairwell opening")
		_check(down.position.z > 5.0 * CELL + 1.2, "descent is placed at its south stair threshold")
		_check(down.position.y > 0.5 and is_zero_approx(down.rotation.x), "descent is fixed to the stair wall, never billboarded")
	if up:
		_check(up.mesh is QuadMesh, "ascent uses the upright ladder art")
		_check(up.position.x > 8.0 * CELL + 1.0, "ascent is placed at its east stairs edge")
		var ladder: QuadMesh = up.mesh
		_check(ladder.size.y >= WALL_H * 0.90 and ladder.size.x <= CELL * 0.52, "ascent nearly reaches the ceiling while preserving the stair-side walls")
		_check(is_zero_approx(up.position.y - ladder.size.y / 2.0), "ascent's feet remain grounded at the stair threshold")
		var mat: StandardMaterial3D = up.material_override
		_check(mat != null and mat.billboard_mode == BaseMaterial3D.BILLBOARD_DISABLED, "ascent is fixed to its stair edge, never billboarded")
	# This builder test owns the detached viewport tree. Free it explicitly so Godot's headless renderer exits
	# cleanly instead of reporting test-created RID leaks.
	(built["container"] as SubViewportContainer).free()
	quit(1 if _fail > 0 else 0)

func _stair(root: Node, kind: String, direction: String) -> MeshInstance3D:
	var wanted := "Stair_%s_%s" % [kind, direction]
	var found := root.find_child(wanted, true, false)
	return found as MeshInstance3D if found is MeshInstance3D else null

func _check(condition: bool, label: String) -> void:
	if condition:
		print("[stair renderer] PASS %s" % label)
	else:
		_fail += 1
		push_error("[stair renderer] FAIL %s" % label)
