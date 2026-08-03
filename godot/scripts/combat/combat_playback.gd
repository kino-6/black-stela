extends RefCounted
## IMP-052 — combat PLAYBACK flourishes, extracted from combat.gd. Purely presentational: a floating
## damage number and a 撃破 defeat mark, animated over the given layer. No combat state, no victory
## decision — it draws what the resolved round already decided. The scene passes the damage layer and the
## enemy-stage rect; the tween runs on that layer's tree.

const HURT := Color("f2b077")
const CRIT := Color("ffd76a")
const GOLD := Color("c9a765")
const OUTLINE := Color("1a120a")

## A juicy floating damage number (T19): a scale-POP on spawn (overshoot then settle), a rising arc with a
## little sideways drift, a dark outline so it reads on any creature, and a hotter/bigger CRIT variant with
## a "!". `x_frac` (0..1) places it horizontally over the STRUCK target so multi-target rounds land each
## number on its own creature (T15). Presentation only — the resolved round already decided the numbers.
static func damage_number(damage_layer: CanvasItem, stage_rect: Rect2, amount: int, x_frac: float = 0.5, is_crit: bool = false) -> void:
	# Legacy x_frac entry (kept for the fallback path). Prefer damage_number_at with the target's real
	# screen centre so the number lands ON the creature, not at a stage-fraction that ignores the HUD insets.
	var cx := stage_rect.position.x + clampf(x_frac, 0.05, 0.95) * stage_rect.size.x
	damage_number_at(damage_layer, Vector2(cx, stage_rect.position.y + 160), amount, is_crit)

## Land a number centred on `top_centre` (screen space). `colour` overrides the default hurt/crit tint (the
## party-counter numbers use a cooler ally tint). The struck target's real position comes from the caller.
static func damage_number_at(damage_layer: CanvasItem, top_centre: Vector2, amount: int, is_crit: bool = false, colour: Color = Color(0, 0, 0, 0)) -> void:
	if amount <= 0:
		return
	var size := 74 if is_crit else 54
	var tint := colour if colour.a > 0.0 else (CRIT if is_crit else HURT)
	# Same text convention as React's .hit-number (`-N`, crit adds `!`), so the two engines read identically.
	var dmg := _label(("-%d!" % amount) if is_crit else ("-%d" % amount), size, tint)
	dmg.add_theme_color_override("font_outline_color", OUTLINE)
	dmg.add_theme_constant_override("outline_size", 10 if is_crit else 8)
	dmg.pivot_offset = Vector2(size * 0.5, size * 0.6)
	var base_x := top_centre.x - size * 0.5
	dmg.position = Vector2(base_x, top_centre.y)
	dmg.scale = Vector2(0.4, 0.4)
	damage_layer.add_child(dmg)
	var drift := (18.0 if int(base_x) % 2 == 0 else -18.0)  # a small deterministic sideways arc
	var tw := damage_layer.create_tween()
	# POP: overshoot then settle (the "juice").
	tw.tween_property(dmg, "scale", Vector2(1.18, 1.18) if is_crit else Vector2(1.1, 1.1), 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(dmg, "scale", Vector2.ONE, 0.08)
	# RISE + drift + ease-out fade, in parallel.
	tw.set_parallel(true)
	tw.tween_property(dmg, "position:y", dmg.position.y - 96, 0.62).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(dmg, "position:x", dmg.position.x + drift, 0.62)
	tw.tween_property(dmg, "modulate:a", 0.0, 0.5).set_delay(0.34)
	tw.set_parallel(false)
	tw.tween_callback(dmg.queue_free)

## The 撃破 defeat flourish over the enemy stage.
static func defeat_flourish(damage_layer: CanvasItem, stage_rect: Rect2) -> void:
	var mark := _label("撃破", 44, GOLD)
	mark.position = stage_rect.position + Vector2(stage_rect.size.x / 2 - 44, 200)
	damage_layer.add_child(mark)
	var tw := damage_layer.create_tween()
	tw.tween_property(mark, "modulate:a", 0.0, 0.9).set_delay(0.4)
	tw.tween_callback(mark.queue_free)

static func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	return l
