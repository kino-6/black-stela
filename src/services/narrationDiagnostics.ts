// Developer-only diagnostics for hidden local narration (Lane H). Records when a
// narration attempt was unavailable, provider-rejected, or blocked by the policy
// guard, with the metadata needed to reproduce it. This store is NEVER read by
// normal play — nothing in the player-facing UI renders it. It exists so an
// operator can inspect why the local narrator fell back, via the console or tests.

export type NarrationDiagnosticOutcome = "unavailable" | "rejected" | "guard_rejected";

export interface NarrationDiagnostic {
  provider: string;
  outcome: NarrationDiagnosticOutcome;
  message: string;
  promptVersion: string;
  model: string | null;
  turn: number;
}

const MAX_DIAGNOSTICS = 50;
const diagnostics: NarrationDiagnostic[] = [];

export function recordNarrationDiagnostic(entry: NarrationDiagnostic): void {
  diagnostics.push(entry);
  if (diagnostics.length > MAX_DIAGNOSTICS) {
    diagnostics.shift();
  }
}

export function getNarrationDiagnostics(): readonly NarrationDiagnostic[] {
  return diagnostics.slice();
}

export function clearNarrationDiagnostics(): void {
  diagnostics.length = 0;
}
