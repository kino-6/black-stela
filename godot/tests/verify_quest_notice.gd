extends SceneTree
## #29 quest discoverability — the board sat invisible behind the 記録の間 counter, so a party could
## descend for hours without noticing a bounty was on offer. The town square must surface it: a "contracts
## to take" line when quests are available, and a "rewards waiting" line when one is ready to claim.

const UxFixture := preload("res://tests/ux_fixture.gd")
const I18n := preload("res://scripts/i18n.gd")

var _problems: Array[String] = []

func _initialize() -> void:
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for _frame in 8:
		await process_frame
	town.call("set_world_override", "terminal-line")

	# Fresh party, nothing accepted → the square advertises the contracts on offer (terminal-line authors 2).
	var state := UxFixture.build({"partyGold": 300})
	state["phase"] = "town"
	state["quests"] = []
	town.call("set_state_override", state)
	for _frame in 6:
		await process_frame
	var text := _text_of(town)
	_check(text.contains("受注できる依頼が"), "square advertises available contracts when the board has some")

	# One bounty driven to ready → the square switches to the 'rewards waiting' prompt.
	var world: Dictionary = town.get("_world")
	var bounty_id := ""
	for q in world.get("quests", []):
		if String((q as Dictionary).get("kind", "")) == "bounty":
			bounty_id = String((q as Dictionary).get("id", ""))
			break
	if bounty_id == "":
		_check(false, "terminal-line authors a bounty quest to drive to ready")
	else:
		var ready_state := UxFixture.build({"partyGold": 300})
		ready_state["phase"] = "town"
		ready_state["quests"] = [{"questId": bounty_id, "status": "active", "killCount": 999, "claims": 0}]
		town.call("set_state_override", ready_state)
		for _frame in 6:
			await process_frame
		var ready_text := _text_of(town)
		_check(ready_text.contains("報酬を受け取れる"), "square prompts to claim a finished contract's reward")

	# A world with no quests shows neither line (no false nag).
	town.call("set_world_override", "default")
	var no_q := UxFixture.build({"partyGold": 300})
	no_q["phase"] = "town"
	town.call("set_state_override", no_q)
	for _frame in 6:
		await process_frame
	var default_world: Dictionary = town.get("_world")
	if (default_world.get("quests", []) as Array).is_empty():
		var dtext := _text_of(town)
		_check(not dtext.contains("受注できる依頼が") and not dtext.contains("報酬を受け取れる"), "a world without quests shows no quest notice")

	if _problems.is_empty():
		print("[quest-notice] PASS — the town square surfaces the quest board")
		quit(0)
	else:
		for problem in _problems:
			push_error("[quest-notice] %s" % problem)
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
