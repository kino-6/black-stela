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
const I18n := preload("res://scripts/i18n.gd")

var _failures := 0

## Every string the built screen is currently rendering — the gate reads what a PLAYER sees, rather
## than trusting the data it was built from.
func _all_text(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	elif node is RichTextLabel:
		out += (node as RichTextLabel).get_parsed_text() + "\n"
	for child in node.get_children():
		out += _all_text(child)
	return out

func _initialize() -> void:
	# A NEW game starts the guild with an empty roster (the scenario picker clears it); the guild no longer
	# wipes on _ready (that deleted everyone when you re-entered mid-registration). The gate establishes the
	# same clean precondition itself instead of relying on that destructive wipe.
	var run := get_root().get_node_or_null("Run")
	if run != null:
		run.ensure_loaded()
		run.state["party"] = []
		run.state["reserve"] = []

	var guild := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
	get_root().add_child(guild)
	for i in 8:
		await process_frame

	# The guild master's opening is spoken Japanese, not a procedure or faux-archaic
	# exposition. Read the rendered scene so the Godot port cannot drift from ja.ts.
	var briefing := _all_text(guild)
	var expected_briefing := "潜るなら、まずはギルドに名を連ねてもらう"
	if not briefing.contains(expected_briefing):
		_fail("briefing: the natural guild-master greeting is not rendered")
	# The greeting must NOT ask an out-of-place "what kind of adventurer do you want to be?" (playtest)
	# and must NOT bring back the old stiff copy.
	if briefing.contains("どんな冒険者になりたい") or briefing.contains("潜る気か") or briefing.contains("帳面にはそれから載せる"):
		_fail("briefing: removed guild-master copy returned to the screen")
	# "説明を聞かない" was a choice that chose nothing (same _goto), so it must be gone.
	if briefing.contains("説明を聞かない"):
		_fail("briefing: the meaningless 説明を聞かない choice is still shown")

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

	# 1b. §9.6 — THE CLASS PROMISE IS ON SCREEN. The step used to state what a calling WAS (row,
	#     aptitudes, starting gear) and never what it could DO. §10 asks for browser/screen evidence of a
	#     "visible class promise", not merely that a class id was stored — so this reads the rendered
	#     text and fails if the promise is missing, empty, or shows a raw technique id.
	guild.call("set_ui_state", {"step": "class"})
	for i in 4:
		await process_frame
	# Choosing a calling must change the recruit's preview figure. The origin portrait belongs to the
	# later 来歴 step; holding it here made every class look like the same recruit.
	guild.call("_select_class", "warrior")
	for i in 3:
		await process_frame
	var warrior_figure := String(guild.call("_preview_figure_path"))
	guild.call("_select_class", "knight")
	for i in 3:
		await process_frame
	var knight_figure := String(guild.call("_preview_figure_path"))
	if warrior_figure == knight_figure or not knight_figure.contains("adventurer-knight-base.png"):
		_fail("class preview: choosing a calling did not change to its class figure")

	# The class promise is written as player intent first, with the technique name only as a subtitle.
	# Exact unlock levels are rules data, but are not useful as a fixed shopping list during recruitment.
	var knight_copy := _all_text(guild)
	for promise in ["敵を攻撃", "自分の守りを上げる", "味方への攻撃を引き受ける"]:
		if not knight_copy.contains(promise):
			_fail("class promise: knight never explains %s" % promise)
	if knight_copy.contains("Lv"):
		_fail("class promise: fixed level labels leaked into recruitment")

	for class_id in ["warrior", "thief", "chanter"]:
		var draft: Dictionary = guild.get("_draft")
		draft["classId"] = class_id
		guild.set("_draft", draft)
		guild.call("_rebuild")
		for i in 3:
			await process_frame
		var shown := _all_text(guild)
		for label in [I18n.t("party.classPromiseNow"), I18n.t("party.classPromiseLater"), I18n.t("party.classPromiseWeakness")]:
			if not shown.contains(label):
				_fail("%s: the class step never shows %s" % [class_id, label])
		# A technique the player can read, not an id. `power-strike` on screen means the label map broke.
		if shown.contains("power-strike") or shown.contains("shield-splitter"):
			_fail("%s: a raw technique id reached the screen" % class_id)
		if shown.contains(I18n.t("party.classPromiseNone")):
			_fail("%s: a promise line rendered as empty — every class has a line since §9.4b" % class_id)
	# The Thief is the only class §4 trusts with exploration; it must SAY so.
	var thief_draft: Dictionary = guild.get("_draft")
	thief_draft["classId"] = "thief"
	guild.set("_draft", thief_draft)
	guild.call("_rebuild")
	for i in 3:
		await process_frame
	if not _all_text(guild).contains(I18n.t("party.classPromiseExploration")):
		_fail("the Thief's exploration specialism is not shown")
	print("[guild-controller] the class promise is legible: now / later / exploration / weakness")

	# 1c. §9.6's PROHIBITIONS, asserted rather than trusted: "Do not expose English aliases, raw tags,
	#     coverage scores, or a data-entry grid." A screenshot proves it on the day it is taken; this
	#     proves it every run, across every step of the ceremony.
	for step in STEPS:
		guild.call("set_ui_state", {"step": step})
		for i in 3:
			await process_frame
		var text := _all_text(guild)
		for alias in ["warrior", "knight", "swordmaster", "thief", "priest", "chanter", "mage", "occultist"]:
			if text.contains(alias):
				_fail("%s: the English class alias \"%s\" is on screen" % [step, alias])
		# Raw capability tags (equipmentProfile.tags) are authoring vocabulary, never player copy.
		for tag in ["front_line", "back_row", "blade", "focus", "mail", "tools"]:
			if text.contains(tag):
				_fail("%s: the raw tag \"%s\" is on screen" % [step, tag])
		# "Coverage" scoring — the roster grading §9.6 removed — must not come back in any form.
		for score in ["coverage", "カバー率", "編成スコア"]:
			if text.contains(score):
				_fail("%s: a coverage score is on screen (%s)" % [step, score])
	print("[guild-controller] no English aliases, raw tags or coverage scores on any step")

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

	# 3c. #5 — WHAT A POINT BUYS IS ON SCREEN. The bonus step used to be a bare ± grid; a spend was a blind
	#     guess. The effect line is now always shown, using the SAME words the 隊列 status page uses, so the
	#     two screens never drift. Read the rendered bonus step and fail if any aptitude's effect is missing.
	guild.call("set_ui_state", {"step": "bonus"})
	for i in 3:
		await process_frame
	var bonus_text := _all_text(guild)
	for apt in ["might", "agility", "spirit", "wit", "luck"]:
		var effect := I18n.t("partyMenu.aptitudeEffect.%s" % apt)
		if not bonus_text.contains(effect):
			_fail("bonus step: 素質 %s never explains its effect (\"%s\")" % [apt, effect])
	print("[guild-controller] every 素質 states its effect on the bonus step (#5)")

	# 3d. #7 — EACH IDENTITY FIELD RE-ROLLS ON ITS OWN. The single 名を見繕う used to change all three at
	#     once; now name / title / notes each have their own 見繕う. Re-rolling one must leave the other two
	#     exactly as the player left them, or the "lazy" bulk button is effectively back.
	guild.call("set_ui_state", {"step": "name"})
	for i in 3:
		await process_frame
	for field in ["name", "title", "notes"]:
		var d0: Dictionary = guild.get("_draft")
		var before_fields := {"name": String(d0.get("name", "")), "title": String(d0.get("title", "")), "notes": String(d0.get("notes", ""))}
		guild.call("_reroll_field", field)
		for i in 3:
			await process_frame
		var d1: Dictionary = guild.get("_draft")
		if String(d1.get(field, "")) == before_fields[field]:
			_fail("identity: 見繕う on %s did not change it" % field)
		for other in ["name", "title", "notes"]:
			if other != field and String(d1.get(other, "")) != before_fields[other]:
				_fail("identity: 見繕う on %s also changed %s (fields are not independent)" % [field, other])
	print("[guild-controller] name / title / notes each re-roll independently (#7)")

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

	# 3e. #6 — 顔 / 来歴 / 気質 EACH RE-ROLL ON THEIR OWN. A face is not a property of the origin: dealing a
	#     fresh face must not rewrite the 来歴 or 気質, and picking a new 来歴 must leave the face alone. The
	#     appearance step used to carry ONE 来歴+気質 reroll and no face reroll at all.
	for facet in [["face", "portraitKey"], ["background", "backgroundId"], ["trait", "traitId"]]:
		var field := String(facet[0])
		var key := String(facet[1])
		var d0: Dictionary = guild.get("_draft")
		var before_apt := {"portraitKey": String(d0.get("portraitKey", "")), "backgroundId": String(d0.get("backgroundId", "")), "traitId": String(d0.get("traitId", ""))}
		guild.call("_reroll_appearance", field)
		for i in 3:
			await process_frame
		var d1: Dictionary = guild.get("_draft")
		if String(d1.get(key, "")) == before_apt[key]:
			_fail("appearance: 見繕う on %s did not change it" % field)
		for other in ["portraitKey", "backgroundId", "traitId"]:
			if other != key and String(d1.get(other, "")) != before_apt[other]:
				_fail("appearance: 見繕う on %s also changed %s (facets are not independent)" % [field, other])
	print("[guild-controller] 顔 / 来歴 / 気質 each re-roll independently (#6)")

	# 4. The whole flow mints the adventurer the player built.
	guild.call("_select_class", "priest")
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

	# BLOCKER (playtest): the 覚え書き is the one multi-line field on this screen. A controller that lands
	# in it can't get out — arrows only move the caret. The screen must SPELL OUT a Start-role SUBMIT key,
	# and that key must commit registration even while the field holds focus. Prove both.
	if not _all_text(guild).contains(I18n.t("party.submitHint")):
		_fail("name step: the SUBMIT key is not documented on-screen (a controller in 覚え書き is stranded)")
	# Let the step's own deferred focus settle before we hijack the cursor into the trap field.
	for i in 4:
		await process_frame
	var notes_field := _find_textedit(guild)
	if notes_field == null:
		_fail("name step: the 覚え書き field is missing")
	else:
		# grab_focus is synchronous; fire SUBMIT on the SAME step so the deferred step-focus cannot steal
		# it back first. The caret is genuinely trapped in the multi-line field when submit fires.
		notes_field.grab_focus()
		if _focused() != notes_field:
			_fail("name step: could not place the cursor inside the 覚え書き field")
		_fire_action(guild, "submit")
	for i in 4:
		await process_frame
	if guild.call("_party").size() != 1:
		_fail("name step: SUBMIT did not register from inside the 覚え書き field — the controller trap is still live")

	var party: Array = guild.call("_party")
	if party.size() != 1:
		_fail("register: party holds %d member(s), expected 1" % party.size())
	else:
		var member: Dictionary = party[0]
		if String(member.get("classId", "")) != "priest":
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

	# REGRESSION (playtest): re-entering the guild with an existing roster must KEEP it, not wipe it.
	# guild.gd used to start_guild() on every _ready, deleting everyone made so far.
	if run != null:
		run.state["party"] = [{"id": "kept", "name": "既存兵", "classId": "warrior", "row": "front", "hp": 10, "maxHp": 10}]
		run.state["reserve"] = []
		var reentry := (load("res://scenes/guild.tscn") as PackedScene).instantiate()
		get_root().add_child(reentry)
		for i in 8:
			await process_frame
		var kept: Array = run.state.get("party", [])
		if kept.size() != 1 or String((kept[0] as Dictionary).get("id", "")) != "kept":
			_fail("re-entering the guild wiped the existing roster (%d members) — start_guild must not run on _ready" % kept.size())
		reentry.queue_free()

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

## Drive a named action through the scene's _input (which runs before a focused field consumes the key).
func _fire_action(guild: Node, action: String) -> void:
	var event := InputEventAction.new()
	event.action = action
	event.pressed = true
	guild.call("_input", event)

func _find_textedit(node: Node) -> TextEdit:
	if node is TextEdit:
		return node
	for child in node.get_children():
		var found := _find_textedit(child)
		if found:
			return found
	return null

func _focused() -> Control:
	return get_root().gui_get_focus_owner()

func _fail(message: String) -> void:
	_failures += 1
	push_error("[guild-controller] %s" % message)
	print("[guild-controller] FAIL: %s" % message)
