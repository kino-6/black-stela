import type { Character, Command, EquipmentSlot, GameEvent, InventoryItem, ScenarioShop, ScenarioWorld } from "../domain/types";
import { equipmentInstanceKey } from "../domain/affixes";
import { getEffectiveCharacterStats, isEquipmentUsableBy } from "../domain/economy";
import {
  describeEquipmentInstance,
  equippedName,
  findEquipmentById,
  localizedCatalogDescription,
  localizedCatalogName,
  localizedShopName,
  previewEquipmentStats,
  shopCategoryFor,
  type ShopCategory
} from "../ui/catalog";
import {
  formatEquipmentEffect,
  formatEquipmentSlot,
  formatInventoryEffect,
  formatStatDelta,
  isShopEventType
} from "../ui/format";
import { catalogIconUrl } from "../ui/artAssets";
import type { Locale, Translator } from "../i18n";

const equipmentSlotOrder: EquipmentSlot[] = ["weapon", "offhand", "body", "head", "hands", "accessory"];

function renderCatalogIcon(itemId: string) {
  const iconUrl = catalogIconUrl(itemId);
  if (!iconUrl) {
    return null;
  }
  return <img className="catalog-icon" src={iconUrl} alt="" aria-hidden="true" />;
}

interface ShopPanelProps {
  t: Translator;
  locale: Locale;
  world: ScenarioWorld;
  shop: ScenarioShop;
  partyGold: number;
  party: Character[];
  inventory: InventoryItem[];
  latestLogText: string;
  latestEventType: GameEvent["type"] | null;
  selectedProfile: Character;
  onSelectProfile: (id: string) => void;
  availableShopCategories: ShopCategory[];
  activeShopCategory: ShopCategory;
  onSetCategory: (category: ShopCategory) => void;
  onCommand: (command: Command) => void;
}

// The town shop service — stock, inventory (sell), and equip board (extracted
// verbatim from App's render; shop-only helpers move here with it).
export function ShopPanel({
  t,
  locale,
  world,
  shop,
  partyGold,
  party,
  inventory,
  latestLogText,
  latestEventType,
  selectedProfile,
  onSelectProfile,
  availableShopCategories,
  activeShopCategory,
  onSetCategory,
  onCommand
}: ShopPanelProps) {
  const selectedProfileStats = getEffectiveCharacterStats(selectedProfile, world);
  return (
    <section
      className="town-service shop-service"
      aria-labelledby="shop-heading"
      data-controller-active="true"
      data-controller-surface="town-shop"
    >
      <div className="service-heading">
        <h3 id="shop-heading">{localizedShopName(shop, locale)}</h3>
        <strong>{t("town.gold", { gold: partyGold })}</strong>
      </div>
      {latestLogText && latestEventType && isShopEventType(latestEventType) && <p className="event-window" aria-live="polite">{latestLogText}</p>}
      <section className="shop-adventurer-panel" aria-label={t("town.selectedAdventurer")}>
        <div>
          <strong>{t("town.selectedAdventurer")}: {selectedProfile.name}</strong>
          <span>
            {t("town.equipmentSummary", {
              attack: selectedProfileStats.damageMax,
              accuracy: selectedProfileStats.accuracy,
              armorValue: selectedProfileStats.armor,
              speed: selectedProfileStats.speed
            })}
          </span>
        </div>
        <div className="shop-party-select">
          {party.map((member) => (
            <button
              type="button"
              className={member.id === selectedProfile.id ? "selected" : ""}
              key={member.id}
              onClick={() => onSelectProfile(member.id)}
            >
              {member.name}
            </button>
          ))}
        </div>
      </section>
      <div className="shop-grid">
        <section aria-label={t("town.shopStock")}>
          <h4>{t("town.shopStock")}</h4>
          <div className="shop-category-tabs" role="tablist">
            {availableShopCategories.map((category) => (
              <button
                type="button"
                role="tab"
                aria-selected={category === activeShopCategory}
                className={category === activeShopCategory ? "selected" : ""}
                data-testid={`shop-category-${category}`}
                key={category}
                onClick={() => onSetCategory(category)}
              >
                {t(`town.category.${category}` as Parameters<Translator>[0])}
              </button>
            ))}
          </div>
          <div className="shop-list">
            {shop.stock?.filter((stock) => shopCategoryFor(stock.itemId) === activeShopCategory).map((stock) => {
              const equipment = findEquipmentById(stock.itemId);
              const selectedCanEquip = equipment ? isEquipmentUsableBy(equipment, selectedProfile) : false;
              const previewStats = equipment ? previewEquipmentStats(selectedProfile, equipment) : null;
              return (
                <article className="shop-row shop-row-with-icon" key={stock.itemId}>
                  {renderCatalogIcon(stock.itemId)}
                  <div>
                    <strong>{localizedCatalogName(stock.itemId, locale)}</strong>
                    <span>
                      {equipment
                        ? `${formatEquipmentSlot(equipment.slot, t)} · ${formatEquipmentEffect(equipment, t)}`
                        : t("town.price", { gold: stock.price })}
                    </span>
                    {equipment && <small>{localizedCatalogDescription(stock.itemId, locale)}</small>}
                    {equipment && (
                      <small data-testid="shop-delta">
                        {selectedCanEquip
                          ? t("town.canEquip", { member: selectedProfile.name })
                          : t("town.cannotEquip", { member: selectedProfile.name })}
                        {selectedCanEquip && previewStats
                          ? ` · ${formatStatDelta(selectedProfileStats, previewStats, t)}`
                          : ""}
                      </small>
                    )}
                    {equipment && <small>{t("town.price", { gold: stock.price })}</small>}
                    <small>{t("town.remainingGold", { gold: Math.max(0, partyGold - stock.price) })}</small>
                  </div>
                  <button
                    type="button"
                    aria-label={`${t("town.buy")} ${localizedCatalogName(stock.itemId, locale)}`}
                    disabled={partyGold < stock.price}
                    onClick={() => onCommand({ type: "buy_item", shopId: shop.id, itemId: stock.itemId })}
                  >
                    {t("town.buy")}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
        <section aria-label={t("town.inventory")}>
          <h4>{t("town.inventory")}</h4>
          <div className="shop-list">
            {inventory.length === 0 ? (
              <p className="empty-state">{t("town.inventoryEmpty")}</p>
            ) : (
              inventory.map((item) => (
                <article
                  className="shop-row shop-row-with-icon"
                  key={equipmentInstanceKey(item.id, item.plus, item.affix)}
                >
                  {renderCatalogIcon(item.id)}
                  <div>
                    <strong>{describeEquipmentInstance(item.id, locale, t, item.plus, item.affix)}</strong>
                    <span>
                      {item.kind === "equipment" && item.slot
                        ? `${formatEquipmentSlot(item.slot, t)} · ${formatInventoryEffect(item, t)}`
                        : t("town.quantity", { count: item.quantity })}
                    </span>
                    {item.kind === "equipment" && <small>{localizedCatalogDescription(item.id, locale)}</small>}
                    {item.kind === "equipment" && <small>{t("town.quantity", { count: item.quantity })}</small>}
                  </div>
                  <button
                    type="button"
                    disabled={
                      (item.sellValue ?? 0) <= 0 ||
                      party.some((member) =>
                        Object.values(member.equipment).some(
                          (equipped) =>
                            equipped &&
                            equipmentInstanceKey(equipped.id, equipped.plus, equipped.affix) ===
                              equipmentInstanceKey(item.id, item.plus, item.affix)
                        )
                      )
                    }
                    onClick={() => onCommand({ type: "sell_item", itemId: item.id, plus: item.plus, affix: item.affix })}
                  >
                    {t("town.sell")}
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
      <section className="equipment-board" aria-label={t("town.equipment")}>
        <h4>{t("town.equipment")}</h4>
        <article className="equipment-row">
          <div>
            <strong>{selectedProfile.name}</strong>
            <span>
              {t("town.equipmentSummary", {
                attack: selectedProfileStats.damageMax,
                accuracy: selectedProfileStats.accuracy,
                armorValue: selectedProfileStats.armor,
                speed: selectedProfileStats.speed
              })}
            </span>
            <dl className="equipment-slots">
              {equipmentSlotOrder.map((slot) => (
                <div key={`${selectedProfile.id}:${slot}`}>
                  <dt>{formatEquipmentSlot(slot, t)}</dt>
                  <dd>{equippedName(selectedProfile.equipment[slot], locale, t)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="equipment-actions">
            {inventory.filter((item) => item.kind === "equipment").map((item) => {
              const equipment = findEquipmentById(item.id);
              const usable = equipment ? isEquipmentUsableBy(equipment, selectedProfile) : false;
              return (
                <button
                  type="button"
                  key={`${selectedProfile.id}:${equipmentInstanceKey(item.id, item.plus, item.affix)}`}
                  aria-label={`${t("town.equip")} ${describeEquipmentInstance(item.id, locale, t, item.plus, item.affix)} to ${selectedProfile.name}`}
                  disabled={!usable}
                  onClick={() =>
                    onCommand({
                      type: "equip_item",
                      characterId: selectedProfile.id,
                      equipmentId: item.id,
                      plus: item.plus,
                      affix: item.affix
                    })
                  }
                >
                  {renderCatalogIcon(item.id)}
                  {describeEquipmentInstance(item.id, locale, t, item.plus, item.affix)}
                  <small>{usable ? t("town.allowed") : t("town.ineligible")}</small>
                </button>
              );
            })}
          </div>
        </article>
      </section>
    </section>
  );
}
