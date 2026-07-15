import { NARRATION_PROMPT_VERSION, buildPublicNarrationInput, type NarratorProvider } from "../narratorProvider";

export const ollamaProvider: NarratorProvider = {
  metadata: {
    kind: "ollama",
    label: "Ollama",
    promptVersion: NARRATION_PROMPT_VERSION
  },
  async checkHealth(request) {
    try {
      const response = await fetchWithTimeout(request.settings.endpoint, { method: "GET" }, request.settings.timeoutMs);
      return { provider: "ollama", healthy: response.ok || response.status === 405, detail: `HTTP ${response.status}` };
    } catch (error) {
      return { provider: "ollama", healthy: false, detail: error instanceof Error ? error.message : "unreachable" };
    }
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
        promptVersion: NARRATION_PROMPT_VERSION,
        model: request.settings.model,
        proposal: {
          source: "local_ai",
          prose: data.response ?? "",
          subjectId: request.subjectId,
          tone: "observe"
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
