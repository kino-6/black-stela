extends RefCounted
## Shared roster helpers — find / drop an adventurer by id in a party/reserve/retired list. Extracted
## verbatim from slice_rules (IMP-050) so party_commands and the item handlers share ONE copy rather than
## divergent ones. Pure: no state, no side effects.

static func find_by_id(list: Variant, id: String) -> Dictionary:
	if typeof(list) == TYPE_ARRAY:
		for m in list:
			if typeof(m) == TYPE_DICTIONARY and String(m.get("id", "")) == id:
				return m
	return {}

static func without_id(list: Variant, id: String) -> Array:
	var out := []
	if typeof(list) == TYPE_ARRAY:
		for m in list:
			if String(m.get("id", "")) != id:
				out.append(m)
	return out
