// new: ts/src/games/slimeworld/ranch/data/fruit.ts
import type { Affinity, ZoneId } from '../model/types';

export interface FruitDef {
  id: string;
  name: string;
  zone: ZoneId;
  /** The element this fruit pushes mutation toward when fed before a mix. */
  element: Affinity;
}

/** Working titles from the direction doc; M0 ships the Meadow and Frost zones. */
export const FRUIT: readonly FruitDef[] = [
  { id: 'sunfruit', name: 'Sunfruit', zone: 'meadow', element: 'meadow' },
  { id: 'berry', name: 'Berry', zone: 'meadow', element: 'meadow' },
  { id: 'honeybell', name: 'Honeybell', zone: 'meadow', element: 'meadow' },
  { id: 'icepear', name: 'Icepear', zone: 'frost', element: 'frost' },
  { id: 'snowberry', name: 'Snowberry', zone: 'frost', element: 'frost' },
  { id: 'glacier_plum', name: 'Glacier Plum', zone: 'frost', element: 'frost' },
];

export function fruitById(id: string): FruitDef | undefined {
  return FRUIT.find((f) => f.id === id);
}
