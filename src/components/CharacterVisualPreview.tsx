import { MoveDown, MoveLeft, MoveRight, MoveUp } from "lucide-react";
import type { CSSProperties } from "react";
import type { CharacterVisualProfile, CharacterBackgroundId } from "../domain/types";
import type { Translator } from "../i18n";
import { renderPortraitContent } from "../ui/portrait";

interface CharacterVisualPreviewProps {
  portraitRef?: string;
  visualProfile?: CharacterVisualProfile;
  backgroundId: CharacterBackgroundId;
  fallback: string;
  accentColor: string;
  t: Translator;
  onShiftFocus: (x: number, y: number) => void;
}

export function CharacterVisualPreview({
  portraitRef,
  visualProfile,
  backgroundId,
  fallback,
  accentColor,
  t,
  onShiftFocus
}: CharacterVisualPreviewProps) {
  const art = (context: "token" | "profile" | "battle", testId: string) =>
    renderPortraitContent({
      portraitRef,
      visualProfile,
      context,
      backgroundId,
      fallback,
      alt: t("party.portraitPreview"),
      testId
    });

  const focusButtons = [
    { label: t("party.focusUp"), x: 0, y: -5, Icon: MoveUp },
    { label: t("party.focusLeft"), x: -5, y: 0, Icon: MoveLeft },
    { label: t("party.focusRight"), x: 5, y: 0, Icon: MoveRight },
    { label: t("party.focusDown"), x: 0, y: 5, Icon: MoveDown }
  ];

  return (
    <div className="character-visual-preview" data-testid="character-visual-preview">
      <div className="character-visual-frames" style={{ "--character-accent": accentColor } as CSSProperties}>
        <figure className="visual-frame token-frame">
          <div>{art("token", "visual-preview-token")}</div>
          <figcaption>{t("party.previewToken")}</figcaption>
        </figure>
        <figure className="visual-frame profile-frame">
          <div>{art("profile", "portrait-preview")}</div>
          <figcaption>{t("party.previewProfile")}</figcaption>
        </figure>
        <figure className="visual-frame battle-frame">
          <div>{art("battle", "visual-preview-battle")}</div>
          <figcaption>{t("party.previewBattle")}</figcaption>
        </figure>
      </div>
      <div
        className="visual-focus-pad"
        aria-label={t("party.adjustFocus")}
        data-controller-active="true"
        data-controller-surface="portrait-focus"
      >
        {focusButtons.map(({ label, x, y, Icon }) => (
          <button type="button" key={label} aria-label={label} title={label} onClick={() => onShiftFocus(x, y)}>
            <Icon size={17} />
          </button>
        ))}
      </div>
    </div>
  );
}
