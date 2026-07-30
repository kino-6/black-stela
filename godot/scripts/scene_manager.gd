extends Node
## Navigation between the scene roots (Boot → Title → Town → Dungeon → Combat → Result → …). A thin
## wrapper over change_scene_to_file keeps a single seam for the transition/animation layer S4 adds.

const FADE_IN_SECONDS := 0.16
const FADE_OUT_SECONDS := 0.20
var _transitioning := false

func goto(scene_path: String) -> void:
	var err := get_tree().change_scene_to_file(scene_path)
	if err != OK:
		push_error("scene change failed (%d): %s" % [err, scene_path])

## The encounter handoff needs a readable beat, not the unexplained blank between two scene trees. The
## veil is deliberately BLACK at every alpha: full-screen white/high-luminance flashes are prohibited.
func fade_to_dark(scene_path: String) -> void:
	if _transitioning:
		return
	_transitioning = true
	var layer := CanvasLayer.new()
	layer.name = "DarkTransition"
	layer.layer = 100
	var veil := ColorRect.new()
	veil.name = "Veil"
	veil.color = Color(0, 0, 0, 0)
	veil.mouse_filter = Control.MOUSE_FILTER_STOP
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(veil)
	add_child(layer)
	await get_tree().process_frame
	var fade_in := create_tween()
	fade_in.tween_property(veil, "color:a", 1.0, FADE_IN_SECONDS)
	await fade_in.finished
	var err := get_tree().change_scene_to_file(scene_path)
	if err != OK:
		push_error("scene change failed (%d): %s" % [err, scene_path])
		layer.queue_free()
		_transitioning = false
		return
	# Combat waits one frame for its viewport layout before building, so hold the dark veil until its first
	# complete frame exists. This prevents the old one-frame void from bleeding through.
	await get_tree().process_frame
	await get_tree().process_frame
	var fade_out := create_tween()
	fade_out.tween_property(veil, "color:a", 0.0, FADE_OUT_SECONDS)
	await fade_out.finished
	layer.queue_free()
	_transitioning = false
