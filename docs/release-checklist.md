# Release Readiness Checklist

- [ ] `npm ci`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run headless:clear`
- [ ] `npm run test:e2e`
- [ ] `npm audit --audit-level=moderate`
- [ ] `cargo check` in `src-tauri/`
- [ ] Tauri dev launch smoke
- [ ] Save compatibility checked with current `SaveDataV1`
- [ ] Browser save/load works
- [ ] Desktop save adapter smoke checked
- [ ] Portrait fallback works for missing files
- [ ] AI-off flow works
- [ ] Mock LocalAI-compatible flow works
- [ ] Japanese UI desktop and mobile smoke
- [ ] Scenario validation blocks invalid packs
- [ ] Windows build artifacts documented
