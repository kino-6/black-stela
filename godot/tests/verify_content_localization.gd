extends SceneTree
## DETECTION (2026-08-14, user「遊べば分かる不具合、本当に検出できないの？」): a room/gate that carries a
## user-facing English string (event / description / name / clue) but whose `locales.ja` lacks that key
## renders the RAW ENGLISH in play — the recurring「英文が残っている」leak (playtest #42, 回収ロッカーの event).
## The played build never saw a gate for it because the old gates checked structure, not the shipped text.
## This scans every world's rooms and gates and fails on any Japanese-locale gap.
## Usage: godot --headless --path godot/ --script res://tests/verify_content_localization.gd

var _problems: Array[String] = []

func _initialize() -> void:
	# The Japanese-authored, player-shipped worlds. `default` is the English-authored parity/dev reference
	# (its lore is written in English on purpose), so it is not a localization target.
	for world_id in ["verdant", "terminal-line"]:
		var world: Dictionary = _world(world_id)
		if world.is_empty():
			continue
		for dungeon in world.get("dungeons", []):
			for room in (dungeon as Dictionary).get("rooms", []):
				_check_room(world_id, room)
	if _problems.is_empty():
		print("[content-i18n] PASS — every authored room/gate string has a Japanese locale (no English leak)")
		quit(0)
	else:
		for p in _problems:
			push_error("[content-i18n] %s" % p)
		print("[content-i18n] FAIL — %d untranslated string(s) would render raw English in play" % _problems.size())
		quit(1)

func _check_room(world_id: String, room: Variant) -> void:
	if typeof(room) != TYPE_DICTIONARY:
		return
	var rid := String((room as Dictionary).get("id", ""))
	var ja: Dictionary = ((room.get("locales", {}) as Dictionary).get("ja", {}) as Dictionary) if typeof(room.get("locales", {})) == TYPE_DICTIONARY else {}
	# A room that authors ANY ja locale must translate every player-facing field it carries — otherwise that
	# one field silently falls through to English (the exact 回収ロッカー bug: ja has name+description, not event).
	for field in ["name", "description", "event"]:
		var en := String(room.get(field, ""))
		if en.strip_edges() == "":
			continue
		if not ja.has(field) or String(ja.get(field, "")).strip_edges() == "":
			_problems.append("%s room '%s': field '%s' has English but no ja ('%s')" % [world_id, rid, field, en.substr(0, 48)])
	# Gate clues ride the same locale shape — but a `shortcut` gate opens from the far side and never
	# surfaces its clue in play (_faced_gate_clue / _stair_gate_clue both skip shortcuts), so an untranslated
	# shortcut clue can't leak. Only lock/stair gate clues actually render.
	for gate in (room as Dictionary).get("gates", []):
		if typeof(gate) != TYPE_DICTIONARY or String(gate.get("kind", "")) == "shortcut":
			continue
		var clue_en := String(gate.get("clue", ""))
		if clue_en.strip_edges() == "":
			continue
		var gja: Dictionary = ((gate.get("locales", {}) as Dictionary).get("ja", {}) as Dictionary) if typeof(gate.get("locales", {})) == TYPE_DICTIONARY else {}
		if not gja.has("clue") or String(gja.get("clue", "")).strip_edges() == "":
			_problems.append("%s gate '%s' in room '%s': clue has English but no ja ('%s')" % [world_id, String(gate.get("id", "")), rid, clue_en.substr(0, 48)])

func _world(id: String) -> Dictionary:
	var path := "res://data/worlds/%s.json" % id
	if not FileAccess.file_exists(path):
		return {}
	var doc: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return (doc as Dictionary).get("world", {}) if typeof(doc) == TYPE_DICTIONARY else {}
