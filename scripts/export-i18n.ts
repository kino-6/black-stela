import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ja } from "../src/i18n/ja";
import { en } from "../src/i18n/en";

// The UX-parity gate compares the Godot port against the REACT screens it replaces, and option A of the
// migration decision is a FAITHFUL reproduction — same information, same words. So the gate must read the
// same copy React reads. Flatten ja.ts to `key.path -> string` and ship it to Godot; if the copy changes in
// one place, the gate follows it there. Run with `npm run export:i18n`.

function flatten(node: unknown, prefix: string, out: Record<string, string>): void {
  if (typeof node === "string") {
    out[prefix] = node;
    return;
  }
  if (!node || typeof node !== "object") {
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "godot", "data");
mkdirSync(outDir, { recursive: true });

// Ship EVERY locale pack, not just Japanese. The UI is Japanese-only during development, but I18n.gd can
// set_locale("en") from the start, so shipping the en pack keeps language switching a drop-in rather than
// a retrofit (IMP-043 / #22). ja stays the default the screens read.
for (const [locale, copy] of [["ja", ja], ["en", en]] as const) {
  const flat: Record<string, string> = {};
  flatten(copy, "", flat);
  writeFileSync(join(outDir, `i18n-${locale}.json`), `${JSON.stringify(flat, null, 2)}\n`);
  console.log(`exported ${locale} copy (${Object.keys(flat).length} keys) → godot/data/i18n-${locale}.json`);
}
