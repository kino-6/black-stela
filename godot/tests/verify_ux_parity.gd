extends SceneTree
## THE UX-PARITY GATE — a migrated screen may not be called done, and its milestone may not be closed,
## without COMPARISON EVIDENCE against the React screen it replaces.
##
## Why this exists: M3's town services were declared done while they were bare button lists. AGENTS.md
## already forbade that ("Do not call town services done if they are just lists. Shops must show who can
## use equipment and what changes. Recovery must show cost, wounds, before/after, and insufficient-funds
## states.") — a written rule was not enough, so it is now mechanical.
##
## For every screen in gates/ux-parity-manifest.json this asserts BOTH:
##   1. INFORMATION PARITY — every i18n key the React panel renders also appears in the built Godot
##      screen, in the same words (resolved from data/i18n-ja.json, the same ja.ts React reads).
##   2. COMPARISON EVIDENCE — the screenshot artifact for the screen exists.
## A screen that fails either is reported; the run exits non-zero.
##
## Usage: godot --path godot/ --script res://tests/verify_ux_parity.gd
## (render is NOT required — this walks the Control tree, so it works with or without --headless.)

const MANIFEST := "res://gates/ux-parity-manifest.json"
const COPY := "res://data/i18n-ja.json"

func _initialize() -> void:
	var manifest: Variant = JSON.parse_string(FileAccess.get_file_as_string(MANIFEST))
	var copy: Variant = JSON.parse_string(FileAccess.get_file_as_string(COPY))
	if typeof(manifest) != TYPE_DICTIONARY or typeof(copy) != TYPE_DICTIONARY:
		push_error("[ux-parity] cannot load manifest or copy (run `npm run export:i18n`)")
		quit(1)
		return

	var failures := 0
	var screens: Array = manifest.get("screens", [])
	for entry in screens:
		failures += await _check_screen(entry, copy)

	# A player-facing scene that is not in the manifest is NOT passing — it is UNMEASURED, and claiming
	# it done is the exact failure this gate exists to stop. (The guild/result/title screens were built
	# before this gate existed and silently escaped it for three milestones.)
	failures += _check_coverage(manifest)

	print("")
	if failures == 0:
		print("[ux-parity] PASS — every migrated screen matches its React counterpart and has evidence")
		quit(0)
	else:
		print("[ux-parity] FAIL — %d problem(s). A milestone with UX-parity failures is NOT done." % failures)
		quit(1)

func _check_screen(entry: Dictionary, copy: Dictionary) -> int:
	var id: String = entry.get("id", "?")
	var failures := 0

	# A screen's contract is what the React panel can render ACROSS ITS STATES — React never shows all
	# of them at once either (the loot counter's entry stage and its confirm stage are exclusive). So the
	# gate drives every declared state and checks the UNION. Declaring a state is also how the failure /
	# confirm / empty surfaces get PROVEN to exist rather than assumed.
	var states: Array = entry.get("states", [])
	if states.is_empty():
		states = [{"fixture": entry.get("fixture", {}), "uiState": entry.get("uiState", {})}]

	var shown := ""
	for state in states:
		var text: Variant = await _text_for_state(entry, state)
		if typeof(text) != TYPE_STRING:
			print("[ux-parity] %s: could not build state" % id)
			return 1
		shown += String(text) + "\n"

	var missing: Array = []
	for key in entry.get("requiredKeys", []):
		var template: Variant = copy.get(key, null)
		if typeof(template) != TYPE_STRING:
			print("[ux-parity] %s: manifest key not in ja.ts: %s" % [id, key])
			failures += 1
			continue
		if not _shows(shown, String(template)):
			missing.append("%s (\"%s\")" % [key, template])

	var evidence: String = entry.get("evidence", "")
	var has_evidence := evidence != "" and FileAccess.file_exists("res://" + evidence)

	if missing.is_empty() and has_evidence:
		print("[ux-parity] %s: OK (%d keys over %d state(s), evidence present)" % [id, entry.get("requiredKeys", []).size(), states.size()])
		return failures

	print("[ux-parity] %s: FAIL  [React: %s]" % [id, entry.get("reactPanel", "?")])
	if not missing.is_empty():
		print("    missing information (%d of %d required, across %d state(s)):" % [missing.size(), entry.get("requiredKeys", []).size(), states.size()])
		for m in missing:
			print("      - %s" % m)
		failures += 1
	if not has_evidence:
		print("    missing comparison evidence: godot/%s (capture it, then compare against %s)" % [evidence, entry.get("reactPanel", "?")])
		failures += 1
	if entry.get("notes", "") != "":
		print("    contract: %s" % entry["notes"])
	return failures

# Build the screen in one declared state and return every piece of text it shows.
func _text_for_state(entry: Dictionary, state: Dictionary) -> Variant:
	var packed: Variant = load(entry.get("scene", ""))
	if packed == null:
		return null
	var root: Node = (packed as PackedScene).instantiate()
	get_root().add_child(root)
	for i in 8:
		await process_frame

	var world_id: String = entry.get("worldId", "")
	if world_id != "" and root.has_method("set_world_override"):
		root.call("set_world_override", world_id)
		for i in 3:
			await process_frame

	var fixture: Dictionary = state.get("fixture", {})
	if not fixture.is_empty() and root.has_method("set_state_override"):
		var base: Dictionary = (JSON.parse_string(FileAccess.get_file_as_string("res://data/traces/b1f-exploration.json")) as Dictionary).get("initialState", {})
		var patched: Dictionary = base.duplicate(true)
		patched["phase"] = "town"
		for key in fixture:
			patched[key] = fixture[key]
		if fixture.has("__afflictParty"):
			# Statuses and a wound, so the strip's pips are PROVEN to render rather than assumed.
			var afflicted := []
			var ailments := ["poison", "sleep", "fear", "silence", "ward"]
			var index := 0
			for member in patched.get("party", []):
				var m: Dictionary = member.duplicate(true)
				m["status"] = [ailments[index % ailments.size()]]
				if index == 0:
					m["injury"] = "wounded"
				afflicted.append(m)
				index += 1
			patched["party"] = afflicted
		if fixture.has("__wearNone"):
			var stripped := []
			for member in patched.get("party", []):
				var m: Dictionary = member.duplicate(true)
				m["equipment"] = {}
				stripped.append(m)
			patched["party"] = stripped
		if fixture.has("__wearMaxed"):
			# A piece already at the reinforce cap, so 鍛え切った is proven rather than assumed.
			var maxed := []
			for member in patched.get("party", []):
				var m: Dictionary = member.duplicate(true)
				m["equipment"] = {"weapon": {"id": "equip.militia-sabre", "plus": 5}}
				maxed.append(m)
			patched["party"] = maxed
		if fixture.has("__wearAll"):
			# The forge lists only the slots a member WEARS; kit one out so every slot label is proven.
			var kitted := []
			for member in patched.get("party", []):
				var m: Dictionary = member.duplicate(true)
				m["equipment"] = {
					"weapon": {"id": "equip.militia-sabre"}, "offhand": {"id": "equip.split-buckler"},
					"body": {"id": "equip.padded-jack"}, "head": {"id": "equip.iron-cap"},
					"hands": {"id": "equip.grip-gloves"}, "accessory": {"id": "equip.chalk-cord"}
				}
				kitted.append(m)
			patched["party"] = kitted
		if fixture.has("__woundParty"):
			var hurt := []
			for member in patched.get("party", []):
				var m: Dictionary = member.duplicate(true)
				m["hp"] = maxi(1, int(m.get("maxHp", 10)) - int(fixture["__woundParty"]))
				hurt.append(m)
			patched["party"] = hurt
		root.call("set_state_override", patched)
		for i in 4:
			await process_frame

	var service: String = entry.get("service", "")
	if service != "" and root.has_method("_open_service"):
		root.call("_open_service", service)
		for i in 4:
			await process_frame

	var ui_state: Dictionary = state.get("uiState", {})
	if not ui_state.is_empty() and root.has_method("set_ui_state"):
		root.call("set_ui_state", ui_state)
		for i in 4:
			await process_frame

	var text := _collect_text(root)
	root.queue_free()
	for i in 2:
		await process_frame
	return text

# Every scene under res://scenes/ must be measured, unless the manifest explicitly exempts it as a
# non-player transition (boot). Exemptions are DECLARED, never implicit.
func _check_coverage(manifest: Dictionary) -> int:
	var measured := {}
	for entry in manifest.get("screens", []):
		measured[String(entry.get("scene", ""))] = true
	var exempt := {}
	for scene in manifest.get("exemptScenes", []):
		exempt[String(scene)] = true

	var unmeasured := []
	var dir := DirAccess.open("res://scenes")
	if dir == null:
		return 0
	for file in dir.get_files():
		if not file.ends_with(".tscn"):
			continue
		var path := "res://scenes/%s" % file
		if not measured.has(path) and not exempt.has(path):
			unmeasured.append(path)

	if unmeasured.is_empty():
		return 0
	print("")
	print("[ux-parity] UNMEASURED SCREENS — present in the build but absent from the manifest:")
	for path in unmeasured:
		print("      - %s" % path)
	print("    A screen nobody measured is not a screen that passed. Add it to the manifest (with the")
	print("    React panel it replaces) or declare it in `exemptScenes` with a reason.")
	return unmeasured.size()

# A key is "shown" when every literal segment of its template (split on {vars}) appears on screen.
func _shows(shown: String, template: String) -> bool:
	for segment in _literal_segments(template):
		if not shown.contains(segment):
			return false
	return true

func _literal_segments(template: String) -> Array:
	var segments := []
	var current := ""
	var depth := 0
	for i in template.length():
		var ch := template[i]
		if ch == "{":
			depth += 1
			if current.strip_edges() != "":
				segments.append(current.strip_edges())
			current = ""
		elif ch == "}":
			depth = maxi(0, depth - 1)
		elif depth == 0:
			current += ch
	if current.strip_edges() != "":
		segments.append(current.strip_edges())
	return segments

# Every piece of text the player can actually read on this screen.
func _collect_text(node: Node) -> String:
	var out := ""
	if node is Label:
		out += (node as Label).text + "\n"
	elif node is Button:
		out += (node as Button).text + "\n"
	elif node is RichTextLabel:
		out += (node as RichTextLabel).get_parsed_text() + "\n"
	for child in node.get_children():
		out += _collect_text(child)
	return out
