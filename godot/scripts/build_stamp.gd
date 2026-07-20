extends CanvasLayer
## The build stamp, shown on every screen exactly as the React build shows it (App.tsx `build-stamp`):
## git short SHA (+ when the tree is dirty) and the build time, so it is obvious AT A GLANCE which build
## is on screen. The Godot port dropped it; a stamp that only exists in one runtime is worse than none,
## because a screenshot then cannot be tied to a build.
##
## Mounted from boot as an autoload-like layer, so no scene has to remember to add it.

const PATH := "res://data/build-stamp.json"

func _ready() -> void:
	layer = 127
	var stamp := "dev"
	if FileAccess.file_exists(PATH):
		var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(PATH))
		if typeof(parsed) == TYPE_DICTIONARY:
			stamp = String((parsed as Dictionary).get("build", "dev"))
	var label := Label.new()
	label.text = stamp
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", Color(0.60, 0.58, 0.52, 0.75))
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	label.offset_left = -260
	label.offset_top = -28
	label.offset_right = -12
	label.offset_bottom = -6
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_child(label)
