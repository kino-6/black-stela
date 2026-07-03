import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultWorld } from "../src/data/defaultWorld";
import { addCharacter, createCharacter, createInitialGameState } from "../src/domain/gameState";
import { requestNarration } from "../src/services/narratorService";

const state = addCharacter(createInitialGameState(), createCharacter({ name: "Mira", notes: "Mapper" }));

describe("narrator providers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the none provider when AI is disabled", async () => {
    const proposal = await requestNarration(state, defaultWorld, { enabled: false });

    expect(proposal).toEqual({
      source: "fallback",
      prose: "AI narration is disabled. The canonical log remains the complete record."
    });
  });

  it("sends constrained public input to Ollama and returns a proposal", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ response: "Dust moves in the lamplight." }), { status: 200 })
    );

    const proposal = await requestNarration(state, defaultWorld, {
      enabled: true,
      provider: "ollama",
      endpoint: "http://127.0.0.1:11434/api/generate",
      model: "llama3.2"
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { prompt: string };
    const prompt = JSON.parse(body.prompt) as { role: string; publicSituation: unknown };

    expect(prompt.role).toBe("environment_flavor_only");
    expect(prompt.publicSituation).toMatchObject({ phase: "town" });
    expect(proposal).toEqual({ source: "local_ai", prose: "Dust moves in the lamplight." });
  });

  it("returns a non-crashing fallback when Ollama is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("connection refused"));

    await expect(
      requestNarration(state, defaultWorld, {
        enabled: true,
        provider: "ollama",
        endpoint: "http://127.0.0.1:11434/api/generate",
        model: "llama3.2"
      })
    ).resolves.toMatchObject({
      source: "fallback",
      prose: "The local narrator is unavailable. Exploration continues by deterministic rules."
    });
  });

  it("supports LocalAI/OpenAI-compatible chat completions without mutating state", async () => {
    const before = structuredClone(state);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "A cold draft crosses the stones." } }] }), {
        status: 200
      })
    );

    const proposal = await requestNarration(state, defaultWorld, {
      enabled: true,
      provider: "openai-compatible",
      endpoint: "http://127.0.0.1:8080/v1/chat/completions",
      model: "local-model",
      apiKey: "test-key"
    });

    expect(state).toEqual(before);
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8080/v1/chat/completions");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(proposal).toEqual({ source: "local_ai", prose: "A cold draft crosses the stones." });
  });
});
