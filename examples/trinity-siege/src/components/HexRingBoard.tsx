/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Unit, UnitShape, LANE_NAMES, OrcUnit } from "../types";
import { Shield, Flame, AlertTriangle } from "lucide-react";

interface HexRingBoardProps {
  frontiers: Record<number, number>;
  claiming: Record<number, number | null>;
  units: Unit[];
  walls: Record<string, boolean>; // key "lane-segment"
  forecastedLanes: number[];
  forecastedAttacks: Record<number, OrcUnit[]>;
  selectedLane: number | null;
  selectedSegment: number | null;
  onSelectTile: (lane: number, segment: number) => void;
  phase: string;
}

export default function HexRingBoard({
  frontiers,
  claiming,
  units,
  walls,
  forecastedLanes,
  forecastedAttacks,
  selectedLane,
  selectedSegment,
  onSelectTile,
  phase,
}: HexRingBoardProps) {
  const cx = 250;
  const cy = 250;

  // Concentric ring radii for 5 segments
  const rCore = 45;
  const rSeg1 = 85;
  const rSeg2 = 125;
  const rSeg3 = 165;
  const rSeg4 = 205;
  const rSeg5 = 245;

  const radii = [rCore, rSeg1, rSeg2, rSeg3, rSeg4, rSeg5];

  // Lane Angles (60 degrees each, centered around North at -30 to 30)
  const getAngles = (laneId: number) => {
    const startAngle = -30 + laneId * 60;
    const endAngle = 30 + laneId * 60;
    return { startAngle, endAngle };
  };

  // Helper to generate SVG path for a sector segment
  const getSectorPath = (rIn: number, rOut: number, startAngle: number, endAngle: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const sRad = toRad(startAngle);
    const eRad = toRad(endAngle);

    const x1 = cx + rIn * Math.sin(sRad);
    const y1 = cy - rIn * Math.cos(sRad);

    const x2 = cx + rOut * Math.sin(sRad);
    const y2 = cy - rOut * Math.cos(sRad);

    const x3 = cx + rOut * Math.sin(eRad);
    const y3 = cy - rOut * Math.cos(eRad);

    const x4 = cx + rIn * Math.sin(eRad);
    const y4 = cy - rIn * Math.cos(eRad);

    const largeArc = 0; // 60 degrees is always less than 180

    return `M ${x1} ${y1} L ${x2} ${y2} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x1} ${y1} Z`;
  };

  // Helper to get center point of a segment for placing content
  const getSegmentCenter = (laneId: number, segmentId: number) => {
    const { startAngle, endAngle } = getAngles(laneId);
    const midAngle = (startAngle + endAngle) / 2;
    const rIn = radii[segmentId - 1];
    const rOut = radii[segmentId];
    const rMid = (rIn + rOut) / 2;
    
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const rad = toRad(midAngle);
    
    return {
      x: cx + rMid * Math.sin(rad),
      y: cy - rMid * Math.cos(rad),
      angle: midAngle,
    };
  };

  // Helper to get arc path for a wall (outer edge of segment)
  const getWallPath = (laneId: number, segmentId: number) => {
    const { startAngle, endAngle } = getAngles(laneId);
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const sRad = toRad(startAngle);
    const eRad = toRad(endAngle);
    const r = radii[segmentId];

    const x1 = cx + r * Math.sin(sRad);
    const y1 = cy - r * Math.cos(sRad);
    const x2 = cx + r * Math.sin(eRad);
    const y2 = cy - r * Math.cos(eRad);

    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center select-none" id="hex-ring-board-container">
      <div className="relative w-full max-w-[500px] aspect-square rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Radar concentric reference circles (behind everything) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
          <div className="absolute w-[90px] h-[90px] rounded-full border border-cyan-500 border-dashed animate-pulse"></div>
          <div className="absolute w-[170px] h-[170px] rounded-full border border-cyan-500"></div>
          <div className="absolute w-[250px] h-[250px] rounded-full border border-cyan-500"></div>
          <div className="absolute w-[330px] h-[330px] rounded-full border border-cyan-500"></div>
          <div className="absolute w-[410px] h-[410px] rounded-full border border-cyan-500"></div>
          <div className="absolute w-[490px] h-[490px] rounded-full border border-cyan-500"></div>
        </div>

        <svg
          viewBox="0 0 500 500"
          className="w-full h-full"
          id="tactical-sonar-map"
        >
          {/* Defended Core / Citadel Center */}
          <g id="citadel-core" className="cursor-default">
            <circle
              cx={cx}
              cy={cy}
              r={rCore}
              className="fill-slate-900 stroke-cyan-500/40"
              strokeWidth="2"
            />
            {/* Core glowing visual indicator */}
            <circle
              cx={cx}
              cy={cy}
              r={rCore - 8}
              className="fill-cyan-950/40 stroke-cyan-400"
              strokeWidth="1.5"
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              className="font-mono text-[9px] font-bold fill-cyan-400 tracking-wider uppercase"
            >
              CORE
            </text>
          </g>

          {/* Draw Lanes and Segments */}
          {LANE_NAMES.map((laneName, laneId) => {
            const { startAngle, endAngle } = getAngles(laneId);
            const frontier = frontiers[laneId];

            return (
              <g key={`lane-${laneId}`} id={`lane-group-${laneId}`}>
                {[1, 2, 3, 4, 5].map((segmentId) => {
                  const rIn = radii[segmentId - 1];
                  const rOut = radii[segmentId];
                  const isOwned = segmentId <= frontier;
                  const isClaiming = claiming && claiming[laneId] === segmentId;
                  const isSelected = selectedLane === laneId && selectedSegment === segmentId;
                  const isFrontier = segmentId === frontier;

                  // Tile styling
                  let fillClass = "fill-slate-950/80 hover:fill-slate-900/60 transition-colors duration-200 cursor-pointer";
                  let strokeClass = "stroke-slate-800/60";
                  let strokeWidth = "1";

                  if (isClaiming) {
                    fillClass = "fill-cyan-950/25 hover:fill-cyan-900/35 cursor-pointer transition-colors duration-200 animate-pulse";
                    strokeClass = "stroke-cyan-400/60 stroke-dasharray-[3,3]";
                    strokeWidth = "1.5";
                  } else if (!isOwned) {
                    fillClass = "fill-slate-950/95 cursor-not-allowed opacity-50";
                    strokeClass = "stroke-slate-900";
                  } else if (isSelected) {
                    fillClass = "fill-cyan-950/40 hover:fill-cyan-950/50 cursor-pointer transition-colors";
                    strokeClass = "stroke-cyan-400";
                    strokeWidth = "2";
                  } else if (isFrontier) {
                    fillClass = "fill-slate-900/40 hover:fill-slate-800/50 cursor-pointer transition-colors";
                    strokeClass = "stroke-cyan-500/20";
                  }

                  const pathD = getSectorPath(rIn, rOut, startAngle, endAngle);

                  return (
                    <g key={`tile-${laneId}-${segmentId}`}>
                      {/* Interactive Wedge Segment */}
                      <path
                        d={pathD}
                        className={`${fillClass} ${strokeClass}`}
                        strokeWidth={strokeWidth}
                        onClick={() => {
                          if (isOwned || isClaiming) {
                            onSelectTile(laneId, segmentId);
                          }
                        }}
                        id={`tile-path-${laneId}-${segmentId}`}
                      />

                      {/* Display grid divisions for non-owned tiles */}
                      {!isOwned && !isClaiming && (
                        <path
                          d={pathD}
                          className="fill-none stroke-slate-950 stroke-dasharray-[2,4]"
                          strokeWidth="0.5"
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Outer threat marching arrows / indicators for forecasted attacks */}
                {forecastedLanes.includes(laneId) && (
                  <g id={`forecast-indicator-${laneId}`} className="animate-pulse pointer-events-none">
                    {/* Flashing hazard outer arc */}
                    <path
                      d={getSectorPath(radii[4], radii[5], startAngle, endAngle)}
                      className="fill-red-950/60 stroke-red-500"
                      strokeWidth="1.5"
                    />
                    {/* Pulsing arrow pointer */}
                    {(() => {
                      const center = getSegmentCenter(laneId, 5);
                      // Offset outward for the arrow
                      const angleRad = (center.angle * Math.PI) / 180;
                      const arrowR = radii[5] + 15;
                      const arrowX = cx + arrowR * Math.sin(angleRad);
                      const arrowY = cy - arrowR * Math.cos(angleRad);
                      
                      return (
                        <g transform={`translate(${arrowX}, ${arrowY}) rotate(${center.angle})`}>
                          <path
                            d="M 0 5 L -5 -5 L 5 -5 Z"
                            className="fill-red-500"
                          />
                        </g>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          })}

          {/* Draw Walls */}
          {Object.entries(walls).map(([key, exists]) => {
            if (!exists) return null;
            const [laneStr, segStr] = key.split("-");
            const laneId = parseInt(laneStr);
            const segmentId = parseInt(segStr);

            // Check if there are player units garrisoned here
            const hasGarrison = units.some((u) => u.lane === laneId && u.segment === segmentId);
            const pathD = getWallPath(laneId, segmentId);

            return (
              <g key={`wall-visual-${key}`}>
                {/* Wall glowing arc */}
                <path
                  d={pathD}
                  fill="none"
                  className={
                    hasGarrison
                      ? "stroke-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      : "stroke-red-500 animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  }
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                
                {/* Warning indicator on board if unmanned */}
                {!hasGarrison && (() => {
                  const center = getSegmentCenter(laneId, segmentId);
                  return (
                    <g transform={`translate(${center.x + 12}, ${center.y - 12})`}>
                      <circle cx="0" cy="0" r="7" className="fill-red-950 stroke-red-500" strokeWidth="1" />
                      <text x="0" y="3" textAnchor="middle" className="font-mono text-[9px] fill-red-400 font-bold">!</text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Draw Player Garrisoned Units */}
          {units.map((unit) => {
            const center = getSegmentCenter(unit.lane, unit.segment);
            
            // To prevent perfect overlapping when there are multiple units in a segment:
            // Find other units in the same tile
            const unitsInSameTile = units.filter(
              (u) => u.lane === unit.lane && u.segment === unit.segment
            );
            const index = unitsInSameTile.findIndex((u) => u.id === unit.id);
            const offsetDist = index * 12 - ((unitsInSameTile.length - 1) * 12) / 2;
            
            // Offset along the tangent line of the segment center
            const rad = (center.angle * Math.PI) / 180;
            const dx = offsetDist * Math.cos(rad);
            const dy = offsetDist * Math.sin(rad);

            const ux = center.x + dx;
            const uy = center.y + dy;

            return (
              <g key={`unit-visual-${unit.id}`} transform={`translate(${ux}, ${uy})`} className="cursor-pointer">
                {/* Base Tooltip-like background for strength display */}
                <circle cx="0" cy="-1" r="9" className="fill-slate-900/90 stroke-cyan-500/50" strokeWidth="1" />
                
                {/* Shape Visuals */}
                {unit.shape === UnitShape.CIRCLE && (
                  <circle cx="0" cy="-1" r="5" className="fill-cyan-500/20 stroke-cyan-400" strokeWidth="1.5" />
                )}
                {unit.shape === UnitShape.SQUARE && (
                  <rect x="-4.5" y="-5.5" width="9" height="9" rx="1" className="fill-cyan-500/20 stroke-cyan-400" strokeWidth="1.5" />
                )}
                {unit.shape === UnitShape.TRIANGLE && (
                  <polygon points="0,-6.5 -5,2.5 5,2.5" className="fill-cyan-500/20 stroke-cyan-400" strokeWidth="1.5" />
                )}

                {/* Strength Text Indicator */}
                <text
                  x="0"
                  y="10"
                  textAnchor="middle"
                  className="font-mono text-[8px] font-bold fill-white tracking-tighter"
                >
                  {unit.currentStrength}
                </text>
              </g>
            );
          })}

          {/* Draw Incoming Attack Orcs (during forecast & allocate, on outermost boundary) */}
          {forecastedLanes.map((laneId) => {
            const orcs = forecastedAttacks[laneId] || [];
            const frontier = frontiers[laneId];

            return orcs.map((orc, index) => {
              // We render orcs marching inward. 
              // If in ALLOCATE/FORECAST, they are hovering just outside the active frontier segment
              // If in RESOLVE, we show them directly on the frontier segment fighting
              const activeSegment = (claiming && claiming[laneId]) || frontier;
              const targetSegment = phase === "Resolve" ? activeSegment : Math.min(5, activeSegment + 1);
              const center = getSegmentCenter(laneId, targetSegment);

              // Position layout for orcs in the tile
              const offsetDist = index * 12 - ((orcs.length - 1) * 12) / 2;
              const rad = (center.angle * Math.PI) / 180;
              const dx = offsetDist * Math.cos(rad);
              const dy = offsetDist * Math.sin(rad);

              // During forecast, offset them slightly further out to look like they are approaching
              const approachOffset = phase !== "Resolve" ? 18 : 0;
              const ox = center.x + dx + approachOffset * Math.sin(rad);
              const oy = center.y + dy - approachOffset * Math.cos(rad);

              return (
                <g key={`orc-visual-${orc.id}`} transform={`translate(${ox}, ${oy})`}>
                  {/* Outer circle badge */}
                  <circle cx="0" cy="-1" r="8" className="fill-slate-950/90 stroke-red-500/40" strokeWidth="1" />

                  {/* Shape outline */}
                  {orc.shape === UnitShape.CIRCLE && (
                    <circle cx="0" cy="-1" r="4.5" className="fill-red-500/20 stroke-red-500" strokeWidth="1.5" />
                  )}
                  {orc.shape === UnitShape.SQUARE && (
                    <rect x="-4" y="-5" width="8" height="8" rx="1" className="fill-red-500/20 stroke-red-500" strokeWidth="1.5" />
                  )}
                  {orc.shape === UnitShape.TRIANGLE && (
                    <polygon points="0,-5.5 -4,2 4,2" className="fill-red-500/20 stroke-red-500" strokeWidth="1.5" />
                  )}

                  {/* Strength badge */}
                  <text
                    x="0"
                    y="10"
                    textAnchor="middle"
                    className="font-mono text-[8px] font-bold fill-red-400 tracking-tighter"
                  >
                    {orc.baseStrength}
                  </text>
                </g>
              );
            });
          })}
        </svg>

        {/* Legend Overlay at the bottom-left */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1 rounded bg-slate-950/80 p-1.5 border border-slate-800 text-[9px] font-mono text-slate-400 pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Player Unit</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Orc Attacker</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
            <span>Wall</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 border border-cyan-400/50 border-dashed bg-cyan-950/40 inline-block animate-pulse"></span>
            <span>Claiming Segment</span>
          </div>
        </div>

        {/* Selected Tile indicator tag at top-left */}
        {selectedLane !== null && selectedSegment !== null && (
          <div className="absolute top-2 left-2 rounded bg-cyan-950/80 px-2 py-1 border border-cyan-800 text-[10px] font-mono text-cyan-300">
            Selected: <span className="font-bold">{LANE_NAMES[selectedLane]}</span> (Seg {selectedSegment})
          </div>
        )}
      </div>
    </div>
  );
}
