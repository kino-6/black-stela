import { findBackground } from "../domain/characterCreation";
import type { CharacterBackgroundId, CharacterVisualProfile } from "../domain/types";
import { portraitUrl } from "./artAssets";
import { resolveCharacterVisual, type CharacterVisualContext } from "./characterVisual";

// Shared across every surface that shows a face (guild creation, party HUD, camp,
// records). Lived inside App.tsx until the cockpit split needed it in two files.
export function renderPortraitContent({
  portraitRef,
  visualProfile,
  context = "token",
  backgroundId,
  fallback,
  alt = "",
  testId
}: {
  portraitRef?: string;
  visualProfile?: CharacterVisualProfile;
  context?: CharacterVisualContext;
  backgroundId: CharacterBackgroundId;
  fallback: string;
  alt?: string;
  testId?: string;
}) {
  const visual = resolveCharacterVisual(visualProfile, context, portraitRef);
  if (visual.src && !visual.src.startsWith("debug://")) {
    return <img data-testid={testId} src={visual.src} alt={alt} style={{ objectPosition: visual.objectPosition }} />;
  }

  const background = findBackground(backgroundId);
  // Portraits are global character-creation art; they follow the active art pack
  // (set on the resolver whenever the scenario changes) rather than a fixed world.
  const portraitAssetUrl = portraitUrl(background.portraitKey);
  if (portraitAssetUrl) {
    return (
      <img
        data-testid={testId}
        src={portraitAssetUrl}
        alt={alt || background.label.en}
        style={{ objectPosition: visual.objectPosition }}
      />
    );
  }

  const mark = fallback.trim().slice(0, 1) || background.label.en.slice(0, 1);
  return (
    <span
      className={`portrait-asset portrait-asset-${background.portraitKey}`}
      data-testid={testId}
      aria-label={alt || background.label.en}
    >
      {mark}
    </span>
  );
}
