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

## One enemy group's mark (IMP-057 stage rework, playtest 2026-07-31). A pack of N is drawn as N BODIES
## grounded on a common floor line — never one sprite with a "×N" beside it — so the fight reads like modern
## DRPGs and honours the Wiz-style model: units fall one at a time (a body vanishes as `count` drops) and the
## FRONT unit is the one being chipped (`hpEach`), the rest still full. The creature is the ONLY representation
## (no framed box, no name/HP CARD); selection is a soft floor glow + arrow, not a hard rectangle. `hp`/`max_hp`
## are the pooled totals the caller already had; per-unit HP is read off the group. `host` is unused now (the
## looping reticle tween is gone) but kept so the call site and the geometry gate need no change.
## size_scale (default 1.0) scales the creature by its data size class (small/medium/large), tuned in DATA.
static func enemy_mark(host: Node, group: Dictionary, centre_x: float, slot_w: float, stage_rect: Rect2, selected: bool, enemy_tex: Texture2D, name_ja: String, hp: int, max_hp: int, size_scale: float = 1.0) -> Control:
	var alive := maxi(0, int(group.get("count", 0)))
	var dead := alive <= 0
	var hp_each := int(group.get("hpEach", hp))
	var max_hp_each := maxi(1, int(group.get("maxHpEach", maxi(1, hp_each))))

	# The mark spans the whole slot; its meta lets the IMP-024 geometry gate find the rect it must keep off
	# the HUD. The slot already sits inside the HUD-clearing band, so the full-width mark still clears it.
	var mark := Control.new()
	mark.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mark.set_meta("enemy_mark", true)
	mark.position = Vector2(centre_x - slot_w / 2.0, stage_rect.position.y)
	mark.size = Vector2(slot_w, stage_rect.size.y)

	# Bodies: draw the LIVING units so the pack visibly shrinks as they fall (a wiped group keeps one faded
	# body until the stage rebuilds). Cap how many stand abreast — a broad rank overlaps into a mass. A lone
	# enemy is drawn LARGE and central (the choice-A "creatures are the screen"); a big pack shrinks so it fits.
	var bodies := 1 if dead else mini(maxi(alive, 1), 5)
	var shrink := 1.0
	if bodies >= 5: shrink = 0.6
	elif bodies >= 3: shrink = 0.74
	elif bodies == 2: shrink = 0.9
	var floor_y := stage_rect.size.y * 0.74          # the common floor line the feet stand on
	var body_h := minf(stage_rect.size.y * 0.76, 410.0) * clampf(size_scale, 0.6, 1.7) * shrink
	body_h = minf(body_h, floor_y - 8.0)             # never let the tallest body clip off the stage top
	var body_w := body_h * 0.9
	var step := 0.0
	if bodies > 1:
		step = minf(body_w * 0.68, (slot_w - body_w) / float(bodies - 1))
	var rank_w := body_w + step * float(bodies - 1)
	var start_x := slot_w / 2.0 - rank_w / 2.0

	# Selection is marked by the ▼ arrow (below) plus a warm brightening of the group's own bodies — NOT a
	# full-width glow band. The old band spanned the whole rank and read as a second horizontal bar competing
	# with the HP bars beneath it (playtest 2026-08-06: 敵HPバーの見た目が乱雑). The creature is the target; light
	# it, don't underline it.
	var body_tint := Color(1.16, 1.10, 0.92) if (selected and not dead) else Color(1, 1, 1, 1)

	# Back-to-front: add rear bodies first so the front (index 0, the chipped unit) overlaps on top.
	for i in range(bodies - 1, -1, -1):
		var bx := start_x + step * float(i)
		var depth := 1.0 - 0.06 * float(i)          # rear ranks a touch smaller/higher for depth
		var bh := body_h * depth
		var bw := body_w * depth
		var body := TextureRect.new()
		body.texture = enemy_tex
		body.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		body.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		body.size = Vector2(bw, bh)
		body.position = Vector2(bx + (body_w - bw) / 2.0, floor_y - bh - 8.0 * float(i))
		body.modulate = Color(1, 1, 1, 0.26) if dead else body_tint
		mark.add_child(body)

		# Each living body carries its own thin HP cue: the front unit shows its real chipped HP, the rest
		# are full (the model damages the front first). No numbers, no ×N — the bodies ARE the count.
		if not dead:
			var unit_bar := ProgressBar.new()
			unit_bar.max_value = float(max_hp_each)
			unit_bar.value = float(max_hp_each) if i > 0 else clampf(float(hp_each), 0.0, float(max_hp_each))
			unit_bar.show_percentage = false
			# A plain ProgressBar renders as a near-invisible grey line on this dark stage, so an enemy's HP
			# looked like it never changed even as it drained (playtest 2026-08-06: 敵HPバーが減って見えない).
			# Give it a VISIBLE crimson fill over a dark track — the party's own bars style theirs the same
			# way (combat_party_hud _raw_bar) — so the value it already carries reads as a draining bar.
			var hp_fill := StyleBoxFlat.new()
			hp_fill.bg_color = Color("c2513f")
			hp_fill.set_corner_radius_all(2)
			var hp_bg := StyleBoxFlat.new()
			hp_bg.bg_color = Color("140f0b")
			hp_bg.set_corner_radius_all(2)
			unit_bar.add_theme_stylebox_override("fill", hp_fill)
			unit_bar.add_theme_stylebox_override("background", hp_bg)
			# Cap the bar to the unit SPACING, not just the body width: a tightly-packed rank has step < body,
			# so a fixed 120px bar under each unit overran the next unit's and the bars stacked into a smear
			# (playtest 2026-08-03: 戦闘時HPバーが重なる). Keep a 6px gap so adjacent bars never touch.
			var bar_w := minf(bw, 120.0)
			if bodies > 1:
				bar_w = clampf(step - 6.0, 22.0, bar_w)
			unit_bar.custom_minimum_size = Vector2(bar_w, 6)
			unit_bar.size = Vector2(bar_w, 6)
			# Sit the bar a touch below the feet line, clear of the selection glow that hugs the feet above it,
			# and centred under its own body so the pack reads as "one bar per creature", not scattered.
			unit_bar.position = Vector2(bx + (body_w - bar_w) / 2.0, floor_y + 8.0)
			mark.add_child(unit_bar)

	# The arrow rides above the selected rank (clamped onto the stage); the name sits once under the group,
	# small (not a card).
	if selected and not dead:
		var arrow := _label("▼", 30, GOLD)
		arrow.position = Vector2(slot_w / 2.0 - 13.0, maxf(4.0, floor_y - body_h - 38.0))
		mark.add_child(arrow)

	var name_label := _label(name_ja, 20, GOLD if selected else INK)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.position = Vector2(0, floor_y + 14.0)
	name_label.size = Vector2(slot_w, 0)
	mark.add_child(name_label)
	return mark

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
