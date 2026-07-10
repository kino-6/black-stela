import { Gauge, Square } from "lucide-react";
import type { TempoMode } from "../domain/tempo";
import type { Translator } from "../i18n";

interface TempoIndicatorProps {
  mode: Exclude<TempoMode, "idle">;
  step: number;
  speed: "normal" | "fast";
  t: Translator;
  onToggleSpeed: () => void;
  onStop: () => void;
}

// Live repeat/auto readout (Lane X): shows the active mode, the current step, and
// the speed tier while the runner is going, with an always-visible immediate Stop
// so the tempo never reads as a stalled or hidden timer.
export function TempoIndicator({ mode, step, speed, t, onToggleSpeed, onStop }: TempoIndicatorProps) {
  return (
    <div
      className="tempo-indicator"
      data-testid="tempo-indicator"
      role="status"
      aria-live="polite"
      data-controller-active="true"
      data-controller-surface="tempo-indicator"
    >
      <span className="tempo-indicator-dot" aria-hidden="true" />
      <span className="tempo-indicator-mode">
        {t(mode === "combat" ? "tempo.modeCombat" : "tempo.modeDungeon")}
      </span>
      <span className="tempo-indicator-step" data-testid="tempo-step">{t("tempo.step", { step })}</span>
      <button type="button" data-testid="tempo-speed" onClick={onToggleSpeed}>
        <Gauge size={16} />
        {t(speed === "fast" ? "tempo.speedFast" : "tempo.speedNormal")}
      </button>
      <button
        type="button"
        className="primary-action"
        data-controller-cancel="true"
        data-testid="tempo-stop"
        onClick={onStop}
      >
        <Square size={16} />
        {t("tempo.stop")}
      </button>
    </div>
  );
}
