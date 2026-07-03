import type { Translator } from "../i18n";
import type { ScenarioValidationError } from "../domain/scenarioPack";

interface ScenarioValidationPanelProps {
  errors: ScenarioValidationError[];
  t: Translator;
}

export function ScenarioValidationPanel({ errors, t }: ScenarioValidationPanelProps) {
  return (
    <section className="scenario-validation-panel" aria-labelledby="scenario-validation-heading">
      <div className="section-title">
        <h2 id="scenario-validation-heading">{t("scenario.validation")}</h2>
        <span>{t("scenario.blocked")}</span>
      </div>
      <ul>
        {errors.map((error) => (
          <li key={`${error.filePath}:${error.fieldPath}:${error.reason}`}>
            <strong>{error.reason}</strong>
            <dl>
              <div>
                <dt>{t("scenario.file")}</dt>
                <dd>{error.filePath}</dd>
              </div>
              <div>
                <dt>{t("scenario.field")}</dt>
                <dd>{error.fieldPath}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
