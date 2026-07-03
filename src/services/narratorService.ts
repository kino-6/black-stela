import type { GameState, ScenarioWorld } from "../domain/types";
import type { NarrationProposal } from "./aiPolicyGuard";
import { defaultAiSettings, parseAiSettings, type AiSettings } from "./aiSettings";
import { noneNarratorProvider, type NarratorProvider } from "./narratorProvider";
import { ollamaProvider } from "./providers/ollamaProvider";
import { openAiCompatibleProvider } from "./providers/openAiCompatibleProvider";

const providers: Record<AiSettings["provider"], NarratorProvider> = {
  none: noneNarratorProvider,
  ollama: ollamaProvider,
  "openai-compatible": openAiCompatibleProvider
};

export async function requestLocalNarration(
  state: GameState,
  world: ScenarioWorld,
  endpoint = "http://127.0.0.1:11434/api/generate"
): Promise<NarrationProposal> {
  return requestNarration(state, world, {
    ...defaultAiSettings,
    enabled: state.aiEnabled,
    provider: state.aiEnabled ? "ollama" : "none",
    endpoint
  });
}

export async function requestNarration(
  state: GameState,
  world: ScenarioWorld,
  inputSettings: Partial<AiSettings> = {}
): Promise<NarrationProposal> {
  const settings = parseAiSettings({
    ...defaultAiSettings,
    ...inputSettings
  });
  const provider = settings.enabled ? providers[settings.provider] : noneNarratorProvider;
  const result = await provider.narrate({ state, world, settings });

  if (result.status === "success") {
    return result.proposal;
  }

  if (result.provider === "none") {
    return {
      source: "fallback",
      prose: result.message
    };
  }

  return {
    source: "fallback",
    prose: "The local narrator is unavailable. Exploration continues by deterministic rules."
  };
}
