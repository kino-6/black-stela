extends SceneTree
## Geometry regression for stair placement. It preserves the player-facing invariant that a stair's visible
## landmark belongs to its traversable edge, not the centre under the party camera. Run headless:
## godot --headless --path godot/ --script res://tests/verify_stair_renderer.gd

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")
const CELL := 3.0

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
		_check(String(down.get_meta("stair_geometry", "")) == "descending_steps", "descent owns a real descending stairwell")
		_check(down.position.z > 5.0 * CELL + 1.2, "descent is placed at its south stair threshold")
		_check(_children_named(down, "StairStep_") == 5, "descent has five physical treads, not a wall decal")
		_check(_child_mesh(down, "StairArtwork_Downshaft") is PlaneMesh, "descent artwork is laid into the shaft floor")
		var down_art := down.get_node_or_null("StairArtwork_Downshaft") as MeshInstance3D
		_check(down_art != null and down_art.position.z <= -0.05 and down_art.position.z >= -CELL * 0.46,
			"descent artwork stays inside the shallow stairwell, never beyond its rear wall")
	if up:
		_check(String(up.get_meta("stair_geometry", "")) == "ladder_well", "ascent owns a recessed ladder well")
		_check(up.position.x > 8.0 * CELL + 1.0, "ascent is placed at its east stairs edge")
		_check(_child_mesh(up, "StairArtwork_Ladder") is QuadMesh, "ascent artwork sits at the far face of a shaft")
		_check(_children_named(up, "StairStep_") == 0, "ascent does not use the descending treads")
		_check(up.rotation.y < 0.0, "ascent shaft faces its east stair edge, never the camera")
	# This builder test owns the detached viewport tree. Free it explicitly so Godot's headless renderer exits
	# cleanly instead of reporting test-created RID leaks.
	(built["container"] as SubViewportContainer).free()
	quit(1 if _fail > 0 else 0)

func _stair(root: Node, kind: String, direction: String) -> Node3D:
	var wanted := "Stair_%s_%s" % [kind, direction]
	var found := root.find_child(wanted, true, false)
	return found as Node3D if found is Node3D else null

func _children_named(node: Node, prefix: String) -> int:
	var found := 0
	for child in node.get_children():
		if String(child.name).begins_with(prefix):
			found += 1
	return found

func _child_mesh(node: Node, child_name: String) -> Mesh:
	var child := node.get_node_or_null(NodePath(child_name)) as MeshInstance3D
	return child.mesh if child else null

func _check(condition: bool, label: String) -> void:
	if condition:
		print("[stair renderer] PASS %s" % label)
	else:
		_fail += 1
		push_error("[stair renderer] FAIL %s" % label)
