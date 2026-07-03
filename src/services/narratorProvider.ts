import type { GameState, ScenarioWorld } from "../domain/types";
import type { NarrationProposal } from "./aiPolicyGuard";
import type { AiSettings } from "./aiSettings";

export interface NarratorProviderRequest {
  state: GameState;
  world: ScenarioWorld;
  settings: AiSettings;
}

export type NarratorProviderResult =
  | { status: "success"; proposal: NarrationProposal; provider: string }
  | { status: "unavailable"; message: string; provider: string }
  | { status: "rejected"; message: string; provider: string };

export interface NarratorProvider {
  metadata: {
    kind: AiSettings["provider"];
    label: string;
  };
  narrate(request: NarratorProviderRequest): Promise<NarratorProviderResult>;
}

export const noneNarratorProvider: NarratorProvider = {
  metadata: {
    kind: "none",
    label: "AI disabled"
  },
  async narrate() {
    return {
      status: "unavailable",
      provider: "none",
      message: "AI narration is disabled. The canonical log remains the complete record."
    };
  }
};

export function buildPublicNarrationInput({ state, world }: NarratorProviderRequest) {
  return {
    role: "environment_flavor_only",
    publicSituation: {
      phase: state.phase,
      position: state.position,
      recentEvents: state.log.slice(-5).map((entry) => entry.text)
    },
    allowed: world.aiPolicy.allowed,
    forbidden: world.aiPolicy.forbidden
  };
}
