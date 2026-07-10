import type { Character, Command, InventoryItem } from "../domain/types";
import type { Translator } from "../i18n";

interface CampPanelProps {
  party: Character[];
  inventory: InventoryItem[];
  t: Translator;
  onCommand: (command: Command) => void;
  onClose: () => void;
}

// The dungeon camp overlay: re-order rows and heal party members between fights
// (extracted verbatim from App's render).
export function CampPanel({ party, inventory, t, onCommand, onClose }: CampPanelProps) {
  return (
    <div className="camp-overlay" data-testid="camp-panel">
      <section
        className="camp-panel"
        role="dialog"
        aria-label={t("play.campTitle")}
        data-controller-active="true"
        data-controller-surface="camp"
      >
        <header className="camp-head">
          <h3>{t("play.campTitle")}</h3>
          <p>{t("play.campSubtitle")}</p>
        </header>
        <ul className="camp-roster">
          {party.map((member) => {
            const healItem = inventory.find((entry) => entry.kind === "healing" && entry.quantity > 0);
            return (
              <li key={member.id} className="camp-member">
                <div className="camp-member-info">
                  <strong>{member.name}</strong>
                  <span>{member.row === "front" ? t("play.rowFront") : t("play.rowBack")}</span>
                  <span>
                    HP {member.hp}/{member.maxHp}
                    {member.maxMp ? ` · MP ${member.mp}/${member.maxMp}` : ""}
                  </span>
                </div>
                <div className="camp-member-actions">
                  <button
                    type="button"
                    onClick={() =>
                      onCommand({
                        type: "set_member_row",
                        characterId: member.id,
                        row: member.row === "front" ? "back" : "front"
                      })
                    }
                  >
                    {member.row === "front" ? t("play.moveToBack") : t("play.moveToFront")}
                  </button>
                  {healItem && member.hp < member.maxHp && (
                    <button
                      type="button"
                      onClick={() => onCommand({ type: "use_item", itemId: healItem.id, targetCharacterId: member.id })}
                    >
                      {t("play.campHeal", { item: healItem.name, count: healItem.quantity })}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="primary-action"
          data-controller-cancel="true"
          onClick={onClose}
        >
          {t("play.breakCamp")}
        </button>
      </section>
    </div>
  );
}
