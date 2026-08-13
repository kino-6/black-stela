extends RefCounted
## #32 random dungeon events — scenario-authored weighted flavour beats rolled while walking, some carrying
## one small one-shot effect. GODOT-ONLY new feature: every entry point is gated on an authored dungeonEvents
## list, so a world (and every parity trace) that authors none never rolls, never draws RNG, never writes
## state — the migrated _move_forward stays byte-identical to the TS oracle. Deterministic: seeded by turn +
## room id via CombatRng (same replay-stable hash the wandering roll uses).

const CombatRng := preload("res://scripts/rules/combat_rng.gd")
const CharacterStats := preload("res://scripts/rules/character_stats.gd")

# Roll for and apply one random event on this step. `state` is the POST-move next-state (position/turn
# already updated). Returns {state, event} when one fires, else null.
static func maybe_roll(state: Dictionary, world: Dictionary) -> Variant:
	var events: Array = world.get("dungeonEvents", [])
	if events.is_empty():
		return null
	var pct := int((world.get("balance", {}) as Dictionary).get("dungeonEventPct", 0))
	if pct <= 0:
		return null
	var room_id := String((state.get("position", {}) as Dictionary).get("roomId", ""))
	var turn := int(state.get("turn", 0))
	if CombatRng.roll_percent("%d:%s:dungeonevent" % [turn, room_id]) >= pct:
		return null

	var total := 0
	for e in events:
		total += int((e as Dictionary).get("weight", 0))
	if total <= 0:
		return null
	var roll := CombatRng.hash_seed("%d:%s:dungeonevent:pick" % [turn, room_id]) % total
	var chosen: Dictionary = events[0]
	for e in events:
		roll -= int((e as Dictionary).get("weight", 0))
		if roll < 0:
			chosen = e
			break

	var next: Dictionary = state.duplicate(true)
	_apply(next, world, chosen)
	return {"state": next, "event": {"type": "room_event_triggered", "roomId": room_id, "text": _text(chosen)}}

static func _text(ev: Dictionary) -> String:
	var ja: Dictionary = (ev.get("locales", {}) as Dictionary).get("ja", {})
	return String(ja.get("text", ev.get("text", "")))

# Apply the event's optional one-shot effects. Salvage/gold add to the run purse; heal/hazard touch the
# standing party only and the hazard is floored at 1 HP so an ambient event can never wipe the party.
static func _apply(next: Dictionary, world: Dictionary, ev: Dictionary) -> void:
	var mats := int(ev.get("findMaterials", 0))
	if mats > 0:
		next["materials"] = int(next.get("materials", 0)) + mats
	var gold := int(ev.get("findGold", 0))
	if gold > 0:
		next["partyGold"] = int(next.get("partyGold", 0)) + gold
	var heal := int(ev.get("heal", 0))
	var dmg := int(ev.get("damage", 0))
	if heal <= 0 and dmg <= 0:
		return
	for member in next.get("party", []):
		var cur := int(member.get("hp", 0))
		if cur <= 0:
			continue
		if heal > 0:
			var stats := CharacterStats.effective(member, world)
			member["hp"] = mini(int(stats.get("maxHp", cur)), cur + heal)
		elif dmg > 0:
			member["hp"] = maxi(1, cur - dmg)
