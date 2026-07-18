import { noChange, withEvents } from "../commandResult";
import type { CommandResult } from "../commandResult";
import { equipmentInstanceKey } from "../affixes";
import {
  addInventoryItem,
  createInventoryItemFromCatalog,
  findEquipment,
  getEquipmentSlot,
  isEquipmentUsableBy,
  removeInventoryItem
} from "../economy";
import {
  MAX_REINFORCE,
  appraisalFee,
  appraiseInstance,
  dismantleYield,
  isProtectedFromBulk,
  isUnidentifiedRare,
  reinforceCost,
  sellValueOf
} from "../loot";
import type { EquipmentSlot, GameState, ItemRarity, ScenarioWorld } from "../types";

// The town equipment economy — appraise, protect, reinforce, bulk-convert, buy, sell, equip. Extracted
// from rulesEngine as one cohesive command group; every handler is town-only and returns a CommandResult.

// The equipmentInstanceKeys currently worn by the party — bulk conversion must not touch worn gear.
function equippedInstanceKeys(state: GameState): Set<string> {
  const keys = new Set<string>();
  for (const member of state.party) {
    for (const equipped of Object.values(member.equipment)) {
      if (equipped) {
        keys.add(equipmentInstanceKey(equipped.id, equipped.plus, equipped.affix));
      }
    }
  }
  return keys;
}

function isStockAvailable(stock: NonNullable<ScenarioWorld["shops"][number]["stock"]>[number], state: GameState) {
  if (stock.availability === "unlocked" && stock.unlockFlag) {
    return state.discoveredSecrets.includes(stock.unlockFlag);
  }

  return stock.availability !== "unlocked";
}

// IMP-022C: appraise an unidentified rare, revealing its rolled affix. Town only.
export function appraiseItemCommand(state: GameState, instanceId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const item = state.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!item || !isUnidentifiedRare(item)) {
    return noChange(state);
  }
  // IMP-022V: appraisal is a paid service. Can't afford the reading → nothing happens (the UI
  // disables the button and shows why), so gold never goes negative.
  const fee = appraisalFee(item);
  if (state.partyGold < fee) {
    return noChange(state);
  }
  const next: GameState = {
    ...state,
    partyGold: state.partyGold - fee,
    inventory: state.inventory.map((candidate) => (candidate.instanceId === instanceId ? appraiseInstance(candidate) : candidate)),
    turn: state.turn + 1
  };
  return withEvents(next, [
    { type: "item_appraised", itemId: item.id, itemName: item.name, affix: item.affix, rarity: item.rarity ?? "rare", cost: fee }
  ]);
}

// IMP-022C: toggle a per-instance protection flag (lock / favorite). Town only, no turn cost.
export function toggleItemFlagCommand(state: GameState, instanceId: string, flag: "locked" | "favorite"): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const item = state.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!item) {
    return noChange(state);
  }
  return {
    state: {
      ...state,
      inventory: state.inventory.map((candidate) =>
        candidate.instanceId === instanceId ? { ...candidate, [flag]: !candidate[flag] } : candidate
      )
    },
    events: []
  };
}

// The materials SINK (workshop / 錬成所): spend dismantled materials to reinforce a WORN piece one
// step (+1 to its slot's primary stat via the existing `plus` mechanic). Guards: town only, an item
// is worn in that slot, it isn't already at the cap, and the party can afford the step. Never spends
// past what it has, never exceeds MAX_REINFORCE.
export function reinforceEquipmentCommand(state: GameState, world: ScenarioWorld, characterId: string, slot: EquipmentSlot): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const member = state.party.find((candidate) => candidate.id === characterId);
  const equipped = member?.equipment[slot];
  if (!member || !equipped) {
    return noChange(state);
  }
  const currentPlus = equipped.plus ?? 0;
  const cost = reinforceCost(currentPlus);
  if (currentPlus >= MAX_REINFORCE || (state.materials ?? 0) < cost) {
    return noChange(state);
  }
  const nextPlus = currentPlus + 1;
  const definition = world.equipment.find((candidate) => candidate.id === equipped.id);
  const next: GameState = {
    ...state,
    materials: (state.materials ?? 0) - cost,
    party: state.party.map((candidate) =>
      candidate.id === characterId
        ? { ...candidate, equipment: { ...candidate.equipment, [slot]: { ...equipped, plus: nextPlus } } }
        : candidate
    ),
    turn: state.turn + 1
  };
  return withEvents(next, [
    { type: "equipment_reinforced", characterName: member.name, itemId: equipped.id, itemName: definition?.name ?? equipped.id, slot, plus: nextPlus, cost }
  ]);
}

// IMP-022C: convert UNPROTECTED equipment — sell for gold or dismantle for materials. Equipped /
// locked / favorite / unidentified-rare items are left untouched (the guard). IMP-022 filter: an
// optional `rarities` list scopes the conversion (e.g. clear commons, keep rares) — omit for all.
export function bulkConvertCommand(
  state: GameState,
  world: ScenarioWorld,
  mode: "sell" | "dismantle",
  rarities?: ItemRarity[]
): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }
  const rarityFilter = rarities && rarities.length > 0 ? new Set(rarities) : null;
  const equippedKeys = equippedInstanceKeys(state);
  const convertible = state.inventory.filter(
    (item) =>
      item.kind === "equipment" &&
      !isProtectedFromBulk(item, equippedKeys) &&
      (!rarityFilter || rarityFilter.has(item.rarity ?? "common"))
  );
  if (convertible.length === 0) {
    return noChange(state);
  }
  const goldGained = mode === "sell" ? convertible.reduce((total, item) => total + sellValueOf(item) * item.quantity, 0) : 0;
  const materialsGained = mode === "dismantle" ? convertible.reduce((total, item) => total + dismantleYield(item), 0) : 0;
  const convertedCount = convertible.reduce((total, item) => total + item.quantity, 0);
  const convertedKeys = new Set(convertible.map((item) => item.instanceId ?? equipmentInstanceKey(item.id, item.plus, item.affix)));

  const next: GameState = {
    ...state,
    inventory: state.inventory.filter(
      (item) => !convertedKeys.has(item.instanceId ?? equipmentInstanceKey(item.id, item.plus, item.affix))
    ),
    partyGold: state.partyGold + goldGained,
    materials: (state.materials ?? 0) + materialsGained,
    turn: state.turn + 1
  };
  return withEvents(next, [
    { type: "bulk_converted", mode, count: convertedCount, gold: goldGained, materials: materialsGained }
  ]);
}

export function buyItem(state: GameState, world: ScenarioWorld, shopId: string, itemId: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const shop = world.shops.find((candidate) => candidate.id === shopId);
  const stock = shop?.stock?.find((candidate) => candidate.itemId === itemId);
  if (!shop || !stock || !isStockAvailable(stock, state)) {
    return noChange(state);
  }

  if (state.partyGold < stock.price) {
    return noChange(state);
  }

  const item = createInventoryItemFromCatalog(world, itemId, 1);
  if (!item) {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    partyGold: state.partyGold - stock.price,
    inventory: addInventoryItem(state.inventory, item),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "item_bought", itemId, itemName: item.name, gold: stock.price }]);
}

export function sellItem(state: GameState, world: ScenarioWorld, itemId: string, plus?: number, affix?: string): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const key = equipmentInstanceKey(itemId, plus, affix);
  const item = state.inventory.find(
    (candidate) => equipmentInstanceKey(candidate.id, candidate.plus, candidate.affix) === key && candidate.quantity > 0
  );
  if (!item) {
    return noChange(state);
  }
  // Only the exact equipped instance is protected from selling.
  if (
    state.party.some((member) =>
      Object.values(member.equipment).some((slot) => slot && equipmentInstanceKey(slot.id, slot.plus, slot.affix) === key)
    )
  ) {
    return noChange(state);
  }

  const catalogValue =
    item.sellValue ??
    world.items.find((candidate) => candidate.id === itemId)?.sellValue ??
    world.equipment.find((candidate) => candidate.id === itemId)?.sellValue ??
    0;
  if (catalogValue <= 0) {
    return noChange(state);
  }

  const next: GameState = {
    ...state,
    partyGold: state.partyGold + catalogValue,
    inventory: removeInventoryItem(state.inventory, itemId, 1, plus, affix),
    turn: state.turn + 1
  };

  return withEvents(next, [{ type: "item_sold", itemId, itemName: item.name, gold: catalogValue }]);
}

export function equipItem(
  state: GameState,
  world: ScenarioWorld,
  characterId: string,
  equipmentId: string,
  plus?: number,
  affix?: string
): CommandResult {
  if (state.phase !== "town") {
    return noChange(state);
  }

  const key = equipmentInstanceKey(equipmentId, plus, affix);
  const item = state.inventory.find(
    (candidate) => equipmentInstanceKey(candidate.id, candidate.plus, candidate.affix) === key && candidate.quantity > 0
  );
  const equipment = findEquipment(world, equipmentId);
  const slot = getEquipmentSlot(world, equipmentId);
  const character = state.party.find((member) => member.id === characterId);
  if (!item || item.kind !== "equipment" || !equipment || !slot || !character || !isEquipmentUsableBy(equipment, character)) {
    return noChange(state);
  }

  const equippedOwners = state.party.flatMap((member) =>
    Object.entries(member.equipment)
      .filter(([, equipped]) => equipped && equipmentInstanceKey(equipped.id, equipped.plus, equipped.affix) === key)
      .map(([memberSlot]) => ({ characterId: member.id, slot: memberSlot as EquipmentSlot }))
  );
  const targetAlreadyHasInstance = equippedOwners.some((owner) => owner.characterId === characterId);
  const transferFrom = !targetAlreadyHasInstance && equippedOwners.length >= item.quantity
    ? equippedOwners.find((owner) => owner.characterId !== characterId)
    : undefined;

  const next: GameState = {
    ...state,
    party: state.party.map((member) => {
      const nextEquipment = { ...member.equipment };
      if (transferFrom?.characterId === member.id) {
        delete nextEquipment[transferFrom.slot];
      }
      if (member.id === characterId) {
        nextEquipment[slot] = { id: equipmentId, plus, affix };
      }
      return { ...member, equipment: nextEquipment };
    }),
    turn: state.turn + 1
  };

  return withEvents(next, [
    { type: "equipment_changed", itemId: equipmentId, characterName: character.name, itemName: equipment.name, slot }
  ]);
}
