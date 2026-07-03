import type { Character } from "../domain/types";

export interface PortraitReference {
  id: string;
  characterId: string;
  dataUrl?: string;
  fileName: string;
  storagePath: string;
}

export async function importPortraitFile(characterId: string, file: File): Promise<PortraitReference> {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: crypto.randomUUID(),
    characterId,
    dataUrl,
    fileName: file.name,
    storagePath: createPortraitStoragePath(file.name)
  };
}

export function bindPortraitReference(character: Character, portrait: PortraitReference): Character {
  if (character.id !== portrait.characterId) {
    throw new Error("Portrait can only be bound to its owning character.");
  }

  return {
    ...character,
    portraitRef: portrait.storagePath
  };
}

export function resolvePortraitSource(
  portraitRef: string | undefined,
  portraits: Record<string, PortraitReference>
): string | null {
  if (!portraitRef) {
    return null;
  }

  if (portraitRef.startsWith("data:")) {
    return portraitRef;
  }

  return portraits[portraitRef]?.dataUrl ?? null;
}

function createPortraitStoragePath(fileName: string) {
  const safeName = fileName.replace(/[^a-z0-9_.-]/gi, "_");
  return `portrait://${crypto.randomUUID()}/${safeName}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
