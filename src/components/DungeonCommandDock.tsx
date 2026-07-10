import {
  ArrowDown,
  ChevronsLeft,
  ChevronsRight,
  DoorClosed,
  DoorOpen,
  Footprints,
  LogOut,
  Map as MapIcon,
  Repeat2,
  RotateCcw,
  RotateCw,
  Search,
  ShieldCheck,
  Square,
  Tent,
  Volume2
} from "lucide-react";
import type { Command } from "../domain/types";
import type { Translator } from "../i18n";

interface DungeonCommandDockProps {
  t: Translator;
  onCommand: (command: Command) => void;
  isTempoRunning: boolean;
  onToggleTempo: () => void;
  onOpenCamp: () => void;
  onOpenFullMap: () => void;
  debugMode: boolean;
  onAutoExplore: () => void;
  canUseStairs: boolean;
  blockingStairGate: boolean;
  stairGateClue: string | null;
  onUseStairs: () => void;
  canReturnToTown: boolean;
  returnViaStairs: boolean;
  onReturnToTown: () => void;
  showEscapeItem: boolean;
  onUseEscapeItem: () => void;
}

// The dungeon movement/context command dock (extracted verbatim from App's render).
export function DungeonCommandDock({
  t,
  onCommand,
  isTempoRunning,
  onToggleTempo,
  onOpenCamp,
  onOpenFullMap,
  debugMode,
  onAutoExplore,
  canUseStairs,
  blockingStairGate,
  stairGateClue,
  onUseStairs,
  canReturnToTown,
  returnViaStairs,
  onReturnToTown,
  showEscapeItem,
  onUseEscapeItem
}: DungeonCommandDockProps) {
  return (
    <div
      className="command-bar command-dock"
      aria-label={t("play.dungeonCommands")}
      data-controller-active="true"
      data-controller-surface="dungeon-commands"
      data-testid="dungeon-command-window"
    >
      <button type="button" aria-pressed={isTempoRunning} onClick={onToggleTempo}>
        {isTempoRunning ? <Square size={18} /> : <Repeat2 size={18} />}
        {isTempoRunning ? t("tempo.stop") : t("tempo.repeat")}
      </button>
      <button type="button" className="move-command" aria-label={t("play.turnLeft")} onClick={() => onCommand({ type: "turn_left" })}>
        <RotateCcw size={18} />
        {t("play.turnLeft")}
      </button>
      <button type="button" className="move-command" aria-label={t("play.strafeLeft")} onClick={() => onCommand({ type: "strafe_left" })}>
        <ChevronsLeft size={18} />
        {t("play.strafeLeft")}
      </button>
      <button type="button" className="move-command" onClick={() => onCommand({ type: "move_forward" })}>
        <Footprints size={18} />
        {t("play.move")}
      </button>
      <button type="button" className="move-command" onClick={() => onCommand({ type: "move_backward" })}>
        <ArrowDown size={18} />
        {t("play.moveBack")}
      </button>
      <button type="button" className="move-command" aria-label={t("play.strafeRight")} onClick={() => onCommand({ type: "strafe_right" })}>
        <ChevronsRight size={18} />
        {t("play.strafeRight")}
      </button>
      <button type="button" className="move-command" aria-label={t("play.turnRight")} onClick={() => onCommand({ type: "turn_right" })}>
        <RotateCw size={18} />
        {t("play.turnRight")}
      </button>
      <button type="button" onClick={() => onCommand({ type: "search" })}>
        <Search size={18} />
        {t("play.search")}
      </button>
      <button type="button" onClick={() => onCommand({ type: "listen" })}>
        <Volume2 size={18} />
        {t("play.listen")}
      </button>
      <button type="button" onClick={onOpenCamp} data-testid="camp-open">
        <Tent size={18} />
        {t("play.camp")}
      </button>
      <button type="button" onClick={onOpenFullMap} data-testid="full-map-open">
        <MapIcon size={18} />
        {t("play.fullMap")}
      </button>
      {debugMode && (
        <>
          <button
            type="button"
            className="context-command"
            data-testid="debug-auto-explore"
            onClick={onAutoExplore}
          >
            <MapIcon size={18} />
            {t("debug.autoExplore")}
          </button>
          <button
            type="button"
            className="context-command"
            data-testid="debug-revive-party-dungeon"
            onClick={() => onCommand({ type: "debug_revive_party" })}
          >
            <ShieldCheck size={18} />
            {t("debug.reviveParty")}
          </button>
        </>
      )}
      {canUseStairs && !blockingStairGate && (
        <button type="button" className="context-command" onClick={onUseStairs}>
          <DoorOpen size={18} />
          {t("play.useStairs")}
        </button>
      )}
      {canUseStairs && blockingStairGate && (
        <div className="descent-locked" data-testid="descent-locked">
          <DoorClosed size={18} />
          <span>{stairGateClue ?? t("play.descentLocked")}</span>
        </div>
      )}
      {canReturnToTown && (
        <button type="button" className="context-command" onClick={onReturnToTown}>
          <LogOut size={18} />
          {returnViaStairs ? t("play.useReturnStairs") : t("play.useReturnMarker")}
        </button>
      )}
      {showEscapeItem && (
        <button
          type="button"
          className="context-command"
          data-testid="use-return-charm"
          onClick={onUseEscapeItem}
        >
          <LogOut size={18} />
          {t("play.useReturnCharm")}
        </button>
      )}
    </div>
  );
}
