extends RefCounted
## IMP-052 — the combat PARTY-VITALS slot builder, extracted from combat.gd. A pure presentation
## collaborator: given one member (plus who is acting, their portrait, and their HP line) it returns the
## slot Control and the live-update refs {bar, label, mp}; the scene keeps the `_party_slots` cache and
## `_refresh_member` that drive the refs. No combat truth lives here (CombatRound stays the authority).

const I18n := preload("res://scripts/i18n.gd")

const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const BAD := Color("c96a5a")
const OK := Color("9db06a")

## Build one adventurer's vitals slot. Returns { control, bar, label, mp } — the scene stores bar/label/mp
## for _refresh_member. Portrait texture and the HP line are passed so this stays free of scene resolvers.
static func slot(member: Dictionary, acting_id: String, portrait_tex: Texture2D, hp_text: String) -> Dictionary:
	var max_hp: int = maxi(1, int(member.get("maxHp", 1)))
	var down: bool = member.get("injury", null) != null or int(member.get("hp", 0)) <= 0
	# A DOWNED member sits at hp:1 + injury; the gauge reads empty while wounded, not a sliver of health.
	var hp_now: int = 0 if member.get("injury", null) != null else int(member.get("hp", 0))
	var max_mp: int = int(member.get("maxMp", 0))
	var danger: bool = hp_now <= int(ceil(float(max_hp) * 0.35))
	var acting: bool = String(member.get("id", "")) == acting_id

	var box := PanelContainer.new()
	box.custom_minimum_size = Vector2(300, 132)
	box.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var border: Color = GOLD if acting else (BAD if down else Color("3a4326"))
	box.add_theme_stylebox_override("panel", _panel_style(Color("1c2013f0"), border))

	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	box.add_child(h)

	var frame := Control.new()
	frame.custom_minimum_size = Vector2(92, 112)
	frame.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	frame.clip_contents = true
	var portrait := TextureRect.new()
	portrait.texture = portrait_tex
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	portrait.modulate = Color(1, 1, 1, 0.45) if down else Color(1, 1, 1, 1)
	frame.add_child(portrait)
	h.add_child(frame)

	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 3)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(v)

	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 6)
	head.add_child(_label(String(member.get("name", "?")), 20, BAD if down else INK))
	if acting:
		head.add_child(_label("▶", 18, GOLD))
	v.add_child(head)

	var hp := _hp_gauge(hp_now, max_hp, BAD if danger else OK)
	v.add_child(hp["control"])
	var mp: ProgressBar = null
	if max_mp > 0:
		mp = _stat_gauge(float(int(member.get("mp", 0))) / float(max_mp), Color("6a86b0"))
		v.add_child(mp)

	var hp_label := _label(hp_text, 14, BAD if danger else INK)
	v.add_child(hp_label)

	var pips := HBoxContainer.new()
	pips.add_theme_constant_override("separation", 4)
	if member.get("injury", null) != null:
		pips.add_child(_pip(I18n.t("partyMenu.wounded"), BAD))
	for status in member.get("status", []):
		var key := "partyMenu.status.%s" % String(status)
		pips.add_child(_pip(I18n.t(key) if I18n.has(key) else String(status), GOLD if String(status) == "ward" else BAD))
	v.add_child(pips)

	# `bar`/`ghost` drive the animated drain (main fill + a trailing red "chip" that lags), `card` locates the
	# member on screen so a damage number can land over them, `max` scales the tween (values are raw HP now).
	return {"control": box, "bar": hp["main"], "ghost": hp["ghost"], "label": hp_label, "mp": mp, "card": box, "max": max_hp}

# A "juicy" HP gauge: the main fill drops immediately, a trailing red "chip" fill behind it lags a beat, so
# the amount JUST lost stays legible for a moment (the modern-RPG damage read — no screen shake/flash). Both
# are raw-HP ProgressBars (max_value = maxHp) so _refresh_member can set value = hp directly.
static func _hp_gauge(value: int, max_v: int, col: Color) -> Dictionary:
	var wrap := Control.new()
	wrap.custom_minimum_size = Vector2(180, 8)
	wrap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	# Ghost (behind): dark bg + a red "chip" fill that lags the main fill down.
	var ghost := _raw_bar(value, max_v, Color(0.74, 0.20, 0.16), Color(0.10, 0.10, 0.09, 0.95))
	ghost.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	wrap.add_child(ghost)
	# Main (on top): the colour fill over a TRANSPARENT bg, so the ghost's red chip shows through the gap.
	var main := _raw_bar(value, max_v, col, Color(0, 0, 0, 0))
	main.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	wrap.add_child(main)
	return {"control": wrap, "main": main, "ghost": ghost}

static func _raw_bar(value: int, max_v: int, fill_col: Color, bg_col: Color) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.max_value = maxi(1, max_v)
	bar.value = clampi(value, 0, maxi(1, max_v))
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(180, 8)
	var fill := StyleBoxFlat.new()
	fill.bg_color = fill_col
	fill.set_corner_radius_all(2)
	var bg := StyleBoxFlat.new()
	bg.bg_color = bg_col
	bg.set_corner_radius_all(2)
	bar.add_theme_stylebox_override("fill", fill)
	bar.add_theme_stylebox_override("background", bg)
	return bar

static func _stat_gauge(ratio: float, col: Color) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.max_value = 100
	bar.value = clampf(ratio, 0.0, 1.0) * 100.0
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(180, 7)
	var fill := StyleBoxFlat.new()
	fill.bg_color = col
	fill.set_corner_radius_all(2)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.10, 0.10, 0.09, 0.95)
	bg.set_corner_radius_all(2)
	bar.add_theme_stylebox_override("fill", fill)
	bar.add_theme_stylebox_override("background", bg)
	return bar

static func _pip(text: String, col: Color) -> Control:
	var p := PanelContainer.new()
	var style := _panel_style(Color(0.12, 0.11, 0.09, 0.9), col)
	style.set_content_margin_all(3)
	p.add_theme_stylebox_override("panel", style)
	p.add_child(_label(text, 12, col))
	return p

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
