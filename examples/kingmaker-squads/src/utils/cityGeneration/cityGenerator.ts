import { TerritoryCell, UnitArchetype, UnitState, WardSubType, HouseId, FactionId } from '../../types';
import { generatePatches, Patch, PatchGeneratorOptions, crossesRiver } from './patchGenerator';
import { generateDistrictsWithinRegion } from './districtGenerator';
import { assignWards } from './wardAssignment';
import { computeBuildingDensity, shouldRenderBuildingAt } from './densityModel';
import { subdivideIntoPlots } from './plotSubdivision';
import { CAPITAL_HILL_ANCHOR, isInsideOldWall, HOVEL_NAME } from '../../data/worldGeometry';
import { createUnit } from '../../data/archetypes';

export interface CityGeneratorOptions extends PatchGeneratorOptions {
  brokenForcesMap?: Record<string, boolean>; // cellId -> whether defense force collapsed
}

function generateDistrictLeaderUnit(districtName: string, wardSubType: WardSubType | undefined, isCapital: boolean): UnitState {
  let archetype: UnitArchetype = 'rook';
  let rank: 'recruit' | 'veteran' | 'elite' = 'veteran';

  if (isCapital) {
    archetype = 'rook';
    rank = 'veteran';
  } else {
    switch (wardSubType) {
      case 'administration':
        archetype = 'queen';
        rank = 'veteran';
        break;
      case 'patriciate':
        archetype = 'rook';
        rank = 'veteran';
        break;
      case 'military':
        archetype = 'rook';
        rank = 'veteran';
        break;
      case 'merchant':
        archetype = 'bishop';
        rank = 'veteran';
        break;
      case 'craftsmen':
        archetype = 'knight';
        rank = 'recruit';
        break;
      case 'slum':
        archetype = 'pawn';
        rank = 'recruit';
        break;
      case 'common':
      default:
        archetype = 'knight';
        rank = 'recruit';
        break;
    }
  }

  const leader = createUnit(archetype, `${districtName} Leader`, rank);
  leader.isKing = true;
  leader.isPermanent = true;
  return leader;
}

/**
 * Assigns the 6 Houses to Region patches based on Revision 12's wheel placement:
 * - Ember (Player): Hovel / Capital Region
 * - Tundra: Crown core inside Old Wall
 * - Marsh & Gale: Adjacent to Ember
 * - Crystal & Tide: Adjacent to Tundra
 */
export function assignHousesToRegions(regionPatches: Patch[]): Map<string, HouseId> {
  const houseMap = new Map<string, HouseId>();
  const unassigned = [...regionPatches];

  // 1. Find Capital / Hovel region -> Ember
  const capitalIdx = unassigned.findIndex((p) => p.isCapital || p.id === 'cell_capital');
  const capitalRegion = capitalIdx >= 0 ? unassigned.splice(capitalIdx, 1)[0] : unassigned.shift()!;
  houseMap.set(capitalRegion.id, 'ember');

  // 2. Find region inside old wall -> Tundra (Crown core)
  const insideWallIdx = unassigned.findIndex((p) => isInsideOldWall(p.center));
  const tundraRegion = insideWallIdx >= 0 ? unassigned.splice(insideWallIdx, 1)[0] : unassigned.shift()!;
  houseMap.set(tundraRegion.id, 'tundra');

  // Helper to find unassigned neighbor regions
  const findNeighborsOf = (targetPatch: Patch): Patch[] => {
    return unassigned.filter((p) => {
      const dist = Math.hypot(p.center.x - targetPatch.center.x, p.center.y - targetPatch.center.y);
      return dist < 300;
    });
  };

  // 3. Assign Marsh and Gale (adjacent to Ember)
  const emberNeighbors = findNeighborsOf(capitalRegion);
  const marshRegion = emberNeighbors.length > 0 ? emberNeighbors[0] : unassigned[0];
  if (marshRegion) {
    houseMap.set(marshRegion.id, 'marsh');
    const idx = unassigned.indexOf(marshRegion);
    if (idx >= 0) unassigned.splice(idx, 1);
  }

  const emberNeighbors2 = findNeighborsOf(capitalRegion);
  const galeRegion = emberNeighbors2.length > 0 ? emberNeighbors2[0] : unassigned[0];
  if (galeRegion) {
    houseMap.set(galeRegion.id, 'gale');
    const idx = unassigned.indexOf(galeRegion);
    if (idx >= 0) unassigned.splice(idx, 1);
  }

  // 4. Assign Crystal and Tide (adjacent to Tundra)
  const tundraNeighbors = findNeighborsOf(tundraRegion);
  const crystalRegion = tundraNeighbors.length > 0 ? tundraNeighbors[0] : unassigned[0];
  if (crystalRegion) {
    houseMap.set(crystalRegion.id, 'crystal');
    const idx = unassigned.indexOf(crystalRegion);
    if (idx >= 0) unassigned.splice(idx, 1);
  }

  const tundraNeighbors2 = findNeighborsOf(tundraRegion);
  const tideRegion = tundraNeighbors2.length > 0 ? tundraNeighbors2[0] : unassigned[0];
  if (tideRegion) {
    houseMap.set(tideRegion.id, 'tide');
    const idx = unassigned.indexOf(tideRegion);
    if (idx >= 0) unassigned.splice(idx, 1);
  }

  // 5. Assign any remaining unassigned regions among the 6 houses
  const housesList: HouseId[] = ['tundra', 'crystal', 'tide', 'marsh', 'gale', 'ember'];
  let houseIdx = 0;
  for (const rem of unassigned) {
    houseMap.set(rem.id, housesList[houseIdx % housesList.length]);
    houseIdx++;
  }

  return houseMap;
}

/**
 * Procedural City Generator — District-within-Region Architecture:
 * Layer 1: Region Patch Generation (Voronoi clipped against permanent OUTER_CITY_LIMIT)
 * Layer 1b: Region House Assignment (Six-House wheel alignment)
 * Layer 1c: District-within-Region Subdivision (Voronoi clipped against parent Region polygon)
 * Layer 2: Ward Assignment with House Ward Bias & OLD_WALL_BOUNDARY position bias
 * Layer 3: Density Model & Plot Subdivision
 * Layer 4: TerritoryCell Assembly & City-wide Adjacency Calculation
 */
export type ProceduralCityResult = TerritoryCell[] & { marshOutline?: [number, number][] };

export function generateProceduralCity(options: CityGeneratorOptions = {}): ProceduralCityResult {
  const capitalAnchor = options.capitalAnchor ?? CAPITAL_HILL_ANCHOR;
  const seed = options.seed ?? 42;
  const regionPatches = generatePatches({ seedCount: options.seedCount ?? 6, ...options, capitalAnchor, seed });
  const regionHouseMap = assignHousesToRegions(regionPatches);
  const brokenForces = options.brokenForcesMap ?? {};

  // Subdivide each Region into 3-6 Districts
  const districtPatches: Patch[] = [];
  const districtHouseMap = new Map<string, HouseId>();

  for (let rIdx = 0; rIdx < regionPatches.length; rIdx++) {
    const region = regionPatches[rIdx];
    const houseId = regionHouseMap.get(region.id) ?? 'ember';
    const targetDistrictCount = (houseId === 'ember' || houseId === 'marsh') ? 8 : 4;
    const subDistricts = generateDistrictsWithinRegion(region, targetDistrictCount, seed + rIdx * 100);

    for (const dist of subDistricts) {
      districtPatches.push(dist);
      districtHouseMap.set(dist.id, houseId);
    }
  }

  // Layer 2: Ward Assignment using House-aware biases
  const wardAssignments = assignWards(districtPatches, districtHouseMap);
  const territoryCells: TerritoryCell[] = [];

  for (const patch of districtPatches) {
    const ward = wardAssignments.get(patch.id)!;
    const houseId = districtHouseMap.get(patch.id) ?? 'ember';
    const isBroken = !!brokenForces[patch.id];
    const isCapitalCell = patch.isCapital || patch.id === 'cell_capital' || ward.districtName === HOVEL_NAME;

    // Layer 3 Density computation
    const density = computeBuildingDensity({
      patch,
      allPatches: districtPatches,
      capitalAnchor,
      isForceBroken: isBroken,
    });

    // Layer 3b Plot subdivision
    const plots = subdivideIntoPlots(patch.polygonPoints, ward.wardSubType);

    // Dynamic Iso Building Layout based on density & ward subtype
    const cols = 2;
    const rows = 2;
    const buildingLayout: string[][] = [];

    for (let r = 0; r < rows; r++) {
      const rowLayout: string[] = [];
      for (let c = 0; c < cols; c++) {
        const renders = shouldRenderBuildingAt(density, `${patch.id}_s${seed}`, c, r);
        if (renders) {
          const plotIdx = (r * cols + c) % plots.length;
          rowLayout.push(plots[plotIdx]?.buildingType || 'house');
        } else {
          rowLayout.push('ruins');
        }
      }
      buildingLayout.push(rowLayout);
    }

    // Permanent district leader generated once at world generation
    const autoGenLeaderUnit = generateDistrictLeaderUnit(ward.districtName, ward.wardSubType, isCapitalCell);
    const autoGenLeaderId = autoGenLeaderUnit.id;

    // Owner determination: Ember = 'player', other houses = houseId or corresponding faction
    const cellOwner: FactionId = (houseId === 'ember' || isCapitalCell) ? 'player' : (houseId as FactionId);

    const isUnsecuredEmberCell = houseId === 'ember' && !isCapitalCell;
    const publicOpinion = isUnsecuredEmberCell ? 35 : ward.publicOpinion;

    const enemyUnits: UnitState[] = [];
    if (isUnsecuredEmberCell) {
      // Holdout garrison for unsecured Ember district
      const isFortifiedWard = ['fortress', 'administration', 'military'].includes(ward.wardSubType);
      const pickArchetype = (i: number): UnitArchetype => {
        if (ward.wardSubType === 'merchant') return 'bishop';
        if (ward.wardSubType === 'craftsmen' || ward.wardSubType === 'common') return 'knight';
        if (ward.wardSubType === 'slum') return 'pawn';
        if (isFortifiedWard) return i === 0 ? 'rook' : (i === 1 ? 'knight' : 'pawn');
        return 'knight';
      };
      if (isFortifiedWard) {
        enemyUnits.push(createUnit(pickArchetype(0), `${ward.districtName} Veteran Guard`, 'veteran'));
        enemyUnits.push(createUnit(pickArchetype(1), `${ward.districtName} Guard 1`, 'recruit'));
        enemyUnits.push(createUnit(pickArchetype(2), `${ward.districtName} Guard 2`, 'recruit'));
      } else {
        enemyUnits.push(createUnit(pickArchetype(0), `${ward.districtName} Guard 1`, 'recruit'));
        enemyUnits.push(createUnit(pickArchetype(1), `${ward.districtName} Guard 2`, 'recruit'));
      }
    } else if (cellOwner !== 'player') {
      enemyUnits.push(autoGenLeaderUnit);
      const guardCount = isCapitalCell ? 3 : 2;
      for (let i = 0; i < guardCount; i++) {
        enemyUnits.push(createUnit('pawn', `${ward.districtName} Guard ${i + 1}`));
      }
    }

    const cell: TerritoryCell = {
      id: patch.id,
      name: ward.districtName,
      x: patch.center.x,
      y: patch.center.y,
      polygonPoints: patch.polygonPoints,
      neighborIds: [], // Recomputed below
      owner: cellOwner,
      houseId,
      type: isCapitalCell ? 'capital' : ward.cellType,
      isCapitalCell,
      wardSubType: ward.wardSubType,
      density,
      plots,
      publicOpinion,
      threatLevel: isCapitalCell ? 1 : Math.min(5, Math.max(2, Math.floor(Math.hypot(patch.center.x - capitalAnchor.x, patch.center.y - capitalAnchor.y) / 80))),
      troopCount: enemyUnits.length > 0 ? enemyUnits.length : (isCapitalCell ? 4 : 3),
      scouted: isCapitalCell || cellOwner === 'player',
      hasKing: true,
      settlingTurnsLeft: 0,
      autoGenLeaderId,
      autoGenLeaderUnit,
      enemyUnits,
      isoGridAnchor: {
        x: Math.round(patch.center.x - 20),
        y: Math.round(patch.center.y - 15),
      },
      isoGridCols: cols,
      isoGridRows: rows,
      isoBuildingLayout: buildingLayout,
    };

    territoryCells.push(cell);
  }

  // Compute city-wide district adjacencies considering river barrier
  for (let i = 0; i < territoryCells.length; i++) {
    const cA = territoryCells[i];
    const neighbors: string[] = [];

    for (let j = 0; j < territoryCells.length; j++) {
      if (i === j) continue;
      const cB = territoryCells[j];
      const dist = Math.hypot(cA.x - cB.x, cA.y - cB.y);

      // Distance threshold for district adjacency
      if (dist < 160) {
        if (!crossesRiver({ x: cA.x, y: cA.y }, { x: cB.x, y: cB.y })) {
          neighbors.push(cB.id);
        }
      }
    }
    cA.neighborIds = neighbors;
  }

  const marshRegion = regionPatches.find((p) => regionHouseMap.get(p.id) === 'marsh');
  const marshOutline: [number, number][] = marshRegion ? marshRegion.polygonPoints : [];

  const result = territoryCells as TerritoryCell[] & { marshOutline?: [number, number][] };
  result.marshOutline = marshOutline;

  return result;
}
