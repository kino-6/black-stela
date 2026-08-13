extends SceneTree
## #30 scenario-authored premise — the "why do you descend" proclamation (Wizardry's castle notice). A
## world states its own via copy.town.premise and the town square must show it; a world that authors none
## shows no premise line (no bland default).

const UxFixture := preload("res://tests/ux_fixture.gd")

var _problems: Array[String] = []

func _initialize() -> void:
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for _frame in 8:
		await process_frame

	town.call("set_world_override", "terminal-line")
	var state := UxFixture.build({"partyGold": 300})
	state["phase"] = "town"
	town.call("set_state_override", state)
	for _frame in 6:
		await process_frame
	var text := _text_of(town)
	_check(text.contains("制御盤を握る"), "terminal-line square shows its authored proclamation")

	# The default world authors no premise → no premise line (and definitely not another world's).
	town.call("set_world_override", "default")
	var d := UxFixture.build({"partyGold": 300})
	d["phase"] = "town"
	town.call("set_state_override", d)
	for _frame in 6:
		await process_frame
	_check(not _text_of(town).contains("制御盤を握る"), "a world without an authored premise shows no proclamation")

	if _problems.is_empty():
		print("[town-premise] PASS — the scenario's proclamation reaches the town square")
		quit(0)
	else:
		for problem in _problems:
			push_error("[town-premise] %s" % problem)
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
