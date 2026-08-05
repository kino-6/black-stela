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
  // An UPLOADED image (data: / http:) wins. A builtin:// ref is NOT an image URL — it names a pack
  // portrait key, resolved below — so it must not reach an <img src>.
  if (visual.src && !visual.src.startsWith("debug://") && !visual.src.startsWith("builtin://")) {
    return <img data-testid={testId} src={visual.src} alt={alt} style={{ objectPosition: visual.objectPosition }} />;
  }

  const background = findBackground(backgroundId);
  // The chosen portrait KEY: an explicit builtin pick (a background face OR one of the world's extra
  // figures) wins, else the background's own face. Deliberately independent of backgroundId — the player
  // may pick any face/figure the world offers.
  const chosenKey = portraitRef?.startsWith(BUILTIN_PORTRAIT_PREFIX)
    ? portraitRef.slice(BUILTIN_PORTRAIT_PREFIX.length)
    : background.portraitKey;

  // Portraits are global character-creation art; they follow the active art pack (set on the resolver
  // whenever the scenario changes) rather than a fixed world.
  //
  // FACE vs FULL BODY: where the character OWNS the screen (context "battle" = combat spotlight / dungeon
  // presence) we prefer the tall standing art from bodies/<key>.png; everywhere else (tokens, sheets) we
  // want the square face from portraits/<key>.png. A world may offer a BODY-ONLY figure (an extra
  // world.portraits key with no matching face) — there the face token top-crops the standing art so the
  // head fills the avatar, and battle uses the body directly. When neither exists we fall to the glyph.
  const face = portraitUrl(chosenKey);
  const body = bodyUrl(chosenKey);
  const bodyAsFace = !face && body; // a body-only key rendered into a small face frame
  const portraitAssetUrl = context === "battle" ? body ?? face : face ?? body;
  if (portraitAssetUrl) {
    return (
      <img
        data-testid={testId}
        src={portraitAssetUrl}
        alt={alt || background.label.en}
        // Top-crop a full-body figure standing in for a face so the head, not the torso, fills the frame.
        style={{ objectPosition: bodyAsFace && context !== "battle" ? "50% 6%" : visual.objectPosition }}
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

const BUILTIN_PORTRAIT_PREFIX = "builtin://portrait/";
