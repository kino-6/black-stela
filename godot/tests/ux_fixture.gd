extends RefCounted
## The state a UX-parity screen is driven into, in ONE place.
##
## It lived twice — inside verify_ux_parity.gd and (partially) inside capture_ux_evidence.gd, which knew
## only about `__woundParty`. So the gate asserted an afflicted party while the SCREENSHOT beside it
## showed the healthy one: the evidence was not evidence of the thing being asserted. Both now build the
## state here.
##
## A `__` key is a STATE DRIVER, not data: it describes a situation the player can be in (everyone
## afflicted, gear at the reinforce cap, nothing learned yet) that a plain fixture cannot express in one
## line. Everything else is patched onto the base state verbatim.

const BASE_TRACE := "res://data/traces/b1f-exploration.json"

static func build(fixture: Dictionary) -> Dictionary:
	var parsed: Variant = JSON.parse_string(FileAccess.get_file_as_string(BASE_TRACE))
	var base: Dictionary = (parsed as Dictionary).get("initialState", {}) if typeof(parsed) == TYPE_DICTIONARY else {}
	var patched: Dictionary = base.duplicate(true)
	# Most screens are town screens; one (the party menu) opens in BOTH places and says different things
	# in each, so a fixture may name its own phase.
	patched["phase"] = String(fixture.get("phase", "town"))
	for key in fixture:
		if not String(key).begins_with("__"):
			patched[key] = fixture[key]

	if fixture.has("__afflictParty"):
		# Statuses and a wound, so the strip's pips are PROVEN to render rather than assumed.
		# A DIFFERENT affliction per member, so every pip is proven — not five copies of poison. Written as
		# a plain loop on purpose: a GDScript lambda captures by VALUE, so a counter incremented inside one
		# never advances, and this silently afflicted the whole party identically when it was written that
		# way (the combat strip's 眠り/恐怖/沈黙 pips stopped being covered and the gate went quiet about it).
		var ailments := ["poison", "sleep", "fear", "silence", "ward"]
		var afflicted := []
		var members: Array = patched.get("party", [])
		for index in members.size():
			var m: Dictionary = (members[index] as Dictionary).duplicate(true)
			m["status"] = [ailments[index % ailments.size()]]
			if index == 0:
				m["injury"] = "wounded"
			afflicted.append(m)
		patched["party"] = afflicted

	if fixture.has("__wearNone"):
		patched["party"] = _map_party(patched, func(m: Dictionary):
			m["equipment"] = {}
			return m)

	if fixture.has("__wearMaxed"):
		# A piece already at the reinforce cap, so 鍛え切った is proven rather than assumed.
		patched["party"] = _map_party(patched, func(m: Dictionary):
			m["equipment"] = {"weapon": {"id": "equip.militia-sabre", "plus": 5}}
			return m)

	if fixture.has("__wearAll"):
		# The forge lists only the slots a member WEARS; kit one out so every slot label is proven.
		patched["party"] = _map_party(patched, func(m: Dictionary):
			m["equipment"] = {
				"weapon": {"id": "equip.militia-sabre"}, "offhand": {"id": "equip.split-buckler"},
				"body": {"id": "equip.padded-jack"}, "head": {"id": "equip.iron-cap"},
				"hands": {"id": "equip.grip-gloves"}, "accessory": {"id": "equip.chalk-cord"}
			}
			return m)

	if fixture.has("__woundParty"):
		var amount := int(fixture["__woundParty"])
		patched["party"] = _map_party(patched, func(m: Dictionary):
			m["hp"] = maxi(1, int(m.get("maxHp", 10)) - amount)
			return m)

	if fixture.has("__vocation"):
		# An explicit vocation state drives the career counter's own situations: nothing learned yet, a
		# technique waiting to be set, a set already full.
		var vocation: Dictionary = fixture["__vocation"]
		patched["party"] = _map_party(patched, func(m: Dictionary):
			var v: Dictionary = vocation.duplicate(true)
			v["current"] = String(m.get("classId", ""))
			m["vocation"] = v
			return m)

	return patched

static func _map_party(state: Dictionary, transform: Callable) -> Array:
	var out := []
	for member in state.get("party", []):
		out.append(transform.call((member as Dictionary).duplicate(true)))
	return out
