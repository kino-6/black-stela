import type { AnyClassId, CharacterClassId, LegacyClassId } from "./types";

/**
 * CLASS ID RESOLUTION — a leaf module (no imports but types) because the class catalog, the class
 * contract, the ability view and the save schema all need it, and routing them through
 * characterCreation.ts would close an import cycle.
 */

const SELECTABLE = new Set<CharacterClassId>([
  "warrior",
  "knight",
  "swordmaster",
  "thief",
  "priest",
  "chanter",
  "mage",
  "occultist"
]);

/**
 * WHAT EACH OLD ID BECAME, and why — the documented mapping §8.3 requires. Old ids are never rewritten in
 * place: saves, world content (equipment `allowedClasses`, authored vocation prerequisites) and the golden
 * traces all still name them, and they keep resolving through this table. Rewriting stored data is a
 * beta-time migration with its own version bump, deliberately not done here.
 *
 * sellsword → warrior      : separated from 先鋒 by two points of stat line and its prose. §4 makes it an
 *                            epithet, not a discipline.
 * scout, cutpurse → thief  : all three carried the SAME trap-handling bonus, which was the only rule that
 *                            ever read a roleTag. One Thief, one identity.
 * wayfinder → thief        : §4 — a route-keeper is a background or a learned technique, not a base class;
 *                            its mapping/secrets work belongs to the Thief family.
 */
export const LEGACY_CLASS_MAPPING: Record<LegacyClassId, CharacterClassId> = {
  vanguard: "warrior",
  sellsword: "warrior",
  bulwark: "knight",
  duelist: "swordmaster",
  seeker: "thief",
  scout: "thief",
  cutpurse: "thief",
  mender: "priest",
  chanter: "chanter",
  occultist: "occultist",
  arcanist: "mage",
  wayfinder: "thief"
};

/**
 * Normalize any class id — current or legacy — to a selectable one. Everything that asks "what class is
 * this?" goes through here, so a character saved as a 斥候 is a 盗賊 to every rule without their stored
 * data being touched.
 */
export function resolveClassId(id: AnyClassId | string | undefined): CharacterClassId {
  if (!id) {
    return "warrior";
  }
  if (SELECTABLE.has(id as CharacterClassId)) {
    return id as CharacterClassId;
  }
  return LEGACY_CLASS_MAPPING[id as LegacyClassId] ?? "warrior";
}
