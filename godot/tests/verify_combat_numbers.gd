extends SceneTree
## T15 + T19 gate: a combat damage number is a JUICY, POSITIONED floating label — not a spreadsheet cell.
## Locks that CombatPlayback.damage_number: (a) renders the amount as a Label added to the given layer;
## (b) positions it horizontally by x_frac (so multi-target rounds land each number on its own creature);
## (c) gives a CRIT a bigger, "!"-suffixed, hotter label; (d) draws an outline for punch. Proven to fail on
## the old fixed-centre, outline-less single number.
## Run: godot --headless --path godot/ --script res://tests/verify_combat_numbers.gd

const CombatPlayback := preload("res://scripts/combat/combat_playback.gd")

var _failures := 0

func _initialize() -> void:
	var layer := Control.new()
	get_root().add_child(layer)
	for i in 3:
		await process_frame

	var rect := Rect2(Vector2(100, 50), Vector2(1000, 400))

	# A normal hit on the LEFT target and a CRIT on the RIGHT target.
	CombatPlayback.damage_number(layer, rect, 12, 0.2, false)
	CombatPlayback.damage_number(layer, rect, 30, 0.85, true)
	# A zero-or-negative amount must render nothing (a miss shows no number).
	CombatPlayback.damage_number(layer, rect, 0, 0.5, false)
	for i in 2:
		await process_frame

	var labels: Array = []
	for child in layer.get_children():
		if child is Label:
			labels.append(child)

	_check(labels.size() == 2, "two numbers rendered (the 0-damage call drew nothing), got %d" % labels.size())

	var normal: Label = null
	var crit: Label = null
	for l in labels:
		if (l as Label).text == "12":
			normal = l
		elif (l as Label).text == "30!":
			crit = l

	# #26: a number is the RESULT of a hit — the bare amount, no app-style minus. Crit keeps the ! emphasis.
	_check(normal != null, "the normal hit renders its amount '12' (no minus — #26)")
	_check(crit != null, "the crit renders '30!' (amount + emphasis)")

	if normal != null and crit != null:
		# Positioned by x_frac: the 0.2 hit sits LEFT of the 0.85 hit.
		_check(normal.position.x < crit.position.x, "numbers are positioned by target (x_frac): 12@left < 30@right")
		# Crit reads bigger.
		var n_size := normal.get_theme_font_size("font_size")
		var c_size := crit.get_theme_font_size("font_size")
		_check(c_size > n_size, "a crit is bigger than a normal hit (%d > %d)" % [c_size, n_size])
		# Outline for punch.
		_check(normal.get_theme_constant("outline_size") > 0, "the number has an outline (reads on any creature)")

	print("[combat-numbers] %s (%d failure(s))" % ["PASS" if _failures == 0 else "FAIL", _failures])
	quit(1 if _failures > 0 else 0)

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[combat-numbers] ok: %s" % label)
	else:
		_failures += 1
		push_error("[combat-numbers] FAIL: %s" % label)
