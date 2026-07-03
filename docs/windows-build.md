# Windows Build Notes

## Prerequisites

- Windows 10 or 11
- Node.js 22+
- npm
- Rust stable toolchain with Cargo
- Microsoft C++ Build Tools
- WebView2 Runtime

## Commands

```sh
npm ci
npm test
npm run build
cd src-tauri
cargo check
cd ..
npm run tauri build
```

## Expected Artifacts

Tauri writes platform artifacts under `src-tauri/target/release/bundle/`.

## Smoke Checklist

- App launches without a blank screen.
- Create a party and enter the dungeon.
- Save/load works.
- AI-off flow works.
- Japanese mode can be selected.
- Scenario validation errors block invalid packs.

## Caveats

- LocalAI/Ollama integrations are optional and should be tested with mocked providers in CI.
- Desktop file persistence should use app data directories, not user-specific hardcoded paths.
