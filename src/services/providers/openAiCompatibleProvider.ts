import { NARRATION_PROMPT_VERSION, buildPublicNarrationInput, type NarratorProvider } from "../narratorProvider";

export const openAiCompatibleProvider: NarratorProvider = {
  metadata: {
    kind: "openai-compatible",
    label: "LocalAI / OpenAI-compatible",
    promptVersion: NARRATION_PROMPT_VERSION
  },
  async checkHealth(request) {
    try {
      const response = await fetch(request.settings.endpoint, { method: "GET" });
      return { provider: "openai-compatible", healthy: response.ok || response.status === 405, detail: `HTTP ${response.status}` };
    } catch (error) {
      return { provider: "openai-compatible", healthy: false, detail: error instanceof Error ? error.message : "unreachable" };
    }
  },
  async narrate(request) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (request.settings.apiKey) {
        headers.Authorization = `Bearer ${request.settings.apiKey}`;
      }

      const response = await fetch(request.settings.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: request.settings.model,
          messages: [
            {
              role: "system",
              content: "Describe only the environment around the supplied subject. Never speak, act, decide, or feel for a player character."
            },
            {
              role: "user",
              content: JSON.stringify(buildPublicNarrationInput(request))
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        return { status: "unavailable", provider: "openai-compatible", message: `Narrator failed with ${response.status}` };
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return {
        status: "success",
        provider: "openai-compatible",
        promptVersion: NARRATION_PROMPT_VERSION,
        model: request.settings.model,
        proposal: {
          source: "local_ai",
          prose: data.choices?.[0]?.message?.content ?? "",
          subjectId: request.subjectId,
          tone: "observe"
        }
      };
    } catch (error) {
      return {
        status: "unavailable",
        provider: "openai-compatible",
        message: error instanceof Error ? error.message : "OpenAI-compatible narrator is unavailable."
      };
    }
  }
};
