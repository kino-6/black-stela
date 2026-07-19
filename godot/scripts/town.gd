extends Control
## M3 TOWN hub — the preparation location the loop returns to (IMP-025's two-level diegetic hub). Level
## one is the grove/ash town: the party/purse read from the LIVE run state, six service destinations
## (each an NPC you walk up to), and the descent into the gate. Level two is each service as a FUNCTIONAL
## controller-first screen wired to the ported rules through Run.dispatch — the same rules the parity gate
## proves, so town play is oracle-faithful. Reads the shared Run autoload in continuous play, or the
## exploration fixture (forced to town phase) under the headless capture SceneTree.

const BG := Color("0b0d09")
const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const OK := Color("9db06a")
const BAD := Color("c96a5a")
const DIM := Color("9a927e")

# key → { ja, en, npc, greet }. The order is the hub focus ring.
const DESTINATIONS := [
	{"key": "guild", "ja": "冒険者ギルド", "en": "Guild Hall", "npc": "npc-guild-master",
		"greet": "灰の門は誰も待たん。隊列を整えてから潜れ。"},
	{"key": "market", "ja": "市場・工房", "en": "Market & Workshop", "npc": "npc-merchant",
		"greet": "松明も、塩の刃も揃っている。灰には塩がよく効く。"},
	{"key": "infirmary", "ja": "施療院", "en": "Infirmary", "npc": "npc-healer",
		"greet": "傷は灰の下では膿む。今のうちに癒しておきなさい。"},
	{"key": "quests", "ja": "依頼掲示板", "en": "Quest Board", "npc": "npc-archivist",
		"greet": "文書庫は残光の首に金を出す。受けていくといい。"},
	{"key": "career", "ja": "職能の間", "en": "Vocation Hall", "npc": "npc-guild-master",
		"greet": "極めた者だけが、次の道を選べる。"},
	{"key": "records", "ja": "記録の間", "en": "Records Hall", "npc": "npc-archivist",
		"greet": "潜った者の記録はここに。読んでから行け。"},
]

var _world: Dictionary = {}
var _run: Node = null
var _world_id: String = "default"
var _service_layer: Control = null
var _ring: Array = []            # focusable hub controls (restore focus after a service closes)
var _purse: Label = null
var _open_key: String = ""       # which service is open (for rebuild-after-dispatch)
var _member_idx: int = 0         # selected party member (market/career)
var _flash: Label = null         # last-action feedback line inside a service

# --- state access (LIVE via Run, or fixture fallback) ---------------------------------------------
func _state() -> Dictionary:
	if _run:
		return _run.state
	return _fallback_state

var _fallback_state: Dictionary = {}

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
		# The hub is a town location — a party that walked in from the dungeon returns to town phase.
		if _run.state.get("phase", "") != "town":
			_run.state["phase"] = "town"
	else:
		_fallback_state = (_read_json("res://data/traces/b1f-exploration.json").get("initialState", {}) as Dictionary).duplicate(true)
		_fallback_state["phase"] = "town"
		_world = _read_json("res://data/worlds/default.json").get("world", {})

func _dispatch(command: Dictionary) -> Array:
	if _run:
		return _run.dispatch(command)
	# Fallback path: resolve directly against the fixture state.
	var SliceRules := preload("res://scripts/rules/slice_rules.gd")
	var engine := _read_json("res://data/engine-data.json")
	var result: Dictionary = SliceRules.resolve(_fallback_state, command, _world, engine)
	_fallback_state = result.get("state", _fallback_state)
	return result.get("events", [])

func _asset(sub: String) -> String:
	return _run.asset_path(sub) if _run else "res://assets/worlds/%s/%s" % [_world_id, sub]

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(path))
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

# --- localization: authored ja name with an en fallback -------------------------------------------
func _loc_name(entry: Dictionary) -> String:
	var locales: Dictionary = entry.get("locales", {})
	var ja: Dictionary = locales.get("ja", {})
	return String(ja.get("name", entry.get("name", entry.get("id", "?"))))

# --- hub (level 1) --------------------------------------------------------------------------------
func _build() -> void:
	var bg := ColorRect.new()
	bg.color = BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var back := TextureRect.new()
	back.texture = _texture(_asset("ui/town-hub.jpg"))
	back.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	back.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	back.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(back)
	var scrim := ColorRect.new()
	scrim.color = Color(0.043, 0.051, 0.035, 0.55)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(scrim)

	var header := VBoxContainer.new()
	header.position = Vector2(64, 48)
	add_child(header)
	header.add_child(_label("拠点  —  %s" % _world.get("title", "Black Stela"), 40, GOLD))
	header.add_child(_label(_world.get("tagline", "潜る前に、ここで備えよ。"), 18, DIM))

	_purse = _label("", 20, INK)
	_purse.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	_purse.offset_left = -560
	_purse.offset_right = -64
	_purse.offset_top = 60
	_purse.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(_purse)
	_refresh_purse()

	var grid := GridContainer.new()
	grid.columns = 6
	grid.add_theme_constant_override("h_separation", 18)
	grid.position = Vector2(64, 340)
	add_child(grid)
	var first: Button = null
	for dest in DESTINATIONS:
		var card := _destination_card(dest)
		grid.add_child(card)
		_ring.append(card)
		if first == null:
			first = card

	var descend := Button.new()
	descend.text = "▶  地下へ潜る   —   ダンジョンへ"
	descend.custom_minimum_size = Vector2(560, 64)
	descend.add_theme_font_size_override("font_size", 26)
	descend.position = Vector2(64, 780)
	descend.add_theme_color_override("font_color", GOLD)
	descend.pressed.connect(_on_descend)
	add_child(descend)
	_ring.append(descend)

	_service_layer = Control.new()
	_service_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.visible = false
	add_child(_service_layer)

	if first:
		first.grab_focus()

func _refresh_purse() -> void:
	if _purse == null:
		return
	var s := _state()
	_purse.text = "パーティ %d名   ・   所持金 %d G   ・   素材 %d" % [
		s.get("party", []).size(), int(s.get("partyGold", 0)), int(s.get("materials", 0))]

func _destination_card(dest: Dictionary) -> Button:
	var card := Button.new()
	card.custom_minimum_size = Vector2(196, 360)
	card.pressed.connect(_open_service.bind(dest["key"]))
	card.add_theme_stylebox_override("normal", _panel_style(Color("11140dcc"), Color("3a4326")))
	card.add_theme_stylebox_override("hover", _panel_style(Color("1c2314e0"), GOLD))
	card.add_theme_stylebox_override("focus", _panel_style(Color("22301aef"), GOLD))
	card.add_theme_stylebox_override("pressed", _panel_style(Color("22301aef"), GOLD))
	var v := VBoxContainer.new()
	v.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	v.add_theme_constant_override("separation", 6)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(v)
	var portrait := TextureRect.new()
	portrait.texture = _texture(_asset("npc/%s.png" % dest["npc"]))
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.custom_minimum_size = Vector2(180, 260)
	portrait.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(portrait)
	v.add_child(_centered(_label(dest["ja"], 20, GOLD)))
	v.add_child(_centered(_label(dest["en"], 12, DIM)))
	return card

# --- service frame (level 2) ----------------------------------------------------------------------
func _open_service(key: String) -> void:
	_open_key = key
	_rebuild_service()
	_service_layer.visible = true

func _dest_of(key: String) -> Dictionary:
	for d in DESTINATIONS:
		if d["key"] == key:
			return d
	return {}

# Rebuild the open service panel in place (called after every dispatch so the screen reflects new state).
func _rebuild_service() -> void:
	for child in _service_layer.get_children():
		child.queue_free()
	var scrim := ColorRect.new()
	scrim.color = Color(0, 0, 0, 0.72)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_service_layer.add_child(scrim)

	var dest := _dest_of(_open_key)
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(1200, 820)
	panel.position = Vector2(size.x / 2 - 600, size.y / 2 - 410)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("14180ff9"), GOLD))
	_service_layer.add_child(panel)

	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 12)
	panel.add_child(root)

	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 16)
	root.add_child(head)
	head.add_child(_label(dest.get("ja", "サービス"), 30, GOLD))
	head.add_child(_label(dest.get("en", ""), 16, DIM))
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(spacer)
	_flash = _label("", 18, OK)
	head.add_child(_flash)

	root.add_child(_hsep())

	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", 8)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(body)

	match _open_key:
		"infirmary": _svc_infirmary(body)
		"market": _svc_market(body)
		"quests": _svc_quests(body)
		"career": _svc_career(body)
		"records": _svc_records(body)
		"guild": _svc_guild(body)

	root.add_child(_hsep())
	var close := Button.new()
	close.text = "戻る  ✕   (Esc)"
	close.custom_minimum_size = Vector2(220, 48)
	close.add_theme_font_size_override("font_size", 18)
	close.pressed.connect(_close_service)
	root.add_child(close)

	# Focus the first focusable body control, else the close button.
	var target := _first_focusable(body)
	if target:
		target.call_deferred("grab_focus")
	else:
		close.call_deferred("grab_focus")

func _after_dispatch(events: Array) -> void:
	_refresh_purse()
	_rebuild_service()
	if _flash and not events.is_empty():
		_flash.text = _describe(events[events.size() - 1])

func _close_service() -> void:
	_service_layer.visible = false
	_open_key = ""
	for i in DESTINATIONS.size():
		if i < _ring.size():
			(_ring[i] as Control).grab_focus()
			return

# --- INFIRMARY: recover_party ---------------------------------------------------------------------
func _svc_infirmary(body: VBoxContainer) -> void:
	body.add_child(_label("傷を癒し、負傷を解く。回復費はHP不足と負傷の数で決まる。", 16, DIM))
	var s := _state()
	var any_hurt := false
	for m in s.get("party", []):
		var line := _label("%s   HP %d/%d   MP %d/%d%s" % [
			m.get("name", "?"), int(m.get("hp", 0)), int(m.get("maxHp", 0)),
			int(m.get("mp", 0)), int(m.get("maxMp", 0)),
			("   [負傷: %s]" % m.get("injury")) if m.get("injury", null) != null else ""], 18,
			BAD if (int(m.get("hp", 0)) < int(m.get("maxHp", 0)) or m.get("injury", null) != null) else INK)
		body.add_child(line)
		if int(m.get("hp", 0)) < int(m.get("maxHp", 0)) or m.get("injury", null) != null:
			any_hurt = true
	body.add_child(_gap(12))
	var heal := _action_button("パーティを回復する", func(): _after_dispatch(_dispatch({"type": "recover_party"})))
	heal.disabled = not any_hurt
	body.add_child(heal)

# --- MARKET & WORKSHOP: buy / sell / equip / discard / appraise / lock / reinforce / bulk ----------
func _svc_market(body: VBoxContainer) -> void:
	body.add_child(_member_strip("装備先"))
	var cols := HBoxContainer.new()
	cols.add_theme_constant_override("separation", 24)
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(cols)

	# left: shop stock (buy)
	var left := VBoxContainer.new()
	left.add_theme_constant_override("separation", 4)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(left)
	left.add_child(_label("― 店の品 ―", 18, GOLD))
	var s := _state()
	var shops: Array = _world.get("shops", [])
	for shop in shops:
		for stock in shop.get("stock", []):
			if not _stock_available(stock, s):
				continue
			var item := _catalog_item(stock.get("itemId", ""))
			if item.is_empty():
				continue
			var price := int(stock.get("price", 0))
			var afford := int(s.get("partyGold", 0)) >= price
			var row := _row()
			row.add_child(_grow(_label("%s   %d G" % [_loc_name(item), price], 16, INK if afford else DIM)))
			var buy := _mini_button("購入", func(): _after_dispatch(_dispatch({"type": "buy_item", "shopId": shop.get("id", ""), "itemId": stock.get("itemId", "")})))
			buy.disabled = not afford
			row.add_child(buy)
			left.add_child(row)

	# right: inventory (sell / discard / equip / appraise / lock / favorite / reinforce)
	var right := VBoxContainer.new()
	right.add_theme_constant_override("separation", 4)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(right)
	right.add_child(_label("― 手持ち ―", 18, GOLD))
	var inv: Array = s.get("inventory", [])
	if inv.is_empty():
		right.add_child(_label("（手持ちなし）", 14, DIM))
	for item in inv:
		var row := _row()
		var tag := ""
		if item.get("locked", false): tag += " 🔒"
		if item.get("favorite", false): tag += " ★"
		if item.get("rarity", "common") != "common" and item.get("identified", true) == false: tag += " ?未鑑定"
		row.add_child(_grow(_label("%s ×%d%s" % [item.get("name", "?"), int(item.get("quantity", 1)), tag], 15, INK)))
		if item.get("kind", "") == "equipment":
			row.add_child(_mini_button("装備", func(): _equip_selected(item)))
		if item.get("rarity", "common") != "common" and item.get("identified", true) == false:
			row.add_child(_mini_button("鑑定", func(): _after_dispatch(_dispatch({"type": "appraise_item", "instanceId": item.get("instanceId", "")}))))
		if item.get("instanceId", null) != null:
			row.add_child(_mini_button("🔒" if not item.get("locked", false) else "解錠", func(): _after_dispatch(_dispatch({"type": "toggle_item_lock", "instanceId": item.get("instanceId", "")}))))
		row.add_child(_mini_button("売却", func(): _after_dispatch(_dispatch({"type": "sell_item", "itemId": item.get("id", ""), "plus": item.get("plus", null), "affix": item.get("affix", null)}))))
		right.add_child(row)

	right.add_child(_gap(6))
	var bulk := _row()
	bulk.add_child(_grow(_label("一括:", 15, DIM)))
	bulk.add_child(_mini_button("未保護を分解", func(): _after_dispatch(_dispatch({"type": "bulk_convert", "mode": "dismantle"}))))
	bulk.add_child(_mini_button("未保護を売却", func(): _after_dispatch(_dispatch({"type": "bulk_convert", "mode": "sell"}))))
	right.add_child(bulk)

	# workshop: reinforce each worn slot of the selected member
	var member := _selected_member()
	if not member.is_empty():
		right.add_child(_gap(8))
		right.add_child(_label("― 工房: %s の装備を強化 ―" % member.get("name", ""), 16, GOLD))
		var equipment: Dictionary = member.get("equipment", {})
		for slot in equipment:
			var eq: Variant = equipment[slot]
			if typeof(eq) != TYPE_DICTIONARY:
				continue
			var plus := int(eq.get("plus", 0))
			var cost := (plus + 1) * 2
			var row := _row()
			row.add_child(_grow(_label("%s  +%d  (素材 %d)" % [slot, plus, cost], 15, INK)))
			var rein := _mini_button("強化", func(): _after_dispatch(_dispatch({"type": "reinforce_equipment", "characterId": member.get("id", ""), "slot": slot})))
			rein.disabled = plus >= 5 or int(s.get("materials", 0)) < cost
			row.add_child(rein)
			right.add_child(row)

func _equip_selected(item: Dictionary) -> void:
	var member := _selected_member()
	if member.is_empty():
		return
	_after_dispatch(_dispatch({"type": "equip_item", "characterId": member.get("id", ""), "equipmentId": item.get("id", ""), "plus": item.get("plus", null), "affix": item.get("affix", null)}))

# --- QUEST BOARD: accept / claim ------------------------------------------------------------------
func _svc_quests(body: VBoxContainer) -> void:
	body.add_child(_label("依頼を受け、条件を満たして地上で報酬を受け取る。", 16, DIM))
	var s := _state()
	var progress := {}
	for p in s.get("quests", []):
		progress[p.get("questId", "")] = p
	var quests: Array = _world.get("quests", [])
	if quests.is_empty():
		body.add_child(_label("（依頼なし）", 14, DIM))
	for q in quests:
		var qid: String = q.get("id", "")
		var p: Variant = progress.get(qid, null)
		var reward: Dictionary = q.get("reward", {})
		var row := _row()
		var status := "未受注"
		if typeof(p) == TYPE_DICTIONARY:
			status = "受注中" if p.get("status", "") == "active" else "達成済"
		row.add_child(_grow(_label("%s   [%s]   報酬 %dG / %dxp" % [_loc_name(q), status, int(reward.get("gold", 0)), int(reward.get("xp", 0))], 15, INK)))
		if typeof(p) != TYPE_DICTIONARY:
			row.add_child(_mini_button("受注", func(): _after_dispatch(_dispatch({"type": "accept_quest", "questId": qid}))))
		elif _quest_ready(s, q, p):
			row.add_child(_mini_button("報酬受取", func(): _after_dispatch(_dispatch({"type": "claim_quest", "questId": qid}))))
		body.add_child(row)

# --- VOCATION HALL: change_vocation ---------------------------------------------------------------
func _svc_career(body: VBoxContainer) -> void:
	body.add_child(_member_strip("対象"))
	var member := _selected_member()
	if member.is_empty():
		body.add_child(_label("（パーティに冒険者がいません）", 14, DIM))
		return
	var current: String = member.get("vocation", {}).get("current", member.get("classId", "")) if typeof(member.get("vocation", null)) == TYPE_DICTIONARY else member.get("classId", "")
	body.add_child(_label("%s   Lv.%d   現在の職能: %s" % [member.get("name", ""), int(member.get("level", 1)), current], 18, INK))
	body.add_child(_label("極めた前提職能と必要レベルを満たすと、上位職に就ける。", 14, DIM))
	body.add_child(_gap(6))
	# advanced vocations from the world (basics change via the guild reclass)
	for v in _world.get("vocations", []):
		var vid: String = v.get("id", "")
		var req: Dictionary = v.get("requires", {})
		var can := _can_adopt(member, v)
		var row := _row()
		var reqtxt := "Lv%d / 極: %s" % [int(req.get("minLevel", 1)), ",".join(PackedStringArray(req.get("mastered", [])))]
		row.add_child(_grow(_label("%s   (%s)" % [_loc_name(v), reqtxt], 15, INK if can else DIM)))
		if current == vid:
			row.add_child(_label("就任中", 14, OK))
		else:
			var b := _mini_button("就任", func(): _after_dispatch(_dispatch({"type": "change_vocation", "characterId": member.get("id", ""), "vocationId": vid})))
			b.disabled = not can
			row.add_child(b)
		body.add_child(row)

# --- RECORDS HALL: bestiary + roster snapshot (read-only projection) -------------------------------
func _svc_records(body: VBoxContainer) -> void:
	body.add_child(_label("この世界で見えている脅威と、隊列の記録。", 16, DIM))
	var s := _state()
	var cleared := {}
	for eid in s.get("floorClearedEnemies", []):
		cleared[eid] = true
	var cols := HBoxContainer.new()
	cols.add_theme_constant_override("separation", 24)
	cols.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(cols)
	var left := VBoxContainer.new()
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(left)
	left.add_child(_label("― 魔物誌 ―", 18, GOLD))
	for e in _world.get("enemies", []):
		var known := cleared.has(e.get("id", ""))
		left.add_child(_label("%s   %s" % [_loc_name(e), "討伐済" if known else "―"], 14, INK if known else DIM))
	var right := VBoxContainer.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols.add_child(right)
	right.add_child(_label("― 隊列 ―", 18, GOLD))
	for m in s.get("party", []):
		right.add_child(_label("%s   Lv.%d   %s列" % [m.get("name", "?"), int(m.get("level", 1)), "前" if m.get("row", "front") == "front" else "後"], 14, INK))

# --- GUILD HALL: roster (rows / bench / reclass) --------------------------------------------------
func _svc_guild(body: VBoxContainer) -> void:
	body.add_child(_label("隊列を組み、控えとの入れ替えや再訓練を行う。新規登録はギルド受付から。", 15, DIM))
	var s := _state()
	body.add_child(_label("― 出撃メンバー ―", 18, GOLD))
	for m in s.get("party", []):
		var row := _row()
		row.add_child(_grow(_label("%s   Lv.%d   %s列" % [m.get("name", "?"), int(m.get("level", 1)), "前" if m.get("row", "front") == "front" else "後"], 15, INK)))
		var to_row := "back" if m.get("row", "front") == "front" else "front"
		row.add_child(_mini_button("前後入替", func(): _after_dispatch(_dispatch({"type": "set_member_row", "characterId": m.get("id", ""), "row": to_row}))))
		row.add_child(_mini_button("控えへ", func(): _after_dispatch(_dispatch({"type": "bench_member", "characterId": m.get("id", "")}))))
		body.add_child(row)
	body.add_child(_gap(6))
	body.add_child(_label("― 控え ―", 18, GOLD))
	var reserve: Array = s.get("reserve", [])
	if reserve.is_empty():
		body.add_child(_label("（控えなし）", 14, DIM))
	for m in reserve:
		var row := _row()
		row.add_child(_grow(_label("%s   Lv.%d" % [m.get("name", "?"), int(m.get("level", 1))], 15, INK)))
		row.add_child(_mini_button("出撃へ", func(): _after_dispatch(_dispatch({"type": "recall_member", "characterId": m.get("id", "")}))))
		body.add_child(row)
	body.add_child(_gap(8))
	var reg := _action_button("＋ 新しい冒険者を登録（ギルド受付）", func(): get_tree().change_scene_to_file("res://scenes/guild.tscn"))
	body.add_child(reg)

# --- member selector strip (market / career) ------------------------------------------------------
func _member_strip(label: String) -> Control:
	var s := _state()
	var party: Array = s.get("party", [])
	if party.is_empty():
		return _label("（パーティに冒険者がいません）", 14, DIM)
	_member_idx = clampi(_member_idx, 0, party.size() - 1)
	var row := _row()
	row.add_child(_label("%s:" % label, 15, DIM))
	var prev := _mini_button("◀", func(): _cycle_member(-1))
	row.add_child(prev)
	var m: Dictionary = party[_member_idx]
	row.add_child(_grow(_centered(_label("%s  (Lv.%d %s)" % [m.get("name", "?"), int(m.get("level", 1)), m.get("classId", "")], 16, GOLD))))
	row.add_child(_mini_button("▶", func(): _cycle_member(1)))
	return row

func _cycle_member(delta: int) -> void:
	var party: Array = _state().get("party", [])
	if party.is_empty():
		return
	_member_idx = (_member_idx + delta + party.size()) % party.size()
	_rebuild_service()

func _selected_member() -> Dictionary:
	var party: Array = _state().get("party", [])
	if party.is_empty():
		return {}
	_member_idx = clampi(_member_idx, 0, party.size() - 1)
	return party[_member_idx]

# --- rule mirrors (read-only gates for enabling buttons) ------------------------------------------
func _stock_available(stock: Dictionary, s: Dictionary) -> bool:
	if stock.get("availability", "") == "unlocked" and stock.get("unlockFlag", null) != null:
		return s.get("discoveredSecrets", []).has(stock.get("unlockFlag"))
	return stock.get("availability", "") != "unlocked"

func _catalog_item(item_id: String) -> Dictionary:
	for it in _world.get("items", []):
		if it.get("id", "") == item_id:
			return it
	for eq in _world.get("equipment", []):
		if eq.get("id", "") == item_id:
			return eq
	return {}

func _quest_ready(s: Dictionary, quest: Dictionary, progress: Dictionary) -> bool:
	if progress.get("status", "") != "active":
		return false
	var count := 0
	if quest.get("kind", "") == "delivery" and typeof(quest.get("targetItemId", null)) == TYPE_STRING:
		for item in s.get("inventory", []):
			if item.get("id", "") == quest.get("targetItemId"):
				count += int(item.get("quantity", 0))
	else:
		count = int(progress.get("killCount", 0))
	return count >= int(quest.get("requiredCount", 1))

func _can_adopt(member: Dictionary, vocation: Dictionary) -> bool:
	var req: Dictionary = vocation.get("requires", {})
	if int(req.get("minLevel", 0)) > int(member.get("level", 1)):
		return false
	var mastery: Dictionary = member.get("vocation", {}).get("mastery", {}) if typeof(member.get("vocation", null)) == TYPE_DICTIONARY else {}
	for required in req.get("mastered", []):
		if int(mastery.get(required, 0)) < 5:
			return false
	return true

func _describe(event: Dictionary) -> String:
	match event.get("type", ""):
		"party_recovered": return "回復した（%d G）" % int(event.get("gold", 0))
		"recovery_blocked": return "所持金が足りない"
		"item_bought": return "%s を購入" % event.get("itemName", "")
		"item_sold": return "%s を売却" % event.get("itemName", "")
		"item_discarded": return "%s を処分" % event.get("itemName", "")
		"equipment_changed": return "装備を変更"
		"item_appraised": return "%s を鑑定" % event.get("itemName", "")
		"equipment_reinforced": return "%s を +%d に強化" % [event.get("itemName", ""), int(event.get("plus", 0))]
		"bulk_converted": return "%d 点を一括処理" % int(event.get("count", 0))
		"quest_accepted": return "依頼「%s」を受注" % event.get("questName", "")
		"quest_claimed": return "依頼「%s」達成 — %dG" % [event.get("questName", ""), int(event.get("gold", 0))]
		"vocation_changed": return "%s に就任" % event.get("vocationName", "")
		"party_member_benched": return "控えに回した"
		"party_member_recalled": return "出撃に戻した"
		"party_turned", "": return ""
	return ""

func _unhandled_input(event: InputEvent) -> void:
	if _service_layer and _service_layer.visible and event.is_action_pressed("cancel"):
		_close_service()
		get_viewport().set_input_as_handled()

func _on_descend() -> void:
	get_tree().change_scene_to_file("res://scenes/dungeon.tscn")

# --- widgets --------------------------------------------------------------------------------------
func _first_focusable(node: Node) -> Control:
	for child in node.get_children():
		if child is Button and not (child as Button).disabled:
			return child
		var deeper := _first_focusable(child)
		if deeper:
			return deeper
	return null

func _row() -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 8)
	return h

func _grow(control: Control) -> Control:
	control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return control

func _action_button(text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(420, 46)
	b.add_theme_font_size_override("font_size", 18)
	b.pressed.connect(cb)
	return b

func _mini_button(text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(96, 38)
	b.add_theme_font_size_override("font_size", 15)
	b.pressed.connect(cb)
	return b

func _centered(control: Control) -> Control:
	var c := CenterContainer.new()
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.add_child(control)
	return c

func _gap(px: int) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(0, px)
	return c

func _hsep() -> HSeparator:
	return HSeparator.new()

func _texture(path: String) -> Texture2D:
	var img := Image.load_from_file(path)
	return ImageTexture.create_from_image(img) if img != null else null

func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _panel_style(bg: Color, border: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.set_content_margin_all(14)
	s.set_corner_radius_all(4)
	if border.a > 0:
		s.border_color = border
		s.set_border_width_all(2)
	return s
