import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Backpack, Gem, Shield, Trash2, UserRound, X } from "lucide-react";
import { findBackground, findClass, findTrait } from "../domain/characterCreation";
import { getCriticalChance, getEvasionChance, getSpellPowerBonus, getStatusSpellChance } from "../domain/combatMath";
import { getEffectiveCharacterStats, isEquipmentUsableBy } from "../domain/economy";
import { xpForLevel } from "../domain/leveling";
import type { Command, EquipmentSlot, GameState, InventoryItem, ScenarioWorld } from "../domain/types";
import type { Locale, TranslationKey, Translator } from "../i18n";
import {
  describeEquipmentInstance,
  equippedName,
  formatCharacterSummary,
  localizedCatalogDescription,
  localizedCatalogName
} from "../ui/catalog";
import { formatEquipmentSlot, formatInventoryEffect } from "../ui/format";
import { renderPortraitContent } from "../ui/portrait";

type PartyMenuPage = "status" | "equipment" | "items" | "valuables";

interface PartyMenuPanelProps {
  state: GameState;
  world: ScenarioWorld;
  locale: Locale;
  t: Translator;
  onCommand: (command: Command) => void;
  onClose: () => void;
}

const equipmentSlots: EquipmentSlot[] = ["weapon", "offhand", "body", "head", "hands", "accessory"];
const pages: { id: PartyMenuPage; icon: typeof UserRound; label: TranslationKey }[] = [
  { id: "status", icon: UserRound, label: "partyMenu.tabs.status" },
  { id: "equipment", icon: Shield, label: "partyMenu.tabs.equipment" },
  { id: "items", icon: Backpack, label: "partyMenu.tabs.items" },
  { id: "valuables", icon: Gem, label: "partyMenu.tabs.valuables" }
];

function itemKey(item: InventoryItem) {
  return `${item.id}:${item.plus ?? 0}:${item.affix ?? ""}`;
}

function describeConsumable(item: InventoryItem, t: Translator) {
  const effects = [
    item.healAmount ? t("partyMenu.restoreHp", { amount: item.healAmount }) : "",
    item.restoreMp ? t("partyMenu.restoreMp", { amount: item.restoreMp }) : "",
    item.curesStatuses?.length
      ? t("partyMenu.cures", {
          statuses: item.curesStatuses.map((status) => t(`partyMenu.status.${status}` as TranslationKey)).join("・")
        })
      : ""
  ].filter(Boolean);
  return effects.join(" / ") || t("partyMenu.noDescription");
}

export function PartyMenuPanel({ state, world, locale, t, onCommand, onClose }: PartyMenuPanelProps) {
  const [page, setPage] = useState<PartyMenuPage>("status");
  const [selectedMemberId, setSelectedMemberId] = useState(state.party[0]?.id ?? "");
  const [selectedItemKey, setSelectedItemKey] = useState("");
  const [discardPending, setDiscardPending] = useState(false);
  const member = state.party.find((candidate) => candidate.id === selectedMemberId) ?? state.party[0];
  const items = useMemo(
    () => state.inventory.filter((item) => !["key", "treasure", "escape"].includes(item.kind)),
    [state.inventory]
  );
  const valuables = useMemo(
    () => state.inventory.filter((item) => ["key", "treasure", "escape"].includes(item.kind)),
    [state.inventory]
  );
  const visibleItems = page === "valuables" ? valuables : items;
  const selectedItem = visibleItems.find((item) => itemKey(item) === selectedItemKey) ?? visibleItems[0];

  useEffect(() => {
    setDiscardPending(false);
    setSelectedItemKey(visibleItems[0] ? itemKey(visibleItems[0]) : "");
  }, [page]);

  if (!member) {
    return null;
  }

  const stats = getEffectiveCharacterStats(member, world);
  const classDef = findClass(member.classId);
  const background = findBackground(member.backgroundId);
  const nextLevelXp = xpForLevel(member.level + 1);
  const selectedEquipment = selectedItem ? world.equipment.find((candidate) => candidate.id === selectedItem.id) : undefined;
  const canEquip = Boolean(selectedEquipment && isEquipmentUsableBy(selectedEquipment, member));
  const canUse = Boolean(selectedItem && ["healing", "cure", "focus"].includes(selectedItem.kind));
  const equippedCount = selectedItem
    ? state.party.reduce(
        (count, candidate) =>
          count +
          Object.values(candidate.equipment).filter(
            (entry) => entry?.id === selectedItem.id && entry.plus === selectedItem.plus && entry.affix === selectedItem.affix
          ).length,
        0
      )
    : 0;
  const canDiscard = Boolean(
    selectedItem &&
      !["key", "treasure", "escape"].includes(selectedItem.kind) &&
      selectedItem.quantity > equippedCount
  );
  const rowMembers = state.party.filter((candidate) => candidate.row === member.row);
  const oppositeMembers = state.party.filter((candidate) => candidate.row !== member.row);
  const counterpart = oppositeMembers[Math.min(Math.max(0, rowMembers.findIndex((candidate) => candidate.id === member.id)), oppositeMembers.length - 1)];
  const conditions = [
    member.injury ? t("partyMenu.wounded") : "",
    ...(member.status ?? []).map((status) => t(`partyMenu.status.${status}` as TranslationKey))
  ].filter(Boolean);

  function moveMenuFocus(event: KeyboardEvent<HTMLElement>) {
    if (!event.key.startsWith("Arrow")) {
      return;
    }

    const root = event.currentTarget;
    const active = document.activeElement as HTMLElement | null;
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-party-menu-tab]"));
    const members = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-party-menu-member]"));
    let next: HTMLButtonElement | undefined;

    if (active?.hasAttribute("data-party-menu-tab")) {
      const index = tabs.indexOf(active as HTMLButtonElement);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const step = event.key === "ArrowLeft" ? -1 : 1;
        next = tabs[(index + step + tabs.length) % tabs.length];
      } else if (event.key === "ArrowDown") {
        next = members.find((button) => button.getAttribute("aria-pressed") === "true") ?? members[0];
      }
    } else if (active?.hasAttribute("data-party-menu-member")) {
      const index = members.indexOf(active as HTMLButtonElement);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const step = event.key === "ArrowLeft" ? -1 : 1;
        next = members[(index + step + members.length) % members.length];
      } else if (event.key === "ArrowUp") {
        next = tabs.find((button) => button.getAttribute("aria-pressed") === "true") ?? tabs[0];
      } else if (event.key === "ArrowDown") {
        next = root.querySelector<HTMLButtonElement>(".party-menu-page button:not([disabled])") ??
          root.querySelector<HTMLButtonElement>("[data-controller-cancel]") ?? undefined;
      }
    }

    if (!next) {
      const controls = Array.from(root.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
      const index = active ? controls.indexOf(active as HTMLButtonElement) : -1;
      if (index >= 0 && controls.length > 0) {
        const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
        next = controls[(index + step + controls.length) % controls.length];
      }
    }

    if (next) {
      event.preventDefault();
      event.stopPropagation();
      next.focus();
    }
  }

  return (
    <div className="party-menu-overlay" data-testid="party-menu">
      <section
        className="party-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("partyMenu.title")}
        data-controller-active="true"
        data-controller-surface="party-menu"
        onKeyDown={moveMenuFocus}
      >
        <header className="party-menu-head">
          <div>
            <h2>{t("partyMenu.title")}</h2>
            <p>{state.phase === "town" ? t("partyMenu.subtitleTown") : t("partyMenu.subtitleDungeon")}</p>
          </div>
        </header>

        <nav className="party-menu-tabs" aria-label={t("partyMenu.pages") }>
          {pages.map(({ id, icon: Icon, label }) => (
            <button
              type="button"
              key={id}
              className={page === id ? "active" : ""}
              aria-pressed={page === id}
              data-party-menu-tab="true"
              data-testid={`party-menu-tab-${id}`}
              onClick={() => setPage(id)}
            >
              <Icon size={17} />
              {t(label)}
            </button>
          ))}
        </nav>

        <div className="party-menu-formation" aria-label={t("partyMenu.members") }>
          {(["front", "back"] as const).map((row) => (
            <div className="party-menu-row" key={row}>
              <span>{row === "front" ? t("play.frontRow") : t("play.backRow")}</span>
              <div>
                {state.party.filter((candidate) => candidate.row === row).map((candidate) => (
                  <button
                    type="button"
                    key={candidate.id}
                    className={candidate.id === member.id ? "active" : ""}
                    aria-pressed={candidate.id === member.id}
                    data-party-menu-member="true"
                    onClick={() => setSelectedMemberId(candidate.id)}
                  >
                    <strong>{candidate.name}</strong>
                    <small>Lv {candidate.level} · HP {candidate.hp}/{getEffectiveCharacterStats(candidate, world).maxHp}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="party-menu-content">
          <aside className="party-menu-profile">
            <div className="party-menu-portrait" style={{ borderColor: member.accentColor }}>
              {renderPortraitContent({
                portraitRef: member.portraitRef,
                backgroundId: member.backgroundId,
                fallback: member.name,
                alt: member.name,
                testId: "party-menu-portrait"
              })}
            </div>
            <div>
              <h3 data-testid="party-menu-member-name">{member.name}</h3>
              <p>{formatCharacterSummary(member, locale, t)}</p>
              <p>{background.label[locale]} / {member.traitIds.map((id) => findTrait(id).label[locale]).join("・")}</p>
              <p className={conditions.length > 0 ? "party-menu-condition danger" : "party-menu-condition"}>
                {t("partyMenu.condition")}: {conditions.join("・") || t("partyMenu.healthy")}
              </p>
            </div>
            <dl>
              <div><dt>{t("partyMenu.level")}</dt><dd>{member.level}</dd></div>
              <div><dt>{t("partyMenu.xpToNext")}</dt><dd>{Math.max(0, nextLevelXp - member.xp)}</dd></div>
              <div><dt>HP</dt><dd>{member.hp}/{stats.maxHp}</dd></div>
              <div><dt>MP</dt><dd>{member.mp}/{stats.maxMp}</dd></div>
            </dl>
            {counterpart && (
              <button
                type="button"
                className="party-menu-swap"
                onClick={() => onCommand({ type: "swap_member_rows", characterId: member.id, targetCharacterId: counterpart.id })}
              >
                {t("partyMenu.swapWith", { name: counterpart.name })}
              </button>
            )}
          </aside>

          {page === "status" && (
            <section className="party-menu-page" data-testid="party-menu-status">
              <div className="party-menu-section">
                <h3>{t("partyMenu.combatStats")}</h3>
                <dl className="party-stat-grid">
                  <div><dt>{t("partyMenu.attack")}</dt><dd>{stats.attack}</dd></div>
                  <div><dt>{t("party.damage")}</dt><dd>{stats.damageMin}-{stats.damageMax}</dd></div>
                  <div><dt>{t("party.accuracy")}</dt><dd>{stats.accuracy}</dd></div>
                  <div><dt>{t("party.armor")}</dt><dd>{stats.armor}</dd></div>
                  <div><dt>{t("party.speed")}</dt><dd>{stats.speed}</dd></div>
                  <div><dt>{t("partyMenu.evasion")}</dt><dd>{getEvasionChance(member, world)}%</dd></div>
                  <div><dt>{t("partyMenu.spellPower")}</dt><dd>+{getSpellPowerBonus(member)}</dd></div>
                  <div><dt>{t("partyMenu.statusPower")}</dt><dd>{getStatusSpellChance(member, 0)}%</dd></div>
                  <div><dt>{t("partyMenu.critical")}</dt><dd>{getCriticalChance(member)}%</dd></div>
                </dl>
              </div>
              <div className="party-menu-section">
                <h3>{t("party.aptitude")}</h3>
                <dl className="aptitude-grid">
                  {(["might", "agility", "spirit", "wit", "luck"] as const).map((key) => (
                    <div key={key}>
                      <dt>{t(`aptitude.${key}` as TranslationKey)} {member.aptitude[key]}</dt>
                      <dd>{t(`partyMenu.aptitudeEffect.${key}` as TranslationKey)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="party-menu-section party-resistance-section">
                <h3>{t("partyMenu.resistances")}</h3>
                <p>{(["poison", "fear", "silence", "sleep"] as const).map((status) => `${t(`partyMenu.status.${status}` as TranslationKey)} ${stats.resistance[status] ?? 0}%`).join(" / ")}</p>
              </div>
            </section>
          )}

          {page === "equipment" && (
            <section className="party-menu-page" data-testid="party-menu-equipment">
              <div className="party-menu-section">
                <h3>{t("partyMenu.equipped")}</h3>
                <dl className="equipment-slot-list">
                  {equipmentSlots.map((slot) => (
                    <div key={slot}>
                      <dt>{formatEquipmentSlot(slot, t)}</dt>
                      <dd>{equippedName(member.equipment[slot], locale, t)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="party-menu-note">{state.phase === "town" ? t("partyMenu.equipmentTown") : t("partyMenu.equipmentDungeon")}</p>
            </section>
          )}

          {(page === "items" || page === "valuables") && (
            <section className="party-menu-page party-item-page" data-testid={`party-menu-${page}`}>
              <div className="party-item-list" aria-label={page === "items" ? t("partyMenu.tabs.items") : t("partyMenu.tabs.valuables")}>
                {visibleItems.length === 0 && <p>{page === "items" ? t("partyMenu.inventoryEmpty") : t("partyMenu.valuablesEmpty")}</p>}
                {visibleItems.map((item) => (
                  <button
                    type="button"
                    key={itemKey(item)}
                    className={selectedItem && itemKey(selectedItem) === itemKey(item) ? "active" : ""}
                    aria-pressed={selectedItem && itemKey(selectedItem) === itemKey(item)}
                    onClick={() => {
                      setSelectedItemKey(itemKey(item));
                      setDiscardPending(false);
                    }}
                  >
                    <span>{item.kind === "equipment" ? describeEquipmentInstance(item.id, locale, t, item.plus, item.affix) : localizedCatalogName(item.id, locale)}</span>
                    <small>×{item.quantity}</small>
                  </button>
                ))}
              </div>
              <div className="party-item-detail">
                {selectedItem && (
                  <>
                    <h3>{selectedItem.kind === "equipment" ? describeEquipmentInstance(selectedItem.id, locale, t, selectedItem.plus, selectedItem.affix) : localizedCatalogName(selectedItem.id, locale)}</h3>
                    <p>{localizedCatalogDescription(selectedItem.id, locale) || (selectedEquipment ? formatInventoryEffect(selectedItem, t) : describeConsumable(selectedItem, t))}</p>
                    {selectedEquipment && <p>{formatInventoryEffect(selectedItem, t)}</p>}
                    <div className="party-item-actions">
                      {canUse && (
                        <button type="button" onClick={() => onCommand({ type: "use_item", itemId: selectedItem.id, targetCharacterId: member.id })}>
                          {t("partyMenu.useOn", { name: member.name })}
                        </button>
                      )}
                      {selectedEquipment && (
                        <button
                          type="button"
                          disabled={state.phase !== "town" || !canEquip}
                          onClick={() => onCommand({ type: "equip_item", characterId: member.id, equipmentId: selectedItem.id, plus: selectedItem.plus, affix: selectedItem.affix })}
                        >
                          {state.phase !== "town" ? t("partyMenu.equipmentDungeonShort") : canEquip ? t("partyMenu.equipOn", { name: member.name }) : t("partyMenu.cannotEquip")}
                        </button>
                      )}
                      {canDiscard && (
                        <button
                          type="button"
                          className={discardPending ? "danger-action" : ""}
                          onClick={() => {
                            if (!discardPending) {
                              setDiscardPending(true);
                              return;
                            }
                            onCommand({ type: "discard_item", itemId: selectedItem.id, plus: selectedItem.plus, affix: selectedItem.affix });
                            setDiscardPending(false);
                          }}
                        >
                          <Trash2 size={16} />
                          {discardPending ? t("partyMenu.confirmDiscard") : t("partyMenu.discard")}
                        </button>
                      )}
                      {!canDiscard && page === "valuables" && <p>{t("partyMenu.protectedItem")}</p>}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        <footer className="party-menu-footer">
          <span>{classDef.description[locale]}</span>
          <button type="button" data-controller-cancel="true" onClick={onClose}>
            <X size={17} />
            {t("partyMenu.close")}
          </button>
        </footer>
      </section>
    </div>
  );
}
