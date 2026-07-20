extends SceneTree
## Asset-resolution gate. The UX-parity gate derives its contract from the React panels' t() keys, so
## anything rendered WITHOUT an i18n key is invisible to it — which is exactly how the dungeon shipped
## untextured, the enemy stage showed an empty frame, and the build stamp went missing for the whole
## migration. Text parity cannot catch a missing PICTURE.
##
## This asserts that every art path the running code will actually request resolves to a real file.
## Usage: godot --headless --path godot/ --script res://tests/verify_assets.gd

var _failures := 0

func _initialize() -> void:
	var worlds: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/index.json"))
	var ids: Array = (worlds as Dictionary).get("worlds", []) if typeof(worlds) == TYPE_DICTIONARY else []
	var engine: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/engine-data.json"))
	var classes: Array = (engine as Dictionary).get("classes", []) if typeof(engine) == TYPE_DICTIONARY else []

	# The build stamp both runtimes show.
	_require("res://data/build-stamp.json", "build stamp (npm run export:build)")

	# P20: every selectable class owns a Default-pack base/action master. Dungeon and combat use the
	# current class id directly and fall back to this pack only when a scenario does not override it.
	for class_def in classes:
		var class_id := String((class_def as Dictionary).get("id", ""))
		if class_id.is_empty():
			_fail("engine class catalog has an empty id")
			continue
		for pose in ["base", "attack"]:
			_require("res://assets/worlds/default/characters/adventurer-%s-%s.png" % [class_id, pose], "P20 %s %s master" % [class_id, pose])

	for entry in ids:
		var world_id := String(entry)
		var pack: Variant = JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/%s.json" % world_id))
		var world: Dictionary = (pack as Dictionary).get("world", {}) if typeof(pack) == TYPE_DICTIONARY else {}

		# Town / title backdrops the scenes load by name.
		for sub in ["ui/town-hub.jpg"]:
			_require("res://assets/worlds/%s/%s" % [world_id, sub], "%s backdrop" % world_id)

		# Dungeon block textures, per depth band (dungeon.gd picks by floor number).
		for suffix in ["-block1", "-block2", "-block3"]:
			for kind in ["stone-wall", "stone-floor"]:
				_require("res://assets/worlds/%s/dungeon/%s%s.jpg" % [world_id, kind, suffix], "%s maze texture" % world_id)

		# EVERY authored enemy must have art the combat stage can find, by the same lookup combat.gd uses.
		for enemy in world.get("enemies", []):
			var full := String(enemy.get("id", ""))
			var parts := full.split(".")
			var short := parts[parts.size() - 1]
			var found := false
			for sub in ["dungeon/%s.png" % short, "enemies/%s.png" % short, "dungeon/%s.png" % full.replace(".", "-")]:
				if FileAccess.file_exists("res://assets/worlds/%s/%s" % [world_id, sub]):
					found = true
					break
			if not found:
				_fail("%s: no art for enemy %s — the stage would show an empty frame" % [world_id, full])

	print("")
	if _failures == 0:
		print("[assets] PASS — every texture and creature the code asks for resolves")
		quit(0)
	else:
		print("[assets] FAIL — %d missing asset(s). Run `npm run stage:assets`." % _failures)
		quit(1)

func _require(path: String, what: String) -> void:
	if not FileAccess.file_exists(path):
		_fail("%s: missing %s" % [what, path])

func _fail(message: String) -> void:
	_failures += 1
	print("[assets] %s" % message)
