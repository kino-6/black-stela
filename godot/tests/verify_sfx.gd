extends SceneTree
## The chiptune UI sound is synthesised (no asset) and presentation-only, so it sits outside parity/ux —
## this just proves the autoload synthesises its clips (a boot exercises the audio players separately).

const SfxScript := preload("res://scripts/sfx.gd")

func _initialize() -> void:
	var fail := 0
	var sfx: Object = SfxScript.new()
	sfx.build_clips()
	if sfx.clip_count() < 3:
		push_error("[sfx] FAIL: expected >=3 synthesised clips, got %d" % sfx.clip_count())
		fail += 1
	else:
		print("[sfx] ok: synthesises the confirm / cancel / move clips (%d)" % sfx.clip_count())
	# A muted play() and an unknown clip must both be safe no-ops.
	sfx.set_enabled(false)
	sfx.play("confirm")
	sfx.play("nope")
	print("[sfx] ok: muted play() and unknown clip are safe no-ops")
	print("[sfx] %s (%d failures)" % ["PASS" if fail == 0 else "FAIL", fail])
	quit(fail)
