import { PlayerState, CatalogId, Equipment } from "./types";
import { CATALOG } from "./catalog";

export function canCraft(player: PlayerState, catalogId: CatalogId, tier?: 1 | 2): boolean {
  const entry = CATALOG[catalogId];
  if (!entry) return false;

  // Tool is special: it's a gate and only has Tier 1
  if (catalogId === "tool") {
    if (player.tier2Unlocked) return false;
    const cost = entry.tierCost[1];
    return player.scrap >= cost;
  }

  const resolvedTier = tier ?? (player.tier2Unlocked ? 2 : 1);

  // If attempting Tier 2, must have tier2Unlocked
  if (resolvedTier === 2 && !player.tier2Unlocked) {
    return false;
  }

  const cost = entry.tierCost[resolvedTier];
  return player.scrap >= cost;
}

export function craft(player: PlayerState, catalogId: CatalogId, tier?: 1 | 2): PlayerState {
  const entry = CATALOG[catalogId];
  if (!entry) {
    throw new Error(`Crafting rejected: Catalog entry for "${catalogId}" does not exist.`);
  }

  if (catalogId === "tool" && player.tier2Unlocked) {
    throw new Error(`Crafting rejected: Tool already crafted and Tier 2 unlocked.`);
  }

  const resolvedTier = catalogId === "tool" ? 1 : (tier ?? (player.tier2Unlocked ? 2 : 1));
  const cost = entry.tierCost[resolvedTier];

  // Specific reason checking
  if (resolvedTier === 2 && !player.tier2Unlocked) {
    throw new Error(`Crafting rejected: Attempted Tier 2 craft for "${catalogId}" but Tier 2 is locked (Tool required).`);
  }

  if (player.scrap < cost) {
    throw new Error(`Crafting rejected: Insufficient scrap to craft "${catalogId}" (Tier ${resolvedTier}). Cost: ${cost}, available: ${player.scrap}.`);
  }

  const updatedPlayer = {
    ...player,
    scrap: player.scrap - cost,
  };

  if (catalogId === "tool") {
    return {
      ...updatedPlayer,
      tier2Unlocked: true,
    };
  }

  const slot = entry.slot!;
  const maxLife = entry.maxLife[resolvedTier];

  const newEquipment: Equipment = {
    id: `${catalogId}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    slot,
    catalogId,
    tier: resolvedTier,
    life: maxLife,
    maxLife,
  };

  return {
    ...updatedPlayer,
    equipped: {
      ...updatedPlayer.equipped,
      [slot]: newEquipment,
    },
  };
}
