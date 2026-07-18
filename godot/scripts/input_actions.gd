extends Node
## Registers the DRPG named input actions in code, so the whole controller map lives in one readable
## place and stays in sync with the migration plan's named-action list. Built-in ui_* actions
## (accept / cancel / up / down / left / right) already exist for Control focus navigation.

const ACTIONS := {
	"move_forward": [KEY_W, KEY_UP],
	"move_back": [KEY_S, KEY_DOWN],
	"turn_left": [KEY_A, KEY_LEFT],
	"turn_right": [KEY_D, KEY_RIGHT],
	"sidestep_left": [KEY_Q],
	"sidestep_right": [KEY_E],
	"confirm": [KEY_ENTER, KEY_SPACE],
	"cancel": [KEY_ESCAPE],
	"menu": [KEY_TAB],
	"actor_prev": [KEY_BRACKETLEFT],
	"actor_next": [KEY_BRACKETRIGHT],
	"target_prev": [KEY_COMMA],
	"target_next": [KEY_PERIOD],
	"repeat": [KEY_R],
	"auto": [KEY_F],
	"auto_interrupt": [KEY_BACKSPACE],
}

func _ready() -> void:
	for action in ACTIONS:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for keycode in ACTIONS[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = keycode
			InputMap.action_add_event(action, ev)
