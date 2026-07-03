import { useEffect, useState } from "react";
import type { AiSettings } from "../services/aiSettings";
import type { Translator } from "../i18n";

interface AiSettingsPanelProps {
  settings: AiSettings;
  t: Translator;
  onChange: (settings: AiSettings) => void;
}

export function AiSettingsPanel({ settings, t, onChange }: AiSettingsPanelProps) {
  const [endpointDraft, setEndpointDraft] = useState(settings.endpoint);
  const [error, setError] = useState("");

  useEffect(() => {
    setEndpointDraft(settings.endpoint);
  }, [settings.endpoint]);

  function commitEndpoint(value: string) {
    try {
      new URL(value);
      setError("");
      onChange({ ...settings, endpoint: value });
    } catch {
      setError(t("ai.invalidEndpoint"));
    }
  }

  return (
    <section className="ai-settings-panel" aria-labelledby="ai-settings-heading">
      <div className="section-title">
        <h3 id="ai-settings-heading">{t("ai.settings")}</h3>
        <span>{settings.enabled ? t("ai.local") : t("ai.disabled")}</span>
      </div>
      <label className="inline-toggle">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
        />
        {t("ai.enabled")}
      </label>
      <label>
        {t("ai.provider")}
        <select
          value={settings.provider}
          onChange={(event) => onChange({ ...settings, provider: event.target.value as AiSettings["provider"] })}
        >
          <option value="none">{t("ai.none")}</option>
          <option value="ollama">{t("ai.ollama")}</option>
          <option value="openai-compatible">{t("ai.openAiCompatible")}</option>
        </select>
      </label>
      <label>
        {t("ai.endpoint")}
        <input
          value={endpointDraft}
          onBlur={() => commitEndpoint(endpointDraft)}
          onChange={(event) => setEndpointDraft(event.target.value)}
        />
      </label>
      <label>
        {t("ai.model")}
        <input value={settings.model} onChange={(event) => onChange({ ...settings, model: event.target.value })} />
      </label>
      <label>
        {t("ai.apiKey")}
        <input value={settings.apiKey ?? ""} onChange={(event) => onChange({ ...settings, apiKey: event.target.value || undefined })} />
      </label>
      {error && <strong className="panel-error">{error}</strong>}
    </section>
  );
}
