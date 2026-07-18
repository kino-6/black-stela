class_name StateHash
## Port of the TS canonical-state hash (src/headless/traceFixture.ts). It MUST produce byte-identical
## output to the TS side so a replayed state hash can be compared across runtimes. Two things make that
## exact:
##  - canonical JSON: object keys sorted, arrays in order, integral numbers with no ".0" (matching
##    JS JSON.stringify, where all numbers are float64 and 5.0 serializes as "5").
##  - FNV-1a 32-bit over UTF-16 code units (JS String.charCodeAt), not UTF-8 bytes.

## Canonical JSON string for a JSON value (Dictionary/Array/String/number/bool/null).
static func canonical_json(value: Variant) -> String:
	match typeof(value):
		TYPE_NIL:
			return "null"
		TYPE_BOOL:
			return "true" if value else "false"
		TYPE_INT:
			return str(value)
		TYPE_FLOAT:
			# JS has no int/float split: an integral value serializes without a decimal point.
			if is_finite(value) and value == floor(value):
				return str(int(value))
			return JSON.stringify(value)
		TYPE_STRING, TYPE_STRING_NAME:
			return JSON.stringify(value)
		TYPE_ARRAY:
			var parts := PackedStringArray()
			for item in value:
				parts.append(canonical_json(item))
			return "[" + ",".join(parts) + "]"
		TYPE_DICTIONARY:
			var keys: Array = value.keys()
			keys.sort()
			var parts := PackedStringArray()
			for k in keys:
				parts.append(JSON.stringify(str(k)) + ":" + canonical_json(value[k]))
			return "{" + ",".join(parts) + "}"
	return "null"

## FNV-1a, 32-bit, lowercase 8-hex — over UTF-16 code units to match JS String.charCodeAt.
static func fnv1a(input: String) -> String:
	var h := 0x811c9dc5
	for i in input.length():
		h ^= input.unicode_at(i)
		h = (h * 0x01000193) & 0xFFFFFFFF
	return "%08x" % h

## Hash of game truth: the whole state EXCEPT the derived "log" (its ids are non-semantic; events are
## compared directly). Mirrors hashState() on the TS side.
static func hash_state(state: Dictionary) -> String:
	var truth := state.duplicate()
	truth.erase("log")
	return fnv1a(canonical_json(truth))
