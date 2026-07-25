# UI font — required for the Web export (JA text)

The Web export has **no OS font fallback**, so Japanese renders as tofu (□□□)
unless a Japanese-capable font is **embedded** in the game. Native (macOS/Windows)
only works because Godot falls back to a system font (Hiragino / MS Gothic) the
browser cannot reach (IMP-047 Web / #30).

This directory is the **tracked source**. `npm run stage:assets` copies
`assets/fonts/ui.ttf` → `godot/assets/fonts/ui.ttf` (that Godot path is
generated/gitignored), and `boot.gd:_install_ui_font` loads it as
`ThemeDB.fallback_font` — so one font becomes the whole game's font on **every**
platform, Web included.

## Add the font

Drop **one** OFL-licensed Japanese font here, named exactly `ui.ttf`:

- **Noto Sans JP** — https://fonts.google.com/noto/specimen/Noto+Sans+JP
- **M PLUS 1p** — https://fonts.google.com/specimen/M+PLUS+1p

Both are under the **SIL Open Font License**, which permits embedding and
redistribution in the packaged game (a system font like Hiragino cannot be).

```sh
# from the repo root, once you have the .ttf:
cp /path/to/NotoSansJP-Regular.ttf assets/fonts/ui.ttf
npm run export:godot        # stages it into godot/assets/fonts/ui.ttf
npm run gate:font           # asserts the embedded font renders Japanese
```

## Verify

`npm run gate:font` PASSes-with-a-warning while `ui.ttf` is absent (native still
works), and asserts the Japanese glyphs once it is present. After the font lands,
tighten `verify_font.gd` to FAIL on absence, wire `gate:font` into
`gate:migration`, and add the Web half of `gate:package-smoke` (#27) that launches
the Web build and checks Japanese is readable (not tofu).
