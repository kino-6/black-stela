extends SceneTree
## IMP-064: a deep Default floor may be ominous, but its ordinary first-person composition must still read.
## This gate exercises the real palette merge and renderer tree for B5/B10: it reserves enough local light,
## shallow enough fog, and distinct material tones for a player to separate wall, floor and depth.  The paired
## non-headless `capture_deep_floors.gd` PNG is the visual sign-off; this is the regression tripwire.

const DungeonRenderer := preload("res://scripts/dungeon/dungeon_renderer.gd")

const BUDGET := {
	"dungeon.b5f": {"ambient": 0.76, "fog": 0.045, "torch": 10.0, "emission": 0.16},
	"dungeon.b10f": {"ambient": 0.78, "fog": 0.040, "torch": 10.0, "emission": 0.16},
}

func _initialize() -> void:
	var doc := _read_json("res://data/worlds/default.json")
	var world: Dictionary = doc.get("world", {})
	var failures := 0
	if world.is_empty():
		push_error("[deep-visibility] default world is missing")
		quit(1)
		return
	for floor_id in BUDGET:
		var budget: Dictionary = BUDGET[floor_id]
		var state := {"phase": "dungeon", "map": {"floorId": floor_id}, "position": {"facing": "north"}}
		var palette := DungeonRenderer._floor_palette(world, state)
		failures += _check_palette(floor_id, palette, budget)
		failures += _check_runtime(floor_id, world, state, palette, budget)
	if failures == 0:
		print("[deep-visibility] PASS — B5/B10 retain readable local depth without a full-screen brighten")
		quit(0)
	else:
		print("[deep-visibility] FAIL — %d visibility budget violation(s)" % failures)
		quit(1)

func _check_palette(floor_id: String, palette: Dictionary, budget: Dictionary) -> int:
	var failures := 0
	if float(palette.get("ambientEnergy", 0.0)) < float(budget["ambient"]):
		return _fail("%s ambientEnergy is below the local readability budget" % floor_id)
	if float(palette.get("fogDensity", 1.0)) > float(budget["fog"]):
		return _fail("%s fogDensity hides the next depth cue" % floor_id)
	if float(palette.get("torchRange", 0.0)) < float(budget["torch"]):
		return _fail("%s torchRange does not cover the near route" % floor_id)
	if float(palette.get("materialEmission", 0.0)) < float(budget["emission"]):
		return _fail("%s lacks the low material emission that keeps local stone readable" % floor_id)
	for tone in ["wall", "floor", "ceiling"]:
		if not palette.has(tone) or Color(String(palette[tone])).get_luminance() < 0.075:
			failures += _fail("%s has no readable %s material tone" % [floor_id, tone])
	var wall_luma := Color(String(palette.get("wall", "000000"))).get_luminance()
	var floor_luma := Color(String(palette.get("floor", "000000"))).get_luminance()
	if absf(wall_luma - floor_luma) < 0.025:
		failures += _fail("%s wall and floor tones collapse into one plane" % floor_id)
	return failures

func _check_runtime(floor_id: String, world: Dictionary, state: Dictionary, palette: Dictionary, budget: Dictionary) -> int:
	var built: Dictionary = DungeonRenderer.build(world, state, null, Vector2(1280, 720))
	var container: Node = built.get("container", null)
	if container == null:
		return _fail("%s renderer produced no viewport" % floor_id)
	var env_node := _find_environment(container)
	var torch := _find_torch(container)
	var failures := 0
	if env_node == null or env_node.environment == null:
		failures += _fail("%s has no WorldEnvironment" % floor_id)
	else:
		var environment := env_node.environment
		if environment.ambient_light_energy < float(budget["ambient"]) or environment.fog_density > float(budget["fog"]):
			failures += _fail("%s palette budget was not bound into the live renderer" % floor_id)
	if torch == null or torch.omni_range < float(budget["torch"]):
		failures += _fail("%s local torch budget was not bound into the live renderer" % floor_id)
	container.queue_free()
	return failures

func _find_environment(node: Node) -> WorldEnvironment:
	if node is WorldEnvironment:
		return node as WorldEnvironment
	for child in node.get_children():
		var found := _find_environment(child)
		if found != null:
			return found
	return null

func _find_torch(node: Node) -> OmniLight3D:
	if node is OmniLight3D and String(node.name) == "Torch":
		return node as OmniLight3D
	for child in node.get_children():
		var found := _find_torch(child)
		if found != null:
			return found
	return null

func _fail(message: String) -> int:
	push_error("[deep-visibility] %s" % message)
	return 1

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}
