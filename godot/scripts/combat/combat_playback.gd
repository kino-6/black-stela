extends RefCounted
## IMP-052 — combat PLAYBACK flourishes, extracted from combat.gd. Purely presentational: a floating
## damage number and a 撃破 defeat mark, animated over the given layer. No combat state, no victory
## decision — it draws what the resolved round already decided. The scene passes the damage layer and the
## enemy-stage rect; the tween runs on that layer's tree.

const HURT := Color("d98a5a")
const GOLD := Color("c9a765")

## A damage number floating up over the enemy stage, then fading.
static func damage_number(damage_layer: CanvasItem, stage_rect: Rect2, amount: int) -> void:
	if amount <= 0:
		return
	var dmg := _label(str(amount), 56, HURT)
	dmg.position = stage_rect.position + Vector2(stage_rect.size.x / 2 - 20, 120)
	damage_layer.add_child(dmg)
	var tw := damage_layer.create_tween()
	tw.set_parallel(true)
	tw.tween_property(dmg, "position:y", dmg.position.y - 80, 0.6)
	tw.tween_property(dmg, "modulate:a", 0.0, 0.6).set_delay(0.2)
	tw.chain().tween_callback(dmg.queue_free)

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
