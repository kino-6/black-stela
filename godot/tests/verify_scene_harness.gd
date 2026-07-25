extends SceneTree
## gate:scene-harness (IMP-054) — the one fixture/observation harness must land every named fixture in the
## RIGHT scene through normal scene code, expose a coherent observation (scene · phase · state hash · a
## focusable control), and reject an unknown name. This also delivers IMP-046's remaining named starts —
## map_modal (the floor map open) and shop_description (the market showing what a piece does) — without any
## scene-logic change, by driving existing seams/methods.
## Run: godot --headless --path godot/ --script res://tests/verify_scene_harness.gd

const Harness := preload("res://tests/scene_harness.gd")

const EXPECT := {
	"open_corridor": "dungeon.tscn",
	"map_modal": "dungeon.tscn",
	"combat_victory": "combat.tscn",
	"return_ready": "dungeon.tscn",
	"loot_delta": "dungeon.tscn",
	"shop_description": "town.tscn",
}

var _fail := 0

func _initialize() -> void:
	await _run()
	print("[scene-harness] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _run() -> void:
	for i in 4:
		await process_frame

	# The harness rejects a name it does not know (a mismatched fixture must not silently pass).
	var bogus: Dictionary = await Harness.mount(self, "does_not_exist")
	_check(bogus.is_empty(), "an unknown fixture name is rejected")

	for name in Harness.names():
		var mounted: Dictionary = await Harness.mount(self, String(name))
		if not _check(not mounted.is_empty(), "%s mounts" % name):
			continue
		var obs: Dictionary = Harness.observe(self, mounted)
		_check(String(obs["scene"]) == String(EXPECT[name]), "%s lands in %s (got %s)" % [name, EXPECT[name], obs["scene"]])
		_check(bool(obs["has_control"]), "%s renders a Control" % name)
		_check(String(obs["hash"]) != "" and String(obs["phase"]) != "", "%s observation carries phase + state hash" % name)

		var scene: Node = mounted["scene"]
		match String(name):
			"map_modal":
				_check(is_instance_valid(scene.get("_full_map")), "map_modal opened the floor map through _toggle_full_map")
			"shop_description":
				_check(String(scene.get("_service")) == "shop", "shop_description opened the market via set_ui_state")
				_check(Harness.text_of(scene).contains("G"), "shop_description shows priced goods")

		scene.queue_free()
		for i in 3:
			await process_frame

	# IMP-046 action-trace replay: the same trace from the same fixture reproduces the same state hash.
	var trace := [{"type": "turn_left"}, {"type": "turn_right"}, {"type": "listen"}, {"type": "search"}]
	var first: Dictionary = await Harness.mount(self, "open_corridor")
	var hash_a := Harness.replay(first["run"], trace)
	first["scene"].queue_free()
	for i in 3:
		await process_frame
	var second: Dictionary = await Harness.mount(self, "open_corridor")
	var hash_b := Harness.replay(second["run"], trace)
	second["scene"].queue_free()
	_check(hash_a == hash_b and hash_a != "", "an action trace replays to the same state hash (reproducible)")

func _check(ok: bool, label: String) -> bool:
	if ok:
		print("[scene-harness] ok: %s" % label)
	else:
		push_error("[scene-harness] FAIL: %s" % label)
		print("[scene-harness] FAIL: %s" % label)
		_fail += 1
	return ok
