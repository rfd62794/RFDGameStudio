import { CellType, FactionId, HouseId, WardSubType } from '../../types';
import { Patch } from './patchGenerator';
import { isInsideOldWall, HOVEL_NAME } from '../../data/worldGeometry';

export interface WardInfo {
  wardSubType: WardSubType;
  cellType: CellType;
  publicOpinion: number;
  districtName: string;
  defaultOwner: FactionId;
}

export const HOUSE_WARD_BIAS: Record<HouseId, Partial<Record<WardSubType, number>>> = {
  tundra: { fortress: 2, administration: 2, military: 1.5 },
  crystal: { fortress: 1.5, administration: 1.5, patriciate: 1 },
  tide: { merchant: 2, patriciate: 1.5, common: 1 },
  marsh: { common: 1.5, craftsmen: 1.5, slum: 1 },
  gale: { outpost: 2, merchant: 1, common: 1 },
  ember: { slum: 1.5, outpost: 1.5, common: 1.5 }, // the player's own starting bias
};

const DISTRICT_NAMES: Record<WardSubType, string[]> = {
  administration: [
    'Crown Citadel',
    'Grand Archives',
    'High Sovereign Council',
    'Sovereignty Hall',
    'Ministry of War',
    'Chanceries of State',
    'High Court Chambers',
    'Guild Hall Assembly',
    'Royal Mint Vaults',
    'Imperial Registry',
  ],
  patriciate: [
    'Marble Plaza',
    'Golden Heights',
    'Patrician Estates',
    'Noble Crest Avenue',
    'Sunstone Terrace',
    'Old Gentry Court',
    'Silver Spires Court',
    'Highborne Enclave',
    'Manor House Rise',
    'Aristocrat Promenade',
  ],
  military: [
    'Iron Garrison',
    'High Bastion',
    'Redcoat Ramparts',
    'Sentinel Watchtower',
    'Armory Yard',
    'Vanguard Citadel',
    'Sentry Battery',
    'Cavalry Barracks',
    'Shieldwall Ridge',
    'Garrison Grounds',
  ],
  merchant: [
    'Bazaar Quarter',
    'Grand Harbor Market',
    'Silk Road Terminal',
    'Exchange Square',
    'Spice Docks',
    'Merchant Arcade',
    'Caravanserai Way',
    'Coinage Wharf',
    'Customs House Pier',
    'Trade Winds Market',
  ],
  craftsmen: [
    'Blacksmith Forge',
    'Artisan Alley',
    'Foundry Row',
    'Weavers Guildhall',
    'Tanners Basin',
    'Masons Quarry Yard',
    'Glassblowers Court',
    'Copper Works',
    'Joiners Workshop',
    'Potters Kiln Lane',
  ],
  slum: [
    'Rats Den Alley',
    'Ash Ditch',
    'Mudlark Basin',
    'Sovereign Slums',
    'Beggar Gate Run',
    'Narrow Shambles',
    'Festering Gut',
    'Ditchside Row',
    'Shadow Alley',
    'Ropewalk Tenements',
  ],
  common: [
    'Westside Green',
    'Eastern Meadows',
    'Outer Fringe',
    'Northside Commons',
    'South Meadow Way',
    'Old Windmill Fields',
    'Pasture Edge',
    'Orchard Gate',
    'Cattle Fair Ground',
    'Riverbank Common',
  ],
  fortress: [
    'Stone Keep Bastion',
    'Old Wall Stronghold',
    'Iron Citadel',
    'Gatehouse Fortress',
    'High Curtain Wall',
    'Wardens Redoubt',
    'Watchful Citadel',
    'Bulwark Fort',
    'Granite Keep',
    'Dread Hold',
  ],
  outpost: [
    'Border Watch Post',
    'Forward Sentry',
    'Picket Outpost',
    'Crossroads Redoubt',
    'Frontier Garrison',
    'Riverbank Outpost',
    'Scout Encampment',
    'Waystation Fort',
    'Boundary Tower',
    'Ridge Line Picket',
  ],
};

/**
 * Returns weight/bias dictionary for ward subtypes based on inside/outside position.
 */
export function getWardTypeBias(patchCenter: { x: number; y: number }): Partial<Record<WardSubType, number>> {
  if (isInsideOldWall(patchCenter)) {
    return { administration: 2, military: 2, patriciate: 1.5, common: 1, fortress: 2 };
  } else {
    return { slum: 2, craftsmen: 1.5, common: 1, merchant: 1, outpost: 1.5 };
  }
}

/**
 * Selects ward subtype for a district considering house bias and position.
 */
export function pickWardSubTypeForHouse(
  patchCenter: { x: number; y: number },
  houseId: HouseId,
  indexSeed: number = 0
): WardSubType {
  const houseBiases = HOUSE_WARD_BIAS[houseId] || {};
  const posBiases = getWardTypeBias(patchCenter);

  const allTypes: WardSubType[] = [
    'fortress',
    'outpost',
    'administration',
    'military',
    'patriciate',
    'merchant',
    'craftsmen',
    'common',
    'slum',
  ];

  // Calculate weighted score for each ward subtype
  const scores: { type: WardSubType; score: number }[] = allTypes.map((t) => {
    const hBias = houseBiases[t] ?? 0.5;
    const pBias = posBiases[t] ?? 0.5;
    return { type: t, score: hBias * pBias };
  });

  scores.sort((a, b) => b.score - a.score);

  // Pick top scoring types, rotated by indexSeed for variety
  const topCandidates = scores.filter((s) => s.score >= scores[0].score * 0.5);
  const picked = topCandidates[indexSeed % topCandidates.length];
  return picked ? picked.type : scores[0].type;
}

/**
 * Assigns WardSubType, CellType, initial Allegiance (publicOpinion), and naming to patches.
 * Uses position-aware bias relative to OLD_WALL_BOUNDARY and optional House identity.
 */
export function assignWards(
  patches: Patch[],
  houseMap?: Map<string, HouseId>
): Map<string, WardInfo> {
  const assignments = new Map<string, WardInfo>();
  const usedNames = new Set<string>();

  const insidePool: WardSubType[] = ['patriciate', 'military', 'administration', 'merchant'];
  const outsidePool: WardSubType[] = ['slum', 'craftsmen', 'common', 'slum', 'merchant', 'craftsmen'];

  let insideIdx = 0;
  let outsideIdx = 0;

  for (let idx = 0; idx < patches.length; idx++) {
    const patch = patches[idx];
    const houseId = houseMap?.get(patch.id);

    if (patch.isCapital || patch.id === 'cell_capital') {
      usedNames.add(HOVEL_NAME);
      assignments.set(patch.id, {
        wardSubType: 'fortress',
        cellType: 'fortress',
        publicOpinion: 70,
        districtName: HOVEL_NAME,
        defaultOwner: 'player',
      });
    } else {
      const isInside = isInsideOldWall(patch.center);
      let subType: WardSubType;

      if (houseId) {
        subType = pickWardSubTypeForHouse(patch.center, houseId, idx);
      } else if (isInside) {
        subType = insidePool[insideIdx % insidePool.length];
        insideIdx++;
      } else {
        subType = outsidePool[outsideIdx % outsidePool.length];
        outsideIdx++;
      }

      let cellType: CellType = 'plains';
      let publicOpinion = 50;
      const defaultOwner: FactionId = houseId === 'ember' ? 'player' : ((houseId as FactionId) ?? 'player');

      switch (subType) {
        case 'fortress':
          cellType = 'fortress';
          publicOpinion = 65;
          break;
        case 'outpost':
          cellType = 'outpost';
          publicOpinion = 40;
          break;
        case 'patriciate':
          cellType = 'fortress';
          publicOpinion = 60;
          break;
        case 'slum':
          cellType = 'outpost';
          publicOpinion = 35;
          break;
        case 'military':
          cellType = 'pass';
          publicOpinion = 40;
          break;
        case 'merchant':
          cellType = 'plains';
          publicOpinion = 50;
          break;
        case 'craftsmen':
          cellType = 'outpost';
          publicOpinion = 45;
          break;
        case 'administration':
          cellType = 'fortress';
          publicOpinion = 70;
          break;
        default:
          cellType = 'plains';
          publicOpinion = 50;
          break;
      }

      const nameCandidates = DISTRICT_NAMES[subType];
      let name = nameCandidates.find((n) => !usedNames.has(n));
      if (!name) {
        const fallbackBase = nameCandidates[idx % nameCandidates.length];
        name = `${fallbackBase} (Lower)`;
      }
      usedNames.add(name);

      assignments.set(patch.id, {
        wardSubType: subType,
        cellType,
        publicOpinion,
        districtName: name,
        defaultOwner,
      });
    }
  }

  return assignments;
}
