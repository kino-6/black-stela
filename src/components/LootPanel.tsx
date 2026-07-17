import { useEffect, useMemo, useRef, useState } from "react";
import { Gem } from "lucide-react";
import type { Character, Command, GameEvent, InventoryItem, ItemRarity, ScenarioWorld } from "../domain/types";
import { equipmentInstanceKey } from "../domain/affixes";
import { getEffectiveCharacterStats } from "../domain/economy";
import { appraisalFee, dismantleYield, isProtectedFromBulk, isUnidentifiedRare, sellValueOf } from "../domain/loot";
import { describeEquipmentInstance, findEquipmentById, localizedCatalogName } from "../ui/catalog";
import type { Locale, Translator } from "../i18n";

// The stats a fit-comparison surfaces, in the order the player reads them (reuses career.stat labels).
const COMPARE_STATS = ["attack", "damageMin", "damageMax", "accuracy", "armor", "speed", "maxHp", "maxMp"] as const;

interface LootPanelProps {
  t: Translator;
  locale: Locale;
  world: ScenarioWorld;
  party: Character[];
  inventory: InventoryItem[];
  partyGold: number;
  materials: number;
  latestLogText: string;
  latestEventType: GameEvent["type"] | null;
  onCommand: (command: Command) => void;
  onClose: () => void;
}

// IMP-022C/V — the town APPRAISER. Rare finds arrive unidentified; here the player PAYS to reveal
// them, protects keepers (lock / favorite), sees how an appraised piece fits a chosen adventurer
// (and equips it), and clears routine loot in one previewed, CONFIRM-gated bulk operation that never
// consumes an equipped, locked, favorite, or unidentified item.
export function LootPanel({
  t,
  locale,
  world,
  party,
  inventory,
  partyGold,
  materials,
  latestLogText,
  latestEventType,
  onCommand,
  onClose
}: LootPanelProps) {
  const firstRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  // Which adventurer an appraised piece is compared/equipped against.
  const [fitMemberId, setFitMemberId] = useState<string | null>(party[0]?.id ?? null);
  // Bulk conversion is a two-step: preview → confirm/cancel, so one press never destroys loot.
  const [pendingBulk, setPendingBulk] = useState<"sell" | "dismantle" | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (pendingBulk) {
      const frame = window.requestAnimationFrame(() => confirmRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [pendingBulk]);

  const equippedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const member of party) {
      for (const equipped of Object.values(member.equipment)) {
        if (equipped) keys.add(equipmentInstanceKey(equipped.id, equipped.plus, equipped.affix));
      }
    }
    return keys;
  }, [party]);

  const fitMember = party.find((candidate) => candidate.id === fitMemberId) ?? party[0];
  const equipment = inventory.filter((item) => item.kind === "equipment");
  const convertible = equipment.filter((item) => !isProtectedFromBulk(item, equippedKeys));
  const sellTotal = convertible.reduce((total, item) => total + sellValueOf(item) * item.quantity, 0);
  const dismantleTotal = convertible.reduce((total, item) => total + dismantleYield(item), 0);
  const convertCount = convertible.reduce((total, item) => total + item.quantity, 0);

  const affixLabel = (affixId: string | undefined): string => {
    if (!affixId) return "";
    const authored = world.affixes.find((affix) => affix.id === affixId);
    return authored ? authored.locales?.[locale]?.label ?? authored.label : affixId;
  };
  const rarityLabel = (rarity: ItemRarity | undefined) => t(`loot.rarity.${rarity ?? "common"}` as Parameters<typeof t>[0]);
  const isEquipped = (item: InventoryItem) => equippedKeys.has(equipmentInstanceKey(item.id, item.plus, item.affix));

  // Controller focus lands on the first action that actually rendered (sell-all, else the first
  // appraise, else back) — never nowhere, whatever the loot/gold state.
  let firstAssigned = false;
  const claimFirst = () => {
    if (firstAssigned) return undefined;
    firstAssigned = true;
    return firstRef;
  };

  // How an appraised piece would change the chosen adventurer's stats, and what it replaces.
  const fitFor = (item: InventoryItem) => {
    if (!fitMember || isUnidentifiedRare(item)) return null;
    const definition = findEquipmentById(item.id);
    if (!definition) return null;
    const slot = definition.slot;
    const before = getEffectiveCharacterStats(fitMember, world);
    const after = getEffectiveCharacterStats(
      { ...fitMember, equipment: { ...fitMember.equipment, [slot]: { id: item.id, plus: item.plus, affix: item.affix } } },
      world
    );
    const deltas = COMPARE_STATS.map((key) => ({ key, delta: after[key] - before[key] })).filter((entry) => entry.delta !== 0);
    return { slot, deltas, current: fitMember.equipment[slot], alreadyWorn: isEquipped(item) };
  };

  return (
    <section
      className="town-service loot-service"
      aria-labelledby="loot-heading"
      data-testid="loot-panel"
      data-controller-active="true"
      data-controller-surface="town-loot"
    >
      <div className="service-counter">
        <div className="service-counter-head">
          <h3 id="loot-heading">
            <Gem size={18} aria-hidden="true" /> {t("loot.title")}
          </h3>
          <strong>
            {t("loot.gold", { gold: partyGold })} · {t("loot.materials", { materials })}
          </strong>
        </div>
        <p className="service-intro">{t("loot.intro")}</p>

        {latestLogText && (latestEventType === "item_appraised" || latestEventType === "bulk_converted") && (
          <p className="event-window" aria-live="polite">
            {latestLogText}
          </p>
        )}

        {/* Which adventurer an appraised piece is fitted to. */}
        <div className="loot-member-select" role="tablist" aria-label={t("loot.compareFor")}>
          {party.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              role="tab"
              aria-selected={candidate.id === fitMember?.id}
              className={candidate.id === fitMember?.id ? "selected" : undefined}
              data-testid={`loot-fit-${candidate.id}`}
              onClick={() => setFitMemberId(candidate.id)}
            >
              {candidate.name}
            </button>
          ))}
        </div>

        {/* Bulk conversion — preview totals, then a CONFIRM stage before anything is destroyed. */}
        <div className="loot-bulk" data-testid="loot-bulk">
          <h4>{t("loot.bulkHeading")}</h4>
          {convertCount === 0 ? (
            <p className="service-empty">{t("loot.nothingToConvert")}</p>
          ) : pendingBulk ? (
            <div className="loot-confirm" data-testid="loot-bulk-confirm">
              <p className="loot-confirm-question">
                {pendingBulk === "sell"
                  ? t("loot.confirmSell", { count: convertCount, gold: sellTotal })
                  : t("loot.confirmDismantle", { count: convertCount, materials: dismantleTotal })}
              </p>
              <div className="service-actions">
                <button
                  type="button"
                  className="primary-action"
                  ref={confirmRef}
                  data-testid="loot-bulk-confirm-yes"
                  onClick={() => {
                    onCommand({ type: "bulk_convert", mode: pendingBulk });
                    setPendingBulk(null);
                  }}
                >
                  {t("loot.confirm")}
                </button>
                <button type="button" data-testid="loot-bulk-confirm-no" onClick={() => setPendingBulk(null)}>
                  {t("loot.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="loot-bulk-preview" data-testid="loot-bulk-preview">
                {t("loot.convertible", { count: convertCount, gold: sellTotal, materials: dismantleTotal })}
              </p>
              <div className="service-actions">
                <button
                  type="button"
                  className="primary-action"
                  ref={claimFirst()}
                  data-testid="loot-sell-all"
                  onClick={() => setPendingBulk("sell")}
                >
                  {t("loot.sellAll")}
                </button>
                <button type="button" data-testid="loot-dismantle-all" onClick={() => setPendingBulk("dismantle")}>
                  {t("loot.dismantleAll")}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Every carried piece of equipment, with rarity, protection, per-instance actions, and — once
            appraised — how it fits the chosen adventurer. */}
        {equipment.length === 0 ? (
          <p className="service-empty">{t("loot.empty")}</p>
        ) : (
          <ul className="loot-list" data-testid="loot-list">
            {equipment.map((item, index) => {
              const unidentified = isUnidentifiedRare(item);
              const equipped = isEquipped(item);
              const protectedItem = isProtectedFromBulk(item, equippedKeys);
              const rareInstance = Boolean(item.instanceId);
              const key = item.instanceId ?? `${equipmentInstanceKey(item.id, item.plus, item.affix)}-${index}`;
              const fee = appraisalFee(item);
              const canAfford = partyGold >= fee;
              const fit = fitFor(item);
              return (
                <li className={`loot-row loot-${item.rarity ?? "common"}${protectedItem ? " protected" : ""}`} key={key} data-testid={`loot-row-${key}`}>
                  <div className="loot-row-head">
                    <span className={`loot-rarity loot-rarity-${item.rarity ?? "common"}`}>{rarityLabel(item.rarity)}</span>
                    <strong className="loot-name">
                      {!unidentified && item.affix ? `${affixLabel(item.affix)} ` : ""}
                      {localizedCatalogName(item.id, locale)}
                      {item.plus ? ` +${item.plus}` : ""}
                    </strong>
                    {unidentified && <span className="loot-tag loot-unid">{t("loot.unidentified")}</span>}
                    {equipped && <span className="loot-tag">{t("loot.equipped")}</span>}
                    {item.locked && <span className="loot-tag">{t("loot.locked")}</span>}
                    {item.favorite && <span className="loot-tag">{t("loot.favorited")}</span>}
                  </div>
                  {rareInstance && (
                    <div className="loot-row-actions">
                      {unidentified && (
                        <button
                          type="button"
                          className="primary-action"
                          ref={claimFirst()}
                          disabled={!canAfford}
                          data-testid={`loot-appraise-${item.instanceId}`}
                          onClick={() => onCommand({ type: "appraise_item", instanceId: item.instanceId! })}
                        >
                          {canAfford ? t("loot.appraiseCost", { cost: fee }) : t("loot.appraiseCantAfford", { cost: fee })}
                        </button>
                      )}
                      <button type="button" data-testid={`loot-lock-${item.instanceId}`} onClick={() => onCommand({ type: "toggle_item_lock", instanceId: item.instanceId! })}>
                        {item.locked ? t("loot.unlock") : t("loot.lock")}
                      </button>
                      <button type="button" data-testid={`loot-favorite-${item.instanceId}`} onClick={() => onCommand({ type: "toggle_item_favorite", instanceId: item.instanceId! })}>
                        {item.favorite ? t("loot.unfavorite") : t("loot.favorite")}
                      </button>
                    </div>
                  )}
                  {/* Appraised → show how it fits the chosen adventurer, and let them wear it. */}
                  {fit && !fit.alreadyWorn && fitMember && (
                    <div className="loot-compare" data-testid={`loot-compare-${key}`}>
                      <span className="loot-compare-label">{t("loot.compareFor")}: {fitMember.name}</span>
                      {fit.deltas.length === 0 ? (
                        <p className="loot-compare-note">{t("loot.statUnchanged")}</p>
                      ) : (
                        <div className="loot-compare-deltas">
                          {fit.deltas.map(({ key: statKey, delta }) => (
                            <span key={statKey} className={`loot-delta ${delta > 0 ? "up" : "down"}`}>
                              {t(`career.stat.${statKey}` as Parameters<typeof t>[0])} {delta > 0 ? `+${delta}` : delta}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="loot-compare-note">
                        {fit.current
                          ? t("loot.equipReplaces", { name: describeEquipmentInstance(fit.current.id, locale, t, fit.current.plus, fit.current.affix) })
                          : t("loot.compareSlotEmpty")}
                      </p>
                      <div className="service-actions">
                        <button
                          type="button"
                          data-testid={`loot-equip-${key}`}
                          onClick={() =>
                            onCommand({ type: "equip_item", characterId: fitMember.id, equipmentId: item.id, plus: item.plus, affix: item.affix })
                          }
                        >
                          {t("loot.equipOn", { member: fitMember.name })}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="service-actions">
          <button type="button" data-controller-cancel="true" ref={claimFirst()} data-testid="loot-back" onClick={onClose}>
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}
