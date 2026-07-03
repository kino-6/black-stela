import type { Translator } from "../i18n";
import type { ScenarioValidationError } from "../domain/scenarioPack";

interface ScenarioValidationPanelProps {
  errors: ScenarioValidationError[];
  t: Translator;
}

export function ScenarioValidationPanel({ errors, t }: ScenarioValidationPanelProps) {
  const blockingErrors = errors.filter((error) => error.severity !== "warning");
  const groupedErrors = groupByFile(errors);
  return (
    <section className="scenario-validation-panel" aria-labelledby="scenario-validation-heading">
      <div className="section-title">
        <h2 id="scenario-validation-heading">{t("scenario.validation")}</h2>
        <span>
          {blockingErrors.length > 0 ? t("scenario.blocked") : t("scenario.warnings")} ·{" "}
          {t("scenario.issues", { count: errors.length })}
        </span>
      </div>
      <div className="validation-groups">
        {groupedErrors.map((group) => (
          <section className="validation-file-group" key={group.filePath}>
            <div className="validation-file-heading">
              <strong>{group.filePath}</strong>
              <span>{t("scenario.issues", { count: group.errors.length })}</span>
            </div>
            <ul>
              {group.errors.map((error) => {
                const category = categorizeError(error);
                return (
                  <li
                    key={`${error.filePath}:${error.fieldPath}:${error.reason}`}
                    className={error.severity === "warning" ? "validation-warning" : "validation-error"}
                  >
                    <small>{error.severity === "warning" ? t("scenario.warning") : t("scenario.error")}</small>
                    <strong>{error.reason}</strong>
                    <dl>
                      <div>
                        <dt>{t("scenario.category")}</dt>
                        <dd>{t(`scenario.${category}` as Parameters<Translator>[0])}</dd>
                      </div>
                      <div>
                        <dt>{t("scenario.field")}</dt>
                        <dd>{error.fieldPath}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function groupByFile(errors: ScenarioValidationError[]) {
  const groups = new Map<string, ScenarioValidationError[]>();
  for (const error of errors) {
    groups.set(error.filePath, [...(groups.get(error.filePath) ?? []), error]);
  }

  return Array.from(groups, ([filePath, fileErrors]) => ({ filePath, errors: fileErrors }));
}

function categorizeError(error: ScenarioValidationError) {
  const haystack = `${error.fieldPath} ${error.reason}`.toLowerCase();
  if (haystack.includes("reach") || haystack.includes("route") || haystack.includes("exit")) {
    return "categoryReachability";
  }
  if (haystack.includes("floor") || haystack.includes("progress") || haystack.includes("return")) {
    return "categoryProgression";
  }
  if (haystack.includes("japanese") || haystack.includes("local")) {
    return "categoryLocale";
  }
  if (haystack.includes("item") || haystack.includes("enemy") || haystack.includes("table") || haystack.includes("flag")) {
    return "categoryCatalog";
  }
  if (haystack.includes("policy") || haystack.includes("ai")) {
    return "categoryPolicy";
  }
  if (haystack.includes("manifest") || haystack.includes("schema") || haystack.includes("missing")) {
    return "categorySchema";
  }
  return "categoryUnknown";
}
