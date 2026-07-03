import { describe, expect, it } from "vitest";
import { defaultAiSettings, loadAiSettings, parseAiSettings } from "../src/services/aiSettings";

describe("AI settings", () => {
  it("defaults to internal local AI on", () => {
    expect(defaultAiSettings).toMatchObject({
      enabled: true,
      provider: "ollama"
    });
  });

  it("normalizes persisted runtime settings so users cannot disable the concept path", () => {
    const storage = new MapStorage({
      "black-stela:settings:ai": JSON.stringify({ enabled: false, provider: "none" })
    });

    expect(loadAiSettings(storage)).toMatchObject({
      enabled: true,
      provider: "ollama"
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

class MapStorage implements Storage {
  readonly length: number;

  constructor(private values: Record<string, string>) {
    this.length = Object.keys(values).length;
  }

  clear(): void {
    this.values = {};
  }

  getItem(key: string): string | null {
    return this.values[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.values)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.values[key];
  }

  setItem(key: string, value: string): void {
    this.values[key] = value;
  }
}
