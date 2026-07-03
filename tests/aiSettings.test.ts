import { describe, expect, it } from "vitest";
import { defaultAiSettings, parseAiSettings } from "../src/services/aiSettings";

describe("AI settings", () => {
  it("defaults to AI off", () => {
    expect(defaultAiSettings).toMatchObject({
      enabled: false,
      provider: "none"
    });
  });

  it("validates settings and falls back safely", () => {
    expect(parseAiSettings({ enabled: true, provider: "openai-compatible", endpoint: "http://127.0.0.1:8080/v1/chat/completions", model: "local" })).toMatchObject({
      enabled: true,
      provider: "openai-compatible",
      model: "local"
    });
    expect(parseAiSettings({ enabled: true, provider: "ollama", endpoint: "not a url" })).toEqual(defaultAiSettings);
  });
});
