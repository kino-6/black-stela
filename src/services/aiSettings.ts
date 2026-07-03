import { z } from "zod";

export const AiSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["none", "ollama", "openai-compatible"]).default("none"),
  endpoint: z.string().url().default("http://127.0.0.1:11434/api/generate"),
  model: z.string().min(1).default("llama3.2"),
  apiKey: z.string().optional(),
  timeoutMs: z.number().int().positive().max(60_000).default(8_000)
});

export type AiSettings = z.infer<typeof AiSettingsSchema>;

export const defaultAiSettings: AiSettings = AiSettingsSchema.parse({});

const SETTINGS_KEY = "black-stela:settings:ai";

export function parseAiSettings(input: unknown): AiSettings {
  const parsed = AiSettingsSchema.safeParse(input);
  return parsed.success ? parsed.data : defaultAiSettings;
}

export function loadAiSettings(storage: Storage | null = getBrowserStorage()): AiSettings {
  const raw = storage?.getItem(SETTINGS_KEY);
  if (!raw) {
    return defaultAiSettings;
  }

  try {
    return parseAiSettings(JSON.parse(raw));
  } catch {
    return defaultAiSettings;
  }
}

export function saveAiSettings(settings: AiSettings, storage: Storage | null = getBrowserStorage()): void {
  storage?.setItem(SETTINGS_KEY, JSON.stringify(AiSettingsSchema.parse(settings)));
}

function getBrowserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}
