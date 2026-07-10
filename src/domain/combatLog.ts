import type { AdventureLogEntry } from "./types";

// #69: gather every blow of the CURRENT fight as an ordered list of beat lines
// (each carries its own damage number). Only the most recent encounter's rounds
// count — an earlier fight's beats are dropped the moment a new one begins. The
// view reveals these one at a time so a round no longer collapses into one line.
export function collectCombatBeats(log: AdventureLogEntry[]): string[] {
  const beats: string[] = [];
  let inFight = false;
  for (const entry of log) {
    if (entry.event?.type === "enemy_encountered") {
      beats.length = 0;
      inFight = true;
      continue;
    }
    if (inFight && entry.event?.type === "combat_round_resolved") {
      beats.push(...entry.event.summaries);
    }
  }
  return beats;
}
