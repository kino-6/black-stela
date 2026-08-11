extends SceneTree
## gate:combat-geometry (IMP-024) — with MULTIPLE enemy groups on the stage, no enemy body may hide behind
## a HUD rectangle. Stage-share / silhouette-size gates never caught this because a single centred enemy
## missed the right-hand command panel by luck; a pack spread full-width put its rightmost creature under
## the panel. This mounts a 3-group fight and asserts every enemy mark's screen rect clears both the command
## panel and the acting-member panel.
## Run: godot --headless --path godot/ --script res://tests/verify_combat_geometry.gd

const StateHash := preload("res://scripts/rules/state_hash.gd")
const CombatStage := preload("res://scripts/combat/combat_stage.gd")

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

	# The same five-unit group after three kills must lose the rear bodies, not re-run its pack layout with
	# `count=2`.  Recalculated shrink/spacing made the two survivors grow and jump, which looks like enemy
	# resizing rather than attrition.  `initialCount` is encounter truth and is intentionally stable here.
	var layout_host := Control.new()
	var full_mark := CombatStage.enemy_mark(layout_host, {"count": 5, "initialCount": 5, "hpEach": 10, "maxHpEach": 10}, 450.0, 600.0, Rect2(0, 0, 900, 540), false, null, "固定隊形", 50, 50)
	var depleted_mark := CombatStage.enemy_mark(layout_host, {"count": 2, "initialCount": 5, "hpEach": 10, "maxHpEach": 10}, 450.0, 600.0, Rect2(0, 0, 900, 540), false, null, "固定隊形", 20, 50)
	var full_front := _body(full_mark, 0)
	var full_second := _body(full_mark, 1)
	var depleted_front := _body(depleted_mark, 0)
	var depleted_second := _body(depleted_mark, 1)
	_check(full_front != null and depleted_front != null and full_front.size.is_equal_approx(depleted_front.size) and is_equal_approx(full_front.position.y, depleted_front.position.y), "the front survivor keeps its initial size and floor height after a pack member falls")
	_check(full_second != null and depleted_second != null and full_second.size.is_equal_approx(depleted_second.size) and is_equal_approx(full_second.position.y, depleted_second.position.y), "the second survivor keeps its initial size and floor height after a pack member falls")
	_check(_body(depleted_mark, 2) == null and _body(depleted_mark, 3) == null and _body(depleted_mark, 4) == null, "only the three rear bodies disappear from the five-unit layout")
	full_mark.free()
	depleted_mark.free()
	layout_host.free()

	# A selected target used to spawn a `set_loops()` tween. Build that exact pure stage fragment rather than
	# relying on the fixture's current combat phase to happen to select an enemy.
	var tween_baseline := get_processed_tweens().size()
	var reticle_host := Control.new()
	get_root().add_child(reticle_host)
	reticle_host.add_child(CombatStage.enemy_mark(reticle_host, {"count": 1}, 300.0, 240.0, Rect2(0, 0, 900, 540), true, null, "検証標的", 10, 10))
	# The old loop is 1.2 seconds (fade out + fade in). Past one whole cycle it remains alive, while a
	# static reticle leaves the tree with no presentation tween to leak or trigger Godot's warning.
	await create_timer(1.3).timeout
	# Godot 4.7 warns about that unbounded tween during normal play, so the target marker must be
	# self-contained and leave no infinite tween behind.
	var stage_tweens := get_processed_tweens().size()
	_check(stage_tweens == tween_baseline, "the combat stage leaves no persistent tweens (%d, baseline %d)" % [stage_tweens, tween_baseline])
	reticle_host.queue_free()

	combat.queue_free()

func _tagged(node: Node, meta: String) -> Array:
	var out := []
	if node.has_meta(meta):
		out.append(node)
	for c in node.get_children():
		out.append_array(_tagged(c, meta))
	return out

func _body(mark: Control, index: int) -> TextureRect:
	for child in mark.get_children():
		if child is TextureRect and child.has_meta("enemy_body_index") and int(child.get_meta("enemy_body_index")) == index:
			return child as TextureRect
	return null

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[combat-geometry] ok: %s" % label)
	else:
		push_error("[combat-geometry] FAIL: %s" % label)
		print("[combat-geometry] FAIL: %s" % label)
		_fail += 1
