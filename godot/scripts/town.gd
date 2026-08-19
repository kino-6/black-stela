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
const SaveGame := preload("res://scripts/rules/save_game.gd")
const DungeonHud := preload("res://scripts/dungeon/dungeon_hud.gd")
const ConfigPanel := preload("res://scripts/config_panel.gd")

const RecoveryPanel := preload("res://scripts/town/recovery_panel.gd")
const WorldResources := preload("res://scripts/world_resources.gd")
const ShopPanel := preload("res://scripts/town/shop_panel.gd")
const LootPanel := preload("res://scripts/town/loot_panel.gd")
const WorkshopPanel := preload("res://scripts/town/workshop_panel.gd")
const BlacksmithPanel := preload("res://scripts/town/blacksmith_panel.gd")
const QuestPanel := preload("res://scripts/town/quest_panel.gd")
const FacilityPanel := preload("res://scripts/town/facility_panel.gd")
const Quests := preload("res://scripts/rules/quests.gd")
const FacilityRules := preload("res://scripts/rules/facilities.gd")
const CareerPanel := preload("res://scripts/town/career_panel.gd")
const RecordsPanel := preload("res://scripts/town/records_panel.gd")
const PartyPanel := preload("res://scripts/town/party_panel.gd")

const BG := Color("0b0d09")

# The square's destinations, and which services each holds (mirrors TownEntryPanel's `services`).
const LOCATIONS := {
	"hall": ["guild", "party", "career"],
	"market": ["shop", "loot", "workshop", "blacksmith", "facility"],
	"archive": ["records", "quests"]
}
const LOCATION_LABEL := {"hall": "town.locGuildHall", "market": "town.locMarket", "archive": "town.locArchive"}
const SERVICE_LABEL := {
	"guild": "town.guild", "party": "partyMenu.title", "career": "town.career",
	"shop": "town.shop", "loot": "town.reliquary", "workshop": "town.workshop", "blacksmith": "town.blacksmith",
	"records": "town.records", "quests": "town.quests", "recovery": "town.recovery",
	"facility": "town.facility"
}

var _run: Node = null
var _world: Dictionary = {}
var _world_id: String = "default"
var _fallback_state: Dictionary = {}
var _fallback_engine: Dictionary = {}

var _location: String = ""        # "" = the square
var _service: String = ""         # "" = no counter open
var _menu_open: bool = false      # the settings/menu overlay (over the square)
var _selected_id: String = ""     # the adventurer services act on
var _shop_category: String = ""
var _shop_item_id: String = ""    # stock currently being examined; buying is a deliberate second step
var _shop_mode: String = "buy"    # 買う / 売る — the Etrian-style top-level split (T8)
var _loot_filter: String = "all"
var _loot_pending: String = ""
var _party_page: String = "status"
var _party_item: String = ""
var _party_item_target_id: String = ""
var _party_technique_id: String = ""
var _party_equipment_slot: String = "weapon"
var _party_equipment_candidate: String = ""
var _party_discard: bool = false
var _party_focus_member_id: String = "" # one rebuild only; keeps roster browsing under the controller cursor
var _career_preview: String = ""  # the 転職 destination being previewed (SFC list→preview→confirm); "" = the list
var _event_text: String = ""      # the last thing that happened, shown at the open counter

var _menu_host: VBoxContainer = null
var _service_layer: Control = null
var _backdrop: TextureRect = null
var _pending_focus: Control = null

func _ready() -> void:
	await get_tree().process_frame
	_acquire_state()
	# Autosave 1 — arriving in town with a party (playtest: the build never autosaved, so every run started
	# from the beginning). An empty brand-new town (no party yet) is not worth a save.
	if _run and not _run.state.get("party", []).is_empty():
		_run.save_autosave()
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
	if ui.has("shop_item_id"): _shop_item_id = String(ui["shop_item_id"])
	if ui.has("shop_mode"): _shop_mode = String(ui["shop_mode"])
	if ui.has("party_page"): _party_page = String(ui["party_page"])
	if ui.has("party_member_id"): _selected_id = String(ui["party_member_id"])
	if ui.has("party_item"): _party_item = String(ui["party_item"])
	if ui.has("party_item_target_id"): _party_item_target_id = String(ui["party_item_target_id"])
	if ui.has("party_technique_id"): _party_technique_id = String(ui["party_technique_id"])
	if ui.has("party_equipment_slot"): _party_equipment_slot = String(ui["party_equipment_slot"])
	if ui.has("party_equipment_candidate"): _party_equipment_candidate = String(ui["party_equipment_candidate"])
	if ui.has("party_discard"): _party_discard = bool(ui["party_discard"])
	if ui.has("career_preview"): _career_preview = String(ui["career_preview"])
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
	return WorldResources.read_json(path)

func _asset(sub: String) -> String:
	return WorldResources.world_asset(_run.world_id if _run else _world_id, sub)

## The world's own name — the town heading, so the square reads as a PLACE, not a tutorial step.
func _world_title() -> String:
	var ja: Dictionary = (_world.get("locales", {}) as Dictionary).get("ja", {})
	var title := String(ja.get("title", _world.get("title", "")))
	return title if title != "" else I18n.t("town.statusHeading")

## The member's calling, localized — resolved through the same twelve-to-eight legacy map as the portrait,
## so a legacy save reads its real current 職業. Empty if the class is somehow unknown (card just omits it).
func _class_label(class_id: String) -> String:
	var legacy: Dictionary = engine().get("legacyClassMapping", {})
	var id := String(legacy.get(class_id, class_id))
	# A world may re-skin a basic class (terminal-line's 戦士 → 保安隊員); prefer its vocation name so the town
	# party card reads the themed class, falling back to the base class label (React localizedVocationName parity).
	for vocation in _world.get("vocations", []):
		if String((vocation as Dictionary).get("id", "")) == id:
			return Fmt.localized_vocation_name(_world, vocation)
	for class_def in engine().get("classes", []):
		if String((class_def as Dictionary).get("id", "")) == id:
			var label: Variant = (class_def as Dictionary).get("label", {})
			if typeof(label) == TYPE_DICTIONARY and (label as Dictionary).has("ja"):
				return String((label as Dictionary)["ja"])
	return ""

## The portrait a member's card shows — a builtin/imported ref, else the class figure from the pack (the
## Default eight-class library is the shared fallback). Mirrors dungeon.gd/_portrait_path so the town card
## resolves the same face as the crawl. (The 4th copy of this — a future WorldResources extraction.)
var _backgrounds_cache: Array = []
func _backgrounds() -> Array:
	if _backgrounds_cache.is_empty():
		_backgrounds_cache = ((_run.character_data if _run else WorldResources.read_json("res://data/character-data.json")) as Dictionary).get("backgrounds", [])
	return _backgrounds_cache

func _portrait_path(member: Dictionary) -> String:
	# The FACE the card shows: an explicit builtin pick, else the background's own face (both packs ship
	# all twelve via the Default fallback). Resolved through face_path so a body-only figure (a world.portraits
	# key like chara-13, no square face) top-crops its standing art instead of blanking (playtest 2026-08-05).
	return WorldResources.face_path(_run.world_id if _run else _world_id, WorldResources.portrait_key(member, _backgrounds()))

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

func _dispatch_service_command(command: Dictionary) -> Array:
	var events := dispatch(command)
	if String(command.get("type", "")) == "equip_item":
		for event in events:
			if String((event as Dictionary).get("type", "")) == "equipment_changed":
				_party_equipment_candidate = ""
				_rebuild()
				break
	if String(command.get("type", "")) == "use_item" and not events.is_empty():
		_party_item_target_id = ""
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

func _select_party_member(id: String, preserve_roster_focus: bool) -> void:
	if id == "" or id == _selected_id:
		return
	_selected_id = id
	_party_focus_member_id = id if preserve_roster_focus else ""
	_career_preview = ""
	_rebuild()

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
	# A bottom-weighted GRADIENT scrim, not a flat 0.62 dark wash: the flat scrim darkened the WHOLE backdrop
	# evenly, crushing a dark town's upper art (default's hall) into near-black (playtest 2026-08-06). Now the
	# top stays light so the environment reads, and it deepens toward the bottom where the party cards and
	# destination buttons need a readable ground. (A genuinely dark backdrop asset is still a Codex retake.)
	var scrim_grad := Gradient.new()
	scrim_grad.set_color(0, Color(0.043, 0.051, 0.035, 0.22))
	scrim_grad.set_color(1, Color(0.043, 0.051, 0.035, 0.78))
	var scrim_tex := GradientTexture2D.new()
	scrim_tex.gradient = scrim_grad
	scrim_tex.fill_from = Vector2(0, 0)
	scrim_tex.fill_to = Vector2(0, 1)
	var scrim := TextureRect.new()
	scrim.texture = scrim_tex
	scrim.stretch_mode = TextureRect.STRETCH_SCALE
	scrim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	# The square spans the whole frame now (was a top-left column that piled every card into one corner and
	# left the town art dead — playtest). Top bar up top, the party formation + destinations along the bottom.
	_menu_host = UI.col(16)
	_menu_host.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_menu_host.offset_left = 72
	_menu_host.offset_top = 44
	_menu_host.offset_right = -72
	_menu_host.offset_bottom = -40
	add_child(_menu_host)

	_service_layer = Control.new()
	_service_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.visible = false
	add_child(_service_layer)

	_rebuild()

func _rebuild() -> void:
	# Per-location still: the square, each destination (hall/market/archive) and the infirmary each have their
	# own prepared art — the town used to keep town-hub.jpg everywhere (playtest 2026-07-29). Falls back to the
	# hub for any world that ships only the hub still.
	if _backdrop:
		# Most-specific still wins: a per-SERVICE still (the forge for the 鍛冶屋, like the infirmary already
		# has its own), then the LOCATION still, then the hub. Each step falls through if the world does not
		# ship that art, so wiring a blacksmith still is safe before the picture exists.
		var still: Texture2D = null
		for candidate in [_service_still(), _location_still(), "ui/town-hub.jpg"]:
			if candidate == "":
				continue
			still = _texture(_asset(candidate))
			if still != null:
				break
		_backdrop.texture = still
	if _service != "":
		# A service is MODAL: hide the square's chrome (party rail + destination bar) so the D-pad cannot
		# geometry-hop out of the panel into the street buttons underneath it (#34/#35 — 鍛冶屋 focus escaped
		# to 鑑定所). Invisible controls are skipped by find_valid_focus_neighbor, so this traps focus in the
		# open panel for every service at once. Restored when the square rebuilds.
		_menu_host.visible = false
		_build_service()
	else:
		_menu_host.visible = true
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

	# --- TOP BAR: the PLACE (atmosphere), the purse, and the menu ---
	# The heading is the LOCATION, not a tutorial. "初めて潜る前に / まだ誰も潜っていません" nagged and broke the
	# mood even though a party was already formed (playtest); the world's own title reads as somewhere you ARE.
	var head := UI.row()
	var titles := UI.col(2)
	titles.add_child(UI.label(_world_title(), 34, UI.GOLD))
	# One quiet line — what changed last trip — never the "編成してから出発" instruction.
	var sub := "" if first_departure else _latest_log_text(s)
	if sub != "":
		titles.add_child(UI.label(sub, 15, UI.DIM))
	head.add_child(UI.grow(titles))
	head.add_child(UI.label(I18n.t("town.gold", {"gold": int(s.get("partyGold", 0))}), 22, UI.INK))
	var menu_btn := UI.button(I18n.t("town.menu"), func(): _open_menu(), Vector2(120, 44), 16)
	head.add_child(menu_btn)
	_menu_host.add_child(head)

	# The town art breathes in the middle; the party + destinations sit along the bottom (like the crawl HUD).
	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_menu_host.add_child(spacer)

	# --- wounds, only when someone is actually hurt — actionable, not a permanent ledger row ---
	if not party_empty and Fmt.party_recovery_cost(party) > 0:
		var ledger := UI.col(4)
		_ledger_row(ledger, I18n.t("town.wounds"), _wounds_summary(party))
		_menu_host.add_child(UI.card(ledger, UI.BAD))

	# --- quest notice (#29): the board sat invisible behind 記録の間, so a party could descend for hours
	# without ever noticing a bounty was on offer. Surface it on the square — only when there is something
	# to do (rewards to claim, or contracts to take), pointing at where (記録の間). ---
	if not party_empty:
		var qc := Quests.board_counts(s, _world)
		# Boxed like the wounds ledger so the notice reads as its own actionable card, not a floating line.
		if int(qc.get("ready", 0)) > 0:
			_menu_host.add_child(UI.card(UI.label(I18n.t("town.questsReady", {"count": int(qc["ready"])}), 17, UI.OK), UI.OK))
		elif int(qc.get("available", 0)) > 0:
			_menu_host.add_child(UI.card(UI.label(I18n.t("town.questsAvailable", {"count": int(qc["available"])}), 17, UI.GOLD), UI.GOLD))

	# --- PARTY FORMATION — the SAME card the crawl/combat HUD uses (portrait, 前衛/後衛, 職/Lv, HP·MP bars,
	# the judged damage/armor/speed, conditions), so "who is ready and where they stand" reads at a glance and
	# the party can actually be PREPARED here (playtest: the old name·HP·MP list was too thin to plan from). ---
	if not party_empty:
		_menu_host.add_child(UI.label(I18n.t("town.partyStatus"), 15, UI.GOLD))
		# 前衛 and 後衛 are grouped under their own heading with a wide gap between, so the two ranks read at a
		# glance instead of six tokens running together (playtest 2026-08-13「前衛・後衛が入り乱れて視認性が悪い」).
		var rail := UI.row()
		rail.add_theme_constant_override("separation", 28)
		for row in ["front", "back"]:
			var group_members := []
			for member in party:
				if String(member.get("row", "front")) == row:
					group_members.append(member)
			if group_members.is_empty():
				continue
			var group_box := UI.col(4)
			group_box.add_child(UI.label(I18n.t("play.frontRow" if row == "front" else "play.backRow"), 15, UI.GOLD if row == "front" else UI.DIM))
			var group_row := UI.row()
			group_row.add_theme_constant_override("separation", 8)
			for member in group_members:
				var tex := WorldResources.portrait_texture(String(member.get("portraitRef", "")), _portrait_path(member))
				group_row.add_child(DungeonHud.party_token(member, _world, tex, _class_label(String(member.get("classId", ""))), FacilityRules.attack_pct(s, _world)))
			group_box.add_child(group_row)
			rail.add_child(group_box)
		_menu_host.add_child(rail)

	# --- the way back down to a rest point already reached ---
	# A checkpoint is earned progress: once a rest point has been walked to, the party never has to walk
	# the whole floor again. The rules command exists (resume_at_checkpoint) and the square had no way to
	# give it, so the progress was unreachable from the screen that is supposed to offer it.
	var checkpoints := _unlocked_checkpoints(s)
	if not checkpoints.is_empty():
		var resume := UI.row()
		resume.add_child(UI.label(I18n.t("play.checkpointsHeading"), 15, UI.DIM))
		for checkpoint in checkpoints:
			var room_id := String(checkpoint["roomId"])
			var b := UI.button(I18n.t("play.resumeAt", {"place": String(checkpoint["name"])}), func(): _dispatch_resume(room_id), Vector2(280, 40), 15)
			b.disabled = party_empty
			resume.add_child(b)
		_menu_host.add_child(resume)

	# A return gets one compact preparation cockpit beside the next commands.  It is intentionally absent
	# before the first descent: an empty “expedition result” is an administrative lie.  Once the party has
	# come back, however, the player should not have to reconstruct wounds, new loot, purse, and the next
	# concern from scattered panels before choosing where to go next.
	if not first_departure:
		var cockpit := UI.col(3)
		var cockpit_head := UI.row()
		cockpit_head.add_child(UI.grow(UI.label(I18n.t("town.statusHeading"), 17, UI.GOLD)))
		cockpit_head.add_child(UI.label(I18n.t("town.gold", {"gold": int(s.get("partyGold", 0))}), 16, UI.INK))
		cockpit.add_child(cockpit_head)
		cockpit.add_child(UI.label("%s　%s" % [I18n.t("town.expeditionResult"), _latest_log_text(s)], 15, UI.DIM))
		cockpit.add_child(UI.label("%s　%s　　%s　%s" % [
			I18n.t("town.wounds"), _wounds_summary(party),
			I18n.t("town.loot"), _loot_summary(s, "town.noLoot", true)
		], 15, UI.INK))
		cockpit.add_child(UI.label("%s　%s" % [I18n.t("town.nextPreparation"), _next_preparation(s, party)], 16, UI.OK))
		_menu_host.add_child(UI.card(cockpit, UI.GOLD))

	# --- the destinations ---
	_menu_host.add_child(UI.label(I18n.t("town.servicesHeading"), 16, UI.DIM))
	var menu := UI.row()
	var focus_target: Button = null
	if _location == "":
		for key in ["hall", "market", "archive"]:
			var k := String(key)
			menu.add_child(UI.button(I18n.t(String(LOCATION_LABEL[k])), func(): _go_location(k), Vector2(200, 56), 18))
		menu.add_child(UI.button(I18n.t("town.recovery"), func(): _open_service("recovery"), Vector2(200, 56), 18))
		# T30/U5: one portal per dungeon. A single-dungeon world resolves to one entrance = the generic
		# 迷宮に入る button, unchanged. The cursor lands on the FIRST portal (the command a party came to give).
		var entrances := _entrances()
		for i in entrances.size():
			var entrance: Dictionary = entrances[i]
			var start_room := String(entrance.get("startRoom", ""))
			var single := entrances.size() == 1
			var label := I18n.t("play.enterDungeon") if single else _entrance_label(entrance)
			var portal := UI.button(label, func(): _on_descend(start_room), Vector2(280, 56), 20)
			portal.disabled = party_empty
			menu.add_child(portal)
			if i == 0:
				focus_target = portal if not party_empty else null
	else:
		menu.add_child(UI.button(I18n.t("town.backToHub"), func(): _go_location(""), Vector2(160, 56), 18))
		for key in LOCATIONS[_location]:
			var svc := String(key)
			# The base counter only exists in worlds that author facilities — hide it entirely elsewhere
			# rather than show a permanently-greyed button (#33).
			if svc == "facility" and (_world.get("facilities", []) as Array).is_empty():
				continue
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
		"party", "career", "workshop", "blacksmith":
			return party_empty
		"shop":
			return (_world.get("shops", []) as Array).is_empty()
		"quests":
			return (_world.get("quests", []) as Array).is_empty()
		"facility":
			return (_world.get("facilities", []) as Array).is_empty()
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
	# A RECORD of the expedition, so the empty case is an honest "nothing to report" — not the flavour
	# "もう一度潜れる" (that belongs to 次の支度, and reading it as a record was the playtest #16 "大嘘").
	return I18n.t("town.noRecord")

func _wounds_summary(party: Array) -> String:
	var parts := []
	for member in party:
		if Fmt.member_recovery_cost(member) > 0:
			parts.append("%s %d/%d" % [String(member.get("name", "?")), int(member.get("hp", 0)), int(member.get("maxHp", 0))])
	return " / ".join(PackedStringArray(parts)) if not parts.is_empty() else I18n.t("town.noWounds")

## Before the first descent the party is looking at SUPPLIES they carry down; afterwards it is LOOT they
## carried back. Same emptiness, different sentence — React says both, and the port said only one.
func _loot_summary(s: Dictionary, empty_key: String = "town.noLoot", only_gains: bool = false) -> String:
	# When reporting expedition LOOT (only_gains), subtract what the party carried down (loot_baseline)
	# so supplies brought from town are never miscounted as things brought back (playtest #3). Before the
	# first descent the same call reports SUPPLIES in full (only_gains=false).
	var baseline: Dictionary = _run.loot_baseline if (only_gains and _run) else {}
	var parts := []
	var count := 0
	for item in s.get("inventory", []):
		var id := String(item.get("id", ""))
		var qty := int(item.get("quantity", 1)) - int(baseline.get(id, 0))
		if qty <= 0:
			continue
		count += qty
		if parts.size() < 3:
			parts.append(Fmt.localized_catalog_name(_world, id))
	if count == 0:
		return I18n.t(empty_key)
	return " / ".join(PackedStringArray(parts))

func _inventory_counts(s: Dictionary) -> Dictionary:
	var counts := {}
	for item in s.get("inventory", []):
		var id := String(item.get("id", ""))
		counts[id] = int(counts.get(id, 0)) + int(item.get("quantity", 1))
	return counts

func _next_preparation(s: Dictionary, party: Array) -> String:
	if Fmt.party_recovery_cost(party) > 0:
		return I18n.t("town.nextRecovery")
	for item in s.get("inventory", []):
		if item.get("kind", "") == "equipment":
			return I18n.t("town.nextShop")
	return I18n.t("town.readyToDescend")

# The prepared still for where the party is standing: the infirmary counter, each destination, else the hub.
# A still specific to the open SERVICE (its own atmosphere art), or "" to fall back to the location still.
# The 鍛冶屋 gets a forge still of its own, mirroring the infirmary; falls back to the market backdrop until
# the art ships (Codex art-lane owns the picture).
func _service_still() -> String:
	match _service:
		"blacksmith":
			return "ui/blacksmith.png"
		_:
			return ""

func _location_still() -> String:
	if _service == "recovery":
		return "ui/infirmary.png"
	match _location:
		"hall":
			return "ui/guild-hall.jpg"
		"market":
			return "ui/market-workshop.png"
		"archive":
			return "ui/archive-lodge.png"
		_:
			return "ui/town-hub.jpg"

func _go_location(location: String) -> void:
	_location = location
	_rebuild()

# --- level 3: the service counter ------------------------------------------------------------------
func _open_service(service: String) -> void:
	# The guild is the registration CEREMONY — a full scene, not a town panel. Entering it from town KEEPS
	# the roster (guild.gd no longer wipes on _ready), so this is the path to create and add more adventurers.
	# Without it there was no way to build a party from town at all (playtest regression).
	if service == "guild":
		get_tree().change_scene_to_file("res://scenes/guild.tscn")
		return
	_service = service
	_loot_pending = ""
	_event_text = ""
	_rebuild()

func _close_service() -> void:
	_service = ""
	_loot_pending = ""
	_career_preview = ""
	_event_text = ""
	_rebuild()

func _back_from_party_equipment() -> bool:
	if _party_page == "spells" and _party_technique_id != "":
		_party_technique_id = ""
		_rebuild()
		return true
	if (_party_page == "items" or _party_page == "valuables") and _party_item_target_id != "":
		_party_item_target_id = ""
		_rebuild()
		return true
	if _party_page != "equipment" or _party_equipment_candidate == "":
		return false
	_party_equipment_candidate = ""
	_rebuild()
	return true

# --- the town MENU: settings + leave-to-title, reachable from anywhere in the square (playtest: "メニュー
# ボタンがない？"). An overlay over the square (cancel closes it back), NOT a scene change — so the run
# is never lost by peeking at the options. Reuses the shared ConfigPanel the title/combat settings use.
func _open_menu() -> void:
	_menu_open = true
	for child in _service_layer.get_children():
		child.queue_free()
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.8)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.add_child(scrim)

	# CenterContainer, NOT PRESET_CENTER on the panel: PRESET_CENTER freezes the offsets while the panel is
	# still 0×0, so once its column grows the panel spills down-right of screen-centre instead of centring
	# (playtest 2026-08-03「メニューの位置が変」). A full-rect CenterContainer re-centres after layout.
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.add_child(center)
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UI.panel_style(UI.PANEL_BG, UI.GOLD))
	panel.custom_minimum_size = Vector2(560, 0)
	center.add_child(panel)

	var col := UI.col(14)
	col.add_child(UI.label(I18n.t("town.menu"), 26, UI.GOLD))
	var built := ConfigPanel.build(ConfigPanel.load_settings(), func(): _open_menu())
	col.add_child(built["control"])
	col.add_child(UI.button(I18n.t("town.leaveToTitle"), func(): get_tree().change_scene_to_file("res://scenes/title.tscn"), Vector2(300, 46), 16))
	var close := UI.button(I18n.t("town.closeMenu"), func(): _close_menu(), Vector2(300, 46), 16)
	col.add_child(close)
	panel.add_child(col)
	_service_layer.visible = true
	var focus: Control = built["first"] if built["first"] != null else close
	if focus:
		focus.call_deferred("grab_focus")

func _close_menu() -> void:
	_menu_open = false
	_service_layer.visible = false
	for child in _service_layer.get_children():
		child.queue_free()
	_rebuild()

# A player-made save into one of this scenario's three manual slots (記録の間). The town/stairs autosave
# rolls into the scenario's own autosave separately.
func _save_manual(index: int) -> void:
	if _run:
		_run.save_manual(index)
		_event_text = I18n.t("save.savedToSlot", {"slot": I18n.t("save.manualSlot", {"n": index})})
		_rebuild()

# This scenario's three manual slots resolved to their current save summaries (empty ⇒ no "savedAt"), for
# the records-room Save UI. Mirrors App.tsx manualSlotSummaries.
func _manual_slots() -> Array:
	var world_id := String(_world.get("id", _world_id))
	var out: Array = []
	for i in range(1, SaveGame.MANUAL_SLOTS_PER_WORLD + 1):
		var summary: Dictionary = SaveGame.slot_summary(SaveGame.manual_slot_id(world_id, i)) if _run else {"empty": true}
		out.append({"index": i, "savedAt": String(summary.get("savedAt", "")) if not bool(summary.get("empty", true)) else ""})
	return out

func _service_ctx() -> Dictionary:
	return {
		"state": state(),
		"world": _world,
		"engine": engine(),
		"event_text": _event_text,
		"dispatch": func(command): _dispatch_service_command(command),
		"manual_slots": _manual_slots(),
		"save_manual": func(index): _save_manual(int(index)),
		"close": func(): _close_service(),
		"selected_member": func(): return selected_member(),
		# Keep party inspection separate from the shared service-selection callback: roster selection retains
		# its current row, while shop/workshop/career selections retain their own intended focus.
		"set_selected": func(id): _select_party_member(String(id), false),
		"select_party_member": func(id): _select_party_member(String(id), true),
		"focus_selected": func(id): _select_party_member(String(id), true),
		"party_focus_member_id": _party_focus_member_id,
		"career_preview": _career_preview,
		"set_career_preview": func(id): _career_preview = String(id); _rebuild(),
		"focus_hint": func(control): _pending_focus = control,
		"shop_category": _shop_category,
		"set_shop_category": func(cat): _shop_category = String(cat); _rebuild(),
		"shop_item_id": _shop_item_id,
		"set_shop_item": func(id): _shop_item_id = String(id); _rebuild(),
		"shop_mode": _shop_mode,
		"set_shop_mode": func(m): _shop_mode = String(m); _rebuild(),
		"loot_filter": _loot_filter,
		"set_loot_filter": func(f): _loot_filter = String(f); _rebuild(),
		"party_page": _party_page,
		"set_party_page": func(page): _party_page = String(page); _party_technique_id = ""; _party_item_target_id = ""; _party_discard = false; _rebuild(),
		"party_technique_id": _party_technique_id,
		"set_party_technique": func(id): _party_technique_id = String(id); _rebuild(),
		"party_item": _party_item,
		"set_party_item": func(key): _party_item = String(key); _party_item_target_id = ""; _party_discard = false; _rebuild(),
		"party_item_target_id": _party_item_target_id,
		"set_party_item_target": func(id): _party_item_target_id = String(id); _party_discard = false; _rebuild(),
		"party_equipment_slot": _party_equipment_slot,
		"set_party_equipment_slot": func(slot): _party_equipment_slot = String(slot); _party_equipment_candidate = ""; _rebuild(),
		"party_equipment_candidate": _party_equipment_candidate,
		"set_party_equipment_candidate": func(key): _party_equipment_candidate = String(key); _rebuild(),
		"open_equipment_item": func(item): _party_page = "equipment"; _party_equipment_slot = String(item.get("slot", "weapon")); _party_equipment_candidate = Fmt.equipment_selection_key(item); _party_discard = false; _rebuild(),
		"party_discard_pending": _party_discard,
		"set_party_discard": func(pending): _party_discard = bool(pending); _rebuild(),
		"loot_pending_bulk": _loot_pending,
		"set_loot_pending": func(p): _loot_pending = String(p); _rebuild()
	}

func _build_service() -> void:
	for child in _service_layer.get_children():
		child.queue_free()
	# A service still is only worth authoring when it survives the reading surface.  The forge's low-key
	# fire and anvil can show through the otherwise dark counter body; its rows/buttons remain opaque, so
	# controller focus and Japanese text contrast are unchanged.  Other services keep the shared opaque
	# counter treatment until they have an art-directed reason to differ.
	var blacksmith_backdrop := _service == "blacksmith"
	var scrim := ColorRect.new()
	# The town scene already has a 0.62 atmosphere scrim.  Stacking the normal service 0.78 scrim on
	# top would make a dedicated forge still mathematically invisible, so only this service uses a light
	# second veil.  The panel and row cards still supply the reading contrast.
	scrim.color = Color(0, 0, 0, 0.18 if blacksmith_backdrop else 0.78)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.add_child(scrim)

	# Fit the counter to the AVAILABLE viewport, not to a list's arbitrary 300–460px minimum. Content-height
	# panels made long services look like a narrow strip floating over a useless dark lower half; this gives
	# their scrollers room while preserving the 40px safety margin at every window height (#40i).
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.offset_top = 40
	center.offset_bottom = -40
	_service_layer.add_child(center)
	var panel := PanelContainer.new()
	var panel_bg := Color("14180f66") if blacksmith_backdrop else UI.PANEL_BG
	panel.add_theme_stylebox_override("panel", UI.panel_style(panel_bg, UI.GOLD))
	panel.custom_minimum_size = Vector2(1740, maxf(0.0, get_viewport_rect().size.y - 80.0))
	center.add_child(panel)

	var ctx := _service_ctx()
	var body: Control = null
	match _service:
		"recovery": body = RecoveryPanel.build(ctx)
		"shop": body = ShopPanel.build(ctx)
		"loot": body = LootPanel.build(ctx)
		"workshop": body = WorkshopPanel.build(ctx)
		"blacksmith": body = BlacksmithPanel.build(ctx)
		"quests": body = QuestPanel.build(ctx)
		"facility": body = FacilityPanel.build(ctx)
		"career": body = CareerPanel.build(ctx)
		"records": body = RecordsPanel.build(ctx)
		"party", "guild": body = PartyPanel.build(ctx)
	_party_focus_member_id = ""
	if body == null:
		body = UI.label("(未実装)", 18, UI.DIM)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.add_child(body)
	_service_layer.visible = true

# Cancel resolves one step back, always: counter -> services -> square.
func _unhandled_input(event: InputEvent) -> void:
	# The dedicated menu key (Tab) opens the town menu from the root and closes it if open. The top-right
	# メニュー button was the ONLY way in and it is not in the controller focus ring, so a keyboard/controller
	# player at the town root could not reach the settings at all (playtest 2026-08-03「街でメニュー開けない」).
	if event.is_action_pressed("menu"):
		if _menu_open:
			_close_menu()
		elif _service == "" and _location == "":
			_open_menu()
		get_viewport().set_input_as_handled()
		return
	if not event.is_action_pressed("cancel"):
		return
	if _menu_open:
		_close_menu()
		get_viewport().set_input_as_handled()
	elif _service != "":
		if _service == "loot" and _loot_pending != "":
			_loot_pending = ""
			_rebuild()
		elif _back_from_party_equipment():
			pass
		else:
			_close_service()
		get_viewport().set_input_as_handled()
	elif _location != "":
		_go_location("")
		get_viewport().set_input_as_handled()
	else:
		# Town ROOT: cancel opens the PARTY menu (隊列メニュー) — the same 迷宮メニュー the dungeon's cancel opens,
		# NOT the settings overlay (playtest 2026-08-03「Escで開きたいのは迷宮メニュー、右上の設定ではない」). Settings
		# stay on the dedicated menu key (Tab) and the top-right button; cancel now mirrors the crawl.
		_open_service("party")
		get_viewport().set_input_as_handled()

# The town portals into this world's dungeons (T30/U5). A world with no authored `entrances` has exactly
# one — its startRoom — so the town shows a single button. Mirrors scenario.ts resolveEntrances.
func _entrances() -> Array:
	var authored: Array = _world.get("entrances", [])
	if authored.is_empty():
		return [{"id": "main", "startRoom": String(_world.get("startRoom", ""))}]
	return authored

func _entrance_label(entrance: Dictionary) -> String:
	var locales: Dictionary = entrance.get("locales", {})
	var loc: Dictionary = locales.get(I18n.locale(), {}) if typeof(locales) == TYPE_DICTIONARY else {}
	return String(loc.get("label", entrance.get("label", I18n.t("play.enterDungeon"))))

func _on_descend(entrance_room: String = "") -> void:
	# Remember what the party carries DOWN, so the return ledger can show what it actually brought back
	# (playtest #3: an untouched starting potion was reported as "持ち帰った物").
	if _run:
		_run.loot_baseline = _inventory_counts(state())
		# T30/U5: the chosen portal, honoured by dungeon_entry.plan for the fresh landing (default = the
		# world's start room). Cleared once consumed so a later re-descend does not reuse it.
		_run.set("pending_entrance_room", entrance_room)
		# COUNT THE DESCENT. In the rules this lives in the enter_dungeon command (expeditions += 1), but the
		# Godot descent enters the dungeon scene directly (dungeon_entry.plan) and bypasses that command, so
		# expeditions never advanced — town then greeted a returning party with "初めて潜る前に" forever
		# (playtest). Once the party has been below, first_departure is false.
		_run.state["expeditions"] = int(_run.state.get("expeditions", 0)) + 1
	get_tree().change_scene_to_file("res://scenes/dungeon.tscn")

## Rest points the party has actually WALKED to (port of listUnlockedCheckpoints) — never a floor they
## have only heard of.
func _unlocked_checkpoints(s: Dictionary) -> Array:
	var visited: Array = (s.get("map", {}) as Dictionary).get("visitedRooms", [])
	var out := []
	for dungeon in _world.get("dungeons", []):
		for room in dungeon.get("rooms", []):
			if not bool(room.get("restPoint", false)) or not visited.has(room.get("id", "")):
				continue
			var locales: Variant = room.get("locales", {})
			var ja: Dictionary = (locales as Dictionary).get("ja", {}) if typeof(locales) == TYPE_DICTIONARY else {}
			out.append({"roomId": String(room.get("id", "")), "name": String(ja.get("name", room.get("name", "")))})
	return out

func _dispatch_resume(room_id: String) -> void:
	if _run:
		_run.dispatch({"type": "resume_at_checkpoint", "roomId": room_id})
	if state().get("phase", "") == "dungeon":
		if _run:
			_run.loot_baseline = _inventory_counts(state())
		get_tree().change_scene_to_file("res://scenes/dungeon.tscn")

func _texture(path: String) -> Texture2D:
	return WorldResources.texture(path)   # export-safe load lives in WorldResources (IMP-053)

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
		"equipment_forged": return I18n.t("events.equipmentForged", {"name": String(event.get("characterName", "")), "item": String(event.get("itemName", "")), "plus": int(event.get("plus", 0)), "cost": int(event.get("cost", 0))})
		"bulk_converted": return I18n.t("loot.convertible", {"count": int(event.get("count", 0)), "gold": int(event.get("gold", 0)), "materials": int(event.get("materials", 0))})
		"quest_accepted": return "%s ・ %s" % [String(event.get("questName", "")), I18n.t("questBoard.accept")]
		"quest_claimed": return "%s ・ %s" % [String(event.get("questName", "")), I18n.t("questBoard.claim")]
		"vocation_changed": return I18n.t("career.changeTo", {"vocation": String(event.get("vocationName", ""))})
	return ""
