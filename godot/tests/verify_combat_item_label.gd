extends SceneTree
## Regression lock for IMP-055 (playtest 2026-07-31): the combat 道具 menu leaked an item's BASE (English)
## name — "Healing Draught" — into a Japanese screen because _item_stage rendered item.name directly instead
## of localizing by id like every other screen. This drives CommandMenu's item stage and asserts the button
## shows the resolver's JA label, never the base English name.
## Usage: godot --headless --path godot/ --script res://tests/verify_combat_item_label.gd

const CommandMenu := preload("res://scripts/combat/command_menu.gd")

var _fail := 0

func _initialize() -> void:
	# A ctx exactly like combat.gd builds for the item stage: an inventory item that carries an English base
	# name, plus the item_name resolver combat.gd now passes (id -> localized catalog name).
	var ctx := {
		"actor": {"name": "Rook", "hp": 14, "maxHp": 14, "mp": 9, "maxMp": 9},
		"stage": "item",
		"inventory": [{"id": "item.healing-draught", "name": "Healing Draught", "kind": "healing", "quantity": 1}],
		"engine": {},
		"choose": func(_kind, _payload): pass,
		"back": func(): pass,
		"item_name": func(item_id): return "治癒の水薬" if String(item_id) == "item.healing-draught" else String(item_id)
	}
	var built: Dictionary = CommandMenu.build(ctx)
	var control: Control = built["control"]

	var label := _item_button_text(control)
	_check(label != "", "the 道具 menu renders an item button")
	_check(label.find("治癒の水薬") != -1, "the item button shows the JA catalog name (治癒の水薬)")
	_check(label.find("Healing") == -1 and not _has_ascii_word(label), "no English base name leaks into the 道具 menu (IMP-055)")

	if control:
		control.free()
	print("[combat-item-label] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

# The first item button's text — the consumable row (skips the heading/hint labels).
func _item_button_text(node: Node) -> String:
	if node is Button:
		var t := String((node as Button).text)
		if t.find("×") != -1:
			return t
	for c in node.get_children():
		var found := _item_button_text(c)
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
		print("[combat-item-label] ok: %s" % label)
	else:
		push_error("[combat-item-label] FAIL: %s" % label)
		_fail += 1
