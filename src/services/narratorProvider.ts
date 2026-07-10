import type { GameState, ScenarioWorld } from "../domain/types";
import type { NarrationProposal } from "./aiPolicyGuard";
import type { AiSettings } from "./aiSettings";

// Bump when the narration prompt shape changes. Carried on every request/result so
// a generated line is reproducible from (promptVersion, model, publicSituation).
export const NARRATION_PROMPT_VERSION = "narration/2026-07-10";

export interface NarratorProviderRequest {
  state: GameState;
  world: ScenarioWorld;
  settings: AiSettings;
}

export type NarratorProviderResult =
  | { status: "success"; proposal: NarrationProposal; provider: string; promptVersion: string; model: string }
  | { status: "unavailable"; message: string; provider: string }
  | { status: "rejected"; message: string; provider: string };

// A hidden, developer-facing health probe. Never surfaced in normal play — it never
// throws and never speaks for the game; it only reports whether the local provider
// is reachable so an operator can debug a silent fallback.
export interface NarratorProviderHealth {
  provider: string;
  healthy: boolean;
  detail: string;
}

export interface NarratorProvider {
  metadata: {
    kind: AiSettings["provider"];
    label: string;
    promptVersion: string;
  };
  narrate(request: NarratorProviderRequest): Promise<NarratorProviderResult>;
  checkHealth(request: NarratorProviderRequest): Promise<NarratorProviderHealth>;
}

export const noneNarratorProvider: NarratorProvider = {
  metadata: {
    kind: "none",
    label: "Local narrator bypassed",
    promptVersion: NARRATION_PROMPT_VERSION
  },
  async narrate() {
    return {
      status: "unavailable",
      provider: "none",
      message: "Local narration is bypassed. The canonical log remains the complete record."
    };
  },
  async checkHealth() {
    return { provider: "none", healthy: true, detail: "Narration is bypassed; the deterministic log is the record." };
  }
};

// The ONLY data a provider sees: environment flavor derived from public situation.
// It deliberately excludes every player-character field (name, notes, speech,
// portrait, stats) so a provider can neither speak for nor act as a PC. Recent
// event text is redacted of party-member names — the narrator gets environmental
// context but never the identities it must not voice. The prompt version is
// included so a result can be reproduced.
export function buildPublicNarrationInput({ state, world }: NarratorProviderRequest) {
  return {
    role: "environment_flavor_only",
    promptVersion: NARRATION_PROMPT_VERSION,
    publicSituation: {
      phase: state.phase,
      position: state.position,
      recentEvents: state.log.slice(-5).map((entry) => redactPartyNames(entry.text, state.party))
    },
    allowed: world.aiPolicy.allowed,
    forbidden: world.aiPolicy.forbidden
  };
}

function redactPartyNames(text: string, party: GameState["party"]): string {
  let redacted = text;
  for (const member of party) {
    if (!member.name) {
      continue;
    }
    redacted = redacted.split(member.name).join("an adventurer");
  }
  return redacted;
}
