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
	"submit": [KEY_ENTER, KEY_KP_ENTER],   # a "Start"-role key: commits a form even from inside a text field (registration名前 step)
	"menu": [KEY_TAB],
	"status": [KEY_C],   # the party-status glance is global — the same key opens it in ANY scene (IMP-042)
	"full_map": [KEY_M],   # the floor map has a shortcut, not just a dock button
	"actor_prev": [KEY_BRACKETLEFT],
	"actor_next": [KEY_BRACKETRIGHT],
	"target_prev": [KEY_COMMA],
	"target_next": [KEY_PERIOD],
	"auto": [KEY_F],   # 全員でかかる — one all-out attack round
	"attack_auto": [KEY_R],   # 攻撃オート — auto-battle loop, attack-focus (repeat stays a button, matching React)
	"defense_auto": [KEY_G],   # 守備オート — auto-battle loop, ward/heal-focus
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
