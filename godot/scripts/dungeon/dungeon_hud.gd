extends RefCounted
## IMP-051 — the dungeon party-rail token builder, extracted from dungeon.gd. A pure presentation
## collaborator: member (+ world for effective stats, and the portrait) → the rail card Control. No state
## mutation, no dispatch. The scene owns `_party_hud` and rebuilds the rail from these tokens.

const UIKit := preload("res://scripts/town/ui_kit.gd")
const I18n := preload("res://scripts/i18n.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")

const GOLD := Color("c9a765")
const INK := Color("e6e2d4")
const DIM := Color("9a927e")
const BAD := Color("c96a5a")
const OK := Color("9db06a")

## One adventurer's rail card: portrait, row, name/level, HP·MP, gauges, the judged combat numbers, and
## the conditions the player must act on.
## `class_label` is optional: the crawl HUD leaves it empty (row + name is enough mid-move), the town square
## passes the 職業 so the party can be planned by calling at a glance. Same card either way.
static func party_token(member: Dictionary, world: Dictionary, portrait_tex: Texture2D, class_label: String = "", facility_hp_pct: int = 0) -> Control:
	var stats: Dictionary = CharacterStats.effective(member, world, [], facility_hp_pct)
	var max_hp: int = maxi(1, int(stats.get("maxHp", member.get("maxHp", 1))))
	# A DOWNED member is stored at hp:1 + injury; show 0 while wounded so it never reads as barely-alive.
	var down: bool = member.get("injury", null) != null or int(member.get("hp", 0)) <= 0
	var hp: int = 0 if member.get("injury", null) != null else int(member.get("hp", 0))
	var danger: bool = hp <= int(ceil(float(max_hp) * 0.35))

	var body := UIKit.col(2)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var head := UIKit.row()
	var portrait := TextureRect.new()
	portrait.texture = portrait_tex
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.custom_minimum_size = Vector2(48, 76)
	head.add_child(portrait)
	var row_text := I18n.t("play.frontRow" if String(member.get("row", "front")) == "front" else "play.backRow")
	head.add_child(UIKit.label(row_text if class_label == "" else "%s · %s" % [row_text, class_label], 12, DIM))
	head.add_child(UIKit.grow(UIKit.label(String(member.get("name", "?")), 17, BAD if down else INK)))
	head.add_child(UIKit.label("Lv %d" % int(member.get("level", 1)), 13, DIM))
	body.add_child(head)

	var vitals := UIKit.row()
	vitals.add_child(UIKit.label("HP %d/%d" % [hp, max_hp], 13, BAD if danger else INK))
	var max_mp := int(stats.get("maxMp", member.get("maxMp", 0)))
	if max_mp > 0:
		vitals.add_child(UIKit.label("%s %d/%d" % [I18n.t("play.mpShort"), int(member.get("mp", 0)), max_mp], 13, INK))
	body.add_child(vitals)
	body.add_child(_gauge(float(hp) / float(max_hp), BAD if danger else OK))
	if max_mp > 0:
		body.add_child(_gauge(float(int(member.get("mp", 0))) / float(max_mp), Color("6a86b0")))

	var numbers := UIKit.row()
	# (play.memberStatus was a screen-reader-only aria-label in the React HUD; ported here it rendered as a
	# meaningless visible caption in front of the stats, so it is dropped — the numbers speak for themselves.)
	# The compact token shows 攻撃 as ONE number — the typical (average) damage per hit — because a
	# min-max range on a stat-labelled line read as confusing (playtest 2026-08-13「攻撃6-12という表記がわからん」).
	# The full damage RANGE stays in the party-menu detail. The 動力炉 attack% is already baked into these.
	numbers.add_child(UIKit.label("%s %d" % [I18n.t("party.damage"), int(round((int(stats.get("damageMin", 0)) + int(stats.get("damageMax", 0))) / 2.0))], 13, DIM))
	numbers.add_child(UIKit.label("%s %d" % [I18n.t("party.armor"), int(stats.get("armor", 0))], 13, DIM))
	numbers.add_child(UIKit.label("%s %d" % [I18n.t("party.speed"), int(stats.get("speed", 0))], 13, DIM))
	body.add_child(numbers)

	var pips := []
	for status in member.get("status", []):
		if String(status) != "ward":
			pips.append(I18n.t("partyMenu.status.%s" % String(status)) if I18n.has("partyMenu.status.%s" % String(status)) else String(status))
	if member.get("injury", null) != null:
		pips.append(I18n.t("partyMenu.wounded"))
	if not pips.is_empty():
		body.add_child(UIKit.label(" · ".join(PackedStringArray(pips)), 13, BAD))

	var card := PanelContainer.new()
	# Six cards still fit between the current viewport margins and minimap at 1280px.  The extra width
	# buys readable vitals/stat numerals instead of a global UI scale-up that would displace the crawl HUD.
	card.custom_minimum_size = Vector2(136, 132)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var style := UIKit.panel_style(UIKit.ROW_BG, BAD if down else (GOLD if danger else Color("3a4326")))
	style.set_content_margin_all(6)
	card.add_theme_stylebox_override("panel", style)
	card.add_child(body)
	return card

static func _gauge(ratio: float, col: Color) -> Control:
	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(0, 4)
	bar.show_percentage = false
	bar.max_value = 100
	bar.value = clampf(ratio, 0.0, 1.0) * 100.0
	var fill := StyleBoxFlat.new()
	fill.bg_color = col
	fill.set_corner_radius_all(2)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.12, 0.12, 0.10, 0.9)
	bg.set_corner_radius_all(2)
	bar.add_theme_stylebox_override("fill", fill)
	bar.add_theme_stylebox_override("background", bg)
	return bar
