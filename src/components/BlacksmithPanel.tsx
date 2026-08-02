import { useEffect, useRef, useState } from "react";
import { Anvil } from "lucide-react";
import type { Character, Command, EquipmentSlot, GameEvent, ScenarioWorld } from "../domain/types";
import { plusPrimaryStat } from "../domain/affixes";
import { MAX_REINFORCE, forgeCost } from "../domain/loot";
import { describeEquipmentInstance } from "../ui/catalog";
import type { Locale, Translator } from "../i18n";

const SLOT_ORDER: EquipmentSlot[] = ["weapon", "offhand", "body", "head", "hands", "accessory"];
// The `plus` mechanic raises the slot's primary stat; name it so the player sees what forging buys.
const PRIMARY_STAT_KEY: Record<string, "attack" | "armor" | "accuracy"> = {
  attackBonus: "attack",
  defenseBonus: "armor",
  accuracyBonus: "accuracy"
};

interface BlacksmithPanelProps {
  t: Translator;
  locale: Locale;
  world: ScenarioWorld;
  party: Character[];
  partyGold: number;
  latestLogText: string;
  latestEventType: GameEvent["type"] | null;
  onCommand: (command: Command) => void;
  onClose: () => void;
}

// The town BLACKSMITH (鍛冶屋, T9) — the GOLD sink twin of the workshop. Spend coin earned in the dungeon to
// temper what an adventurer already WEARS: each step is +1 to that slot's primary stat, costing more as it
// climbs, up to MAX_REINFORCE. Controller-first; refuses at the cap and when the party can't afford it.
export function BlacksmithPanel({
  t,
  locale,
  world,
  party,
  partyGold,
  latestLogText,
  latestEventType,
  onCommand,
  onClose
}: BlacksmithPanelProps) {
  const firstRef = useRef<HTMLButtonElement | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(party[0]?.id ?? null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => firstRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [selectedMemberId]);

  const member = party.find((candidate) => candidate.id === selectedMemberId) ?? party[0];
  if (!member) {
    return null;
  }

  const worn = SLOT_ORDER.map((slot) => ({ slot, equipped: member.equipment[slot] })).filter(
    (entry): entry is { slot: EquipmentSlot; equipped: NonNullable<typeof entry.equipped> } => Boolean(entry.equipped)
  );

  let firstAssigned = false;
  const claimFirst = () => {
    if (firstAssigned) return undefined;
    firstAssigned = true;
    return firstRef;
  };

  return (
    <section
      className="town-service blacksmith-service"
      aria-labelledby="blacksmith-heading"
      data-testid="blacksmith-panel"
      data-controller-active="true"
      data-controller-surface="town-blacksmith"
    >
      <div className="service-counter">
        <div className="service-counter-head">
          <h3 id="blacksmith-heading">
            <Anvil size={18} aria-hidden="true" /> {t("blacksmith.title")}
          </h3>
          <strong>{t("blacksmith.gold", { gold: partyGold })}</strong>
        </div>
        <p className="service-intro">{t("blacksmith.intro")}</p>
        {partyGold <= 0 && (
          <p className="service-intro blacksmith-no-gold">{t("blacksmith.noGold")}</p>
        )}

        {latestLogText && latestEventType === "equipment_forged" && (
          <p className="event-window" aria-live="polite">
            {latestLogText}
          </p>
        )}

        <div className="loot-member-select" role="tablist" aria-label={t("blacksmith.member")}>
          {party.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              role="tab"
              aria-selected={candidate.id === member.id}
              className={candidate.id === member.id ? "selected" : undefined}
              data-testid={`blacksmith-member-${candidate.id}`}
              onClick={() => setSelectedMemberId(candidate.id)}
            >
              {candidate.name}
            </button>
          ))}
        </div>

        {worn.length === 0 ? (
          <p className="service-empty">{t("blacksmith.nothingWorn")}</p>
        ) : (
          <ul className="workshop-list" data-testid="blacksmith-list">
            {worn.map(({ slot, equipped }) => {
              const currentPlus = equipped.plus ?? 0;
              const atCap = currentPlus >= MAX_REINFORCE;
              const cost = forgeCost(currentPlus);
              const canAfford = partyGold >= cost;
              const statKey = PRIMARY_STAT_KEY[plusPrimaryStat(slot)];
              return (
                <li className="workshop-row" key={slot} data-testid={`blacksmith-row-${slot}`}>
                  <div className="workshop-row-head">
                    <span className="workshop-slot">{t(`career.slot.${slot}` as Parameters<typeof t>[0])}</span>
                    <strong className="workshop-name">
                      {describeEquipmentInstance(equipped.id, locale, t, equipped.plus, equipped.affix)}
                    </strong>
                    {atCap && <span className="workshop-plus">{t("blacksmith.atCap")}</span>}
                  </div>
                  <div className="workshop-row-actions">
                    <span className="workshop-boost">{t("blacksmith.boosts", { stat: t(`career.stat.${statKey}` as Parameters<typeof t>[0]) })}</span>
                    <button
                      type="button"
                      className="primary-action"
                      ref={claimFirst()}
                      disabled={atCap || !canAfford}
                      data-testid={`blacksmith-forge-${slot}`}
                      onClick={() => onCommand({ type: "forge_equipment", characterId: member.id, slot })}
                    >
                      {atCap ? t("blacksmith.atCap") : canAfford ? t("blacksmith.forge", { cost }) : t("blacksmith.cantAfford", { cost })}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="service-actions">
          <button type="button" data-controller-cancel="true" ref={claimFirst()} data-testid="blacksmith-back" onClick={onClose}>
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}
