extends SceneTree
## Terminal Line has two authored market counters. The normal shop surface must merge them rather than
## silently hide the armory behind shops[0]. This is a rules-and-controller reachability proof; the paired
## capture_terminal_line_armory.gd is the visual review.

const UxFixture := preload("res://tests/ux_fixture.gd")

var _problems: Array[String] = []

func _initialize() -> void:
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for _frame in 8:
		await process_frame
	town.call("set_world_override", "terminal-line")
	var state := UxFixture.build({"partyGold": 600})
	state["discoveredSecrets"] = [
		"flag.tl3f.bypass-open", "flag.tl4f.sluice-open", "flag.tl5f.loading-open",
		"flag.tl6f.lift-online", "flag.tl7f.archive-open", "flag.tl8f.switch-open"
	]
	town.call("set_state_override", state)
	town.call("set_ui_state", {"service": "shop", "shop_mode": "buy", "shop_category": "weapon", "shop_item_id": "equip.tl-quarantine-62-dmr"})
	for _frame in 6:
		await process_frame
	var text := _text_of(town)
	for name in ["鉄雨74式自動小銃", "改札9型短機関銃", "水門12型散弾銃", "隔離62式指定射撃銃", "ホーム88式軽機関銃"]:
		_check(text.contains(name), "weapon catalog exposes %s" % name)
	_check(text.contains("装備できる:"), "selected firearm names compatible party members")
	var focus := get_root().gui_get_focus_owner()
	_check(focus != null and (focus as Control).is_visible_in_tree() and not (focus as Control).disabled, "market opens on a usable controller focus target")
	if _problems.is_empty():
		print("[terminal-line-armory] PASS — all firearm stock is reachable in the normal market")
		quit(0)
	else:
		for problem in _problems:
			push_error("[terminal-line-armory] %s" % problem)
		quit(1)

func _check(ok: bool, label: String) -> void:
	if not ok:
		_problems.append(label)

func _text_of(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	for child in node.get_children():
		out += _text_of(child)
	return out
