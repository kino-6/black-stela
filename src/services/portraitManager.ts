import type { Character } from "../domain/types";

export interface PortraitReference {
  id: string;
  characterId: string;
  dataUrl: string;
  fileName: string;
}

export async function importPortraitFile(characterId: string, file: File): Promise<PortraitReference> {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: crypto.randomUUID(),
    characterId,
    dataUrl,
    fileName: file.name
  };
}

export function bindPortraitReference(character: Character, portrait: PortraitReference): Character {
  if (character.id !== portrait.characterId) {
    throw new Error("Portrait can only be bound to its owning character.");
  }

  return {
    ...character,
    portraitRef: portrait.dataUrl
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}
