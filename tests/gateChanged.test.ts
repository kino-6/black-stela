import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// IMP-049 — the change-impact manifest is the contract that decides what a scoped edit must prove. If it
// rots (a check pointing at a deleted gate, a scope with no mapping, a high-risk file that never escalates)
// the gate silently under-tests. This locks its integrity, and that the runner's selection/escalation and
// exit codes behave, so `gate:changed` is a trustworthy stop condition rather than a self-report.

const root = join(import.meta.dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "godot", "gates", "change-impact.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

function checkResolves(check: Record<string, string>): boolean {
  if (check.godot) return existsSync(join(root, "godot", "tests", `${check.godot}.gd`));
  if (check.npm) return typeof pkg.scripts[check.npm] === "string";
  if (check.sh) return check.sh.length > 0;
  return false;
}

const allChecks = Object.values<any>(manifest.scopes).flatMap((s) => [
  ...(s.fast ?? []),
  ...(s.affected ?? []),
  ...(s.native ?? []),
]);

describe("change-impact manifest integrity", () => {
  it("every check points at an existing gate script or npm script", () => {
    for (const check of [...allChecks, manifest.fullRoute]) {
      expect(checkResolves(check), `unresolved check: ${JSON.stringify(check)}`).toBe(true);
    }
  });

  it("every high-risk file and escalation trigger exists on disk", () => {
    const paths = [
      ...(manifest.highRiskFiles ?? []),
      ...Object.values<any>(manifest.scopes).flatMap((s) => s.escalateOn ?? []),
    ];
    for (const p of paths) {
      expect(existsSync(join(root, p)), `missing declared path: ${p}`).toBe(true);
    }
  });

  it("every non-docs scope maps to at least one check", () => {
    for (const [name, spec] of Object.entries<any>(manifest.scopes)) {
      if (name === "docs") continue;
      const count = (spec.fast?.length ?? 0) + (spec.affected?.length ?? 0) + (spec.native?.length ?? 0);
      expect(count, `scope ${name} has no checks`).toBeGreaterThan(0);
    }
  });

  it("the save scope always requests the full route", () => {
    expect(manifest.scopes.save.alwaysFullRoute).toBe(true);
  });
});

function runGate(args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync("node", ["scripts/gate-changed.mjs", ...args], { cwd: root, encoding: "utf8" });
    return { code: 0, out };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("gate:changed runner", () => {
  it("exits 2 on an unknown scope", () => {
    expect(runGate(["--scope", "bogus"]).code).toBe(2);
  });

  it("exits 2 with no scope", () => {
    expect(runGate([]).code).toBe(2);
  });

  // A fixed changed-file set is injected with --changed so the assertions do not depend on the live
  // working tree (a dirty tree with a high-risk file would legitimately flip these to full-route).
  it("a docs edit is diff-only and does not select the full route", () => {
    const { code, out } = runGate(["--scope", "docs", "--plan", "--changed", "README.md"]);
    expect(code).toBe(0);
    expect(out).toContain('"fullRouteSelected":false');
  });

  it("a save edit demonstrably requests the full route", () => {
    const { out } = runGate(["--scope", "save", "--plan", "--changed", ""]);
    expect(out).toContain('"fullRouteSelected":true');
    expect(out).toContain("gate:migration");
  });

  it("a plain dungeon edit runs affected checks without the full route", () => {
    const { out } = runGate(["--scope", "dungeon", "--plan", "--changed", "godot/scripts/minimap.gd"]);
    expect(out).toContain("verify_dungeon_controller");
    expect(out).toContain('"fullRouteSelected":false');
  });

  it("a high-risk file in the diff escalates any scope to the full route", () => {
    const { out } = runGate(["--scope", "dungeon", "--plan", "--changed", "godot/scripts/scene_manager.gd"]);
    expect(out).toContain('"fullRouteSelected":true');
  });
});
