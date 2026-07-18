class_name CombatRng
## Port of the seeded combat RNG (src/domain/rulesEngine.ts). hashSeed is an FNV-1a variant that
## accumulates in SIGNED 32-bit space (JS Math.imul) and returns Math.abs at the end; rollDamage and
## chipThroughResistance build on it. Reproducing these byte-for-byte is the foundation of combat
## parity — verified against godot/data/rng-samples.json (godot/tests/verify_rng.gd).

# Wrap to signed 32-bit (JS ToInt32 semantics, used by ^ and Math.imul).
static func _to_int32(x: int) -> int:
	x = x & 0xFFFFFFFF
	if x >= 0x80000000:
		x -= 0x100000000
	return x

# Low 32 bits of a*b as a signed int32 — exactly JS Math.imul, computed without 64-bit overflow.
static func _imul(a: int, b: int) -> int:
	var ua := a & 0xFFFFFFFF
	var ub := b & 0xFFFFFFFF
	var b_lo := ub & 0xFFFF
	var b_hi := (ub >> 16) & 0xFFFF
	var low := (ua * b_lo) & 0xFFFFFFFF
	var mid := (ua * b_hi) & 0xFFFF
	var prod := (low + ((mid << 16) & 0xFFFFFFFF)) & 0xFFFFFFFF
	return _to_int32(prod)

## hashSeed(seed): FNV-1a over char codes with signed-32-bit imul, returned as Math.abs. Note the empty
## seed returns the raw offset basis (2166136261) — Math.abs never int32-truncates the final value.
static func hash_seed(seed: String) -> int:
	var h := 2166136261
	for i in seed.length():
		h = _to_int32(h) ^ seed.unicode_at(i)
		h = _imul(h, 16777619)
	return abs(h)

## rollDamage(seed, min, max, armor): low + hash%span - armor, floored at 1. Min/max may be reversed.
static func roll_damage(seed: String, min_v: int, max_v: int, armor: int) -> int:
	var low: int = min(min_v, max_v)
	var high: int = max(min_v, max_v)
	var span: int = high - low + 1
	return max(1, low + (hash_seed(seed) % span) - armor)

## elementMultiplier(weaknesses, element): the weakness factor for an element, default 1.
static func element_multiplier(weaknesses: Variant, element: String) -> float:
	if typeof(weaknesses) == TYPE_DICTIONARY and weaknesses.has(element):
		return float(weaknesses[element])
	return 1.0

## chipThroughResistance(damage, seed): a connecting blow resisted to 0 still chips 1 at 65%.
static func chip_through_resistance(damage: int, seed: String) -> int:
	if damage > 0:
		return damage
	return 1 if (hash_seed(seed + ":chip") % 100 < 65) else 0
