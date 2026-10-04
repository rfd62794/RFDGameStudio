import React from 'react';
import { TerritoryCell, HouseId } from '../types';
import { computeIsoTileScreenPos } from '../utils/isoMath';
import { HOUSES } from '../data/archetypes';

interface IsometricBuildingLayerProps {
  cell: TerritoryCell;
  tileWidth?: number;
  tileHeight?: number;
}

/**
 * Maps building tile keys to custom SVG 2.5D isometric building renderings.
 */
function renderBuildingSprite(tileKey: string, factionColor: string) {
  // Common colors
  const topColor = '#3f3f46';
  const leftColor = '#18181b';
  const rightColor = '#27272a';
  const highlightColor = '#52525b';

  switch (tileKey) {
    case 'keep':
    case 'citadel':
    case 'fortress': {
      const h = 18;
      return (
        <g className="iso-tile-sprite">
          {/* Base shadow */}
          <polygon points="0,-7 14,0 0,7 -14,0" fill="#09090b" opacity="0.6" />
          {/* Left wall */}
          <polygon points={`-12,0 0,6 0,${6 - h} -12,${0 - h}`} fill={leftColor} stroke="#09090b" strokeWidth="0.5" />
          {/* Right wall */}
          <polygon points={`12,0 0,6 0,${6 - h} 12,${0 - h}`} fill={rightColor} stroke="#09090b" strokeWidth="0.5" />
          {/* Top roof */}
          <polygon points={`0,${-6 - h} 12,${0 - h} 0,${6 - h} -12,${0 - h}`} fill={factionColor} stroke="#09090b" strokeWidth="0.5" fillOpacity="0.85" />
          {/* Inner keep tower */}
          <polygon points={`-6,${-3 - h} 0,${0 - h} 0,${0 - h - 8} -6,${-3 - h - 8}`} fill={highlightColor} />
          <polygon points={`6,${-3 - h} 0,${0 - h} 0,${0 - h - 8} 6,${-3 - h - 8}`} fill={topColor} />
          {/* Crest / flag */}
          <line x1="0" y1={-h - 8} x2="0" y2={-h - 14} stroke="#f43f5e" strokeWidth="1" />
          <polygon points={`0,${-h - 14} 5,${-h - 12} 0,${-h - 10}`} fill="#f43f5e" />
        </g>
      );
    }

    case 'watchtower':
    case 'spire':
    case 'outpost': {
      const h = 22;
      return (
        <g className="iso-tile-sprite">
          <polygon points="0,-7 14,0 0,7 -14,0" fill="#09090b" opacity="0.6" />
          {/* Main spire */}
          <polygon points={`-8,0 0,4 0,${4 - h} -8,${0 - h}`} fill={leftColor} stroke="#09090b" strokeWidth="0.5" />
          <polygon points={`8,0 0,4 0,${4 - h} 8,${0 - h}`} fill={rightColor} stroke="#09090b" strokeWidth="0.5" />
          {/* Pointed roof cone */}
          <polygon points={`0,${4 - h - 10} 8,${0 - h} 0,${4 - h} -8,${0 - h}`} fill={factionColor} fillOpacity="0.9" />
          {/* Beacon light */}
          <circle cx="0" cy={4 - h - 5} r="2" fill="#fbbf24" className="animate-pulse" />
        </g>
      );
    }

    case 'gate':
    case 'dread_gate':
    case 'arch':
    case 'tunnel': {
      const h = 12;
      return (
        <g className="iso-tile-sprite">
          <polygon points="0,-7 14,0 0,7 -14,0" fill="#09090b" opacity="0.5" />
          {/* Left pier */}
          <polygon points={`-12,0 -6,3 -6,${3 - h} -12,${0 - h}`} fill={leftColor} />
          <polygon points={`-6,3 0,0 0,${0 - h} -6,${3 - h}`} fill={rightColor} />
          {/* Right pier */}
          <polygon points={`0,0 6,3 6,${3 - h} 0,${0 - h}`} fill={leftColor} />
          <polygon points={`6,3 12,0 12,${0 - h} 6,${3 - h}`} fill={rightColor} />
          {/* Lintel arch top */}
          <polygon points={`-12,${0 - h} 12,${0 - h} 0,${-6 - h}`} fill={factionColor} fillOpacity="0.8" stroke="#09090b" strokeWidth="0.5" />
          {/* Portcullis bars */}
          <line x1="-3" y1={2 - h} x2="-3" y2="2" stroke="#71717a" strokeWidth="0.8" />
          <line x1="3" y1={2 - h} x2="3" y2="2" stroke="#71717a" strokeWidth="0.8" />
        </g>
      );
    }

    case 'wall':
    case 'bastion': {
      const h = 10;
      return (
        <g className="iso-tile-sprite">
          <polygon points="0,-7 14,0 0,7 -14,0" fill="#09090b" opacity="0.4" />
          <polygon points={`-12,0 0,6 0,${6 - h} -12,${0 - h}`} fill={leftColor} stroke="#09090b" strokeWidth="0.5" />
          <polygon points={`12,0 0,6 0,${6 - h} 12,${0 - h}`} fill={rightColor} stroke="#09090b" strokeWidth="0.5" />
          <polygon points={`0,${-6 - h} 12,${0 - h} 0,${6 - h} -12,${0 - h}`} fill={topColor} stroke="#09090b" strokeWidth="0.5" />
          {/* Battlements */}
          <rect x="-10" y={-h - 2} width="4" height="3" fill={highlightColor} />
          <rect x="6" y={-h - 2} width="4" height="3" fill={highlightColor} />
        </g>
      );
    }

    case 'bazaar':
    case 'stall': {
      const h = 8;
      return (
        <g className="iso-tile-sprite">
          <polygon points="0,-7 14,0 0,7 -14,0" fill="#09090b" opacity="0.4" />
          {/* Posts */}
          <line x1="-8" y1="0" x2="-8" y2={-h} stroke="#78350f" strokeWidth="1" />
          <line x1="8" y1="0" x2="8" y2={-h} stroke="#78350f" strokeWidth="1" />
          {/* Canopy top */}
          <polygon points={`0,${-6 - h} 10,${0 - h} 0,${6 - h} -10,${0 - h}`} fill="#f59e0b" stroke="#b45309" strokeWidth="0.5" />
          <path d={`M -10,${0 - h} Q 0,${3 - h} 10,${0 - h}`} fill="none" stroke="#fef08a" strokeWidth="1.5" />
        </g>
      );
    }

    case 'fountain': {
      return (
        <g className="iso-tile-sprite">
          <polygon points="0,-6 10,0 0,6 -10,0" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
          {/* Water reflection */}
          <polygon points="0,-4 7,0 0,4 -7,0" fill="#38bdf8" fillOpacity="0.7" />
          {/* Spout */}
          <circle cx="0" cy="0" r="1.5" fill="#e0f2fe" />
        </g>
      );
    }

    case 'ruins':
    case 'alley':
    case 'hideout': {
      return (
        <g className="iso-tile-sprite opacity-50">
          <polygon points="0,-5 8,0 0,5 -8,0" fill="#27272a" stroke="#52525b" strokeWidth="0.5" />
          <line x1="-4" y1="-1" x2="2" y2="-4" stroke="#71717a" strokeWidth="1" />
          <line x1="1" y1="2" x2="5" y2="-1" stroke="#71717a" strokeWidth="1" />
        </g>
      );
    }

    default: {
      // Default house / building tile
      const h = 10;
      return (
        <g className="iso-tile-sprite">
          <polygon points="0,-7 14,0 0,7 -14,0" fill="#09090b" opacity="0.4" />
          <polygon points={`-10,0 0,5 0,${5 - h} -10,${0 - h}`} fill={leftColor} stroke="#09090b" strokeWidth="0.5" />
          <polygon points={`10,0 0,5 0,${5 - h} 10,${0 - h}`} fill={rightColor} stroke="#09090b" strokeWidth="0.5" />
          {/* Roof */}
          <polygon points={`0,${-5 - h - 4} 10,${0 - h} 0,${5 - h} -10,${0 - h}`} fill="#881337" stroke="#09090b" strokeWidth="0.5" />
        </g>
      );
    }
  }
}

/**
 * IsometricBuildingLayer renders an isometric sub-grid of building tiles inside a TerritoryCell.
 * Tiles are rendered at (col, row) offset from isoGridAnchor with proper depth sorting.
 */
export const IsometricBuildingLayer: React.FC<IsometricBuildingLayerProps> = ({
  cell,
  tileWidth = 28,
  tileHeight = 14,
}) => {
  if (
    !cell.isoGridAnchor ||
    cell.isoGridCols === undefined ||
    cell.isoGridRows === undefined ||
    !cell.isoBuildingLayout
  ) {
    return null; // Unset cells render unchanged
  }

  const { isoGridAnchor, isoGridCols, isoGridRows, isoBuildingLayout } = cell;

  // Gather all tiles and sort by isometric depth (row + col ascending)
  const tilesToRender: { col: number; row: number; tileKey: string; screenX: number; screenY: number; depth: number }[] = [];

  for (let r = 0; r < isoGridRows; r++) {
    for (let c = 0; c < isoGridCols; c++) {
      const tileKey = isoBuildingLayout[r]?.[c] || 'wall';
      const pos = computeIsoTileScreenPos({
        anchor: isoGridAnchor,
        col: c,
        row: r,
        tileWidth,
        tileHeight,
      });

      tilesToRender.push({
        col: c,
        row: r,
        tileKey,
        screenX: pos.x,
        screenY: pos.y,
        depth: r + c,
      });
    }
  }

  // Sort by depth so back tiles draw first
  tilesToRender.sort((a, b) => a.depth - b.depth);

  const houseColor = cell.houseId ? HOUSES[cell.houseId]?.color : HOUSES[cell.owner as HouseId]?.color;
  const factionColor = cell.owner === 'player' ? '#3b82f6' : (houseColor || '#a855f7');

  return (
    <g className="isometric-building-layer pointer-events-none">
      {tilesToRender.map((t) => (
        <g key={`iso_tile_${cell.id}_${t.row}_${t.col}`} transform={`translate(${t.screenX}, ${t.screenY})`}>
          {renderBuildingSprite(t.tileKey, factionColor)}
        </g>
      ))}
    </g>
  );
};
