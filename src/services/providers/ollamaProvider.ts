import { buildPublicNarrationInput, type NarratorProvider } from "../narratorProvider";

export const ollamaProvider: NarratorProvider = {
  metadata: {
    kind: "ollama",
    label: "Ollama"
  },
  async narrate(request) {
    try {
      const response = await fetchWithTimeout(
        request.settings.endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: request.settings.model,
            stream: false,
            prompt: JSON.stringify(buildPublicNarrationInput(request))
          })
        },
        request.settings.timeoutMs
      );

      if (!response.ok) {
        return { status: "unavailable", provider: "ollama", message: `Narrator failed with ${response.status}` };
      }

      const data = (await response.json()) as { response?: string };
      return {
        status: "success",
        provider: "ollama",
        proposal: {
          source: "local_ai",
          prose: data.response ?? ""
        }
      };
    } catch (error) {
      return {
        status: "unavailable",
        provider: "ollama",
        message: error instanceof Error ? error.message : "Ollama narrator is unavailable."
      };
    }
  }
};

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
