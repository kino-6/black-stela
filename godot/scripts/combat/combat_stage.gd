extends RefCounted
## IMP-052 — the combat ENEMY STAGE builders, extracted from combat.gd: the palette-tinted backdrop, the
## acting-member figure, the placement band (IMP-024), and each enemy mark (art, reticle on the chosen
## creature, name / HP bar / count). Pure presentation — it returns Controls; the scene owns _stage_layer,
## the _enemy_marks cache, and the target selection. No combat truth lives here.

const UIKit := preload("res://scripts/town/ui_kit.gd")

const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const DIM := Color("9a927e")

## The band the creatures may occupy — the full stage inset on the right by the command panel and, when
## the spotlight is on, the left by the acting-member panel, so the HUD never hides a creature (IMP-024).
static func enemy_band(stage_rect: Rect2, spotlight_on: bool) -> Rect2:
	var right_inset: float = 520.0 + 28.0
	var left_inset: float = (272.0 + 44.0 + 24.0) if spotlight_on else 40.0
	var x := stage_rect.position.x + left_inset
	var w: float = maxf(120.0, stage_rect.size.x - left_inset - right_inset)
	return Rect2(x, stage_rect.position.y, w, stage_rect.size.y)

## The full-stage world vignette, tinted by the world palette (a Verdant pack reads canopy, ash reads
## ash), plus the fog shade. Returns [backdrop, shade] for the scene to add UNDER the creatures.
static func backdrop_nodes(stage_rect: Rect2, vignette: Texture2D, palette: Dictionary) -> Array:
	var backdrop := TextureRect.new()
	backdrop.texture = vignette
	backdrop.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	backdrop.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	backdrop.position = stage_rect.position
	backdrop.size = stage_rect.size
	var ambient := Color(String(palette.get("ambient", "#5f5548")))
	backdrop.modulate = ambient.lightened(0.22)
	var shade := ColorRect.new()
	var fog := Color(String(palette.get("fog", "#090906")))
	shade.color = Color(fog, 0.52)
	shade.position = stage_rect.position
	shade.size = stage_rect.size
	return [backdrop, shade]

## The acting member at hero scale on the left, during command select (IMP-014).
static func actor_figure(member: Dictionary, stage_rect: Rect2, portrait_tex: Texture2D) -> Control:
	var panel := PanelContainer.new()
	panel.set_meta("actor_panel", true)   # IMP-024 geometry gate
	panel.position = Vector2(44, stage_rect.position.y + 36)
	panel.size = Vector2(272, 420)
	panel.add_theme_stylebox_override("panel", _panel_style(Color("10150bd9"), GOLD))
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 2)
	panel.add_child(stack)
	var marker := _label("手番", 15, GOLD)
	marker.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stack.add_child(marker)
	var art := TextureRect.new()
	art.texture = portrait_tex
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	art.custom_minimum_size = Vector2(248, 320)
	stack.add_child(art)
	var name := _label(String(member.get("name", "?")), 24, INK)
	name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stack.add_child(name)
	var role := _label("次の行動を選ぶ", 15, DIM)
	role.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stack.add_child(role)
	return panel

## One enemy group's mark: its art, the reticle when it is the chosen target, and the name / HP bar /
## count caption. `host` is the scene (for the reticle pulse tween). Returns the mark; the scene caches it.
static func enemy_mark(host: Node, group: Dictionary, centre_x: float, slot_w: float, stage_rect: Rect2, selected: bool, enemy_tex: Texture2D, name_ja: String, hp: int, max_hp: int) -> Control:
	var dead := int(group.get("count", 0)) <= 0

	var mark := Control.new()
	mark.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mark.set_meta("enemy_mark", true)   # so the IMP-024 geometry gate can find every creature's rect
	var art_w: float = minf(slot_w * 0.9, 420.0)
	var art_h: float = minf(stage_rect.size.y * 0.74, 400.0)
	mark.position = Vector2(centre_x - art_w / 2.0, stage_rect.position.y)
	mark.size = Vector2(art_w, stage_rect.size.y)

	var art := TextureRect.new()
	art.texture = enemy_tex
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	art.size = Vector2(art_w, art_h)
	art.modulate = Color(1, 1, 1, 0.28) if dead else Color(1, 1, 1, 1)
	mark.add_child(art)

	if selected and not dead:
		var reticle := PanelContainer.new()
		var frame := StyleBoxFlat.new()
		frame.bg_color = Color(0, 0, 0, 0)
		frame.border_color = GOLD
		frame.set_border_width_all(3)
		frame.set_corner_radius_all(4)
		reticle.add_theme_stylebox_override("panel", frame)
		reticle.position = Vector2(-8, -8)
		reticle.size = Vector2(art_w + 16, art_h + 16)
		reticle.mouse_filter = Control.MOUSE_FILTER_IGNORE
		mark.add_child(reticle)
		var arrow := _label("▼", 32, GOLD)
		arrow.position = Vector2(art_w / 2.0 - 14, -40)
		mark.add_child(arrow)
		_reticle_pulse(host, reticle)

	var caption := UIKit.col(2)
	caption.position = Vector2(0, art_h + 6)
	caption.custom_minimum_size = Vector2(art_w, 0)
	var name_label := _label(name_ja, 22, GOLD if selected else INK)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.custom_minimum_size = Vector2(art_w, 0)
	caption.add_child(name_label)

	var bar := ProgressBar.new()
	bar.max_value = maxf(1.0, float(max_hp))
	bar.value = float(hp)
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(minf(art_w, 260.0), 8)
	caption.add_child(bar)

	var count_label := _label("×%d" % int(group.get("count", 0)), 16, DIM)
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	count_label.custom_minimum_size = Vector2(art_w, 0)
	caption.add_child(count_label)
	mark.add_child(caption)
	return mark

static func _reticle_pulse(_host: Node, node: Control) -> void:
	# A static gold frame is clearer than a fading one and, unlike the old unbounded Tween, cannot make
	# Godot 4.7 emit "Infinite loop detected" during normal play. The arrow and selected caption still make
	# the current target unambiguous without an animation that outlives the rebuilt stage.
	node.modulate.a = 1.0

static func _label(text: String, sz: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", sz)
	l.add_theme_color_override("font_color", col)
	return l

static func _panel_style(bg: Color, border: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.content_margin_left = 12
	s.content_margin_right = 12
	s.content_margin_top = 8
	s.content_margin_bottom = 8
	s.corner_radius_top_left = 4
	s.corner_radius_top_right = 4
	s.corner_radius_bottom_left = 4
	s.corner_radius_bottom_right = 4
	if border.a > 0:
		s.border_color = border
		s.set_border_width_all(1)
	return s
