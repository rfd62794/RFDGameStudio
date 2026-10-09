import type { CellularGrid } from './grid';
import type { BuildingManager } from './buildingManager';
import { BUILDING_DEFS } from './buildingDefs';

/** The factory every new sandbox starts with: Collector -> Pipe -> Compressor -> Solid Bin. */
export function placeStarterFactory(grid: CellularGrid, bMgr: BuildingManager): void {
  // Starter setup: Collector -> Pipe -> Compressor -> Solid Bin
  // Collector: 2x2 at tile (19, 4) -> spans CA (152..168, 32..48)
  const collectorDef = BUILDING_DEFS.find((b) => b.id === 'collector_dust')!;
  bMgr.placeBuilding(grid, collectorDef, 19, 4);

  // Pipes connecting downward
  const pipeDef = BUILDING_DEFS.find((b) => b.id === 'pipe')!;
  bMgr.placeBuilding(grid, pipeDef, 19, 6, 'DOWN');
  bMgr.placeBuilding(grid, pipeDef, 19, 7, 'DOWN');

  // Compressor: 3x3 at tile (19, 8)
  const compressorDef = BUILDING_DEFS.find((b) => b.id === 'processor_compressor')!;
  bMgr.placeBuilding(grid, compressorDef, 19, 8);

  // Pipes from compressor to solid container
  bMgr.placeBuilding(grid, pipeDef, 19, 11, 'DOWN');
  bMgr.placeBuilding(grid, pipeDef, 19, 12, 'DOWN');

  // Solid Bin: 2x3 at tile (19, 13)
  const solidBinDef = BUILDING_DEFS.find((b) => b.id === 'container_solid')!;
  bMgr.placeBuilding(grid, solidBinDef, 19, 13);
}
