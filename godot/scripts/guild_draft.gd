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
		# A face is a player choice, not a property of the origin.  The key resolves to the shipped
		# portrait library; storing it separately lets a watchkeeper and an apothecary share neither face
		# nor story by accident.
		"portraitKey": "gate",
		"traitId": "steady",
		"bonusPool": roll_bonus_pool(seed),
		"bonusAptitude": empty_bonus(),
		"bonusSeed": seed,
		"originSeed": seed,
		"identitySeed": seed,
	}

static func empty_bonus() -> Dictionary:
	return {"might": 0, "agility": 0, "spirit": 0, "wit": 0, "luck": 0}

## Deal a COMPLETE random adventurer into the draft — class, face, 来歴/気質, a fully-SPENT bonus pool, and a
## name — the Godot mirror of React's createQuickRecruit, for a player who would rather be dealt a recruit
## than build one step by step. The pool is spent in full so the result is immediately registerable.
static func randomize(draft: Dictionary, data: Dictionary, class_ids: Array, seed: int, extra_faces: Array = []) -> void:
	# Pick each field DIRECTLY off the seed (not a +1 nudge from the default) so class/来歴/気質/顔 all vary —
	# mirrors React's createQuickRecruit (roll, roll/3, roll/7, …).
	if not class_ids.is_empty():
		draft["classId"] = String(class_ids[int(abs(seed)) % class_ids.size()])
	var backgrounds: Array = data.get("backgrounds", [])
	if not backgrounds.is_empty():
		draft["backgroundId"] = String(backgrounds[int(abs(seed / 3)) % backgrounds.size()].get("id", ""))
	var traits: Array = data.get("traits", [])
	if not traits.is_empty():
		draft["traitId"] = String(traits[int(abs(seed / 7)) % traits.size()].get("id", ""))
	# When the world ships its own creation figures (terminal-line's platform crowd), deal one of THOSE so
	# 見繕う hands back a portrait of this world — not a default-pack background face. A world with no pool
	# keeps the shared background faces (base unchanged); mirrors React createSuggestedRecruitForParty.
	var faces: Array = extra_faces if not extra_faces.is_empty() else face_keys(data)
	if not faces.is_empty():
		draft["portraitKey"] = String(faces[int(abs(seed / 11)) % faces.size()])
	# Deal the NAME/title/notes off the SAME varying seed as everything else — otherwise identitySeed stays
	# at the draft's fixed origin seed and every 見繕う hands back the same name (playtest 2026-07-29). Clear
	# the per-field seeds so suggest_identity falls through to this identitySeed.
	draft["identitySeed"] = seed
	draft.erase("nameSeed")
	draft.erase("titleSeed")
	draft.erase("notesSeed")
	reroll_identity(draft, data) # a dealt name/title/notes
	draft["bonusAptitude"] = empty_bonus()
	var pool := int(draft.get("bonusPool", 0))
	for i in range(pool):
		adjust(draft, String(APTITUDE_KEYS[int(abs(seed + i * 7)) % APTITUDE_KEYS.size()]), 1)

## What randomize() WOULD deal for a given seed — the calling and the suggested NAME — WITHOUT dealing it, so
## the guild can search for a seed whose name/class is not already in the party (前衛3・後衛3, no doubled names).
## Mirrors randomize's own offsets exactly: the class is picked off `seed`, and the name off `seed + 1` because
## randomize sets identitySeed=seed and reroll_identity bumps it by one before naming.
static func preview_deal(class_ids: Array, seed: int) -> Dictionary:
	var class_id := ""
	if not class_ids.is_empty():
		class_id = String(class_ids[int(abs(seed)) % class_ids.size()])
	return {"classId": class_id, "name": _name_for(seed + 1)}

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

## Per-field 見繕う (#6): a face is a player choice, not a property of the origin, so 顔 / 来歴 / 気質 each
## re-roll on their OWN seed — dealing a fresh face never rewrites the origin story or temperament, and
## picking a new 来歴 leaves the chosen face alone. Seeds fall back to originSeed for older drafts.
static func reroll_face(draft: Dictionary, data: Dictionary) -> void:
	var keys := face_keys(data)
	if keys.is_empty():
		return
	var s := int(draft.get("faceSeed", draft.get("originSeed", 1))) + 1
	draft["faceSeed"] = s
	var next := absi(s) % keys.size()
	# A visible "reroll" that redraws the same portrait is indistinguishable from
	# a broken control.  Seed wrapping is fine, but advance one face when it would
	# otherwise reproduce the player's current choice.
	if keys.size() > 1 and String(keys[next]) == String(draft.get("portraitKey", "")):
		next = (next + 1) % keys.size()
	draft["portraitKey"] = String(keys[next])

static func reroll_background(draft: Dictionary, data: Dictionary) -> void:
	var backgrounds: Array = data.get("backgrounds", [])
	if backgrounds.is_empty():
		return
	draft["backgroundSeed"] = int(draft.get("backgroundSeed", draft.get("originSeed", 1))) + 1
	var index := maxi(0, _index_of(backgrounds, String(draft.get("backgroundId", ""))))
	draft["backgroundId"] = String(backgrounds[(index + 1) % backgrounds.size()].get("id", ""))

static func reroll_trait(draft: Dictionary, data: Dictionary) -> void:
	var traits: Array = data.get("traits", [])
	if traits.is_empty():
		return
	var s := int(draft.get("traitSeed", draft.get("originSeed", 1))) + 1
	draft["traitSeed"] = s
	var next := absi(int(floor(s * 1.7))) % traits.size()
	# A visible reroll must never reproduce the current 気質 — otherwise the control reads as broken (and the
	# gate flakes when the seed happens to land on it). Advance one when it would, exactly as face/origin do.
	if traits.size() > 1 and String(traits[next].get("id", "")) == String(draft.get("traitId", "")):
		next = (next + 1) % traits.size()
	draft["traitId"] = String(traits[next].get("id", ""))

## The face pool: the distinct portrait keys the backgrounds draw from — a face is chosen from here
## independently of which 来歴 owns it.
static func face_keys(data: Dictionary) -> Array:
	var out := []
	for background in data.get("backgrounds", []):
		var key := String((background as Dictionary).get("portraitKey", ""))
		if key != "" and not out.has(key):
			out.append(key)
	return out

static func reroll_identity(draft: Dictionary, data: Dictionary) -> void:
	draft["identitySeed"] = int(draft.get("identitySeed", 1)) + 1
	var suggestion := suggest_identity(draft, data)
	draft["name"] = suggestion["name"]
	draft["title"] = suggestion["title"]
	draft["notes"] = suggestion["notes"]

## Per-field "見繕う" (#7): each field re-rolls on ITS OWN seed, so dealing a fresh NAME never disturbs a
## title or notes the player chose to keep. The seeds fall back to identitySeed for drafts made before the
## split, so an in-flight recruit keeps rerolling sensibly.
static func reroll_name(draft: Dictionary) -> void:
	var s := int(draft.get("nameSeed", draft.get("identitySeed", 1))) + 1
	draft["nameSeed"] = s
	draft["name"] = _name_for(s)

static func reroll_title(draft: Dictionary) -> void:
	var s := int(draft.get("titleSeed", draft.get("identitySeed", 1))) + 1
	draft["titleSeed"] = s
	draft["title"] = _title_for(s)

static func reroll_notes(draft: Dictionary, data: Dictionary) -> void:
	var s := int(draft.get("notesSeed", draft.get("identitySeed", 1))) + 1
	draft["notesSeed"] = s
	draft["notes"] = _notes_for(s, draft, data)

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
	return {
		"name": _name_for(seed),
		"title": _title_for(seed),
		"notes": _notes_for(seed, draft, data),
	}

# The per-field pickers the bulk suggestion and the #7 field rerolls share, so both routes deal from the
# same tables with the same offsets — a bulk 見繕う and three separate field rerolls at the same seeds land
# on identical text.
static func _name_for(seed: int) -> String:
	return NAMES[absi(seed) % NAMES.size()]

static func _title_for(seed: int) -> String:
	var s := absi(seed)
	return "%s%s" % [TITLE_HEADS[(s + 3) % TITLE_HEADS.size()], TITLE_TAILS[(s + 7) % TITLE_TAILS.size()]]

static func _notes_for(seed: int, draft: Dictionary, data: Dictionary) -> String:
	var s := absi(seed)
	var class_label := label_ja(data.get("classes", []), String(draft.get("classId", "")))
	var background_label := label_ja(data.get("backgrounds", []), String(draft.get("backgroundId", "")))
	var trait_label := label_ja(data.get("traits", []), String(draft.get("traitId", "")))
	return "%s %sで、%s。%sとして潜る。" % [
		NOTE_OPENERS[(s + 11) % NOTE_OPENERS.size()], background_label, trait_label, class_label
	]

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
