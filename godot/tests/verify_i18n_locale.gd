extends SceneTree
## gate:i18n — language switching is DESIGNED IN from the start (kino's #22 call: the EN UI is not needed
## during development, but the switch must be architecturally present so English is a drop-in, not a
## retrofit). This locks that: both packs ship, ja is the default, and set_locale actually swaps the copy.
## The title's language-SELECTOR widget is deliberately deferred (see the manifest derivedExclusions); this
## proves the engine + data behind it are real. Run: godot --headless --path godot/ --script res://tests/verify_i18n_locale.gd

const I18n := preload("res://scripts/i18n.gd")

var _fail := 0

func _initialize() -> void:
	# Both locale packs ship (export:i18n writes i18n-ja.json AND i18n-en.json).
	var avail := I18n.available_locales()
	_check(avail.has("ja") and avail.has("en"), "both the ja and en packs ship (%s)" % str(avail))

	# Japanese is the development default.
	I18n.set_locale("ja")
	_check(I18n.locale() == "ja", "the default locale is Japanese")
	var ja := I18n.t("town.wounds")
	_check(ja == "負傷", "ja resolves Japanese copy (town.wounds=%s)" % ja)

	# The switch actually swaps the copy — English is reachable at runtime.
	_check(I18n.set_locale("en"), "set_locale(\"en\") loads the English pack")
	var en := I18n.t("town.wounds")
	_check(en != ja and en != "town.wounds", "en resolves English copy, not Japanese or the raw key (town.wounds=%s)" % en)

	# A missing pack falls back to the default rather than blanking the UI.
	I18n.set_locale("ja")
	_check(not I18n.set_locale("zz"), "an unknown locale is refused")
	_check(I18n.locale() == "ja", "a refused switch leaves the previous locale intact")

	print("[i18n-locale] %s (%d failures)" % ["PASS" if _fail == 0 else "FAIL", _fail])
	quit(_fail)

func _check(ok: bool, label: String) -> void:
	if ok:
		print("[i18n-locale] ok: %s" % label)
	else:
		push_error("[i18n-locale] FAIL: %s" % label)
		_fail += 1
