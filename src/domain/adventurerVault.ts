import { z } from "zod";
import { resolveClassId } from "./classIds";
import type { PortableAdventurer } from "./types";

// The adventurer vault is a scenario-independent storage boundary: adventurers
// exported here can be imported into any world's guild. It lives under its own
// localStorage key, separate from per-scenario save data, so retiring or
// abandoning one expedition never touches vaulted heroes.
export const VAULT_STORAGE_KEY = "black-stela:adventurer-vault:v1";

const AptitudeSchema = z.object({
  might: z.number().int(),
  agility: z.number().int(),
  spirit: z.number().int(),
  wit: z.number().int(),
  luck: z.number().int()
});

// Legacy class ids are accepted and normalized (characterCreation.LEGACY_CLASS_MAPPING) — a vault
// adventurer written by an older build is still that adventurer.
const ClassIdSchema = z.string().min(1).transform((id) => resolveClassId(id));

const BackgroundIdSchema = z.enum([
  "watch",
  "ruinborn",
  "apothecary",
  "debtor",
  "cartographer",
  "shrine_ward",
  "caravan_guard",
  "pit_fighter",
  "scriptorium",
  "grave_tender",
  "dock_rat",
  "deserter"
]);

const TraitIdSchema = z.enum([
  "steady",
  "scarred",
  "lucky",
  "grim",
  "curious",
  "cautious",
  "bold",
  "devout",
  "nimble",
  "stubborn",
  "sharp_eyed",
  "soft_spoken"
]);

const MemorySchema = z.object({
  firstExpeditionTurn: z.number().int().nonnegative().optional(),
  deepestFloorId: z.string().optional(),
  injuries: z.number().int().nonnegative().default(0),
  retreats: z.number().int().nonnegative().default(0),
  notableVictories: z.array(z.string()).default([]),
  deeds: z.array(z.string()).default([])
});

const CharacterVisualProfileSchema = z.object({
  baseRef: z.string().optional(),
  battleRef: z.string().optional(),
  focusX: z.number().min(0).max(100).default(50),
  focusY: z.number().min(0).max(100).default(38)
});

export const PortableAdventurerSchema = z.object({
  formatVersion: z.literal(1),
  exportedAt: z.string(),
  origin: z.object({ worldId: z.string().min(1), worldTitle: z.string().min(1) }),
  identity: z.object({
    name: z.string().min(1),
    title: z.string().default(""),
    notes: z.string().default(""),
    accentColor: z.string().default("#c9a765"),
    portraitRef: z.string().optional(),
    visualProfile: CharacterVisualProfileSchema.optional()
  }),
  build: z.object({
    classId: ClassIdSchema,
    backgroundId: BackgroundIdSchema,
    roleTags: z.array(z.string()).default([]),
    rowPreference: z.enum(["front", "back"]).default("front"),
    aptitude: AptitudeSchema,
    traitIds: z.array(TraitIdSchema).default([])
  }),
  progress: z.object({
    level: z.number().int().positive().default(1),
    xp: z.number().int().nonnegative().default(0),
    gold: z.number().int().nonnegative().default(0),
    memory: MemorySchema.default({ injuries: 0, retreats: 0, notableVictories: [], deeds: [] })
  })
});

// A stored entry pairs the portable snapshot with a stable vault id so the UI
// can list, select, and remove individual deposits.
export const VaultEntrySchema = z.object({
  vaultId: z.string().min(1),
  adventurer: PortableAdventurerSchema
});

export type VaultEntry = z.infer<typeof VaultEntrySchema>;

const VaultFileSchema = z.array(VaultEntrySchema).catch([]);

export interface VaultStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Read the vault, dropping any entries that fail validation rather than throwing
// — a corrupt or partially-forward-compatible file should never brick the guild.
export function readVault(storage: VaultStorage): VaultEntry[] {
  const raw = storage.getItem(VAULT_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const entries = Array.isArray(parsed) ? parsed : [];
  return entries.flatMap((entry) => {
    const result = VaultEntrySchema.safeParse(entry);
    return result.success ? [result.data] : [];
  });
}

export function writeVault(storage: VaultStorage, entries: VaultEntry[]): void {
  storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(VaultFileSchema.parse(entries)));
}

// Record an adventurer into the vault under a fresh id, returning the updated
// list. Callers persist the result via writeVault.
export function depositToVault(
  storage: VaultStorage,
  adventurer: PortableAdventurer,
  vaultId: string
): VaultEntry[] {
  const entries = readVault(storage);
  const next = [...entries, { vaultId, adventurer: PortableAdventurerSchema.parse(adventurer) }];
  writeVault(storage, next);
  return next;
}

export function removeFromVault(storage: VaultStorage, vaultId: string): VaultEntry[] {
  const next = readVault(storage).filter((entry) => entry.vaultId !== vaultId);
  writeVault(storage, next);
  return next;
}
