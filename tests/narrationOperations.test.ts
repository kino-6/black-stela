import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { checkNarratorHealth, requestNarration } from "../src/services/narratorService";
import {
  clearNarrationDiagnostics,
  getNarrationDiagnostics
} from "../src/services/narrationDiagnostics";
import { applyNarrationProposal } from "../src/services/aiPolicyGuard";
import { NARRATION_PROMPT_VERSION, buildPublicNarrationInput } from "../src/services/narratorProvider";
import { defaultAiSettings } from "../src/services/aiSettings";

const state = addCharacter(
  createInitialGameState(),
  createCharacter({ name: "Mira Ashford", notes: "Keeps a secret map." })
);

describe("hidden local narration operations (Lane H)", () => {
  beforeEach(() => clearNarrationDiagnostics());
  afterEach(() => vi.restoreAllMocks());

  it("health check reports the bypassed provider as healthy without touching the game", () => {
    return checkNarratorHealth(state, defaultWorld, { enabled: false }).then((health) => {
      expect(health).toEqual({
        provider: "none",
        healthy: true,
        detail: "Narration is bypassed; the deterministic log is the record."
      });
    });
  });

  it("health check reports an unreachable local provider as unhealthy (never throws)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("connection refused"));
    const health = await checkNarratorHealth(state, defaultWorld, { enabled: true, provider: "ollama" });
    expect(health.provider).toBe("ollama");
    expect(health.healthy).toBe(false);
  });

  it("records a dev diagnostic (with prompt version) when the provider is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("connection refused"));
    await requestNarration(state, defaultWorld, { enabled: true, provider: "ollama", model: "llama3.2" });

    const [entry] = getNarrationDiagnostics();
    expect(entry).toMatchObject({
      provider: "ollama",
      outcome: "unavailable",
      promptVersion: NARRATION_PROMPT_VERSION,
      model: "llama3.2"
    });
  });

  it("blocks + diagnoses narration that tries to speak for a player character", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ response: 'Mira Ashford says "we go east."' }), { status: 200 })
    );
    const proposal = await requestNarration(state, defaultWorld, { enabled: true, provider: "ollama" });

    // The offending line never reaches the player — deterministic fallback instead.
    expect(proposal.source).toBe("fallback");
    expect(proposal.prose).not.toContain("Mira");
    expect(getNarrationDiagnostics().at(-1)).toMatchObject({ outcome: "guard_rejected", provider: "ollama" });
  });

  it("never mutates GameState (non-canonical)", () => {
    const after = applyNarrationProposal(state, { source: "local_ai", prose: "The lamps gutter." });
    expect(after).toEqual(state);
    expect(after).not.toBe(state);
  });

  it("sends no player-character identity to the provider", () => {
    const input = buildPublicNarrationInput({ state, world: defaultWorld, settings: defaultAiSettings });
    const serialized = JSON.stringify(input);
    expect(serialized).not.toContain("Mira Ashford");
    expect(serialized).not.toContain("secret map");
    expect(input.role).toBe("environment_flavor_only");
    expect(input.promptVersion).toBe(NARRATION_PROMPT_VERSION);
  });
});
