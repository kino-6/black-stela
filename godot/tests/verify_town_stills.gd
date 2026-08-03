extends SceneTree
## Still-coverage gate. Every town backdrop slot — the per-LOCATION stills and the per-SERVICE stills the
## town can request (town.gd `_location_still` / `_service_still`) — should ship a picture, so a screen never
## silently borrows another's backdrop forever. For each registered world this WARNS for any still that is
## absent from BOTH the world and the default fallback (an art gap to fill), and FAILS only if a REQUIRED
## still (the hub, the ultimate fallback) is missing — that would leave a screen with no backdrop at all.
##   godot --headless --path godot/ --script res://tests/verify_town_stills.gd
##
## New still slots: add the file here when town.gd learns to request one, so the gap is tracked from day one.

const STILLS := [
	{"file": "town-hub.jpg", "role": "town square / ultimate fallback", "required": true},
	{"file": "guild-hall.jpg", "role": "hall location"},
	{"file": "market-workshop.png", "role": "market location"},
	{"file": "archive-lodge.png", "role": "archive location"},
	{"file": "infirmary.png", "role": "recovery (infirmary) service"},
	{"file": "blacksmith.png", "role": "blacksmith (forge) service"},
]

func _initialize() -> void:
	var worlds := _worlds()
	var warnings := 0
	var failures := 0
	for world in worlds:
		for spec in STILLS:
			var file := String(spec["file"])
			var role := String(spec["role"])
			var own := "res://assets/worlds/%s/ui/%s" % [world, file]
			var fallback := "res://assets/worlds/default/ui/%s" % file
			if FileAccess.file_exists(own):
				continue  # the world ships its own still
			if FileAccess.file_exists(fallback):
				# Covered by the default still. A world with its own flavour would ideally author its own, but
				# the fallback keeps the screen intact — a soft note, not a warning.
				print("[town-stills] NOTE: %s reuses the default '%s' (%s) — no own still" % [world, file, role])
				continue
			if bool(spec.get("required", false)):
				push_error("[town-stills] FAIL: required still '%s' (%s) is missing for %s AND default — the screen would be blank" % [file, role, world])
				failures += 1
			else:
				print("[town-stills] WARNING: no '%s' still (%s) for %s — the screen falls back to another backdrop (art gap)" % [file, role, world])
				warnings += 1
	print("[town-stills] %d warning(s), %d failure(s) across %d world(s)" % [warnings, failures, worlds.size()])
	if failures > 0:
		print("[town-stills] FAIL (%d)" % failures)
		quit(1)
	else:
		print("[town-stills] PASS (%d still art-gap warning(s) — see WARNING lines)" % warnings)
		quit(0)

func _worlds() -> Array:
	var out := []
	var dir := DirAccess.open("res://assets/worlds")
	if dir != null:
		for d in dir.get_directories():
			out.append(d)
	if out.is_empty():
		out = ["default", "verdant"]
	out.sort()
	return out
