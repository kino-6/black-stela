import { useEffect, useRef, useState } from "react";
import { Hammer } from "lucide-react";
import type { Character, Command, EquipmentSlot, GameEvent, ScenarioWorld } from "../domain/types";
import { plusPrimaryStat } from "../domain/affixes";
import { MAX_REINFORCE, reinforceCost } from "../domain/loot";
import { describeEquipmentInstance } from "../ui/catalog";
import type { Locale, Translator } from "../i18n";

const SLOT_ORDER: EquipmentSlot[] = ["weapon", "offhand", "body", "head", "hands", "accessory"];
// The `plus` mechanic raises the slot's primary stat; name it so the player sees what tempering buys.
const PRIMARY_STAT_KEY: Record<string, "attack" | "armor" | "accuracy"> = {
  attackBonus: "attack",
  defenseBonus: "armor",
  accuracyBonus: "accuracy"
};

interface WorkshopPanelProps {
  t: Translator;
  locale: Locale;
  world: ScenarioWorld;
  party: Character[];
  materials: number;
  latestLogText: string;
  latestEventType: GameEvent["type"] | null;
  onCommand: (command: Command) => void;
  onClose: () => void;
}

// The town WORKSHOP (錬成所) — the materials SINK that closes the dismantle → materials → stronger-gear
// loop. Spend the take from dismantled loot to temper what an adventurer already WEARS: each step is
// +1 to that slot's primary stat, costing more as it climbs, up to MAX_REINFORCE. Controller-first.
export function WorkshopPanel({
  t,
  locale,
  world,
  party,
  materials,
  latestLogText,
  latestEventType,
  onCommand,
  onClose
}: WorkshopPanelProps) {
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
      className="town-service workshop-service"
      aria-labelledby="workshop-heading"
      data-testid="workshop-panel"
      data-controller-active="true"
      data-controller-surface="town-workshop"
    >
      <div className="service-counter">
        <div className="service-counter-head">
          <h3 id="workshop-heading">
            <Hammer size={18} aria-hidden="true" /> {t("workshop.title")}
          </h3>
          <strong>{t("workshop.materials", { materials })}</strong>
        </div>
        <p className="service-intro">{t("workshop.intro")}</p>

        {latestLogText && latestEventType === "equipment_reinforced" && (
          <p className="event-window" aria-live="polite">
            {latestLogText}
          </p>
        )}

        <div className="loot-member-select" role="tablist" aria-label={t("workshop.member")}>
          {party.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              role="tab"
              aria-selected={candidate.id === member.id}
              className={candidate.id === member.id ? "selected" : undefined}
              data-testid={`workshop-member-${candidate.id}`}
              onClick={() => setSelectedMemberId(candidate.id)}
            >
              {candidate.name}
            </button>
          ))}
        </div>

        {worn.length === 0 ? (
          <p className="service-empty">{t("workshop.nothingWorn")}</p>
        ) : (
          <ul className="workshop-list" data-testid="workshop-list">
            {worn.map(({ slot, equipped }) => {
              const currentPlus = equipped.plus ?? 0;
              const atCap = currentPlus >= MAX_REINFORCE;
              const cost = reinforceCost(currentPlus);
              const canAfford = materials >= cost;
              const statKey = PRIMARY_STAT_KEY[plusPrimaryStat(slot)];
              return (
                <li className="workshop-row" key={slot} data-testid={`workshop-row-${slot}`}>
                  <div className="workshop-row-head">
                    <span className="workshop-slot">{t(`career.slot.${slot}` as Parameters<typeof t>[0])}</span>
                    <strong className="workshop-name">
                      {describeEquipmentInstance(equipped.id, locale, t, equipped.plus, equipped.affix)}
                    </strong>
                    {atCap && <span className="workshop-plus">{t("workshop.atCap")}</span>}
                  </div>
                  <div className="workshop-row-actions">
                    <span className="workshop-boost">{t("workshop.boosts", { stat: t(`career.stat.${statKey}` as Parameters<typeof t>[0]) })}</span>
                    <button
                      type="button"
                      className="primary-action"
                      ref={claimFirst()}
                      disabled={atCap || !canAfford}
                      data-testid={`workshop-reinforce-${slot}`}
                      onClick={() => onCommand({ type: "reinforce_equipment", characterId: member.id, slot })}
                    >
                      {atCap ? t("workshop.atCap") : canAfford ? t("workshop.reinforce", { cost }) : t("workshop.cantAfford", { cost })}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="service-actions">
          <button type="button" data-controller-cancel="true" ref={claimFirst()} data-testid="workshop-back" onClick={onClose}>
            {t("town.serviceCancel")}
          </button>
        </div>
      </div>
    </section>
  );
}
