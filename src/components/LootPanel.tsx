import { useEffect, useMemo, useRef } from "react";
import { Gem } from "lucide-react";
import type { Character, Command, GameEvent, InventoryItem, ItemRarity, ScenarioWorld } from "../domain/types";
import { equipmentInstanceKey } from "../domain/affixes";
import { dismantleYield, isProtectedFromBulk, isUnidentifiedRare, sellValueOf } from "../domain/loot";
import { localizedCatalogName } from "../ui/catalog";
import type { Locale, Translator } from "../i18n";

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

// IMP-022C — the town APPRAISER. Rare finds arrive unidentified; here the player reveals them,
// protects keepers (lock / favorite), and clears routine loot in one previewed, reversible-before-
// confirm bulk operation that NEVER consumes an equipped, locked, favorite, or unidentified item.
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
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const equippedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const member of party) {
      for (const equipped of Object.values(member.equipment)) {
        if (equipped) keys.add(equipmentInstanceKey(equipped.id, equipped.plus, equipped.affix));
      }
    }
    return keys;
  }, [party]);

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

  let firstAssigned = false;
  const claimFirst = () => {
    if (firstAssigned) return undefined;
    firstAssigned = true;
    return firstRef;
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

        {/* Bulk conversion — preview totals, then a single safe operation. */}
        <div className="loot-bulk" data-testid="loot-bulk">
          <h4>{t("loot.bulkHeading")}</h4>
          {convertCount === 0 ? (
            <p className="service-empty">{t("loot.nothingToConvert")}</p>
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
                  onClick={() => onCommand({ type: "bulk_convert", mode: "sell" })}
                >
                  {t("loot.sellAll")}
                </button>
                <button type="button" data-testid="loot-dismantle-all" onClick={() => onCommand({ type: "bulk_convert", mode: "dismantle" })}>
                  {t("loot.dismantleAll")}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Every carried piece of equipment, with its rarity, protection, and per-instance actions. */}
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
                        <button type="button" className="primary-action" ref={claimFirst()} data-testid={`loot-appraise-${item.instanceId}`} onClick={() => onCommand({ type: "appraise_item", instanceId: item.instanceId! })}>
                          {t("loot.appraise")}
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
                </li>
              );
            })}
          </ul>
        )}

        <div className="service-actions">
          <button type="button" data-controller-cancel="true" data-testid="loot-back" ref={claimFirst()} onClick={onClose}>
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}
