import { useState } from "react";
import type { Translator } from "../i18n";
import type { Locale } from "../i18n";
import { isAutosaveSlot, manualSlotIndex } from "../domain/saveData";
import type { SaveSlotSummary } from "../services/saveRepository";

type ValidSave = Extract<SaveSlotSummary, { status: "valid" }>;

// U4: the Load browser. Lists every valid save (its own autosave + up to three manual slots PER
// scenario), newest first, so the player can resume any run — not just the single most-recent one the
// title's Continue jumps to. Delete is guarded by an inline confirm so a save is never one press from gone.
export function SaveBrowser({
  saves,
  t,
  locale,
  onLoad,
  onDelete,
  onBack
}: {
  saves: ValidSave[];
  t: Translator;
  locale: Locale;
  onLoad: (slotId: string) => void;
  onDelete: (slotId: string) => void;
  onBack: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const slotLabel = (slotId: string) => {
    if (isAutosaveSlot(slotId)) return t("save.autosave");
    const index = manualSlotIndex(slotId);
    return index ? t("save.manualSlot", { n: index }) : slotId;
  };

  return (
    <section
      className="save-browser"
      aria-labelledby="save-browser-heading"
      data-controller-active="true"
      data-controller-surface="save-browser"
      data-testid="save-browser"
    >
      <h2 id="save-browser-heading">{t("save.browserTitle")}</h2>
      {saves.length === 0 ? (
        <p className="origin-note" data-testid="save-browser-empty">{t("save.noSaves")}</p>
      ) : (
        <ul className="save-list">
          {saves.map((save) => (
            <li key={save.slotId} className="save-row" data-testid={`save-row-${save.slotId}`}>
              <div className="save-row-info">
                <span className="save-row-title">{save.title}</span>
                <span className="save-row-slot">{slotLabel(save.slotId)}</span>
                <span className="save-row-time">{new Date(save.savedAt).toLocaleString(locale)}</span>
              </div>
              <div className="save-row-actions">
                {confirmingDelete === save.slotId ? (
                  <>
                    <button
                      type="button"
                      className="danger-action"
                      data-testid={`save-delete-confirm-${save.slotId}`}
                      onClick={() => {
                        onDelete(save.slotId);
                        setConfirmingDelete(null);
                      }}
                    >
                      {t("title.deleteConfirm")}
                    </button>
                    <button type="button" onClick={() => setConfirmingDelete(null)}>
                      {t("title.deleteCancel")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="primary-action"
                      data-testid={`save-load-${save.slotId}`}
                      onClick={() => onLoad(save.slotId)}
                    >
                      {t("save.load")}
                    </button>
                    <button
                      type="button"
                      data-testid={`save-delete-${save.slotId}`}
                      onClick={() => setConfirmingDelete(save.slotId)}
                    >
                      {t("title.deleteSlot")}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" data-controller-cancel="true" data-testid="save-browser-back" onClick={onBack}>
        {t("party.back")}
      </button>
    </section>
  );
}
