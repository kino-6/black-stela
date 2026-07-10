# Desktop Productization (Lane G)

Status of the remaining Tauri/desktop work. Split into **done + verifiable in this
repo** and **env-gated** (needs a desktop toolchain — Rust + a Tauri build on the
target OS — which cannot run in the headless sandbox, so it is scoped + seamed here
rather than faked).

## Done (verifiable here)

- **Save-schema migration policy + seam.** `src/domain/saveData.ts` exposes
  `LATEST_SAVE_SCHEMA_VERSION`, `migrateSaveData` (upgrades an older save forward one
  version at a time; refuses a save *newer* than the build — no silent data loss),
  and `parseSaveData` (migrate → validate). Both save repositories load through
  `parseSaveData`, so migration runs everywhere a save is read. Unit-tested in
  `tests/saveData.test.ts`. **Adding `SaveDataV2` is now a localized change** — see
  the header comment in `saveData.ts`.
- **Frontend production build smoke test.** `npm run build` (`tsc -b && vite build`)
  passes. Note: `tsc -b` is stricter than `tsc --noEmit` — treat `npm run build` as
  the real typecheck (it caught a `latestEventType` prop-nullability bug that
  `tsc --noEmit` missed).
- **Desktop save-repo abstraction is ready.** `TauriFileSaveRepository` in
  `src/services/saveRepository.ts` already implements the full read/write/list/delete
  contract against a `TauriSaveFileApi` interface (`appDataDir` + text read/write).
  Only the concrete binding to the real Tauri FS plugin is missing (below).

## Env-gated (needs a desktop toolchain to wire + verify)

Tauri v2 moved the filesystem out of core `@tauri-apps/api` into a plugin, which is
not installed and cannot be installed/verified headless. The steps, in order:

1. **Add the FS plugin.** `npm i @tauri-apps/plugin-fs`; in `src-tauri/Cargo.toml`
   add `tauri-plugin-fs`, and register it in `src-tauri/src/lib.rs`
   (`.plugin(tauri_plugin_fs::init())`).
2. **Grant capability permissions.** In `src-tauri/capabilities/default.json` add the
   scoped `fs:` permissions for the app-data directory (read/write/mkdir), keeping
   the scope minimal (no broad filesystem access).
3. **Bind the concrete FS API.** Add `createDesktopSaveFileApi(): TauriSaveFileApi`
   that maps to `@tauri-apps/plugin-fs` (`writeTextFile`, `readTextFile`, `mkdir`,
   `exists`) with `BaseDirectory.AppData`, and `appDataDir` from
   `@tauri-apps/api/path`. Use a dynamic `import()` so the browser bundle never
   pulls the plugin.
4. **Pick the repo at runtime.** Add `createSaveRepository()` that returns the Tauri
   repo when `isTauri()` (`'__TAURI_INTERNALS__' in window`) else the existing
   `LocalStorageSaveRepository`. App already calls a browser factory — swap it for
   this.
5. **Portrait persistence as app-data files.** Today imported portraits live as
   `dataUrl`s (`src/services/portraitManager.ts`), which bloats saves. On desktop,
   write the image to an app-data `portraits/<id>.png` file and store only the
   relative path in the save; resolve via `convertFileSrc`. Keep the browser path
   on data URLs. Gate on `isTauri()`.
6. **Platform bundle smoke test.** `npm run tauri build` on macOS **and** Windows;
   launch the bundle, create a party, save, relaunch, confirm the save round-trips
   from the app-data file (not localStorage), and that a portrait persists across
   relaunch. This is the acceptance gate for the lane and must run on each target OS.

Until step 6 passes on a real target, the desktop FS path is **implemented-but-
unverified**; the browser path (localStorage) is the shipped, tested default.
