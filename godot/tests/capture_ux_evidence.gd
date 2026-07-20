extends SceneTree
## Capture the COMPARISON EVIDENCE the UX-parity gate requires: one screenshot per migrated screen in
## gates/ux-parity-manifest.json, written to the `evidence` path the manifest names. These are the shots
## a human puts beside the React panel to judge whether the port is faithful.
##
## MUST be run WITHOUT --headless (headless has no render viewport and every shot comes out null — that
## mistake is why an earlier M3 pass claimed screenshots were impossible):
##   godot --path godot/ --script res://tests/capture_ux_evidence.gd

const UxFixture := preload("res://tests/ux_fixture.gd")
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
		var world_id: String = entry.get("worldId", "")
		if world_id != "" and root.has_method("set_world_override"):
			root.call("set_world_override", world_id)
			for i in 3:
				await process_frame

		# same fixture + ui state the gate asserts against, so the shot IS the asserted screen (both build
		# it through tests/ux_fixture.gd — this file used to know only __woundParty, so the evidence for an
		# afflicted party showed a healthy one).
		var fixture: Dictionary = entry.get("fixture", {})
		if not fixture.is_empty() and root.has_method("set_state_override"):
			root.call("set_state_override", UxFixture.build(fixture))
			for i in 4:
				await process_frame

		var service: String = entry.get("service", "")
		if service != "" and root.has_method("_open_service"):
			root.call("_open_service", service)
			for i in 6:
				await process_frame

		# A screen's contract is measured across its declared STATES, so the evidence has to cover them
		# too — one shot of the happy path is not evidence for the confirm / failure / opened states the
		# gate asserts. The first state keeps the manifest's filename; the rest get a suffix.
		var states: Array = entry.get("states", [])
		if states.is_empty():
			states = [{"uiState": entry.get("uiState", {})}]

		var index := 0
		for state in states:
			var ui_state: Dictionary = state.get("uiState", {})
			if not ui_state.is_empty() and root.has_method("set_ui_state"):
				root.call("set_ui_state", ui_state)
				for i in 4:
					await process_frame

			var img := get_root().get_texture().get_image()
			if img == null:
				push_error("[ux-evidence] %s: NULL image — you are running with --headless; re-run without it" % id)
				break
			var path := evidence if index == 0 else evidence.replace(".png", "--%d.png" % index)
			img.save_png("res://" + path)
			print("[ux-evidence] %s -> godot/%s (%dx%d)" % [id, path, img.get_width(), img.get_height()])
			written += 1
			index += 1

		root.queue_free()
		for i in 3:
			await process_frame

	print("[ux-evidence] wrote %d screenshot(s)" % written)
	quit(0)
