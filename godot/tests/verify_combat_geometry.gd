extends SceneTree
## gate:combat-geometry (IMP-024) — with MULTIPLE enemy groups on the stage, no enemy body may hide behind
## a HUD rectangle. Stage-share / silhouette-size gates never caught this because a single centred enemy
## missed the right-hand command panel by luck; a pack spread full-width put its rightmost creature under
## the panel. This mounts a 3-group fight and asserts every enemy mark's screen rect clears both the command
## panel and the acting-member panel.
## Run: godot --headless --path godot/ --script res://tests/verify_combat_geometry.gd

const StateHash := preload("res://scripts/rules/state_hash.gd")

var _fail := 0

func _initialize() -> void:
	await _run()
	print("[combat-geometry] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _run() -> void:
	for i in 4:
		await process_frame
	var run := get_root().get_node_or_null("Run")
	_check(run != null, "the Run autoload is available")
	if run == null:
		return
	run.ensure_loaded()

	# A three-group fight — the case the single-enemy fixture never exercised.
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/traces/b1f-combat-victory.json"))
	var state: Dictionary = ((doc as Dictionary).get("initialState", {}) as Dictionary).duplicate(true)
	var groups: Array = ((state.get("combat", {}) as Dictionary).get("enemyGroups", []) as Array)
	if groups.is_empty():
		_check(false, "fixture has an enemy group to clone")
		return
	var trio := []
	for k in 3:
		var g: Dictionary = (groups[0] as Dictionary).duplicate(true)
		g["id"] = "group.test.%d" % k
		trio.append(g)
	state["combat"]["enemyGroups"] = trio
	state["phase"] = "combat"
	run.state = state

	var combat: Node = (load("res://scenes/combat.tscn") as PackedScene).instantiate()
	get_root().add_child(combat)
	for i in 10:
		await process_frame

	var marks := _tagged(combat, "enemy_mark")
	_check(marks.size() >= 2, "the stage renders every enemy group as its own creature (%d marks)" % marks.size())

	# The command panel and, when shown, the acting-member panel — the rects an enemy must not sit under.
	var hud: Array = []
	var cmd: Variant = combat.get("_cmd_panel")
	if is_instance_valid(cmd):
		hud.append({"name": "command panel", "rect": (cmd as Control).get_global_rect()})
	for actor_panel in _tagged(combat, "actor_panel"):
		hud.append({"name": "acting-member panel", "rect": actor_panel.get_global_rect()})
	_check(hud.size() >= 1, "the command panel rect is measurable")

	for mark in marks:
		var mr: Rect2 = (mark as Control).get_global_rect()
		for h in hud:
			var hr: Rect2 = h["rect"]
			_check(not mr.intersects(hr), "enemy mark %s clears the %s" % [str(mr), h["name"]])

	combat.queue_free()

func _tagged(node: Node, meta: String) -> Array:
	var out := []
	if node.has_meta(meta):
		out.append(node)
	for c in node.get_children():
		out.append_array(_tagged(c, meta))
	return out

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[combat-geometry] ok: %s" % label)
	else:
		push_error("[combat-geometry] FAIL: %s" % label)
		print("[combat-geometry] FAIL: %s" % label)
		_fail += 1
