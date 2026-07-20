extends SceneTree
## Controller traversal gate for the GUILD registration flow (AGENTS.md: a player-facing screen is not
## done without evidence of controller operation; controller-first-ui: "every screen hands the cursor a
## place to land" and "Cancel means back one step").
##
## The UX-parity gate proves each step SAYS what the React step says. This proves the flow WORKS: that
## every step lands the cursor somewhere usable, that Cancel walks back exactly one step and stops at the
## briefing, that the bonus pool is really spendable and really blocks 登録 while points remain, and that
## walking the whole flow mints an adventurer carrying the choices that were made — not the defaults.
##
## Usage: godot --headless --path godot/ --script res://tests/verify_guild_controller.gd

const STEPS := ["briefing", "class", "appearance", "bonus", "name"]

var _failures := 0

func _initialize() -> void:
	var guild := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
	get_root().add_child(guild)
	for i in 8:
		await process_frame

	# 1. Every step hands the cursor a place to land, and never a disabled one.
	for step in STEPS:
		guild.call("set_ui_state", {"step": step})
		for i in 4:
			await process_frame
		var focused := _focused()
		if focused == null:
			_fail("%s: no focus surface — a controller is stuck on this step" % step)
		elif focused is Button and (focused as Button).disabled:
			_fail("%s: cursor landed on a DISABLED control" % step)
		else:
			print("[guild-controller] %s: cursor on %s" % [step, (focused as Button).text if focused is Button else focused.name])

	# 2. Cancel walks back one step at a time and STOPS at the briefing (there is nothing behind the
	#    guild but the title — a Cancel that fell through would drop the player out of the game).
	guild.call("set_ui_state", {"step": "name"})
	for i in 3:
		await process_frame
	for expected in ["bonus", "appearance", "class", "briefing", "briefing"]:
		_press_cancel(guild)
		for i in 3:
			await process_frame
		if String(guild.get("_step")) != expected:
			_fail("Cancel: expected %s, got %s" % [expected, guild.get("_step")])
	print("[guild-controller] Cancel walks back one step and stops at 説明")

	# 3. The bonus pool is real: points are spendable, 登録 refuses while any remain, and every spent
	#    point lands on the adventurer the preview promised.
	guild.call("set_ui_state", {"step": "bonus"})
	for i in 3:
		await process_frame
	var draft: Dictionary = guild.get("_draft")
	var pool := int(draft.get("bonusPool", 0))
	if pool < 4 or pool > 8:
		_fail("bonus pool %d is outside the 4-8 React rolls" % pool)
	if not _register_enabled(guild):
		print("[guild-controller] 登録 correctly refused with %d point(s) unspent" % pool)
	else:
		_fail("登録 was offered with %d point(s) still unspent" % pool)

	var before := int(_preview(guild).get("aptitude", {}).get("might", 0))
	for i in pool:
		guild.call("_adjust", "might", 1)
		await process_frame
	if int(guild.get("_draft").get("bonusAptitude", {}).get("might", 0)) != pool:
		_fail("spending: %d of %d points landed" % [int(guild.get("_draft").get("bonusAptitude", {}).get("might", 0)), pool])
	# One more must be refused — the pool is a budget, not a suggestion.
	guild.call("_adjust", "might", 1)
	await process_frame
	if int(guild.get("_draft").get("bonusAptitude", {}).get("might", 0)) != pool:
		_fail("spending: the pool let the player overspend")
	var after := int(_preview(guild).get("aptitude", {}).get("might", 0))
	if after != before + pool:
		_fail("the preview did not follow the spend: 筋力 %d -> %d (expected +%d)" % [before, after, pool])
	else:
		print("[guild-controller] %d point(s) spent; the preview followed (筋力 %d -> %d)" % [pool, before, after])

	# 3b. Every choice rebuilds the screen, so the cursor must come BACK to the control just used —
	#     otherwise adjusting 運 silently moves the cursor to 筋力 and the next press hits the wrong row.
	guild.call("_adjust", "might", -1)   # take one back, so there is a point to move
	for i in 3:
		await process_frame
	var reclaimed := _focused()
	if reclaimed == null or String(reclaimed.get_meta("focus_key", "")) != "bonus:-:might":
		_fail("reclaiming a point moved the cursor off 筋力 (landed on %s)" % ("nothing" if reclaimed == null else String(reclaimed.get_meta("focus_key", "?"))))
	guild.call("_adjust", "luck", 1)     # spend it elsewhere; that row's ＋ goes dead as the pool empties
	for i in 3:
		await process_frame
	var held := _focused()
	if held == null or String(held.get_meta("focus_key", "")) != "bonus:-:luck":
		_fail("the cursor left the row it was adjusting (landed on %s)" % ("nothing" if held == null else String(held.get_meta("focus_key", "?"))))
	else:
		print("[guild-controller] the cursor stayed on 運 after spending there")

	guild.call("set_ui_state", {"step": "appearance"})
	for i in 3:
		await process_frame
	guild.call("_select_trait", "lucky")
	for i in 3:
		await process_frame
	var chip := _focused()
	if chip == null or String(chip.get_meta("focus_key", "")) != "trait:lucky":
		_fail("choosing a 気質 threw the cursor off the 気質 row (landed on %s)" % ("nothing" if chip == null else String(chip.get_meta("focus_key", "?"))))
	else:
		print("[guild-controller] the cursor stayed on the 気質 just chosen")

	# 4. The whole flow mints the adventurer the player built.
	guild.call("_select_class", "mender")
	await process_frame
	guild.call("_select_background", "apothecary")
	await process_frame
	guild.call("_select_trait", "curious")
	await process_frame
	guild.call("_goto", "name")
	for i in 3:
		await process_frame
	if String(guild.get("_draft").get("name", "")) == "":
		_fail("name step: arrived with a blank name — the suggestion did not fill it")
	if not _register_enabled(guild):
		_fail("登録 still refused with the pool spent")
	guild.call("_register")
	for i in 4:
		await process_frame

	var party: Array = guild.call("_party")
	if party.size() != 1:
		_fail("register: party holds %d member(s), expected 1" % party.size())
	else:
		var member: Dictionary = party[0]
		if String(member.get("classId", "")) != "mender":
			_fail("register: the recruit is a %s, not the 癒し手 that was chosen" % member.get("classId", ""))
		if String(member.get("backgroundId", "")) != "apothecary":
			_fail("register: the chosen 来歴 was dropped (%s)" % member.get("backgroundId", ""))
		if String(member.get("row", "")) != "back":
			_fail("register: a 癒し手 landed in the %s row" % member.get("row", ""))
		if String(member.get("id", "")) == "":
			_fail("register: the recruit has no id")
		if String(member.get("notes", "")).strip_edges() == "":
			_fail("register: the recruit carries no 覚え書き")
		else:
			print("[guild-controller] registered %s (%s / %s), row %s" % [member.get("name", "?"), member.get("classId", ""), member.get("backgroundId", ""), member.get("row", "")])

	# A fresh draft for the next recruit — its own pool, nothing carried over.
	if int(guild.get("_draft").get("bonusAptitude", {}).get("might", 0)) != 0:
		_fail("register: the next recruit inherited the last one's spent points")

	print("")
	if _failures == 0:
		print("[guild-controller] PASS — the five registration steps are reachable, focusable, cancellable, and mint the adventurer that was built")
		quit(0)
	else:
		print("[guild-controller] FAIL — %d problem(s)" % _failures)
		quit(1)

func _preview(guild: Node) -> Dictionary:
	return guild.call("_build_character")

## Whether the name step is currently offering registration — read off the built screen, not a flag, so
## this asserts what the player can actually press.
func _register_enabled(guild: Node) -> bool:
	var step := String(guild.get("_step"))
	guild.call("set_ui_state", {"step": "name"})
	var found := _find_button(guild, "冒険者を登録")
	var enabled: bool = found != null and not found.disabled
	guild.call("set_ui_state", {"step": step})
	return enabled

func _find_button(node: Node, text: String) -> Button:
	if node is Button and (node as Button).text == text:
		return node
	for child in node.get_children():
		var found := _find_button(child, text)
		if found:
			return found
	return null

func _press_cancel(guild: Node) -> void:
	var event := InputEventAction.new()
	event.action = "cancel"
	event.pressed = true
	guild.call("_unhandled_input", event)

func _focused() -> Control:
	return get_root().gui_get_focus_owner()

func _fail(message: String) -> void:
	_failures += 1
	push_error("[guild-controller] %s" % message)
	print("[guild-controller] FAIL: %s" % message)
