import { FolderOpen, Save, Upload } from "lucide-react";
import { debugProgressValues, type DebugProgress } from "../debug/debugStart";
import type { GameState } from "../domain/types";
import { formatDebugProgress, formatPhase } from "../ui/format";
import type { Translator } from "../i18n";
import type { SaveSlotSummary } from "../services/saveRepository";

interface DebugPanelProps {
  open: boolean;
  /** Debug mode is scenario-aware: pick which content/worlds/<id> to debug. */
  scenarios: { worldId: string; title: string }[];
  worldId: string;
  onChangeWorld: (worldId: string) => void;
  onToggle: () => void;
  visitedCount: number;
  roomTotal: number;
  phase: GameState["phase"];
  t: Translator;
  progress: DebugProgress;
  onChangeProgress: (value: string) => void;
  onLoadProgress: () => void;
  onRunHeadless: () => void;
  onImportPack: (files: FileList | null) => void;
  saveSlotId: string;
  onChangeSlot: (value: string) => void;
  saveSlots: SaveSlotSummary[];
  onSave: () => void;
  onLoad: () => void;
  headlessStatus: string;
  saveStatus: string;
  scenarioImportStatus: string;
}

// The debug tools panel (collapsed by default). Extracted verbatim from App's
// render; pure helpers/icons are imported here rather than threaded as props.
export function DebugPanel({
  open,
  scenarios,
  worldId,
  onChangeWorld,
  onToggle,
  visitedCount,
  roomTotal,
  phase,
  t,
  progress,
  onChangeProgress,
  onLoadProgress,
  onRunHeadless,
  onImportPack,
  saveSlotId,
  onChangeSlot,
  saveSlots,
  onSave,
  onLoad,
  headlessStatus,
  saveStatus,
  scenarioImportStatus
}: DebugPanelProps) {
  return (
    <section className={`debug-panel${open ? "" : " collapsed"}`} aria-labelledby="debug-heading">
      <div>
        <h2 id="debug-heading">{t("debug.heading")}</h2>
        <p>
          {t("debug.visited", {
            visited: visitedCount,
            total: roomTotal,
            phase: formatPhase(phase, t)
          })}
        </p>
      </div>
      <button
        type="button"
        className="debug-panel-toggle"
        data-testid="debug-panel-toggle"
        onClick={onToggle}
      >
        {open ? t("debug.collapse") : t("debug.expand")}
      </button>
      {open && (
        <>
          <label>
            {t("debug.scenario")}
            <select
              value={worldId}
              data-testid="debug-scenario"
              onChange={(event) => onChangeWorld(event.target.value)}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.worldId} value={scenario.worldId}>
                  {scenario.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("debug.progress")}
            <select value={progress} onChange={(event) => onChangeProgress(event.target.value)}>
              {debugProgressValues.map((value) => (
                <option key={value} value={value}>
                  {formatDebugProgress(value, t)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onLoadProgress}>{t("debug.loadProgress")}</button>
          <button type="button" onClick={onRunHeadless}>{t("debug.headlessReachability")}</button>
          <label className="scenario-import-control">
            <Upload size={18} />
            {t("scenario.importPack")}
            <input
              data-testid="scenario-pack-input"
              type="file"
              multiple
              accept=".md,.yaml,.yml,.json,text/markdown,text/plain"
              onChange={(event) => onImportPack(event.target.files)}
            />
          </label>
          <div className="dev-save-controls" aria-label={t("save.devControls")}>
            <label>
              {t("save.slot")}
              <input
                list="save-slots"
                value={saveSlotId}
                onChange={(event) => onChangeSlot(event.target.value)}
                aria-label={t("save.slotInput")}
              />
            </label>
            <datalist id="save-slots">
              {saveSlots.map((slot) => (
                <option key={slot.slotId} value={slot.slotId}>
                  {slot.status === "valid" ? slot.savedAt : t("save.corrupt")}
                </option>
              ))}
            </datalist>
            <button type="button" onClick={onSave}>
              <Save size={18} />
              {t("save.save")}
            </button>
            <button type="button" onClick={onLoad}>
              <FolderOpen size={18} />
              {t("save.load")}
            </button>
          </div>
          {headlessStatus && <strong>{headlessStatus}</strong>}
          {saveStatus && <strong>{saveStatus}</strong>}
          {scenarioImportStatus && <strong>{scenarioImportStatus}</strong>}
        </>
      )}
    </section>
  );
}
