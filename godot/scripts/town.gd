extends Control
## The TOWN — a faithful port of src/components/TownEntryPanel.tsx (the IMP-025 two-level hub) plus the
## service screens under scripts/town/.
##
## Level one is the square: a STATUS LEDGER (what came back from the last expedition — result, wounds,
## loot, and what to do next), then a handful of DESTINATIONS rather than ten equal systems. Roster
## work, the market and the archive each hold their services one step in; recovery and departure stay
## on the square. Level two is a destination's services; level three is the service counter itself.
##
## Focus discipline (controller-first-ui): the cursor starts on 迷宮に入る — the command a party standing
## in town came here to give — NOT the first focusable button, and gold means focus and nothing else.
## Cancel always resolves one step back: counter → services → square.

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")
const SliceRules := preload("res://scripts/rules/slice_rules.gd")

const RecoveryPanel := preload("res://scripts/town/recovery_panel.gd")
const ShopPanel := preload("res://scripts/town/shop_panel.gd")
const LootPanel := preload("res://scripts/town/loot_panel.gd")
const WorkshopPanel := preload("res://scripts/town/workshop_panel.gd")
const QuestPanel := preload("res://scripts/town/quest_panel.gd")
const CareerPanel := preload("res://scripts/town/career_panel.gd")
const RecordsPanel := preload("res://scripts/town/records_panel.gd")
const PartyPanel := preload("res://scripts/town/party_panel.gd")

const BG := Color("0b0d09")

# The square's destinations, and which services each holds (mirrors TownEntryPanel's `services`).
const LOCATIONS := {
	"hall": ["guild", "party", "career"],
	"market": ["shop", "loot", "workshop"],
	"archive": ["records", "quests"]
}
const LOCATION_LABEL := {"hall": "town.locGuildHall", "market": "town.locMarket", "archive": "town.locArchive"}
const SERVICE_LABEL := {
	"guild": "town.guild", "party": "partyMenu.title", "career": "town.career",
	"shop": "town.shop", "loot": "town.reliquary", "workshop": "town.workshop",
	"records": "town.records", "quests": "town.quests", "recovery": "town.recovery"
}

var _run: Node = null
var _world: Dictionary = {}
var _world_id: String = "default"
var _fallback_state: Dictionary = {}
var _fallback_engine: Dictionary = {}

var _location: String = ""        # "" = the square
var _service: String = ""         # "" = no counter open
var _selected_id: String = ""     # the adventurer services act on
var _shop_category: String = ""
var _loot_filter: String = "all"
var _loot_pending: String = ""
var _party_page: String = "status"
var _party_item: String = ""
var _party_discard: bool = false
var _event_text: String = ""      # the last thing that happened, shown at the open counter

var _menu_host: VBoxContainer = null
var _service_layer: Control = null
var _backdrop: TextureRect = null
var _pending_focus: Control = null

func _ready() -> void:
	await get_tree().process_frame
	_acquire_state()
	_build()

func _acquire_state() -> void:
	_run = get_node_or_null("/root/Run")
	if _run:
		_run.ensure_loaded()
		_world_id = _run.world_id
		_world = _run.world
		if _run.state.get("phase", "") != "town":
			_run.state["phase"] = "town"
	else:
		_fallback_state = (_read_json("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary).duplicate(true)
		_fallback_state["phase"] = "town"
		_world = _read_json("res://data/worlds/default.json").get("world", {})
		_fallback_engine = _read_json("res://data/engine-data.json")

func state() -> Dictionary:
	return _run.state if _run else _fallback_state

## Test seam for the UX-parity gate: drive the screen from a specific state so the CONDITIONAL surfaces
## (wounded party, unaffordable treatment, loot to appraise, a quest ready to claim, a known bestiary
## entry) actually render and can be asserted. Without this the gate only ever sees the empty happy path
## and would pass a screen that silently drops its failure states.
func set_ui_state(ui: Dictionary) -> void:
	if ui.has("service"): _service = String(ui["service"])
	if ui.has("location"): _location = String(ui["location"])
	if ui.has("loot_pending"): _loot_pending = String(ui["loot_pending"])
	if ui.has("loot_filter"): _loot_filter = String(ui["loot_filter"])
	if ui.has("shop_category"): _shop_category = String(ui["shop_category"])
	if ui.has("party_page"): _party_page = String(ui["party_page"])
	_rebuild()

## Test seam: drive the town from ANOTHER world's pack, proving the same scene code renders both.
func set_world_override(world_id: String) -> void:
	_run = null
	_world_id = world_id
	_world = _read_json("res://data/worlds/%s.json" % world_id).get("world", {})
	if _fallback_engine.is_empty():
		_fallback_engine = _read_json("res://data/engine-data.json")
	if _fallback_state.is_empty():
		_fallback_state = (_read_json("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary).duplicate(true)
		_fallback_state["phase"] = "town"
	# The world's ASSETS switch with its data — a world-parameterized scene that keeps the previous
	# world's backdrop is only half parameterized.
	if _backdrop:
		_backdrop.texture = _texture(_asset("ui/town-hub.jpg"))
	_rebuild()

func set_state_override(patched: Dictionary) -> void:
	_run = null
	_fallback_state = patched
	if _fallback_engine.is_empty():
		_fallback_engine = _read_json("res://data/engine-data.json")
	_rebuild()

func engine() -> Dictionary:
	return _run.engine if _run else _fallback_engine

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

func _asset(sub: String) -> String:
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

# --- the one mutation path: the ported rules, the same ones the parity gate proves ----------------
func dispatch(command: Dictionary) -> Array:
	var events: Array
	if _run:
		events = _run.dispatch(command)
	else:
		var result: Dictionary = SliceRules.resolve(_fallback_state, command, _world, _fallback_engine)
		_fallback_state = result.get("state", _fallback_state)
		events = result.get("events", [])
	if not events.is_empty():
		_event_text = _describe(events[events.size() - 1])
	_rebuild()
	return events

func selected_member() -> Dictionary:
	var party: Array = state().get("party", [])
	if party.is_empty():
		return {}
	for member in party:
		if String(member.get("id", "")) == _selected_id:
			return member
	_selected_id = String(party[0].get("id", ""))
	return party[0]

# --- build ----------------------------------------------------------------------------------------
func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	_backdrop = TextureRect.new()
	var back := _backdrop
	back.texture = _texture(_asset("ui/town-hub.jpg"))
	back.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	back.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	back.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(back)
	var scrim := ColorRect.new()
	scrim.color = Color(0.043, 0.051, 0.035, 0.62)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	_menu_host = UI.col(14)
	_menu_host.position = Vector2(72, 56)
	_menu_host.custom_minimum_size = Vector2(1100, 0)
	add_child(_menu_host)

	_service_layer = Control.new()
	_service_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.visible = false
	add_child(_service_layer)

	_rebuild()

func _rebuild() -> void:
	if _service != "":
		_build_service()
	else:
		_service_layer.visible = false
		_build_square()
	if _pending_focus:
		_pending_focus.call_deferred("grab_focus")
		_pending_focus = null

# --- level 1/2: the square and its destinations ---------------------------------------------------
func _build_square() -> void:
	for child in _menu_host.get_children():
		child.queue_free()
	var s := state()
	var party: Array = s.get("party", [])
	var party_empty := party.is_empty()
	var expeditions := int(s.get("expeditions", 0))
	var first_departure := expeditions == 0

	# heading + purse
	var head := UI.row()
	var titles := UI.col(2)
	titles.add_child(UI.label(I18n.t("town.departureHeading" if first_departure else "town.statusHeading"), 34, UI.GOLD))
	titles.add_child(UI.prose(I18n.t("town.departureCopy" if first_departure else "town.statusCopy"), 16, UI.DIM, 760))
	head.add_child(UI.grow(titles))
	head.add_child(UI.label(I18n.t("town.gold", {"gold": int(s.get("partyGold", 0))}), 22, UI.INK))
	_menu_host.add_child(head)

	# --- THE STATUS LEDGER: what came back, and what to do about it ---
	var ledger := UI.col(4)
	if first_departure:
		_ledger_row(ledger, I18n.t("town.party"), I18n.t("town.noParty") if party_empty else I18n.t("town.partyReady", {"count": party.size()}))
		_ledger_row(ledger, I18n.t("town.supplies"), _loot_summary(s))
		_ledger_row(ledger, I18n.t("town.nextPreparation"), I18n.t("town.firstNeedParty") if party_empty else I18n.t("town.firstDescend"))
	else:
		_ledger_row(ledger, I18n.t("town.expeditionResult"), _latest_log_text(s))
		_ledger_row(ledger, I18n.t("town.wounds"), _wounds_summary(party))
		_ledger_row(ledger, I18n.t("town.loot"), _loot_summary(s))
		_ledger_row(ledger, I18n.t("town.nextPreparation"), _next_preparation(s, party))
	_menu_host.add_child(UI.card(ledger))

	# --- the destinations ---
	var menu := UI.row()
	var focus_target: Button = null
	if _location == "":
		for key in ["hall", "market", "archive"]:
			var k := String(key)
			menu.add_child(UI.button(I18n.t(String(LOCATION_LABEL[k])), func(): _go_location(k), Vector2(200, 56), 18))
		menu.add_child(UI.button(I18n.t("town.recovery"), func(): _open_service("recovery"), Vector2(200, 56), 18))
		var descend := UI.button(I18n.t("play.enterDungeon"), func(): _on_descend(), Vector2(280, 56), 20)
		descend.disabled = party_empty
		menu.add_child(descend)
		# The cursor lands on the command the player came here to give.
		focus_target = descend if not party_empty else null
	else:
		menu.add_child(UI.button(I18n.t("town.backToHub"), func(): _go_location(""), Vector2(160, 56), 18))
		for key in LOCATIONS[_location]:
			var svc := String(key)
			var b := UI.button(I18n.t(String(SERVICE_LABEL[svc])), func(): _open_service(svc), Vector2(200, 56), 18)
			b.disabled = _service_disabled(svc, party_empty)
			menu.add_child(b)
			if focus_target == null and not b.disabled:
				focus_target = b
	_menu_host.add_child(menu)
	if focus_target:
		_pending_focus = focus_target
	elif menu.get_child_count() > 0:
		_pending_focus = UI.first_focusable(menu)

func _service_disabled(service: String, party_empty: bool) -> bool:
	match service:
		"party", "career", "workshop":
			return party_empty
		"shop":
			return (_world.get("shops", []) as Array).is_empty()
		"quests":
			return (_world.get("quests", []) as Array).is_empty()
	return false

func _ledger_row(host: VBoxContainer, term: String, value: String) -> void:
	var row := UI.row()
	var t := UI.label(term, 15, UI.DIM)
	t.custom_minimum_size = Vector2(160, 0)
	row.add_child(t)
	row.add_child(UI.grow(UI.label(value, 17, UI.INK)))
	host.add_child(row)

# The expedition result the ledger reports. DEBUG entries are never player-facing (AGENTS.md: no debug
# UI or implementation wording in normal play) — the debug-start seed is English and would otherwise be
# the first thing a player reads in town.
func _latest_log_text(s: Dictionary) -> String:
	var log: Array = s.get("log", [])
	for i in range(log.size() - 1, -1, -1):
		var entry: Dictionary = log[i]
		if (entry.get("tags", []) as Array).has("debug"):
			continue
		if String((entry.get("event", {}) as Dictionary).get("type", "")).begins_with("debug"):
			continue
		var text := String(entry.get("text", ""))
		if text != "":
			return text
	return I18n.t("town.readyToDescend")

func _wounds_summary(party: Array) -> String:
	var parts := []
	for member in party:
		if Fmt.member_recovery_cost(member) > 0:
			parts.append("%s %d/%d" % [String(member.get("name", "?")), int(member.get("hp", 0)), int(member.get("maxHp", 0))])
	return " / ".join(PackedStringArray(parts)) if not parts.is_empty() else I18n.t("town.noWounds")

func _loot_summary(s: Dictionary) -> String:
	var parts := []
	var count := 0
	for item in s.get("inventory", []):
		count += int(item.get("quantity", 1))
		if parts.size() < 3:
			parts.append(Fmt.localized_catalog_name(_world, item.get("id", "")))
	if count == 0:
		return I18n.t("town.noLoot")
	return " / ".join(PackedStringArray(parts))

func _next_preparation(s: Dictionary, party: Array) -> String:
	if Fmt.party_recovery_cost(party) > 0:
		return I18n.t("town.nextRecovery")
	for item in s.get("inventory", []):
		if item.get("kind", "") == "equipment":
			return I18n.t("town.nextShop")
	return I18n.t("town.readyToDescend")

func _go_location(location: String) -> void:
	_location = location
	_rebuild()

# --- level 3: the service counter ------------------------------------------------------------------
func _open_service(service: String) -> void:
	_service = service
	_loot_pending = ""
	_event_text = ""
	_rebuild()

func _close_service() -> void:
	_service = ""
	_loot_pending = ""
	_event_text = ""
	_rebuild()

func _service_ctx() -> Dictionary:
	return {
		"state": state(),
		"world": _world,
		"engine": engine(),
		"event_text": _event_text,
		"dispatch": func(command): dispatch(command),
		"close": func(): _close_service(),
		"selected_member": func(): return selected_member(),
		"set_selected": func(id): _selected_id = String(id); _rebuild(),
		"focus_hint": func(control): _pending_focus = control,
		"shop_category": _shop_category,
		"set_shop_category": func(cat): _shop_category = String(cat); _rebuild(),
		"loot_filter": _loot_filter,
		"set_loot_filter": func(f): _loot_filter = String(f); _rebuild(),
		"party_page": _party_page,
		"set_party_page": func(page): _party_page = String(page); _party_discard = false; _rebuild(),
		"party_item": _party_item,
		"set_party_item": func(key): _party_item = String(key); _party_discard = false; _rebuild(),
		"party_discard_pending": _party_discard,
		"set_party_discard": func(pending): _party_discard = bool(pending); _rebuild(),
		"loot_pending_bulk": _loot_pending,
		"set_loot_pending": func(p): _loot_pending = String(p); _rebuild()
	}

func _build_service() -> void:
	for child in _service_layer.get_children():
		child.queue_free()
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.78)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.add_child(scrim)

	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UI.panel_style(UI.PANEL_BG, UI.GOLD))
	panel.position = Vector2(90, 60)
	panel.custom_minimum_size = Vector2(1740, 960)
	_service_layer.add_child(panel)

	var ctx := _service_ctx()
	var body: Control = null
	match _service:
		"recovery": body = RecoveryPanel.build(ctx)
		"shop": body = ShopPanel.build(ctx)
		"loot": body = LootPanel.build(ctx)
		"workshop": body = WorkshopPanel.build(ctx)
		"quests": body = QuestPanel.build(ctx)
		"career": body = CareerPanel.build(ctx)
		"records": body = RecordsPanel.build(ctx)
		"party", "guild": body = PartyPanel.build(ctx)
	if body == null:
		body = UI.label("(未実装)", 18, UI.DIM)
	panel.add_child(body)
	_service_layer.visible = true

# Cancel resolves one step back, always: counter -> services -> square.
func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("cancel"):
		return
	if _service != "":
		if _service == "loot" and _loot_pending != "":
			_loot_pending = ""
			_rebuild()
		else:
			_close_service()
		get_viewport().set_input_as_handled()
	elif _location != "":
		_go_location("")
		get_viewport().set_input_as_handled()

func _on_descend() -> void:
	get_tree().change_scene_to_file("res://scenes/dungeon.tscn")

func _texture(path: String) -> Texture2D:
	var img := Image.load_from_file(path)
	return ImageTexture.create_from_image(img) if img != null else null

# The one line telling the player what just happened at this counter.
func _describe(event: Dictionary) -> String:
	match String(event.get("type", "")):
		"party_recovered": return I18n.t("events.partyRecovered", {"gold": int(event.get("gold", 0))}) if I18n.has("events.partyRecovered") else I18n.t("town.recoveryCost", {"gold": int(event.get("gold", 0))})
		"recovery_blocked": return I18n.t("town.cannotAffordRecovery")
		"item_bought": return "%s ・ %s" % [String(event.get("itemName", "")), I18n.t("town.buy")]
		"item_sold": return "%s ・ %s" % [String(event.get("itemName", "")), I18n.t("town.sell")]
		"equipment_changed": return I18n.t("town.equipment")
		"item_appraised": return "%s ・ %s" % [String(event.get("itemName", "")), I18n.t("loot.title")]
		"equipment_reinforced": return I18n.t("workshop.boosts", {"stat": String(event.get("itemName", ""))})
		"bulk_converted": return I18n.t("loot.convertible", {"count": int(event.get("count", 0)), "gold": int(event.get("gold", 0)), "materials": int(event.get("materials", 0))})
		"quest_accepted": return "%s ・ %s" % [String(event.get("questName", "")), I18n.t("questBoard.accept")]
		"quest_claimed": return "%s ・ %s" % [String(event.get("questName", "")), I18n.t("questBoard.claim")]
		"vocation_changed": return I18n.t("career.changeTo", {"vocation": String(event.get("vocationName", ""))})
	return ""
