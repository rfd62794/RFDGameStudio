import { CatalogId, GearSlot, Stats } from "./types";

export interface CatalogEntry {
  id: CatalogId;
  name: string;
  slot?: GearSlot;              // undefined for "tool" — it has no slot
  tierCost: Record<1 | 2, number>;
  baseStats: Record<1 | 2, Partial<Stats>>;
  maxLife: Record<1 | 2, number>;
}

export const CATALOG: Record<CatalogId, CatalogEntry> = {
  beatStick: {
    id: "beatStick",
    name: "Beat Stick",
    slot: "weapon",
    tierCost: { 1: 10, 2: 25 },
    baseStats: {
      1: { hp: 0, atk: 5, def: 0 },
      2: { hp: 0, atk: 10, def: 0 },
    },
    maxLife: { 1: 10, 2: 18 },
  },
  shield: {
    id: "shield",
    name: "Shield",
    slot: "shield",
    tierCost: { 1: 10, 2: 25 },
    baseStats: {
      1: { hp: 0, atk: 0, def: 3 },
      2: { hp: 0, atk: 0, def: 7 },
    },
    maxLife: { 1: 10, 2: 18 },
  },
  bodyArmor: {
    id: "bodyArmor",
    name: "Body Armor",
    slot: "armor",
    tierCost: { 1: 10, 2: 25 },
    baseStats: {
      1: { hp: 15, atk: 0, def: 2 },
      2: { hp: 30, atk: 0, def: 5 },
    },
    maxLife: { 1: 10, 2: 18 },
  },
  tool: {
    id: "tool",
    name: "Tier-2 Tool",
    slot: undefined,
    tierCost: { 1: 20, 2: 20 }, // only tierCost[1] matters, keep static
    baseStats: {
      1: { hp: 0, atk: 0, def: 0 },
      2: { hp: 0, atk: 0, def: 0 },
    },
    maxLife: { 1: 999, 2: 999 },
  },
};
