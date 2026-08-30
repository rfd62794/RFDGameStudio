import React from 'react';
import { RunNode } from '../types';

interface MapGraphViewProps {
  mapNodesList: RunNode[];
  currentNodeId: string;
  visitedNodeIds: string[];
  isCurrentCompleted: boolean;
  nextConnections: string[];
  selectedNextId: string | null;
  onSelectNextId: (id: string) => void;
}

export default function MapGraphView({
  mapNodesList,
  currentNodeId,
  visitedNodeIds,
  isCurrentCompleted,
  nextConnections,
  selectedNextId,
  onSelectNextId
}: MapGraphViewProps) {
  const currentNodeDef = mapNodesList.find(n => n.id === currentNodeId) || mapNodesList[0];

  const width = 800;
  const height = 280;

  return (
    <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex flex-col gap-3 relative shadow-inner">
      <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
        <span className="text-[10px] tracking-wider uppercase text-slate-500">INTELLIGENT ROUTE MAP</span>
        <span className="text-amber-400 text-[10px]">
          {isCurrentCompleted ? 'Standing on Completed Hub - SELECT NEXT BRANCH' : `Active Destination: Node ${currentNodeDef?.id}`}
        </span>
      </div>

      <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
        <div style={{ minWidth: "550px", position: "relative" }} className="py-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block select-none">
            
            {/* Layer grid background indicator lines */}
            {[10, 30, 50, 70, 90].map((percent, idx) => (
              <line
                key={idx}
                x1={percent * (width / 100)}
                y1={0}
                x2={percent * (width / 100)}
                y2={height}
                className="stroke-slate-900/40"
                strokeWidth="1"
              />
            ))}

            {/* Draw Connection Lines */}
            {mapNodesList.map((node) => {
              const fromX = (node.x ?? 0) * (width / 100);
              const fromY = (node.y ?? 0) * (height / 100);

              return (node.connectsTo || []).map((targetId) => {
                const targetNode = mapNodesList.find(n => n.id === targetId);
                if (!targetNode) return null;

                const toX = (targetNode.x ?? 0) * (width / 100);
                const toY = (targetNode.y ?? 0) * (height / 100);

                const isFromVisited = visitedNodeIds.includes(node.id);
                const isToVisited = visitedNodeIds.includes(targetId);
                const isConnectionActive = currentNodeId === node.id && selectedNextId === targetId;

                let strokeColor = "stroke-slate-800/80";
                let strokeWidth = "2";
                let strokeDasharray = "4,4";

                if (isFromVisited && isToVisited) {
                  strokeColor = "stroke-emerald-500/50";
                  strokeWidth = "2.5";
                  strokeDasharray = "0";
                } else if (isConnectionActive) {
                  strokeColor = "stroke-amber-400";
                  strokeWidth = "3.5";
                  strokeDasharray = "0";
                } else if (isFromVisited && nextConnections.includes(targetId)) {
                  strokeColor = "stroke-amber-500/35";
                  strokeWidth = "2";
                  strokeDasharray = "2,2";
                }

                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={isConnectionActive ? undefined : "currentColor"}
                    className={`transition-all duration-350 ease-out ${strokeColor}`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                  />
                );
              });
            })}

            {/* Draw Node Rings and Labels */}
            {mapNodesList.map((node) => {
              const nx = (node.x ?? 0) * (width / 100);
              const ny = (node.y ?? 0) * (height / 100);

              const isVisited = visitedNodeIds.includes(node.id);
              const isActive = currentNodeId === node.id;
              const isSelectable = isCurrentCompleted && nextConnections.includes(node.id);
              const isSelected = selectedNextId === node.id;

              let bgColor = "fill-slate-900";
              let strokeColor = "stroke-slate-800";
              let strokeWidth = "1.5";
              let textColor = "fill-slate-500";
              let r = 21;
              let isPulsing = false;

              if (isActive && !isCurrentCompleted) {
                bgColor = "fill-amber-500/10";
                strokeColor = "stroke-amber-400";
                strokeWidth = "3";
                textColor = "fill-amber-300";
                isPulsing = true;
              } else if (isActive && isCurrentCompleted) {
                bgColor = "fill-emerald-950/40";
                strokeColor = "stroke-emerald-400";
                strokeWidth = "2.5";
                textColor = "fill-emerald-300";
              } else if (isVisited) {
                bgColor = "fill-emerald-950/20";
                strokeColor = "stroke-emerald-500/40";
                textColor = "fill-emerald-400/70";
              } else if (isSelectable) {
                if (isSelected) {
                  bgColor = "fill-amber-500/20";
                  strokeColor = "stroke-amber-400";
                  strokeWidth = "3";
                  textColor = "fill-amber-200";
                  isPulsing = true;
                } else {
                  bgColor = "fill-slate-900";
                  strokeColor = "stroke-amber-500/35";
                  strokeWidth = "2";
                  textColor = "fill-amber-400/60";
                }
              } else {
                bgColor = "fill-slate-950";
                strokeColor = "stroke-slate-900";
                textColor = "fill-slate-700";
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${nx}, ${ny})`}
                  className={`transition-all duration-300 ${isSelectable ? "cursor-pointer hover:scale-105" : ""}`}
                  onClick={() => {
                    if (isSelectable) onSelectNextId(node.id);
                  }}
                >
                  {isPulsing && (
                    <circle
                      r={r + 4}
                      className="fill-none stroke-amber-400/20 animate-ping"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    r={r}
                    className={`${bgColor} ${strokeColor} transition-colors duration-200`}
                    strokeWidth={strokeWidth}
                  />

                  <text
                    textAnchor="middle"
                    dy="-2"
                    className="font-mono text-[8px] font-bold tracking-wider fill-slate-300 uppercase select-none"
                  >
                    {node.type === 'fight' ? 'FIGHT' :
                     node.type === 'restCraft' ? 'HAVEN' :
                     node.type === 'treasure' ? 'TREAS' :
                     node.type === 'store' ? 'STORE' :
                     node.type === 'anomaly' ? 'ANOM' :
                     node.type === 'boss' ? 'BOSS' : 'UNK'}
                  </text>

                  <text
                    textAnchor="middle"
                    dy="10"
                    className={`font-mono text-[7px] select-none ${textColor}`}
                  >
                    {node.id === "boss" ? "CORE" : node.id.replace("node_", "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
