import React, { useState } from 'react';
import { MapCell, Point, Corporation, UnitTransit, UnitGroup, UnitType } from '../types';
import { Shield, EyeOff, Radio, Compass, Swords, Skull } from 'lucide-react';

interface PlanetMapProps {
  cells: MapCell[];
  corporations: Corporation[];
  transits: UnitTransit[];
  selectedCellId: number | null;
  onSelectCell: (cellId: number) => void;
  playerCorpId: string;
  isPlanningPhase: boolean;
  playerOrders: { [cellId: number]: any };
  activeEventTargetCellId: number | null;
}

export default function PlanetMap({
  cells,
  corporations,
  transits,
  selectedCellId,
  onSelectCell,
  playerCorpId,
  isPlanningPhase,
  playerOrders,
  activeEventTargetCellId
}: PlanetMapProps) {
  const [hoveredCellId, setHoveredCellId] = useState<number | null>(null);
  const [alwaysShowGarrison, setAlwaysShowGarrison] = useState<boolean>(true);

  const getCorp = (corpId: string | null) => {
    return corporations.find(c => c.id === corpId);
  };

  const getPlayerCorp = () => {
    return corporations.find(c => c.id === playerCorpId);
  };

  // Check visibility for the player
  const isCellScoutedByPlayer = (cell: MapCell) => {
    const player = getPlayerCorp();
    if (!player) return false;
    
    // Capital is always scouted
    if (cell.ownerId === playerCorpId) return true;
    
    // Is adjacent to any owned cell
    const ownedCellIds = cells.filter(c => c.ownerId === playerCorpId).map(c => c.id);
    for (const ownedId of ownedCellIds) {
      if (cell.neighbors.includes(ownedId)) return true;
    }

    // Has any transiting unit heading to or originating from it
    const activeTransitInvolved = transits.some(t => 
      t.corpId === playerCorpId && 
      (t.originCellId === cell.id || t.targetCellId === cell.id)
    );
    if (activeTransitInvolved) return true;

    // From historical scouting
    if (player.scoutedCells[cell.id]) return true;

    return false;
  };

  const isCellVisibleToPlayer = (cell: MapCell) => {
    // Fully bright if owned, has player units, or is adjacent to owned cells
    if (cell.ownerId === playerCorpId) return true;
    
    const ownedCellIds = cells.filter(c => c.ownerId === playerCorpId).map(c => c.id);
    for (const ownedId of ownedCellIds) {
      if (cell.neighbors.includes(ownedId)) return true;
    }
    
    return false;
  };

  // Find if a cell is currently contested (units of multiple corps inside)
  const isCellContested = (cell: MapCell) => {
    const corpsPresent = new Set<string>();
    if (cell.ownerId) corpsPresent.add(cell.ownerId);
    
    // Check transiting units that have ARRIVED (progress = 0 / daysLeft = 0 is handled during day end,
    // but we also check if there are active units of multiple corporations in the cell)
    // Wait, are there units inside?
    const cellUnits = cell.units;
    const hasPlayerUnits = cellUnits.circle > 0 || cellUnits.square > 0 || cellUnits.triangle > 0;
    if (hasPlayerUnits && cell.ownerId && cell.ownerId !== playerCorpId) {
      return true; // Player units inside a cell owned by rival
    }

    // We can also check if multiple AI corps or AI + player are inside.
    // At the end of the day, any units that finish transit accumulate in the cell.
    // If a cell has units of corporation X but is owned by Y, it is contested.
    // Let's check how many corporations have units in this cell or own it.
    const uniqueCorpsWithPresence = new Set<string>();
    if (cell.ownerId) {
      uniqueCorpsWithPresence.add(cell.ownerId);
    }
    // Check if there are units from other corps residing in this cell
    // (In our state, each cell has a single `.units` list which belongs to the cell's owner,
    // but wait! If multiple corps invade, we store the units for each corp.
    // How do we track that? Let's verify how we structured MapCell:
    // It has `units: UnitGroup` which belongs to the owner, or if there is combat,
    // we aggregate units from all transits that completed.
    // Let's check if there are transits that have completed (daysLeft === 0)
    // but are awaiting Monthly conflict resolution!
    // Yes! If a unit transits to a cell, and lands there, we can let it sit there
    // as an "invader" until Month-End resolution.
    // So to know if a cell is contested, we check if there are any pending transits of OTHER corporations
    // that have arrived (daysLeft === 0) in this cell, or if there is an active conflict).
    // Let's search all transits with daysLeft === 0 ending at this cell.
    const arrivedInvaders = transits.filter(t => t.targetCellId === cell.id && t.daysLeft === 0);
    if (arrivedInvaders.length > 0) {
      for (const inv of arrivedInvaders) {
        uniqueCorpsWithPresence.add(inv.corpId);
      }
    }
    
    return uniqueCorpsWithPresence.size > 1;
  };

  // Get list of arrived invaders to draw on the cell
  const getArrivedInvadersForCell = (cellId: number): { corpId: string; units: UnitGroup }[] => {
    const arrived = transits.filter(t => t.targetCellId === cellId && t.daysLeft === 0);
    const corpsMap: { [corpId: string]: UnitGroup } = {};
    for (const t of arrived) {
      if (!corpsMap[t.corpId]) {
        corpsMap[t.corpId] = { circle: 0, square: 0, triangle: 0 };
      }
      corpsMap[t.corpId].circle += t.units.circle;
      corpsMap[t.corpId].square += t.units.square;
      corpsMap[t.corpId].triangle += t.units.triangle;
    }
    return Object.keys(corpsMap).map(cid => ({ corpId: cid, units: corpsMap[cid] }));
  };

  // SVG dimensions
  const mapW = 600;
  const mapH = 600;

  return (
    <div className="bg-[#E4E3E0] p-4 border-4 border-[#141414] shadow-[4px_4px_0px_0px_#141414] flex flex-col items-center select-none w-full" id="planet-map-container">
      {/* Map Header info */}
      <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#141414]" />
          <span className="font-serif italic text-sm tracking-wide text-[#141414] font-semibold">Tessellated Planet Canvas</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono justify-end">
          <button
            onClick={() => setAlwaysShowGarrison(!alwaysShowGarrison)}
            className="px-2 py-0.5 border border-[#141414] bg-white text-[#141414] hover:bg-[#D4D3D0] text-[8px] font-bold font-mono shadow-[1px_1px_0px_0px_#141414] active:translate-x-0.2 active:translate-y-0.2 transition uppercase"
            id="btn-toggle-garrison-display"
          >
            Display: {alwaysShowGarrison ? "Always-On" : "On-Hover"}
          </button>
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.2 bg-[#C4C3C0] text-[#141414] border border-[#141414] text-[8px] font-bold uppercase">Fog</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.2 bg-cyan-300 text-[#141414] border border-[#141414] text-[8px] font-bold uppercase">Vanguard</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.2 bg-amber-300 text-[#141414] border border-[#141414] text-[8px] font-bold uppercase">Rivals</span>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-[600px] aspect-square bg-[#F4F3F0] overflow-hidden border-4 border-[#141414]">
        {/* Subtle background tech grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:30px_30px]" />

        <svg
          viewBox={`0 0 ${mapW} ${mapH}`}
          className="w-full h-full"
          style={{ cursor: 'crosshair' }}
        >
          {/* 1. Draw Cells */}
          {cells.map(cell => {
            const isScouted = isCellScoutedByPlayer(cell);
            const isVisible = isCellVisibleToPlayer(cell);
            const isSelected = selectedCellId === cell.id;
            const isHovered = hoveredCellId === cell.id;
            const contested = isCellContested(cell);
            const owner = getCorp(cell.ownerId);

            // Determine cell polygon coordinates
            const polygonPoints = cell.polygon.map(p => `${p.x},${p.y}`).join(' ');

            // Calculate fill and border colors
            let fill = '#D4D3D0'; // Unknown / Fogged out
            let stroke = '#141414'; // Bold border for sectors
            let strokeWidth = '1.5';
            let opacity = '1.0';

            if (isScouted) {
              if (cell.ownerId) {
                // Owned by some corp
                fill = owner ? owner.color : '#A4A3A0';
                opacity = isVisible ? '0.75' : '0.35'; // visible gets brighter representation
                stroke = '#141414';
                strokeWidth = isSelected ? '4.5' : isHovered ? '3' : '1.8';
              } else {
                // Neutral scouted cell
                fill = '#FFFFFF';
                opacity = '1.0';
                stroke = '#141414';
                strokeWidth = isSelected ? '4.5' : isHovered ? '3' : '1.5';
              }
            } else {
              // Fog of war
              fill = '#C4C3C0';
              opacity = '1.0';
              stroke = '#141414';
              strokeWidth = isSelected ? '3.5' : '1.2';
            }

            // Highlighting colors for selected cells
            if (isSelected && isScouted) {
              stroke = '#141414';
              strokeWidth = '5';
            } else if (isHovered && isScouted) {
              stroke = '#141414';
              strokeWidth = '3';
            }

            return (
              <g key={cell.id}>
                {/* Cell Area */}
                <polygon
                  points={polygonPoints}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200 cursor-pointer text-[#141414]"
                  onClick={() => onSelectCell(cell.id)}
                  onMouseEnter={() => setHoveredCellId(cell.id)}
                  onMouseLeave={() => setHoveredCellId(null)}
                />

                {/* Draw Hatching Pattern for Contested Cells */}
                {isScouted && contested && (
                  <polygon
                    points={polygonPoints}
                    fill="url(#contested-hatch)"
                    fillOpacity="0.45"
                    className="pointer-events-none"
                  />
                )}

                {/* Cell Center Annotations & Label Details */}
                {isScouted && (
                  <g className="pointer-events-none" style={{ opacity: isHovered || isSelected ? 1 : 0.9 }}>
                    {/* Circle representing the seed center */}
                    <circle
                      cx={cell.seed.x}
                      cy={cell.seed.y}
                      r="4"
                      fill={owner ? owner.color : '#141414'}
                      stroke="#141414"
                      strokeWidth="1"
                    />

                    {/* Sector Text Name */}
                    {isHovered && (
                      <g>
                        {/* Background box for readability */}
                        <rect
                          x={cell.seed.x - 55}
                          y={cell.seed.y - 32}
                          width="110"
                          height="18"
                          fill="white"
                          stroke="#141414"
                          strokeWidth="2"
                        />
                        <text
                          x={cell.seed.x}
                          y={cell.seed.y - 20}
                          textAnchor="middle"
                          fill="#141414"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {cell.name}
                        </text>
                      </g>
                    )}

                    {/* Show Fortification Level if any */}
                    {cell.fortification > 0 && (
                      <g transform={`translate(${cell.seed.x - 14}, ${cell.seed.y + 10})`}>
                        <rect x="-2" y="-2" width="18" height="12" fill="white" stroke="#141414" strokeWidth="1.5" />
                        <text x="7" y="7" fontSize="8" fontFamily="monospace" fill="#0284c7" textAnchor="middle" fontWeight="bold">
                          🛡️{cell.fortification}
                        </text>
                      </g>
                    )}

                    {/* Status flags indicating alerts - Football Manager traffic-light convention */}
                    {(() => {
                      const hasPendingEvent = activeEventTargetCellId === cell.id;
                      const isMissingOrder = isPlanningPhase && cell.ownerId === playerCorpId && !playerOrders[cell.id];
                      const isContested = contested;

                      if (!hasPendingEvent && !isContested && !isMissingOrder) return null;

                      return (
                        <g transform={`translate(${cell.seed.x}, ${cell.seed.y - 18})`} className="pointer-events-none">
                          {/* Amber Flag (Dilemma Event) */}
                          {hasPendingEvent && (
                            <g transform="translate(-10, 0)">
                              <polygon points="-3,-3 3,-3 1.5,0 3,3 -3,3" fill="#f59e0b" stroke="#141414" strokeWidth="1" />
                              <line x1="-3" y1="-3" x2="-3" y2="6" stroke="#141414" strokeWidth="1" />
                            </g>
                          )}
                          
                          {/* Red Flag (Contested Conflict) */}
                          {isContested && (
                            <g transform="translate(0, 0)">
                              <polygon points="-3,-3 3,-3 1.5,0 3,3 -3,3" fill="#ef4444" stroke="#141414" strokeWidth="1" className="animate-pulse" />
                              <line x1="-3" y1="-3" x2="-3" y2="6" stroke="#141414" strokeWidth="1" />
                            </g>
                          )}
                          
                          {/* Blue Flag (Missing Order) */}
                          {isMissingOrder && (
                            <g transform="translate(10, 0)">
                              <polygon points="-3,-3 3,-3 1.5,0 3,3 -3,3" fill="#06b6d4" stroke="#141414" strokeWidth="1" />
                              <line x1="-3" y1="-3" x2="-3" y2="6" stroke="#141414" strokeWidth="1" />
                            </g>
                          )}
                        </g>
                      );
                    })()}

                    {/* Show Unit Count Indicator / Glyph Array inside the cell */}
                    {(isVisible || cell.ownerId === playerCorpId) && (
                      (() => {
                        const totalCount = cell.units.circle + cell.units.square + cell.units.triangle;
                        if (totalCount === 0) return null;
                        
                        // Check if we should render detailed glyph array or simple count
                        const showDetailed = alwaysShowGarrison || isHovered || isSelected;
                        
                        if (showDetailed) {
                          return (
                            <g transform={`translate(${cell.seed.x - 20}, ${cell.seed.y + 4})`}>
                              <rect x="0" y="0" width="40" height="12" rx="2" fill="white" stroke="#141414" strokeWidth="1.2" />
                              
                              {/* Circle count */}
                              <circle cx="5" cy="6" r="2" fill="#dc2626" />
                              <text x="11" y="9" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#141414">
                                {cell.units.circle}
                              </text>
                              
                              {/* Square count */}
                              <rect x="17" y="4" width="4" height="4" fill="#2563eb" />
                              <text x="25" y="9" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#141414">
                                {cell.units.square}
                              </text>
                              
                              {/* Triangle count */}
                              <polygon points="31.5,4 29.5,8 33.5,8" fill="#16a34a" />
                              <text x="36" y="9" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="#141414">
                                {cell.units.triangle}
                              </text>
                            </g>
                          );
                        } else {
                          // Simple total count
                          return (
                            <g transform={`translate(${cell.seed.x - 8}, ${cell.seed.y + 4})`}>
                              <rect x="0" y="0" width="16" height="12" fill="white" stroke="#141414" strokeWidth="1.2" />
                              <text x="8" y="9" fontSize="8" fontFamily="monospace" fill="#141414" textAnchor="middle" fontWeight="bold">
                                {totalCount}
                              </text>
                            </g>
                          );
                        }
                      })()
                    )}

                    {/* Draw Arrived Invaders as little secondary bubbles if player can see them */}
                    {isVisible && getArrivedInvadersForCell(cell.id).map((inv, idx) => {
                      const invCorp = getCorp(inv.corpId);
                      const invCount = inv.units.circle + inv.units.square + inv.units.triangle;
                      if (invCount === 0) return null;
                      
                      // Position offset depending on count/index
                      const offsetIdx = idx + 1;
                      const offsetX = cell.seed.x + 10;
                      const offsetY = cell.seed.y - 15 - (offsetIdx * 12);
                      
                      return (
                        <g key={inv.corpId} transform={`translate(${offsetX}, ${offsetY})`}>
                          <rect x="-2" y="-2" width="18" height="12" fill="#fef08a" stroke="#141414" strokeWidth="1.2" />
                          <text x="7" y="7" fontSize="8" fontFamily="monospace" fill="#141414" textAnchor="middle" fontWeight="bold">
                            ⚠️{invCount}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Draw Fog of War Icon for completely unknown cells */}
                {!isScouted && (
                  <g className="pointer-events-none">
                    <text
                      x={cell.seed.x}
                      y={cell.seed.y + 4}
                      textAnchor="middle"
                      fill="#141414"
                      fontSize="14"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="opacity-20"
                    >
                      ?
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Define SVG Patterns / Gradients */}
          <defs>
            {/* Contested stripes / hatching pattern */}
            <pattern id="contested-hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="2.5" />
            </pattern>
          </defs>

          {/* 3. Draw Transiting Units */}
          {transits.map(transit => {
            const originCell = cells.find(c => c.id === transit.originCellId);
            const targetCell = cells.find(c => c.id === transit.targetCellId);
            const corp = getCorp(transit.corpId);

            if (!originCell || !targetCell) return null;

            // Only draw transits that are visible to the player
            // Player can see transit if they scouted the origin OR the destination cell.
            const originScouted = isCellScoutedByPlayer(originCell);
            const targetScouted = isCellScoutedByPlayer(targetCell);
            if (!originScouted && !targetScouted) return null;

            // Calculate progress position
            // daysLeft goes from totalDays (4) down to 0
            // Progress = (totalDays - daysLeft) / totalDays
            const totalDays = transit.totalDays || 4;
            const progress = (totalDays - transit.daysLeft) / totalDays;

            const startX = originCell.seed.x;
            const startY = originCell.seed.y;
            const endX = targetCell.seed.x;
            const endY = targetCell.seed.y;

            // Current position
            const currentX = startX + progress * (endX - startX);
            const currentY = startY + progress * (endY - startY);

            // Unit count of this transit
            const count = transit.units.circle + transit.units.square + transit.units.triangle;

            return (
              <g key={transit.id} className="pointer-events-none">
                {/* Transit Vector Path */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#141414"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  className="opacity-50"
                />

                {/* Moving Unit Badge */}
                <g transform={`translate(${currentX}, ${currentY})`}>
                  {/* Outer circle badge */}
                  <circle
                    cx="0"
                    cy="0"
                    r="9"
                    fill="white"
                    stroke="#141414"
                    strokeWidth="2"
                  />
                  {/* Text for unit types/count */}
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#141414"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {count}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Cell quick info strip */}
      <div className="w-full mt-3 p-3 bg-white border-2 border-[#141414] text-[#141414] flex justify-between items-center text-xs font-mono shadow-[2px_2px_0px_0px_#141414]">
        {selectedCellId !== null ? (
          (() => {
            const cell = cells.find(c => c.id === selectedCellId);
            if (!cell) return <span className="opacity-50">No sector selected</span>;
            const scouted = isCellScoutedByPlayer(cell);
            const owner = getCorp(cell.ownerId);

            if (!scouted) {
              return (
                <>
                  <span className="font-bold uppercase tracking-wider text-red-600">UNKNOWN SECTOR</span>
                  <span className="text-red-600 flex items-center gap-1 font-bold">
                    <EyeOff className="w-3.5 h-3.5" /> Scout required
                  </span>
                </>
              );
            }

            return (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase">{cell.name}</span>
                  <span className="opacity-40">|</span>
                  <span className="font-medium">
                    Owner: {owner ? (
                      <span style={{ color: owner.color }} className="font-black uppercase">{owner.name}</span>
                    ) : (
                      <span className="opacity-60 font-serif italic">Neutral</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">● Garrison: {cell.units.circle + cell.units.square + cell.units.triangle}</span>
                  {cell.fortification > 0 && (
                    <span className="text-sky-600 font-bold">🛡️ Level {cell.fortification}</span>
                  )}
                </div>
              </>
            );
          })()
        ) : (
          <span className="opacity-60 mx-auto font-serif italic">Select a sector cell on the map to issue Weekly Orders</span>
        )}
      </div>
    </div>
  );
}
