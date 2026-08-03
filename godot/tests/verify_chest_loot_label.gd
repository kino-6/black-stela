extends SceneTree
## Regression lock for IMP-060 (playtest 2026-07-31): the opened-chest reward panel leaked an item's BASE
## (English) name — "Sap Draught" — because _loot_name rendered gained.itemName directly instead of
## localizing by id like the dungeon log. This builds the opened-result panel with a loot event that carries
## an English itemName plus a real itemId, and asserts the shown reward is the JA catalog name.
## Usage: godot --headless --path godot/ --script res://tests/verify_chest_loot_label.gd

const ChestPanel := preload("res://scripts/dungeon/chest_panel.gd")
const Fmt := preload("res://scripts/town_format.gd")

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

	# T3 — a successful investigation NAMES the trap kind, not a flat 「罠が仕掛けられている」.
	var trapped_note := String(ChestPanel._note({"trap": {"kind": "needle"}}, "trapped", false))
	_check(trapped_note.find("毒針") != -1, "investigating a trapped chest names the trap kind (毒針, T3)")
	_check(trapped_note.find("仕掛けられている") == -1, "the identified-trap note is not the flat 'trapped' message (T3)")

	# P3 (playtest 2026-08-03): an AUTHORED affix must resolve to its localized label, never leak the doubled
	# raw key "affix.affix.verdant.thorn-fanged" — the old I18n.t("affix." + id) prefixed an id that already
	# began with "affix.". Lock both the authored (world.affixes ja label) and built-in (bare id → i18n) paths.
	var verdant: Dictionary = (JSON.parse_string(FileAccess.get_file_as_string("res://data/worlds/verdant.json")) as Dictionary).get("world", {})
	var affix_label := Fmt.localized_affix_label(verdant, "affix.verdant.thorn-fanged")
	_check(affix_label == "棘牙の", "authored affix resolves to its JA label (棘牙の), got: %s" % affix_label)
	_check(affix_label.find("affix.") == -1, "affix label does not leak the raw key (no 'affix.' substring)")
	_check(Fmt.localized_affix_label(verdant, "keen") == "鋭利な", "built-in bare affix resolves via i18n (鋭利な)")

	# P6 (playtest 2026-08-03「均等とは？」): gear whose effect is HP/MP/regen or a resist ward must summarise its
	# REAL effect — the old 4-combat-stat summary fell back to the aptitude word「均等」for a ward charm.
	var ward_effect := Fmt.format_equipment_effect({"resistBonus": {"sleep": 30}, "hpBonus": 4})
	_check(ward_effect.find("均等") == -1, "gear effect never shows the aptitude word 均等 (got: %s)" % ward_effect)
	_check(ward_effect.find("耐性") != -1 and ward_effect.find("HP") != -1, "a resist+HP accessory summarises 耐性 and HP")
	_check(Fmt.format_equipment_effect({"attackBonus": 3}).find("威力") != -1, "a weapon still summarises its combat stat")

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
