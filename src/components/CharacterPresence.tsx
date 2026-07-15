import type { CSSProperties } from "react";
import type { Character } from "../domain/types";
import { findClass } from "../domain/characterCreation";
import type { Locale } from "../i18n";
import { renderPortraitContent } from "../ui/portrait";

interface CharacterPresenceProps {
  character: Character;
  locale: Locale;
  mode: "command" | "action" | "event";
  testId?: string;
}

export function CharacterPresence({ character, locale, mode, testId = "character-presence" }: CharacterPresenceProps) {
  return (
    <aside
      className={`character-presence ${mode}`}
      data-testid={testId}
      data-character-id={character.id}
      data-presence-mode={mode}
      style={{ "--character-accent": character.accentColor } as CSSProperties}
      aria-label={character.name}
    >
      <div className="character-presence-art">
        {renderPortraitContent({
          portraitRef: character.portraitRef,
          visualProfile: character.visualProfile,
          context: "battle",
          backgroundId: character.backgroundId,
          fallback: character.name,
          alt: character.name,
          testId: "character-presence-art"
        })}
      </div>
      <div className="character-presence-name">
        <strong>{character.name}</strong>
        <span>{findClass(character.classId).label[locale]}</span>
      </div>
    </aside>
  );
}
