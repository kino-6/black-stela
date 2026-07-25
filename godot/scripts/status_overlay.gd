extends CanvasLayer
## IMP-042 — the party-status glance the player can open AT ANY TIME, from any scene.
##
## Town has an always-visible ledger and both town and the dungeon carry the full interactive party
## menu (roster / equipment / items) on a dock button. What was missing is a GLOBAL hotkey that shows
## the party's condition everywhere — including combat and the guild — without traversing focus to a
## button that some scenes do not even have. This autoload is that hotkey.
##
## It is deliberately READ-ONLY. The rich party menu manages the roster (bench / swap / equip), which is
## only ever valid in town or a corridor; dispatching those mid-combat would corrupt the fight. So the
## global glance shows vitals and condition and nothing you could break — the interactive menu stays
## where it belongs.
##
## Modality is done by PAUSING: this node runs ALWAYS, the scenes are PAUSABLE, so while the overlay is
## up the scene beneath receives no input at all (no walking the party while you read the map's cousin).

const UI := preload("res://scripts/town/ui_kit.gd")
const I18n := preload("res://scripts/i18n.gd")
const PartyPanel := preload("res://scripts/town/party_panel.gd")

var _root: Control = null
var _content_host: Control = null
var _prev_focus: Control = null

func _ready() -> void:
	# Draw above the scene, keep working while the tree is paused, and don't eat the pointer when closed.
	layer = 100
	process_mode = Node.PROCESS_MODE_ALWAYS

	_root = Control.new()
	_root.process_mode = Node.PROCESS_MODE_ALWAYS
	_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_root.visible = false
	add_child(_root)

	var scrim := ColorRect.new()
	scrim.color = Color(0.02, 0.03, 0.02, 0.82)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	_root.add_child(scrim)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_root.add_child(center)

	_content_host = center

func is_open() -> bool:
	return _root != null and _root.visible

## The Run autoload, reached by its global singleton name — an absolute /root/ path is rejected under the
## capture/test harness where no scene is current, so go through the singleton that always exists.
func _run_node() -> Node:
	return Run if typeof(Run) == TYPE_OBJECT else null

## The glance is about the PARTY — with no party (title, boot, the scenario picker, an empty guild) there
## is nothing to show, so the key does nothing rather than open an empty box.
func _can_open() -> bool:
	var run := _run_node()
	if run == null:
		return false
	var state: Variant = run.get("state")
	if typeof(state) != TYPE_DICTIONARY:
		return false
	var party: Variant = (state as Dictionary).get("party", [])
	return typeof(party) == TYPE_ARRAY and not (party as Array).is_empty()

func _unhandled_input(event: InputEvent) -> void:
	if is_open():
		if event.is_action_pressed("status") or event.is_action_pressed("cancel"):
			close()
			get_viewport().set_input_as_handled()
		return
	if event.is_action_pressed("status") and _can_open():
		open()
		get_viewport().set_input_as_handled()

func open() -> void:
	if is_open() or not _can_open():
		return
	_prev_focus = get_viewport().gui_get_focus_owner()
	_rebuild()
	_root.visible = true
	get_tree().paused = true

func close() -> void:
	if not is_open():
		return
	get_tree().paused = false
	_root.visible = false
	for child in _content_host.get_children():
		child.queue_free()
	# Hand the cursor back to whatever the scene had focused, so the player resumes where they were.
	if is_instance_valid(_prev_focus):
		_prev_focus.call_deferred("grab_focus")
	_prev_focus = null

func _rebuild() -> void:
	for child in _content_host.get_children():
		child.queue_free()

	var run := _run_node()
	var state: Dictionary = run.get("state") if run != null and typeof(run.get("state")) == TYPE_DICTIONARY else {}
	var party: Array = state.get("party", [])

	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UI.panel_style(UI.PANEL_BG, UI.GOLD))
	panel.custom_minimum_size = Vector2(760, 0)

	var body := UI.col(10)
	body.add_theme_constant_override("separation", 12)
	panel.add_child(body)

	# Heading: what this is + the purse (the same one-glance context every service shows).
	body.add_child(UI.service_heading(I18n.t("statusOverlay.title"), I18n.t("town.gold", {"gold": int(state.get("partyGold", 0))})))
	body.add_child(UI.label(_location_label(state), 16, UI.DIM))

	var list := UI.col(6)
	for member in party:
		list.add_child(_member_card(member))
	body.add_child(list)

	body.add_child(UI.label(I18n.t("statusOverlay.hint"), 14, UI.DIM))
	var close_btn := UI.button(I18n.t("partyMenu.close"), close, Vector2(180, 44), 18)
	var foot := UI.row()
	foot.add_child(close_btn)
	body.add_child(foot)

	_content_host.add_child(panel)
	# The cursor lands on Close so Enter/Esc both dismiss with the controller — no pointer needed.
	close_btn.call_deferred("grab_focus")

## One adventurer, read-only: name / level / row, then HP·MP·condition. Condition text is reused from the
## interactive panel so the two never drift.
func _member_card(member: Dictionary) -> Control:
	var wounded: bool = member.get("injury", null) != null
	var hp := int(member.get("hp", 0))
	var max_hp := int(member.get("maxHp", 0))

	var box := UI.col(3)
	var head := UI.row()
	head.add_child(UI.grow(UI.label(String(member.get("name", "?")), 20, UI.GOLD)))
	head.add_child(UI.label("Lv.%d" % int(member.get("level", 1)), 15, UI.DIM))
	head.add_child(UI.label(I18n.t("play.frontRow") if String(member.get("row", "front")) == "front" else I18n.t("play.backRow"), 15, UI.DIM))
	box.add_child(head)

	var vitals := UI.row()
	vitals.add_child(UI.label("HP %d/%d" % [hp, max_hp], 17, UI.BAD if hp < max_hp else UI.INK))
	vitals.add_child(UI.label("MP %d/%d" % [int(member.get("mp", 0)), int(member.get("maxMp", 0))], 17, UI.INK))
	vitals.add_child(UI.grow(UI.label("%s: %s" % [I18n.t("partyMenu.condition"), PartyPanel._condition(member)], 15, UI.BAD if wounded else UI.OK)))
	box.add_child(vitals)

	return UI.card(box, UI.GOLD if wounded else Color("3a4326"))

func _location_label(state: Dictionary) -> String:
	var phase := String(state.get("phase", "town"))
	var key := "play.%s" % phase
	return I18n.t(key) if I18n.has(key) else phase
