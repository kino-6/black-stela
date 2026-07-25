extends SceneTree
## gate:font — Japanese must render in the EXPORTED build. The Web export has no OS font fallback, so
## without an EMBEDDED Japanese font it shows tofu (IMP-047 Web / #30). This PASSes with a warning while
## no font is present (so it does not block before the OFL font is added), and FAILS if a font IS
## installed at res://assets/fonts/ui.ttf but cannot render Japanese. Once the font lands, tighten this
## to fail on absence and wire it into gate:migration.
## Usage: godot --headless --path godot/ --script res://tests/verify_font.gd

const UI_FONT := "res://assets/fonts/ui.ttf"

func _initialize() -> void:
	if not ResourceLoader.exists(UI_FONT):
		push_warning("[font] no %s — the Web export will render Japanese as tofu; add an OFL font (see assets/fonts/README.md)" % UI_FONT)
		print("[font] PASS (no embedded UI font yet — native-only; Web needs the font)")
		quit(0)
		return

	var f: Variant = load(UI_FONT)
	var ok: bool = f is Font and (f as Font).has_char(0x3042) and (f as Font).has_char(0x967A)  # あ, 険
	if ok:
		print("[font] PASS (the embedded UI font renders Japanese)")
		quit(0)
	else:
		push_error("[font] %s is installed but cannot render Japanese (あ/険 missing) — the Web build would show tofu" % UI_FONT)
		print("[font] FAIL")
		quit(1)
