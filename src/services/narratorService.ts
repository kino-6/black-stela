import type { GameState, ScenarioWorld } from "../domain/types";
import type { NarrationProposal } from "./aiPolicyGuard";

export async function requestLocalNarration(
  state: GameState,
  world: ScenarioWorld,
  endpoint = "http://127.0.0.1:11434/api/generate"
): Promise<NarrationProposal> {
  if (!state.aiEnabled) {
    return {
      source: "fallback",
      prose: "AI narration is disabled. The canonical log remains the complete record."
    };
  }

  const recentEvents = state.log.slice(-5).map((entry) => entry.text);
  const body = {
    model: "llama3.2",
    stream: false,
    prompt: JSON.stringify({
      role: "environment_flavor_only",
      publicSituation: {
        phase: state.phase,
        position: state.position,
        recentEvents
      },
      allowed: world.aiPolicy.allowed,
      forbidden: world.aiPolicy.forbidden
    })
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Narrator failed with ${response.status}`);
    }

    const data = (await response.json()) as { response?: string };
    return {
      source: "local_ai",
      prose: data.response ?? ""
    };
  } catch {
    return {
      source: "fallback",
      prose: "The local narrator is unavailable. Exploration continues by deterministic rules."
    };
  }
}
