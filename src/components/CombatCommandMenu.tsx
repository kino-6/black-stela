import { useEffect, useMemo, useRef, useState } from "react";
import { SPELLS, type SpellId } from "../domain/spells";
import type { Character, CombatEnemyGroup } from "../domain/types";
import type { Translator } from "../i18n";

const SPELL_LABEL_KEY: Record<SpellId, "play.spellHeal" | "play.spellFirebolt" | "play.spellSleep"> = {
  heal: "play.spellHeal",
  firebolt: "play.spellFirebolt",
  sleep: "play.spellSleep"
};

interface CombatCommandMenuProps {
  actor: Character;
  livingGroups: CombatEnemyGroup[];
  spells: SpellId[];
  canAttack: boolean;
  hasItem: boolean;
  t: Translator;
  onQueueAttack: (groupId: string) => void;
  onQueueSpell: (spellId: SpellId, groupId: string | null) => void;
  onQueueDefend: () => void;
  onQueueItem: () => void;
  onUndo: () => void;
}

type MenuView = "command" | "attackTarget" | "spell" | "spellTarget";
type CommandKind = "attack" | "spell" | "item" | "defend";

// A nested, cursor-first combat command menu (コマンドRPG). The front-to-back actor
// is handed a command list (たたかう / じゅもん / どうぐ / ぼうぎょ); ↑↓ move the
// cursor, Enter confirms into a target/spell submenu, Esc backs out (and, at the top
// level, undoes the previous actor). Fully keyboard-navigable — the point is a menu,
// not a flat button toolbar.
export function CombatCommandMenu({
  actor,
  livingGroups,
  spells,
  canAttack,
  hasItem,
  t,
  onQueueAttack,
  onQueueSpell,
  onQueueDefend,
  onQueueItem,
  onUndo
}: CombatCommandMenuProps) {
  const [view, setView] = useState<MenuView>("command");
  const [cursor, setCursor] = useState(0);
  const [pendingSpell, setPendingSpell] = useState<SpellId | null>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);

  const commands = useMemo(() => {
    const list: { kind: CommandKind; label: string; enabled: boolean }[] = [];
    list.push({ kind: "attack", label: t("play.attack"), enabled: canAttack });
    if (spells.length > 0) {
      list.push({ kind: "spell", label: t("play.spell"), enabled: true });
    }
    if (hasItem) {
      list.push({ kind: "item", label: t("play.useItem"), enabled: true });
    }
    list.push({ kind: "defend", label: t("play.defend"), enabled: true });
    return list;
  }, [canAttack, spells.length, hasItem, t]);

  // Reset to the command list whenever the actor being commanded changes, landing
  // the cursor on the first ENABLED command so Enter always does something valid.
  useEffect(() => {
    const firstEnabled = commands.findIndex((command) => command.enabled);
    setView("command");
    setCursor(firstEnabled < 0 ? 0 : firstEnabled);
    setPendingSpell(null);
  }, [actor.id, commands]);

  // Roving tabindex: the selected row keeps keyboard focus, so Enter/Space activate
  // it natively and the surface is always keyboard-ready.
  useEffect(() => {
    selectedButtonRef.current?.focus();
  }, [actor.id, view, cursor]);

  const rows: { key: string; label: string; enabled: boolean; onSelect: () => void }[] = (() => {
    if (view === "command") {
      return commands.map((command) => ({
        key: command.kind,
        label: command.label,
        enabled: command.enabled,
        onSelect: () => selectCommand(command.kind)
      }));
    }
    if (view === "attackTarget") {
      return livingGroups.map((group) => ({
        key: group.id,
        label: `${group.name} ×${group.count}`,
        enabled: true,
        onSelect: () => onQueueAttack(group.id)
      }));
    }
    if (view === "spell") {
      return spells.map((spellId) => {
        const spell = SPELLS[spellId];
        const enabled = actor.mp >= spell.mpCost;
        return {
          key: spellId,
          label: `${t(SPELL_LABEL_KEY[spellId])} · ${t("play.mpShort")} ${spell.mpCost}`,
          enabled,
          onSelect: () => selectSpell(spellId)
        };
      });
    }
    // spellTarget
    return livingGroups.map((group) => ({
      key: group.id,
      label: `${group.name} ×${group.count}`,
      enabled: true,
      onSelect: () => pendingSpell && onQueueSpell(pendingSpell, group.id)
    }));
  })();

  function selectCommand(kind: CommandKind) {
    if (kind === "attack") {
      setView("attackTarget");
      setCursor(0);
    } else if (kind === "spell") {
      setView("spell");
      setCursor(0);
    } else if (kind === "item") {
      onQueueItem();
    } else {
      onQueueDefend();
    }
  }

  function selectSpell(spellId: SpellId) {
    const spell = SPELLS[spellId];
    if (actor.mp < spell.mpCost) {
      return;
    }
    if (spell.target === "enemyGroup") {
      setPendingSpell(spellId);
      setView("spellTarget");
      setCursor(0);
    } else {
      onQueueSpell(spellId, null);
    }
  }

  function goBack() {
    if (view === "command") {
      onUndo();
      return;
    }
    if (view === "spellTarget") {
      setView("spell");
    } else {
      setView("command");
    }
    setCursor(0);
    setPendingSpell(null);
  }

  // Arrows OR WASD move the cursor (S/W = down/up), A/Esc back out, D confirms;
  // Enter/Space also activate the focused row button natively (its onClick).
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key.toLowerCase();
    const down = key === "arrowdown" || key === "s";
    const up = key === "arrowup" || key === "w";
    const back = key === "escape" || key === "backspace" || key === "a";
    const confirm = key === "d";
    if (down || up) {
      event.preventDefault();
      setCursor((current) => (current + (down ? 1 : -1) + rows.length) % Math.max(1, rows.length));
    } else if (back) {
      event.preventDefault();
      goBack();
    } else if (confirm) {
      event.preventDefault();
      const row = rows[cursor];
      if (row?.enabled) {
        row.onSelect();
      }
    }
  }

  const heading =
    view === "command"
      ? t("play.commandFor", { name: actor.name })
      : view === "spell"
        ? t("play.chooseSpell")
        : t("play.chooseTarget");

  return (
    <div
      className="combat-command-menu"
      data-testid="combat-command-menu"
      data-controller-active="true"
      data-controller-surface="combat-menu"
      onKeyDown={onKeyDown}
      role="menu"
      aria-label={heading}
    >
      <p className="combat-command-menu-head">{heading}</p>
      <ul className="combat-command-menu-list">
        {rows.map((row, index) => (
          <li key={row.key}>
            <button
              type="button"
              role="menuitem"
              className={`combat-menu-row${index === cursor ? " selected" : ""}`}
              data-testid={`combat-menu-${row.key}`}
              aria-current={index === cursor}
              disabled={!row.enabled}
              tabIndex={index === cursor ? 0 : -1}
              ref={index === cursor ? selectedButtonRef : undefined}
              onFocus={() => setCursor(index)}
              onClick={() => row.enabled && row.onSelect()}
            >
              <span className="combat-menu-cursor" aria-hidden="true">{index === cursor ? "▸" : " "}</span>
              {row.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="combat-command-menu-hint">{t("play.menuHint")}</p>
    </div>
  );
}
