import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Search, Unlock } from "lucide-react";
import type { Character, ChestState, Command } from "../domain/types";
import { successChance, trapSkill, unlockSkill } from "../domain/chests";
import type { Translator } from "../i18n";

type ChestAction = "investigate" | "disarm" | "unlock";

const ACTION_LABEL_KEYS = {
  investigate: "play.chestInvestigate",
  disarm: "play.chestDisarm",
  unlock: "play.chestUnlock"
} as const;

interface ChestPanelProps {
  chest: ChestState;
  party: Character[];
  t: Translator;
  onCommand: (command: Command) => void;
  onLeave: () => void;
}

function actionLabel(action: ChestAction, t: Translator) {
  return t(ACTION_LABEL_KEYS[action]);
}

function actionCommand(action: ChestAction, characterId: string): Command {
  switch (action) {
    case "investigate": return { type: "investigate_chest", characterId };
    case "disarm": return { type: "disarm_chest", characterId };
    case "unlock": return { type: "unlock_chest", characterId };
  }
}

function chanceFor(action: ChestAction, member: Character, chest: ChestState) {
  if (action === "investigate") return successChance(trapSkill(member), chest.trap?.difficulty ?? 0, 55);
  if (action === "disarm") return successChance(trapSkill(member), chest.trap?.difficulty ?? 0, 45);
  return successChance(unlockSkill(member), chest.lock?.difficulty ?? 0, 45);
}

// IMP-029 — the current-cell chest command surface. Occupies the SAME command region as the movement
// dock (so nothing reflows), and only appears while an unresolved chest sits on the party's cell and no
// fight is on. Controller-first: choosing a risk then focuses the strongest standing handler. An opened
// chest clears immediately and returns this region to exploration without an extra confirmation.
export function ChestPanel({ chest, party, t, onCommand, onLeave }: ChestPanelProps) {
  const firstRef = useRef<HTMLButtonElement>(null);
  const [pendingAction, setPendingAction] = useState<ChestAction | null>(null);
  const knownTrapped = chest.investigateResult === "trapped";
  const locked = Boolean(chest.lock && !chest.unlocked);
  const handlers = useMemo(
    () => party.map((member) => ({ member, able: member.hp > 0 && !member.injury, chance: pendingAction ? chanceFor(pendingAction, member, chest) : 0 })),
    [chest, party, pendingAction]
  );
  const bestHandlerId = pendingAction
    ? handlers.filter((candidate) => candidate.able).reduce<typeof handlers[number] | null>(
      (best, candidate) => !best || candidate.chance > best.chance ? candidate : best,
      null
    )?.member.id
    : null;

  useEffect(() => {
    const focusFirst = () => firstRef.current?.focus();
    focusFirst();
    const timer = window.setTimeout(focusFirst, 60);
    return () => window.clearTimeout(timer);
  }, [bestHandlerId, chest.cellId, chest.disarmAttempted, chest.investigated, chest.unlockAttempted, pendingAction]);

  // T3 — a successful investigation IDENTIFIES the trap ("You spot a needle trap."), not a flat "It is
  // trapped." — mirrors the sprung-trap naming (IMP-061).
  const trapKindLabel = (kind: string | undefined): string =>
    kind === "needle"
      ? t("play.trapNeedle")
      : kind === "gas"
        ? t("play.trapGas")
        : kind === "rune"
          ? t("play.trapRune")
          : kind === "snare"
            ? t("play.trapSnare")
            : t("play.trapUnknown");
  const note = chest.investigateResult === "trapped"
    ? chest.trap?.kind
      ? t("play.chestTrappedKnown", { trap: trapKindLabel(chest.trap.kind) })
      : t("play.chestTrappedNote")
    : chest.investigateResult === "uncertain"
      ? t("play.chestUncertainNote")
      : chest.investigateResult === "clear"
        ? t("play.chestClearNote")
        : locked
          ? t("play.chestLockedNote")
          : t("play.chestClosedNote");

  function chooseHandler(characterId: string) {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    onCommand(actionCommand(action, characterId));
  }

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
      {pendingAction ? (
        <>
          <p className="chest-panel-note" aria-live="polite">{t("play.chestChooseHandler", { action: actionLabel(pendingAction, t) })}</p>
          {handlers.map(({ member, able, chance }) => (
            <button
              type="button"
              key={member.id}
              ref={member.id === bestHandlerId ? firstRef : undefined}
              className="dungeon-command"
              data-testid="chest-handler"
              disabled={!able}
              onClick={() => chooseHandler(member.id)}
            >
              {member.name}　{t("play.chestChance")} {chance}%
            </button>
          ))}
          <button type="button" className="dungeon-command" data-testid="chest-back" onClick={() => setPendingAction(null)}>
            {t("play.chestBack")}
          </button>
        </>
      ) : (
        <>
          {!chest.investigated && (
            <button type="button" ref={firstRef} className="dungeon-command" data-testid="chest-investigate" onClick={() => setPendingAction("investigate")}>
              <Search size={18} />
              {t("play.chestInvestigate")}
            </button>
          )}
          {knownTrapped && !chest.disarmAttempted && (
            <button type="button" ref={chest.investigated ? firstRef : undefined} className="dungeon-command" data-testid="chest-disarm" onClick={() => setPendingAction("disarm")}>
              <KeyRound size={18} />
              {t("play.chestDisarm")}
            </button>
          )}
          {locked && !chest.unlockAttempted && (
            <button type="button" ref={chest.investigated && (!knownTrapped || chest.disarmAttempted) ? firstRef : undefined} className="dungeon-command" data-testid="chest-unlock" onClick={() => setPendingAction("unlock")}>
              <KeyRound size={18} />
              {t("play.chestUnlock")}
            </button>
          )}
          <button type="button" ref={chest.investigated && !knownTrapped && !locked ? firstRef : undefined} className="dungeon-command" data-testid="chest-open" disabled={locked} onClick={() => onCommand({ type: "open_chest" })}>
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
