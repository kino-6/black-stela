extends SceneTree
## Capture the COMPARISON EVIDENCE the UX-parity gate requires: one screenshot per migrated screen in
## gates/ux-parity-manifest.json, written to the `evidence` path the manifest names. These are the shots
## a human puts beside the React panel to judge whether the port is faithful.
##
## MUST be run WITHOUT --headless (headless has no render viewport and every shot comes out null — that
## mistake is why an earlier M3 pass claimed screenshots were impossible):
##   godot --path godot/ --script res://tests/capture_ux_evidence.gd

const MANIFEST := "res://gates/ux-parity-manifest.json"

func _initialize() -> void:
	var manifest: Variant = JSON.parse_string(FileAccess.get_file_as_string(MANIFEST))
	if typeof(manifest) != TYPE_DICTIONARY:
		push_error("[ux-evidence] cannot load manifest")
		quit(1)
		return

	var written := 0
	for entry in manifest.get("screens", []):
		var id: String = entry.get("id", "?")
		var evidence: String = entry.get("evidence", "")
		if evidence == "":
			continue
		var packed: Variant = load(entry.get("scene", ""))
		if packed == null:
			push_error("[ux-evidence] %s: missing scene" % id)
			continue
		var root: Node = (packed as PackedScene).instantiate()
		get_root().add_child(root)
		for i in 8:
			await process_frame
		# same fixture + ui state the gate asserts against, so the shot IS the asserted screen
		var fixture: Dictionary = entry.get("fixture", {})
		if not fixture.is_empty() and root.has_method("set_state_override"):
			var base: Dictionary = (JSON.parse_string(FileAccess.get_file_as_string("res://data/traces/b1f-exploration.json")) as Dictionary).get("initialState", {})
			var patched: Dictionary = base.duplicate(true)
			patched["phase"] = "town"
			for k in fixture:
				patched[k] = fixture[k]
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
			for i in 6:
				await process_frame

		var ui_state: Dictionary = entry.get("uiState", {})
		if not ui_state.is_empty() and root.has_method("set_ui_state"):
			root.call("set_ui_state", ui_state)
			for i in 4:
				await process_frame

		var img := get_root().get_texture().get_image()
		if img == null:
			push_error("[ux-evidence] %s: NULL image — you are running with --headless; re-run without it" % id)
			root.queue_free()
			continue
		img.save_png("res://" + evidence)
		print("[ux-evidence] %s -> godot/%s (%dx%d)" % [id, evidence, img.get_width(), img.get_height()])
		written += 1

		root.queue_free()
		for i in 3:
			await process_frame

	print("[ux-evidence] wrote %d screenshot(s)" % written)
	quit(0)
