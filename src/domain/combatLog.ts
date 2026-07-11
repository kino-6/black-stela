import type { AdventureLogEntry, CombatBeat } from "./types";

// #69: gather every blow of the CURRENT fight as ordered structured beats (each
// carries its own damage number and the fields needed to localize + play it out).
// Only the most recent encounter's rounds count — an earlier fight's beats are
// dropped the moment a new one begins. Falls back to a text-only beat for any
// round event that predates structured beats (older saves).
export function collectCombatBeats(log: AdventureLogEntry[]): CombatBeat[] {
  const beats: CombatBeat[] = [];
  let inFight = false;
  for (const entry of log) {
    if (entry.event?.type === "enemy_encountered") {
      beats.length = 0;
      inFight = true;
      continue;
    }
    if (inFight && entry.event?.type === "combat_round_resolved") {
      if (entry.event.beats && entry.event.beats.length > 0) {
        beats.push(...entry.event.beats);
      } else {
        beats.push(
          ...entry.event.summaries.map((text): CombatBeat => ({ text, kind: "hit", groups: [], party: [] }))
        );
      }
    }
  }
  return beats;
}
