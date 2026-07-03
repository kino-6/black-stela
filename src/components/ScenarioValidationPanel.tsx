import type { Translator } from "../i18n";
import type { ScenarioValidationError } from "../domain/scenarioPack";

interface ScenarioValidationPanelProps {
  errors: ScenarioValidationError[];
  t: Translator;
}

export function ScenarioValidationPanel({ errors, t }: ScenarioValidationPanelProps) {
  const blockingErrors = errors.filter((error) => error.severity !== "warning");
  return (
    <section className="scenario-validation-panel" aria-labelledby="scenario-validation-heading">
      <div className="section-title">
        <h2 id="scenario-validation-heading">{t("scenario.validation")}</h2>
        <span>{blockingErrors.length > 0 ? t("scenario.blocked") : t("scenario.warnings")}</span>
      </div>
      <ul>
        {errors.map((error) => (
          <li
            key={`${error.filePath}:${error.fieldPath}:${error.reason}`}
            className={error.severity === "warning" ? "validation-warning" : "validation-error"}
          >
            <small>{error.severity === "warning" ? t("scenario.warning") : t("scenario.error")}</small>
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
