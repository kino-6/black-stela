import { findBackground } from "../domain/characterCreation";
import type { CharacterBackgroundId, CharacterVisualProfile } from "../domain/types";
import { bodyUrl, portraitUrl } from "./artAssets";
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
  //
  // FACE vs FULL BODY: where the character OWNS the screen (context "battle" = combat spotlight /
  // dungeon presence) we prefer the tall standing art from `assets/bodies/<key>.png`; everywhere else
  // (tokens, sheets) we want the square face. When a pack ships no body for this key, bodyUrl is
  // undefined and we fall through to the face — so a face-only pack renders exactly as before.
  const packBodyUrl = context === "battle" ? bodyUrl(background.portraitKey) : undefined;
  const portraitAssetUrl = packBodyUrl ?? portraitUrl(background.portraitKey);
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
