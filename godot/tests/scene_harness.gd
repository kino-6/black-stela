extends RefCounted
## IMP-054 — one test-only harness for named runtime states and their observation. A fixture seeds a
## deterministic state (via debug_fixtures, the SAME states the `-- --fixture` boot flag uses), then any
## follow-up travels through NORMAL scene code: the harness either drives an existing UI-state seam
## (set_ui_state) or calls an existing scene method — it never adds scene logic, so a capture and its
## paired assertion consume the identical named fixture + UI state. Never mounted in normal play.
##
## `observe()` returns the same short descriptor a debug session shows (scene · phase · state hash ·
## focus), so a gate can assert exactly which screen it exercised, and IMP-046's action trace can be
## replayed against it.

const Fixtures := preload("res://scripts/debug_fixtures.gd")
const StateHash := preload("res://scripts/rules/state_hash.gd")

# name -> { fixture: debug-fixture id, ui: {} set_ui_state seam, call: an existing scene method to invoke }
const FIXTURES := {
	"open_corridor": {"fixture": "open_corridor"},
	"map_modal": {"fixture": "open_corridor", "call": "_toggle_full_map"},
	"combat_victory": {"fixture": "combat_victory"},
	"return_ready": {"fixture": "return_ready"},
	"loot_delta": {"fixture": "loot_delta"},
	"shop_description": {"fixture": "shop_description", "ui": {"service": "shop"}},
}

static func names() -> Array:
	return FIXTURES.keys()

## Mount `name`: seed its fixture into Run, stand its scene up, then apply its declared UI state / action
## through normal scene code. Returns { scene, run, scene_path }. Caller awaits; this coroutine awaits the
## frames the scene needs to build.
static func mount(tree: SceneTree, name: String) -> Dictionary:
	var spec: Dictionary = FIXTURES.get(name, {})
	if spec.is_empty():
		return {}
	var run := tree.get_root().get_node_or_null("Run")
	if run == null:
		return {}
	run.ensure_loaded()
	var scene_path := String(Fixtures.load_into(run, String(spec["fixture"])))
	if scene_path == "":
		return {}
	var scene: Node = (load(scene_path) as PackedScene).instantiate()
	tree.get_root().add_child(scene)
	for i in 8:
		await tree.process_frame
	# Follow-up state travels through the scene's OWN seams/methods, never new logic.
	if spec.has("ui") and scene.has_method("set_ui_state"):
		scene.call("set_ui_state", spec["ui"])
	if spec.has("call") and scene.has_method(String(spec["call"])):
		scene.call(String(spec["call"]))
	for i in 4:
		await tree.process_frame
	return {"scene": scene, "run": run, "scene_path": scene_path}

## The observable descriptor of a mounted scene — scene file, phase, state hash, focused control name.
static func observe(tree: SceneTree, mounted: Dictionary) -> Dictionary:
	var scene: Node = mounted.get("scene", null)
	var run: Node = mounted.get("run", null)
	var state: Dictionary = run.get("state") if run != null and typeof(run.get("state")) == TYPE_DICTIONARY else {}
	var focus := tree.get_root().gui_get_focus_owner()
	return {
		"scene": String(mounted.get("scene_path", "")).get_file(),
		"phase": String(state.get("phase", "")),
		"hash": StateHash.hash_state(state),
		"focus": (focus.name if focus != null else ""),
		"has_control": _has_control(scene),
	}

## IMP-046 action-trace replay: dispatch a recorded sequence of commands through the SAME Run.dispatch the
## scenes use, and return the resulting state hash. Same fixture + same trace ⇒ same hash, so a recorded
## trace reproduces the exact state — diagnostic evidence, not a substitute for the normal route.
static func replay(run: Node, commands: Array) -> String:
	for command in commands:
		run.call("dispatch", command)
	return StateHash.hash_state(run.get("state"))

static func _has_control(node: Node) -> bool:
	if node == null:
		return false
	for c in node.get_children():
		if c is Control or _has_control(c):
			return true
	return false

## Collect every Label/Button text in a scene — for asserting a fixture reached its intended surface.
static func text_of(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	for c in node.get_children():
		out += text_of(c)
	return out
