import {
  DoorClosed,
  DoorOpen,
  Gamepad2,
  LogOut,
  Map as MapIcon,
  Repeat2,
  Search,
  ShieldCheck,
  Square,
  UsersRound,
  Volume2
} from "lucide-react";
import type { Command } from "../domain/types";
import type { Translator } from "../i18n";

interface DungeonCommandDockProps {
  t: Translator;
  onCommand: (command: Command) => void;
  isTempoRunning: boolean;
  onToggleTempo: () => void;
  onOpenPartyMenu: () => void;
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
  onOpenPartyMenu,
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
      {/* IMP-026: movement is directional input only — no turn/strafe/forward/back
          buttons duplicating the controller. A compact, non-focusable legend outside
          the focus order reminds a player of the keys without competing for attention. */}
      <p className="dungeon-move-legend" data-testid="dungeon-move-legend" aria-hidden="true">
        <Gamepad2 size={15} />
        {t("play.moveHint")}
      </p>
      <button type="button" className="dungeon-command" onClick={() => onCommand({ type: "search" })}>
        <Search size={18} />
        {t("play.search")}
      </button>
      <button type="button" className="dungeon-command" onClick={() => onCommand({ type: "listen" })}>
        <Volume2 size={18} />
        {t("play.listen")}
      </button>
      <button type="button" className="dungeon-command" onClick={onOpenPartyMenu} data-testid="party-menu-open">
        <UsersRound size={18} />
        {t("partyMenu.title")}
      </button>
      <button type="button" className="dungeon-command" onClick={onOpenFullMap} data-testid="full-map-open">
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
        // #68: a fixed disabled button (same footprint as Use stairs) instead of a
        // variable-width clue tile — the dock never reflows. The clue rides in the
        // tooltip/aria-label rather than stretching the command row.
        <button
          type="button"
          className="context-command"
          data-testid="descent-locked"
          disabled
          title={stairGateClue ?? t("play.descentLocked")}
          aria-label={stairGateClue ?? t("play.descentLocked")}
        >
          <DoorClosed size={18} />
          {t("play.descentLockedShort")}
        </button>
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
      {/* IMP-026: auto-explore is a compact exploration STATUS with an immediate
          interrupt, not the first command in every room. It rides at the end of the
          dock, visually distinct from the current-cell decisions. */}
      <button
        type="button"
        className="tempo-status"
        data-testid="dungeon-tempo"
        aria-pressed={isTempoRunning}
        onClick={onToggleTempo}
      >
        {isTempoRunning ? <Square size={16} /> : <Repeat2 size={16} />}
        {isTempoRunning ? t("tempo.stop") : t("tempo.auto")}
      </button>
    </div>
  );
}
