extends RefCounted
## The in-progress recruit the guild's registration steps edit before it is committed to the roster —
## a port of src/ui/characterDraft.ts + src/domain/identitySuggestion.ts (the pure parts).
##
## The build MATH stays in rules/character_creation.gd (proven byte-identical to TS). What lives here is
## the DRAFT: the bonus pool the player spends, the origin reroll, and the name/title/notes suggestions
## that keep a player who does not want to invent a name from being blocked at the last step.

const APTITUDE_KEYS := ["might", "agility", "spirit", "wit", "luck"]

# Suggestion tables — the JA halves of identitySuggestion.ts. The guild speaks Japanese; the English
# lists are not ported because no Godot surface renders them.
const NAMES := [
	"ミラ", "ルーク", "ヴェイル", "セイ", "ブラン", "ケスト", "リオ", "アッシュ",
	"ネラ", "オルン", "テス", "ガルト", "イラ", "ノエル", "ヴェイ", "セーブル"
]
const TITLE_HEADS := ["灯", "灰", "門", "塵", "鉄", "静", "黒", "蝋", "殿", "虚"]
const TITLE_TAILS := ["の手", "歩き", "守り", "刃", "読み", "札", "糸", "足", "目", "誓い"]
const NOTE_OPENERS := [
	"人が眠る間に見張りを続ける。",
	"金より先に出口の数を数える。",
	"敷居を越える前に壁へ触れる。",
	"危険が去ってから、ようやく笑う。",
	"貸しと借りを一つずつ抱えている。"
]

static func fresh(seed: int) -> Dictionary:
	return {
		"name": "",
		"title": "",
		"notes": "",
		"classId": "warrior",
		"backgroundId": "watch",
		"traitId": "steady",
		"bonusPool": roll_bonus_pool(seed),
		"bonusAptitude": empty_bonus(),
		"bonusSeed": seed,
		"originSeed": seed,
		"identitySeed": seed,
	}

static func empty_bonus() -> Dictionary:
	return {"might": 0, "agility": 0, "spirit": 0, "wit": 0, "luck": 0}

## 4..8 points, from the draft's seed — the same roll React makes, so a Godot recruit is built from the
## same size of pool as the React one it replaces.
static func roll_bonus_pool(seed: int) -> int:
	return 4 + (int(floor(abs(sin(float(seed) * 12.9898) * 10000.0))) % 5)

static func allocated(bonus: Dictionary) -> int:
	var total := 0
	for key in APTITUDE_KEYS:
		total += int(bonus.get(key, 0))
	return total

static func remaining(draft: Dictionary) -> int:
	return int(draft.get("bonusPool", 0)) - allocated(draft.get("bonusAptitude", {}))

## Spend or reclaim one point. Refuses to overspend the pool or to take back a point never spent —
## the ± steppers are disabled at those bounds too, but the rule lives here, not in the widget.
static func adjust(draft: Dictionary, key: String, delta: int) -> void:
	var bonus: Dictionary = draft.get("bonusAptitude", {})
	var current := int(bonus.get(key, 0))
	if delta > 0 and allocated(bonus) >= int(draft.get("bonusPool", 0)):
		return
	if delta < 0 and current <= 0:
		return
	bonus[key] = current + delta

static func reroll_bonus(draft: Dictionary) -> void:
	var next_seed := int(draft.get("bonusSeed", 1)) + 1
	draft["bonusSeed"] = next_seed
	draft["bonusPool"] = roll_bonus_pool(next_seed)
	draft["bonusAptitude"] = empty_bonus()

## Walk to the next 来歴 and pick a 気質 from the seed — "見繕う" for a player who would rather be dealt
## an origin than choose one.
static func reroll_origin(draft: Dictionary, data: Dictionary) -> void:
	var backgrounds: Array = data.get("backgrounds", [])
	var traits: Array = data.get("traits", [])
	if backgrounds.is_empty() or traits.is_empty():
		return
	var origin_seed := int(draft.get("originSeed", 1)) + 1
	draft["originSeed"] = origin_seed
	var index := maxi(0, _index_of(backgrounds, String(draft.get("backgroundId", ""))))
	draft["backgroundId"] = String(backgrounds[(index + 1) % backgrounds.size()].get("id", ""))
	draft["traitId"] = String(traits[int(floor(origin_seed * 1.7)) % traits.size()].get("id", ""))

static func reroll_identity(draft: Dictionary, data: Dictionary) -> void:
	draft["identitySeed"] = int(draft.get("identitySeed", 1)) + 1
	var suggestion := suggest_identity(draft, data)
	draft["name"] = suggestion["name"]
	draft["title"] = suggestion["title"]
	draft["notes"] = suggestion["notes"]

## Fill blanks on the way INTO the name step (React's enterNameStep): anything the player already wrote
## is left alone, so the suggestion never overwrites a name someone chose.
static func suggest_if_blank(draft: Dictionary, data: Dictionary) -> void:
	if String(draft.get("name", "")).strip_edges() != "":
		return
	if String(draft.get("title", "")).strip_edges() != "" or String(draft.get("notes", "")).strip_edges() != "":
		return
	var suggestion := suggest_identity(draft, data)
	draft["name"] = suggestion["name"]
	draft["title"] = suggestion["title"]
	draft["notes"] = suggestion["notes"]

static func suggest_identity(draft: Dictionary, data: Dictionary) -> Dictionary:
	var seed := absi(int(draft.get("identitySeed", 1)))
	var class_label := label_ja(data.get("classes", []), String(draft.get("classId", "")))
	var background_label := label_ja(data.get("backgrounds", []), String(draft.get("backgroundId", "")))
	var trait_label := label_ja(data.get("traits", []), String(draft.get("traitId", "")))
	return {
		"name": NAMES[seed % NAMES.size()],
		"title": "%s%s" % [TITLE_HEADS[(seed + 3) % TITLE_HEADS.size()], TITLE_TAILS[(seed + 7) % TITLE_TAILS.size()]],
		"notes": "%s %sで、%s。%sとして潜る。" % [
			NOTE_OPENERS[(seed + 11) % NOTE_OPENERS.size()], background_label, trait_label, class_label
		],
	}

static func find(catalog: Array, id: String) -> Dictionary:
	for entry in catalog:
		if typeof(entry) == TYPE_DICTIONARY and String(entry.get("id", "")) == id:
			return entry
	return catalog[0] if not catalog.is_empty() else {}

static func label_ja(catalog: Array, id: String) -> String:
	var entry := find(catalog, id)
	var label: Variant = entry.get("label", {})
	if typeof(label) == TYPE_DICTIONARY and label.has("ja"):
		return String(label["ja"])
	return id

static func _index_of(catalog: Array, id: String) -> int:
	for i in catalog.size():
		if String(catalog[i].get("id", "")) == id:
			return i
	return -1
