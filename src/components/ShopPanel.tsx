import type { Character, Command, GameEvent, InventoryItem, ScenarioShop, ScenarioWorld } from "../domain/types";
import { equipmentInstanceKey } from "../domain/affixes";
import { isEquipmentUsableBy } from "../domain/economy";
import {
  describeEquipmentInstance,
  findEquipmentById,
  localizedCatalogDescription,
  localizedCatalogName,
  localizedShopName,
  shopCategoryFor,
  type ShopCategory
} from "../ui/catalog";
import {
  formatEquipmentEffect,
  formatEquipmentSlot,
  formatInventoryEffect,
  isShopEventType
} from "../ui/format";
import { catalogIconUrl } from "../ui/artAssets";
import type { Locale, Translator } from "../i18n";

export type ShopMode = "buy" | "sell";

// The shop/inventory row is a 3-column grid (icon | text | action). ALWAYS emit the
// icon cell — an item whose art hasn't been drawn yet (e.g. a new scenario's pack)
// must not collapse the row by shifting the text into the icon column.
function renderCatalogIcon(itemId: string, assetPack: string) {
  const iconUrl = catalogIconUrl(itemId, assetPack);
  if (!iconUrl) {
    return <span className="catalog-icon catalog-icon-empty" aria-hidden="true" />;
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
  availableShopCategories: ShopCategory[];
  activeShopCategory: ShopCategory;
  onSetCategory: (category: ShopCategory) => void;
  shopMode: ShopMode;
  onSetShopMode: (mode: ShopMode) => void;
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
  availableShopCategories,
  activeShopCategory,
  onSetCategory,
  shopMode,
  onSetShopMode,
  onCommand
}: ShopPanelProps) {
  const artPack = world.assetPack ?? "default";
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
      {/* 買う / 売る — the Etrian-style top-level split (T8). Equipping is done in the party menu; buying is
          party-wide into the shared inventory (no per-character purchase scope). */}
      <div className="shop-mode-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={shopMode === "buy"} className={shopMode === "buy" ? "selected" : ""} data-testid="shop-mode-buy" onClick={() => onSetShopMode("buy")}>
          {t("town.shopModeBuy")}
        </button>
        <button type="button" role="tab" aria-selected={shopMode === "sell"} className={shopMode === "sell" ? "selected" : ""} data-testid="shop-mode-sell" onClick={() => onSetShopMode("sell")}>
          {t("town.shopModeSell")}
        </button>
      </div>
      {shopMode === "buy" ? (
        <section aria-label={t("town.shopStock")}>
          <h4>{t("town.shopStock")}</h4>
          <p className="shop-guide">{t("town.shopGuideShared")}</p>
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
              const wearers = equipment ? party.filter((m) => isEquipmentUsableBy(equipment, m)).map((m) => m.name) : [];
              return (
                <article className="shop-row shop-row-with-icon" key={stock.itemId}>
                  {renderCatalogIcon(stock.itemId, artPack)}
                  <div>
                    <strong>{localizedCatalogName(stock.itemId, locale)}</strong>
                    <span>
                      {equipment
                        ? `${formatEquipmentSlot(equipment.slot, t)} · ${formatEquipmentEffect(equipment, t)}`
                        : t("town.price", { gold: stock.price })}
                    </span>
                    {equipment && <small>{localizedCatalogDescription(stock.itemId, locale)}</small>}
                    {equipment && (
                      <small data-testid="shop-who-can-equip">
                        {wearers.length ? t("town.equipWhoCan", { names: wearers.join("・") }) : t("town.equipNoneCan")}
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
      ) : (
        <section aria-label={t("town.inventory")}>
          <h4>{t("town.inventory")}</h4>
          <p className="shop-guide">{t("town.shopSellGuide")}</p>
          <div className="shop-list">
            {inventory.length === 0 ? (
              <p className="empty-state">{t("town.inventoryEmpty")}</p>
            ) : (
              inventory.map((item) => (
                <article
                  className="shop-row shop-row-with-icon"
                  key={equipmentInstanceKey(item.id, item.plus, item.affix)}
                >
                  {renderCatalogIcon(item.id, artPack)}
                  <div>
                    <strong>{describeEquipmentInstance(item.id, locale, t, item.plus, item.affix)}</strong>
                    <span>
                      {item.kind === "equipment" && item.slot
                        ? `${formatEquipmentSlot(item.slot, t)} · ${formatInventoryEffect(item, t)}`
                        : t("town.quantity", { count: item.quantity })}
                    </span>
                    {/* T16: the seller needs 性能 (what it does) and 売値 (what they get) to judge the sale. */}
                    <small>{localizedCatalogDescription(item.id, locale)}</small>
                    <small data-testid="sell-value">{t("town.sellValue", { gold: item.sellValue ?? 0 })}</small>
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
      )}
    </section>
  );
}
