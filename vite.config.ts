import { execSync } from "node:child_process";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// A small build stamp (git short SHA + local time the bundle started) so it's
// obvious at a glance in the UI which build is being viewed.
const buildStamp = (() => {
  let sha = "dev";
  try {
    sha = execSync("git rev-parse --short HEAD").toString().trim();
    if (execSync("git status --porcelain").toString().trim()) {
      sha += "+";
    }
  } catch {
    // not a git checkout — leave "dev"
  }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${sha} · ${hh}:${mm}`;
})();

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD__: JSON.stringify(buildStamp)
  },
  clearScreen: false,
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["node_modules/**", "dist/**", "tests/e2e/**"]
  }
});
