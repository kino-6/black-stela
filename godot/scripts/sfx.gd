extends Node
## FC/SFC-flavoured UI sound. Every clip is SYNTHESISED in code (square/pulse waves → AudioStreamWAV) so
## the game ships no audio asset and a chiptune blip is guaranteed to exist. Autoload `Sfx`; presentation
## only — it never touches rules, state, or the hash, so it is outside the parity/ux gates.
##
## Centralised so no screen wires its own audio: cursor movement rides the SceneTree's gui_focus_changed,
## 決定 rides `confirm`/ui_accept (only with a focused control — a real menu confirm), キャンセル rides
## `cancel`/ui_cancel. A real SE .wav can replace a clip later without moving these hooks.

const ConfigPanel := preload("res://scripts/config_panel.gd")
const RATE := 44100

var _players: Array[AudioStreamPlayer] = []
var _next := 0
var _enabled := true
var _clips := {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	# A tiny voice pool so a fast cursor doesn't hard-cut its own tick.
	for _i in 4:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		p.volume_db = -6.0
		add_child(p)
		_players.append(p)
	build_clips()
	_enabled = bool(ConfigPanel.load_settings().get("sfxEnabled", true))
	# gui_focus_changed lives on the Viewport (the cursor moving between controls), not the SceneTree.
	var vp := get_viewport()
	if vp != null and not vp.gui_focus_changed.is_connected(_on_focus_changed):
		vp.gui_focus_changed.connect(_on_focus_changed)

# Pulse-wave blips: thin tick for the cursor, a rising two-note 決定, a falling two-note キャンセル.
# Public + tree-free so a headless test can synthesise and inspect them without a running scene.
func build_clips() -> void:
	_clips["move"] = _make([[1046.5, 26.0]], 0.25, 0.26)
	_clips["confirm"] = _make([[784.0, 36.0], [1174.7, 70.0]], 0.5, 0.30)
	_clips["cancel"] = _make([[466.2, 40.0], [349.2, 78.0]], 0.5, 0.28)

func _on_focus_changed(_control: Control) -> void:
	play("move")

func _input(event: InputEvent) -> void:
	if event.is_echo():
		return
	if event.is_action_pressed("cancel") or event.is_action_pressed("ui_cancel"):
		play("cancel")
	elif event.is_action_pressed("confirm") or event.is_action_pressed("ui_accept"):
		# Only when a control is focused, so 決定 rings on a menu choice, not on every stray Enter.
		var vp := get_viewport()
		if vp != null and vp.gui_get_focus_owner() != null:
			play("confirm")

func play(clip_name: String) -> void:
	if not _enabled:
		return
	var clip: AudioStreamWAV = _clips.get(clip_name, null)
	if clip == null or _players.is_empty():
		return
	var p := _players[_next]
	_next = (_next + 1) % _players.size()
	p.stream = clip
	p.play()

## Live-toggle from the settings panel (see ConfigPanel._toggle).
func set_enabled(on: bool) -> void:
	_enabled = on

## Whether any clip synthesised — a test seam.
func clip_count() -> int:
	return _clips.size()

# Build one pulse-wave blip from [[freq_hz, ms], …] segments. Phase accumulates across segments so a note
# change never clicks; a 2ms attack + 8ms release keep the on/off edges soft.
func _make(segments: Array, duty: float, amp: float) -> AudioStreamWAV:
	var total_ms := 0.0
	for seg in segments:
		total_ms += float(seg[1])
	var n := int(RATE * total_ms / 1000.0)
	var data := PackedByteArray()
	data.resize(n * 2)
	var attack := maxi(1, int(RATE * 0.002))
	var release := maxi(1, int(RATE * 0.008))
	var seg_i := 0
	var seg_end := int(RATE * float(segments[0][1]) / 1000.0)
	var freq := float(segments[0][0])
	var phase := 0.0
	for i in n:
		while i >= seg_end and seg_i < segments.size() - 1:
			seg_i += 1
			seg_end += int(RATE * float(segments[seg_i][1]) / 1000.0)
			freq = float(segments[seg_i][0])
		phase = fmod(phase + freq / float(RATE), 1.0)
		var square := 1.0 if phase < duty else -1.0
		var env := 1.0
		if i < attack:
			env = float(i) / float(attack)
		elif i > n - release:
			env = float(n - i) / float(release)
		var sample := int(clampf(square * env * amp, -1.0, 1.0) * 32767.0)
		data.encode_s16(i * 2, sample)
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = RATE
	wav.stereo = false
	wav.data = data
	return wav
