import type { GameState, ScenarioWorld } from "../domain/types";
import { guardNarration, type NarrationProposal } from "./aiPolicyGuard";
import { defaultAiSettings, parseAiSettings, type AiSettings } from "./aiSettings";
import {
  noneNarratorProvider,
  type NarratorProvider,
  type NarratorProviderHealth
} from "./narratorProvider";
import { recordNarrationDiagnostic } from "./narrationDiagnostics";
import { ollamaProvider } from "./providers/ollamaProvider";
import { openAiCompatibleProvider } from "./providers/openAiCompatibleProvider";

const providers: Record<AiSettings["provider"], NarratorProvider> = {
  none: noneNarratorProvider,
  ollama: ollamaProvider,
  "openai-compatible": openAiCompatibleProvider
};

function pickProvider(settings: AiSettings): NarratorProvider {
  return settings.enabled ? providers[settings.provider] : noneNarratorProvider;
}

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

// Hidden, developer-facing health probe. Background-only: it never throws and never
// touches game state or the player-facing UI. Operators use it to see whether the
// local provider is reachable when narration silently falls back.
export async function checkNarratorHealth(
  state: GameState,
  world: ScenarioWorld,
  inputSettings: Partial<AiSettings> = {}
): Promise<NarratorProviderHealth> {
  const settings = parseAiSettings({ ...defaultAiSettings, ...inputSettings });
  const provider = pickProvider(settings);
  try {
    return await provider.checkHealth({ state, world, settings });
  } catch (error) {
    return {
      provider: provider.metadata.kind,
      healthy: false,
      detail: error instanceof Error ? error.message : "health check failed"
    };
  }
}

export async function requestNarration(
  state: GameState,
  world: ScenarioWorld,
  inputSettings: Partial<AiSettings> = {},
  context: { subjectId?: string } = {}
): Promise<NarrationProposal> {
  const settings = parseAiSettings({
    ...defaultAiSettings,
    ...inputSettings
  });
  const provider = pickProvider(settings);
  const result = await provider.narrate({ state, world, settings, subjectId: context.subjectId });

  if (result.status === "success") {
    // Background flavor is non-canonical: it must pass the policy guard (no speaking
    // or acting for player characters, no scenario-forbidden content) before use.
    // A blocked line is recorded for developers and replaced by deterministic text.
    const guarded = guardNarration(state, world, result.proposal, context.subjectId);
    if (guarded.accepted) {
      return {
        source: result.proposal.source,
        prose: guarded.prose,
        ...(result.proposal.subjectId ? { subjectId: result.proposal.subjectId } : {}),
        ...(result.proposal.subjectId && result.proposal.tone ? { tone: result.proposal.tone } : {})
      };
    }

    recordNarrationDiagnostic({
      provider: result.provider,
      outcome: "guard_rejected",
      message: guarded.reason ?? "Narration blocked by the policy guard.",
      promptVersion: result.promptVersion,
      model: result.model,
      turn: state.turn
    });
    return {
      source: "fallback",
      prose: "The local narrator is unavailable. Exploration continues by deterministic rules."
    };
  }

  if (result.provider === "none") {
    return {
      source: "fallback",
      prose: result.message
    };
  }

  // Unavailable or provider-rejected: record for developer diagnostics, fall back.
  recordNarrationDiagnostic({
    provider: result.provider,
    outcome: result.status,
    message: result.message,
    promptVersion: provider.metadata.promptVersion,
    model: settings.model,
    turn: state.turn
  });
  return {
    source: "fallback",
    prose: "The local narrator is unavailable. Exploration continues by deterministic rules."
  };
}
