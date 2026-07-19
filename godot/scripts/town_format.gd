extends RefCounted
## Port of the town presentation helpers React's screens use (src/ui/format.ts + src/ui/catalog.ts).
## These are what turn raw state into the DECISION MATERIAL a town service shows: what a piece does,
## who can wear it, what it would change, what a treatment costs. Ported so the Godot services can be
## faithful rather than approximate — a name+price list is a UX-parity gate failure.

const I18n := preload("res://scripts/i18n.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")
const Economy := preload("res://scripts/rules/economy.gd")

const EQUIPMENT_SLOT_ORDER := ["weapon", "offhand", "body", "head", "hands", "accessory"]
const SHOP_CATEGORY_ORDER := ["weapon", "armor", "offhand", "trinket", "tool", "consumable"]

# max(0, maxHp-hp) + 8 if injured — the per-member price the infirmary quotes.
static func member_recovery_cost(member: Dictionary) -> int:
	var missing := maxi(0, int(member.get("maxHp", 0)) - int(member.get("hp", 0)))
	return missing + (8 if member.get("injury", null) != null else 0)

static func party_recovery_cost(party: Array) -> int:
	var total := 0
	for m in party:
		total += member_recovery_cost(m)
	return total

static func format_signed_delta(label: String, value: int) -> String:
	if value == 0:
		return ""
	return "%s %s%d" % [label, "+" if value > 0 else "", value]

# "威力 +2 / 防御 -1", or 変化なし when nothing moves.
static func format_stat_delta(current: Dictionary, next: Dictionary) -> String:
	var parts := []
	for pair in [["town.effectAttack", "damageMax"], ["town.effectAccuracy", "accuracy"], ["town.effectDefense", "armor"], ["town.effectSpeed", "speed"]]:
		var text := format_signed_delta(I18n.t(pair[0]), int(next.get(pair[1], 0)) - int(current.get(pair[1], 0)))
		if text != "":
			parts.append(text)
	return " / ".join(PackedStringArray(parts)) if not parts.is_empty() else I18n.t("town.noStatChange")

static func format_signed_bonus(label: String, value: Variant) -> String:
	var v := int(value) if value != null else 0
	if v == 0:
		return ""
	return "%s %s%d" % [label, "+" if v > 0 else "", v]

static func format_bonus_parts(attack: Variant, defense: Variant, accuracy: Variant, speed: Variant) -> String:
	var parts := []
	for pair in [[I18n.t("town.effectAttack"), attack], [I18n.t("town.effectDefense"), defense], [I18n.t("town.effectAccuracy"), accuracy], [I18n.t("town.effectSpeed"), speed]]:
		var text := format_signed_bonus(pair[0], pair[1])
		if text != "":
			parts.append(text)
	return " / ".join(PackedStringArray(parts)) if not parts.is_empty() else I18n.t("aptitude.balanced")

static func format_equipment_effect(equipment: Dictionary) -> String:
	return format_bonus_parts(equipment.get("attackBonus", null), equipment.get("defenseBonus", null), equipment.get("accuracyBonus", null), equipment.get("speedBonus", null))

static func format_inventory_effect(item: Dictionary) -> String:
	return format_bonus_parts(item.get("attackBonus", null), item.get("defenseBonus", null), item.get("accuracyBonus", null), item.get("speedBonus", null))

static func format_equipment_slot(slot: String) -> String:
	return I18n.t("town.slots.%s" % slot)

# --- catalog naming (authored ja locale wins, then the base name) ---------------------------------
static func _catalog_entry(world: Dictionary, item_id: Variant) -> Dictionary:
	if typeof(item_id) != TYPE_STRING:
		return {}
	for it in world.get("items", []):
		if it.get("id", "") == item_id:
			return it
	for eq in world.get("equipment", []):
		if eq.get("id", "") == item_id:
			return eq
	return {}

static func localized_catalog_name(world: Dictionary, item_id: Variant) -> String:
	var entry := _catalog_entry(world, item_id)
	if entry.is_empty():
		return String(item_id) if typeof(item_id) == TYPE_STRING else "-"
	var ja: Dictionary = (entry.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("name", entry.get("name", entry.get("id", "-"))))

static func localized_catalog_description(world: Dictionary, item_id: Variant) -> String:
	var entry := _catalog_entry(world, item_id)
	if entry.is_empty():
		return ""
	var ja: Dictionary = (entry.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("description", entry.get("description", "")))

static func describe_equipment_instance(world: Dictionary, item_id: Variant, plus: Variant = null, affix: Variant = null) -> String:
	if typeof(item_id) != TYPE_STRING or item_id == "":
		return "-"
	var prefix := ""
	if typeof(affix) == TYPE_STRING and affix != "":
		prefix = "%s " % I18n.t("affix.%s" % affix)
	var suffix := ""
	if plus != null and int(plus) != 0:
		suffix = " +%d" % int(plus)
	return "%s%s%s" % [prefix, localized_catalog_name(world, item_id), suffix]

static func equipped_name(world: Dictionary, equipped: Variant) -> String:
	if typeof(equipped) != TYPE_DICTIONARY:
		return "-"
	return describe_equipment_instance(world, equipped.get("id", ""), equipped.get("plus", null), equipped.get("affix", null))

static func localized_shop_name(shop: Dictionary) -> String:
	var ja: Dictionary = (shop.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("name", shop.get("name", "")))

static func localized_quest_name(quest: Dictionary) -> String:
	var ja: Dictionary = (quest.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("name", quest.get("name", "")))

static func localized_quest_description(quest: Dictionary) -> String:
	var ja: Dictionary = (quest.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("description", quest.get("description", "")))

static func localized_vocation_name(world: Dictionary, vocation: Dictionary) -> String:
	var ja: Dictionary = (vocation.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("name", vocation.get("name", vocation.get("id", ""))))

static func localized_vocation_signature(world: Dictionary, vocation: Dictionary) -> String:
	var ja: Dictionary = (vocation.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("signature", vocation.get("signature", "")))

static func localized_enemy_name(world: Dictionary, enemy: Dictionary) -> String:
	var ja: Dictionary = (enemy.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("name", enemy.get("name", enemy.get("id", ""))))

# --- decision support -----------------------------------------------------------------------------
static func find_equipment(world: Dictionary, item_id: Variant) -> Variant:
	return Economy.find_equipment(world, String(item_id) if typeof(item_id) == TYPE_STRING else "")

static func is_usable_by(equipment: Dictionary, member: Dictionary) -> bool:
	return Economy.is_equipment_usable_by(equipment, member)

## Effective stats the member WOULD have with `equipment` in its slot — the shop's what-changes preview.
static func preview_equipment_stats(member: Dictionary, equipment: Dictionary, world: Dictionary) -> Dictionary:
	var hypothetical: Dictionary = member.duplicate(true)
	var slots: Dictionary = (hypothetical.get("equipment", {}) as Dictionary).duplicate(true)
	slots[String(equipment.get("slot", ""))] = {"id": equipment.get("id", "")}
	hypothetical["equipment"] = slots
	return CharacterStats.effective(hypothetical, world)

static func shop_category_for(world: Dictionary, item_id: String) -> String:
	var equipment: Variant = find_equipment(world, item_id)
	if typeof(equipment) == TYPE_DICTIONARY:
		match String(equipment.get("slot", "")):
			"weapon": return "weapon"
			"body": return "armor"
			"offhand": return "offhand"
			_: return "trinket"
	for it in world.get("items", []):
		if it.get("id", "") == item_id:
			var kind := String(it.get("kind", ""))
			return "consumable" if (kind == "healing" or kind == "escape") else "tool"
	return "tool"

static func is_equipped_by_party(party: Array, item: Dictionary) -> bool:
	var key := Economy.equipment_instance_key(item.get("id", ""), item.get("plus", null), item.get("affix", null))
	for member in party:
		for slot in (member.get("equipment", {}) as Dictionary):
			var eq: Variant = member["equipment"][slot]
			if typeof(eq) == TYPE_DICTIONARY and Economy.equipment_instance_key(eq.get("id", ""), eq.get("plus", null), eq.get("affix", null)) == key:
				return true
	return false
