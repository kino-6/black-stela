import { buildPublicNarrationInput, type NarratorProvider } from "../narratorProvider";

export const openAiCompatibleProvider: NarratorProvider = {
  metadata: {
    kind: "openai-compatible",
    label: "LocalAI / OpenAI-compatible"
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
              content: "You only provide environmental flavor. Do not speak or act for player characters."
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
        proposal: {
          source: "local_ai",
          prose: data.choices?.[0]?.message?.content ?? ""
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
