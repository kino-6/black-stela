import { useEffect, useRef } from "react";
import { KeyRound, Search, Sparkles, Unlock } from "lucide-react";
import type { ChestState, Command } from "../domain/types";
import type { Translator } from "../i18n";

interface ChestPanelProps {
  chest: ChestState;
  t: Translator;
  onCommand: (command: Command) => void;
  onLeave: () => void;
}

// IMP-029 — the current-cell chest command surface. Occupies the SAME command region as the movement
// dock (so nothing reflows), and only ever appears while a closed/opened chest sits on the party's cell
// and no fight is on. Controller-first: the first action grabs focus; confirm/cancel drive it. Success
// rates and internal difficulty are never shown — only what the party can see (closed / a found trap /
// "can't tell" / opened).
export function ChestPanel({ chest, t, onCommand, onLeave }: ChestPanelProps) {
  const firstRef = useRef<HTMLButtonElement>(null);
  const opened = chest.phase === "opened";
  // Only a DETECTED trap surfaces a disarm option — an "uncertain" investigation must not reveal a
  // hidden trap, so the party gambles on opening instead.
  const knownTrapped = chest.investigateResult === "trapped";

  // Grab the controller cursor onto the chest's first action. A short timeout lands AFTER the combat
  // result screen's own focus handoff and App's focus-rescue settle, so the chest — the only decision
  // on this cell — reliably holds the cursor instead of it falling back to the document body.
  useEffect(() => {
    const focusFirst = () => firstRef.current?.focus();
    focusFirst();
    const timer = window.setTimeout(focusFirst, 60);
    return () => window.clearTimeout(timer);
  }, [chest.cellId, opened, chest.investigated, chest.disarmAttempted]);

  const note = opened
    ? t("play.chestOpenedNote")
    : chest.investigateResult === "trapped"
      ? t("play.chestTrappedNote")
      : chest.investigateResult === "uncertain"
        ? t("play.chestUncertainNote")
        : chest.investigateResult === "clear"
          ? t("play.chestClearNote")
          : t("play.chestClosedNote");

  return (
    <div
      className="command-bar command-dock chest-panel"
      aria-label={t("play.chestHeading")}
      data-controller-active="true"
      data-controller-surface="chest"
      data-testid="chest-panel"
    >
      <p className="chest-panel-note" data-testid="chest-note" aria-live="polite">
        {note}
      </p>
      {opened ? (
        <button
          type="button"
          ref={firstRef}
          className="dungeon-command"
          data-testid="chest-resume"
          onClick={onLeave}
        >
          <Sparkles size={18} />
          {t("play.chestResume")}
        </button>
      ) : (
        <>
          {!chest.investigated && (
            <button
              type="button"
              ref={firstRef}
              className="dungeon-command"
              data-testid="chest-investigate"
              onClick={() => onCommand({ type: "investigate_chest" })}
            >
              <Search size={18} />
              {t("play.chestInvestigate")}
            </button>
          )}
          {knownTrapped && !chest.disarmAttempted && (
            <button
              type="button"
              ref={chest.investigated ? firstRef : undefined}
              className="dungeon-command"
              data-testid="chest-disarm"
              onClick={() => onCommand({ type: "disarm_chest" })}
            >
              <KeyRound size={18} />
              {t("play.chestDisarm")}
            </button>
          )}
          <button
            type="button"
            ref={chest.investigated && !knownTrapped ? firstRef : undefined}
            className="dungeon-command"
            data-testid="chest-open"
            onClick={() => onCommand({ type: "open_chest" })}
          >
            <Unlock size={18} />
            {t("play.chestOpen")}
          </button>
          <button type="button" className="dungeon-command" data-testid="chest-leave" onClick={onLeave}>
            {t("play.chestLeave")}
          </button>
        </>
      )}
    </div>
  );
}
