extends SceneTree
## Regression lock for IMP-060 (playtest 2026-07-31): the opened-chest reward panel leaked an item's BASE
## (English) name — "Sap Draught" — because _loot_name rendered gained.itemName directly instead of
## localizing by id like the dungeon log. This builds the opened-result panel with a loot event that carries
## an English itemName plus a real itemId, and asserts the shown reward is the JA catalog name.
## Usage: godot --headless --path godot/ --script res://tests/verify_chest_loot_label.gd

const ChestPanel := preload("res://scripts/dungeon/chest_panel.gd")

var _fail := 0

func _initialize() -> void:
	var world: Dictionary = (JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/default.json")) as Dictionary).get("world", {})
	# A loot event exactly as chests.gd emits it: itemId (localizable) + itemName (English base).
	var events := [{"type": "inventory_item_gained", "itemId": "item.healing-draught", "itemName": "Healing Draught", "quantity": 1}]
	var built: Dictionary = ChestPanel.build_opened_result({}, events, func(): pass, null, world)
	var control: Control = built["control"]

	var loot_line := _loot_line_text(control)
	_check(loot_line != "", "the opened-chest panel renders a reward line")
	_check(loot_line.find("治癒の水薬") != -1, "the reward shows the JA catalog name (治癒の水薬)")
	_check(loot_line.find("Healing") == -1 and not _has_ascii_word(loot_line), "no English base name leaks into the chest reward (IMP-060)")

	if control:
		control.free()

	# IMP-061: a sprung trap must NAME the kind and STATE the damage — not a bare "罠が作動した".
	var trap_events := [{"type": "chest_trap_sprung", "trapKind": "needle", "damage": 4}, {"type": "inventory_item_gained", "itemId": "item.healing-draught", "itemName": "Healing Draught", "quantity": 1}]
	var trapped: Dictionary = ChestPanel.build_opened_result({}, trap_events, func(): pass, null, world)
	var note := _note_text(trapped["control"])
	_check(note.find("毒針") != -1, "the sprung-trap note names the trap kind (毒針)")
	_check(note.find("4") != -1, "the sprung-trap note states the damage (4)")
	(trapped["control"] as Control).free()

	print("[chest-loot-label] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

# The opened-chest NOTE: the first non-heading, non-loot label (the trap/opened sentence).
func _note_text(node: Node) -> String:
	if node is Label:
		var t := String((node as Label).text)
		if t.find("作動") != -1:
			return t
	for c in node.get_children():
		var found := _note_text(c)
		if found != "":
			return found
	return ""

# The reward line is the "・<item> ×N" label under the loot heading.
func _loot_line_text(node: Node) -> String:
	if node is Label:
		var t := String((node as Label).text)
		if t.begins_with("・"):
			return t
	for c in node.get_children():
		var found := _loot_line_text(c)
		if found != "":
			return found
	return ""

# A run of 3+ ASCII letters is an untranslated base/id leak on a JA screen.
func _has_ascii_word(text: String) -> bool:
	var run := 0
	for i in text.length():
		var ch := text[i]
		if (ch >= "A" and ch <= "Z") or (ch >= "a" and ch <= "z"):
			run += 1
			if run >= 3:
				return true
		else:
			run = 0
	return false

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[chest-loot-label] ok: %s" % label)
	else:
		push_error("[chest-loot-label] FAIL: %s" % label)
		_fail += 1
