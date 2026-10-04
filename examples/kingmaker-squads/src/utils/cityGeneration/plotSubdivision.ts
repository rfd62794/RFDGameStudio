import { WardPlot, WardSubType } from '../../types';
import { getPolygonBoundingBox } from '../isoMath';

export interface ChaosProfile {
  gridChaos: number; // 0.0 (strictly ordered) to 1.0 (highly irregular)
  sizeChaos: number; // 0.0 (uniform plot sizes) to 1.0 (wild size variance)
  minPlotSize: number;
}

export function getChaosProfile(wardSubType: WardSubType): ChaosProfile {
  switch (wardSubType) {
    case 'slum':
      return { gridChaos: 0.85, sizeChaos: 0.9, minPlotSize: 12 };
    case 'patriciate':
      return { gridChaos: 0.15, sizeChaos: 0.2, minPlotSize: 28 };
    case 'military':
      return { gridChaos: 0.25, sizeChaos: 0.4, minPlotSize: 22 };
    case 'merchant':
      return { gridChaos: 0.45, sizeChaos: 0.5, minPlotSize: 18 };
    case 'craftsmen':
      return { gridChaos: 0.5, sizeChaos: 0.6, minPlotSize: 16 };
    case 'administration':
      return { gridChaos: 0.1, sizeChaos: 0.15, minPlotSize: 32 };
    case 'common':
    default:
      return { gridChaos: 0.4, sizeChaos: 0.4, minPlotSize: 20 };
  }
}

/**
 * Subdivides a patch polygon into individual building plots according to the ward's chaos profile.
 */
export function subdivideIntoPlots(
  polygonPoints: [number, number][],
  wardSubType: WardSubType,
  overrideMinPlotSize?: number
): WardPlot[] {
  const profile = getChaosProfile(wardSubType);
  const minSize = overrideMinPlotSize ?? profile.minPlotSize;

  const bbox = getPolygonBoundingBox(polygonPoints);
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;

  if (width < minSize * 1.5 || height < minSize * 1.5) {
    return [
      {
        polygonPoints,
        buildingType: getDefaultBuildingType(wardSubType),
      },
    ];
  }

  const plots: WardPlot[] = [];
  const cols = Math.max(1, Math.floor(width / (minSize * (1 + profile.sizeChaos * 0.5))));
  const rows = Math.max(1, Math.floor(height / (minSize * (1 + profile.sizeChaos * 0.5))));

  const cellW = width / cols;
  const cellH = height / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Apply chaos jitter
      const jitterX = (Math.sin(r * 13 + c * 7) * profile.gridChaos * cellW) / 3;
      const jitterY = (Math.cos(r * 7 + c * 13) * profile.gridChaos * cellH) / 3;

      const px1 = Math.round(bbox.minX + c * cellW + jitterX);
      const py1 = Math.round(bbox.minY + r * cellH + jitterY);
      const px2 = Math.round(px1 + cellW * 0.85);
      const py2 = Math.round(py1 + cellH * 0.85);

      const plotPoly: [number, number][] = [
        [px1, py1],
        [px2, py1],
        [px2, py2],
        [px1, py2],
      ];

      plots.push({
        polygonPoints: plotPoly,
        buildingType: getBuildingTypeForWard(wardSubType, c, r),
      });
    }
  }

  return plots;
}

function getDefaultBuildingType(wardSubType: WardSubType): string {
  switch (wardSubType) {
    case 'administration':
      return 'keep';
    case 'patriciate':
      return 'citadel';
    case 'military':
      return 'fortress';
    case 'merchant':
      return 'bazaar';
    case 'craftsmen':
      return 'stall';
    case 'slum':
      return 'hideout';
    default:
      return 'house';
  }
}

function getBuildingTypeForWard(wardSubType: WardSubType, col: number, row: number): string {
  const index = (col + row) % 4;
  switch (wardSubType) {
    case 'administration':
      return ['keep', 'citadel', 'spire', 'gate'][index];
    case 'patriciate':
      return ['citadel', 'fountain', 'bastion', 'wall'][index];
    case 'military':
      return ['fortress', 'watchtower', 'bastion', 'gate'][index];
    case 'merchant':
      return ['bazaar', 'stall', 'fountain', 'house'][index];
    case 'craftsmen':
      return ['stall', 'house', 'outpost', 'wall'][index];
    case 'slum':
      return ['hideout', 'alley', 'stall', 'house'][index];
    default:
      return ['house', 'stall', 'fountain', 'wall'][index];
  }
}
