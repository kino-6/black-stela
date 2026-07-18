extends Control
## A placeholder scene root for the S2 shell: it shows its title and advances to the next scene on
## "confirm" (Enter/Space) or back on "cancel" (Escape) — controller-only, no pointer. Real content
## lands per sprint (S4 builds the actual dungeon/combat/town UI). The @export fields wire the
## neighbours in each .tscn.

@export var scene_title: String = ""
@export var next_scene: String = ""
@export var prev_scene: String = ""

func _ready() -> void:
	var label := get_node_or_null("Center/TitleLabel") as Label
	if label:
		label.text = scene_title
	print("[scene] %s" % scene_title)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("confirm") and next_scene != "":
		SceneManager.goto(next_scene)
	elif event.is_action_pressed("cancel") and prev_scene != "":
		SceneManager.goto(prev_scene)
