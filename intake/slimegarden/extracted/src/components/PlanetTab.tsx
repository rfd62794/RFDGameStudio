import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, ShieldAlert, ShieldCheck, Database, Target, Play, Info, Sparkles, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Slime, SlimeColor, PlanetNode, LabState } from '../types';
import { COLOR_SPECS } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';

interface PlanetTabProps {
  key?: string;
  state: LabState;
  handleLaunchMediation: () => void;
  mediationDraftIds: string[];
  setMediationDraftIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedMediationNodeId: string | null;
  setSelectedMediationNodeId: (id: string | null) => void;
  activeMediationReport: { logs: string[]; success: boolean; stabilityChange: number } | null;
  setActiveMediationReport: (report: { logs: string[]; success: boolean; stabilityChange: number } | null) => void;
  
  handleLaunchExploration: () => void;
  explorationDraftIds: string[];
  setExplorationDraftIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedExplorationNodeId: string | null;
  setSelectedExplorationNodeId: (id: string | null) => void;
  activeExplorationReport: { logs: string[]; success: boolean } | null;
  setActiveExplorationReport: (report: { logs: string[]; success: boolean } | null) => void;

  handleAdvanceCycle: () => void;
  activeSubTab: 'regions' | 'mediation' | 'exploration';
  setActiveSubTab: (subTab: 'regions' | 'mediation' | 'exploration') => void;
}

export function PlanetTab({
  state,
  handleLaunchMediation,
  mediationDraftIds,
  setMediationDraftIds,
  selectedMediationNodeId,
  setSelectedMediationNodeId,
  activeMediationReport,
  setActiveMediationReport,
  handleLaunchExploration,
  explorationDraftIds,
  setExplorationDraftIds,
  selectedExplorationNodeId,
  setSelectedExplorationNodeId,
  activeExplorationReport,
  setActiveExplorationReport,
  handleAdvanceCycle,
  activeSubTab,
  setActiveSubTab
}: PlanetTabProps) {
  const [pickerType, setPickerType] = useState<'mediation' | 'exploration' | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const region = state.planetRegion;

  const activeMediationNode = state.planetRegion?.nodes.find(n => n.id === state.activeMediation?.targetNodeId);
  const activeExplorationNode = state.planetRegion?.nodes.find(n => n.id === state.activeExploration?.targetNodeId);

  const isNodeLocked = (node: PlanetNode) => {
    return node.distanceFromCenter >= 150 && !state.wildsUnlocked;
  };

  const handleTogglePickerSelect = (id: string) => {
    if (pickerType === 'mediation') {
      setMediationDraftIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(x => x !== id);
        } else {
          if (prev.length >= 3) return prev;
          return [...prev, id];
        }
      });
    } else if (pickerType === 'exploration') {
      setExplorationDraftIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(x => x !== id);
        } else {
          if (prev.length >= 3) return prev;
          return [...prev, id];
        }
      });
    }
  };

  const getOwnerColorStyle = (color: SlimeColor | null) => {
    if (!color) return { rgb: 'rgb(71, 85, 105)', fill: 'rgba(71, 85, 105, 0.15)', border: 'border-slate-700' };
    const spec = COLOR_SPECS[color];
    return {
      rgb: spec.rgb,
      fill: spec.rgb.replace('rgb', 'rgba').replace(')', ', 0.35)'),
      border: `border-[${spec.rgb}]`
    };
  };

  const draftIds = pickerType === 'mediation' ? mediationDraftIds : (explorationDraftIds || []);
  const availableSlimes = state.slimes.filter(s => s.role === 'idle' && (!s.lockedRole || s.lockedRole === pickerType));

  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1" id="planet_tab_root">
      {/* Sidebar Sub-tabs */}
      <div className="md:w-44 shrink-0 flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/50 pb-4 md:pb-0 md:pr-4" id="planet_sidebar_tabs">
        <button
          id="btn_subtab_regions"
          onClick={() => setActiveSubTab('regions')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer relative ${
            activeSubTab === 'regions'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Planetary Map</span>
        </button>
        <button
          id="btn_subtab_mediation"
          onClick={() => setActiveSubTab('mediation')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer relative ${
            activeSubTab === 'mediation'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Mediation Portal</span>
          {state.activeMediation && (
            <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
          )}
        </button>
        <button
          id="btn_subtab_exploration"
          onClick={() => setActiveSubTab('exploration')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer relative ${
            activeSubTab === 'exploration'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Exploration Portal</span>
          {state.activeExploration && (
            <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col" id="planet_main_content">
        {!region ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
            <Clock className="w-10 h-10 text-slate-700 animate-pulse mb-3" />
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase">Unexplored Region</h3>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Establishing communications satellite uplink with the Heartlands.
            </p>
          </div>
        ) : activeSubTab === 'regions' ? (
          <motion.div
            key="planet_regions"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold font-display text-white">
                  Internal Conflict Terminal: Ringed Asteroid Field
                </h2>
                <p className="text-xs text-slate-400">
                  Monitor unified regional tension, supply chains, and radial orbit link connection states.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Interactive Map Canvas (SVG Polygon Render) */}
              <div className="lg:col-span-7 border border-slate-800/80 bg-[#04080f]/50 rounded-xl p-4 flex flex-col justify-between items-center min-h-[350px] relative">
                <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-slate-950/70 px-2 py-1 rounded border border-slate-800 text-[10px] font-mono z-10">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    state.wildsUnlocked ? 'bg-emerald-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-slate-300">
                    {state.wildsUnlocked ? 'ASTEROID BELT: RING 1 & 2 CONNECTED' : 'ASTEROID BELT: RING 2 OFFLINE'}
                  </span>
                </div>

                <svg viewBox="0 0 600 600" className="w-full max-w-[500px] my-auto">
                  {/* Guidelines & Anchors first so they sit in the background */}
                  <circle cx="300" cy="300" r="30" fill="none" stroke="rgba(71, 85, 105, 0.4)" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="300" cy="300" r="150" fill="none" stroke="rgba(71, 85, 105, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx="300" cy="300" r="300" fill="none" stroke="rgba(71, 85, 105, 0.2)" strokeWidth="1.5" strokeDasharray="4 4" />
                  
                  <text x="305" y="145" fill="rgba(148, 163, 184, 0.4)" fontSize="8" fontFamily="monospace" fontWeight="bold">HEARTLANDS LIMIT (R=150)</text>
                  <text x="305" y="295" fill="rgba(148, 163, 184, 0.3)" fontSize="8" fontFamily="monospace" fontWeight="bold">WILDLANDS LIMIT (R=300)</text>
                  <text x="305" y="285" fill="rgba(234, 179, 8, 0.4)" fontSize="8" fontFamily="monospace" fontWeight="bold">ANNULAR HOLE (R=30)</text>

                  {region.nodes.map(node => {
                    const isFogged = !node.discovered && !node.isCapitol;
                    const isLocked = isNodeLocked(node);
                    const colorSpec = isFogged
                      ? { rgb: 'rgb(30, 41, 59)', fill: 'rgba(15, 23, 42, 0.65)', border: 'border-slate-900' }
                      : isLocked
                        ? { rgb: 'rgb(51, 65, 85)', fill: 'rgba(30, 41, 59, 0.45)', border: 'border-slate-850' }
                        : getOwnerColorStyle(node.ownerColor);

                    const isHovered = hoveredNodeId === node.id;

                    return (
                      <g 
                        key={node.id}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className={`transition-all ${isLocked ? 'cursor-not-allowed opacity-65' : 'cursor-pointer'}`}
                      >
                        <path
                          d={node.cellShape}
                          fill={colorSpec.fill}
                          stroke={isFogged ? (isHovered ? '#06b6d4' : '#1e293b') : (isLocked ? (isHovered ? '#64748b' : '#334155') : (isHovered ? '#f1f5f9' : colorSpec.rgb))}
                          strokeWidth={isHovered ? 2.5 : (isFogged ? 1 : (node.isCapitol ? 2 : 1))}
                          strokeDasharray={isFogged ? '3 3' : (!isLocked && node.ownerColor && !node.isSupplied ? '4 2' : 'none')}
                          className="transition-all duration-200"
                        />
                        {/* Interactive Text Label */}
                        <text
                          x={node.labelX}
                          y={node.labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isFogged ? '#475569' : (isLocked ? '#475569' : '#f8fafc')}
                          fontSize={isFogged ? "11" : "9"}
                          fontWeight="700"
                          fontFamily="monospace"
                          className="select-none pointer-events-none drop-shadow-md"
                        >
                          {isFogged ? '?' : (isLocked ? '🔒 ' : (node.isCapitol ? '👑 ' : '')) + node.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="w-full grid grid-cols-2 sm:grid-cols-3 text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-800/40 gap-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-red-500 bg-red-500/20" />
                    <span>Red Cinder Domain</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-blue-500 bg-blue-500/20" />
                    <span>Blue Abyssal Domain</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded border ${!state.wildsUnlocked ? 'border-slate-700 bg-slate-800/20' : 'border-purple-500 bg-purple-500/20'}`} />
                    <span className={!state.wildsUnlocked ? 'text-slate-600' : ''}>Purple Twilight</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded border ${!state.wildsUnlocked ? 'border-slate-700 bg-slate-800/20' : 'border-orange-500 bg-orange-500/20'}`} />
                    <span className={!state.wildsUnlocked ? 'text-slate-600' : ''}>Orange Rust</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2.5 h-2.5 rounded border ${!state.wildsUnlocked ? 'border-slate-700 bg-slate-800/20' : 'border-emerald-500 bg-emerald-500/20'}`} />
                    <span className={!state.wildsUnlocked ? 'text-slate-600' : ''}>Green Feral</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-dashed border-slate-600 bg-slate-900" />
                    <span>Isolated (Dashed)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-slate-600 bg-slate-900" />
                    <span>Unclaimed/Neutral</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded border border-dashed border-cyan-500 bg-slate-950" />
                    <span>Fog of War (Dotted)</span>
                  </div>
                </div>
              </div>

              {/* Sidebar detail list & hovered node metrics */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Hovered/Selected Detail Panel */}
                <div className="border border-slate-800 bg-[#080d16]/30 rounded-xl p-4 flex-1 flex flex-col justify-between">
                  {(() => {
                    const activeNode = region.nodes.find(n => n.id === (hoveredNodeId || region.nodes[0].id));
                    if (!activeNode) return null;

                    const isFogged = !activeNode.discovered && !activeNode.isCapitol;
                    const isLocked = isNodeLocked(activeNode);

                    if (isFogged) {
                      return (
                        <div className="space-y-4 flex-1 flex flex-col justify-center items-center text-center p-4">
                          <Info className="w-8 h-8 text-cyan-500 mb-2 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Sector Uncharted</h4>
                          <p className="text-[11px] text-slate-500 font-mono leading-relaxed max-w-xs">
                            UNCHARTED: Sector shrouded in atmospheric interference and Fog of War. Use the Exploration role to lock scouts and clear this sector.
                          </p>
                          <div className="border border-slate-800/80 bg-slate-950/40 p-2.5 rounded text-[10px] text-slate-400 font-mono mt-2 w-full text-left">
                            <span className="text-cyan-500 font-bold">SCOUT REVEAL CRITERIA:</span>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 text-[9px]">
                              <li>Discover the sector's associated color via breeding to trigger a passive capital-centered reveal, or</li>
                              <li>Launch an active Exploration mission using MND + AGI of scouts in the Exploration tab.</li>
                            </ul>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedExplorationNodeId(activeNode.id);
                              setActiveSubTab('exploration');
                            }}
                            className="w-full py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-400 font-mono text-[10px] uppercase tracking-wider border border-cyan-900/30 rounded-lg cursor-pointer transition-all mt-4 text-center"
                          >
                            Launch Cartographic Draft
                          </button>
                        </div>
                      );
                    }

                    if (isLocked) {
                      return (
                        <div className="space-y-4 flex-1 flex flex-col justify-center items-center text-center p-4">
                          <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Sector Signal Gated</h4>
                          <p className="text-[11px] text-slate-500 font-mono leading-relaxed max-w-xs">
                            SIGNAL GATED: establish a stable culture of any SECONDARY color (Purple, Orange, or Green) to sync with Ring-2 (The Wilds).
                          </p>
                          <div className="border border-slate-800/80 bg-slate-950/40 p-2.5 rounded text-[10px] text-slate-400 font-mono mt-2 w-full text-left">
                            <span className="text-yellow-500 font-bold">GENETIC DISCOVERY KEYS:</span>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 text-[9px]">
                              <li>Purple = Red + Blue</li>
                              <li>Orange = Red + Yellow</li>
                              <li>Green = Blue + Yellow</li>
                            </ul>
                          </div>
                        </div>
                      );
                    }

                    const hasOtherPressures = Object.entries(activeNode.pressure).some(([color, val]) => color !== activeNode.ownerColor && (val as number) > 0);

                    return (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                              {activeNode.isCapitol ? '👑 CAPITOL FORTRESS' : 'REGIONAL NODE'}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              activeNode.ownerColor 
                                ? activeNode.isSupplied 
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' 
                                  : 'bg-red-950/40 text-red-400 border border-red-900/30'
                                : 'bg-slate-900 text-slate-400'
                            }`}>
                              {activeNode.ownerColor 
                                ? activeNode.isSupplied 
                                  ? 'CONNECTED' 
                                  : 'UNSUPPLIED COLLAPSE IMMINENT'
                                : 'UNCLAIMED'}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white font-mono uppercase mt-1">
                            {activeNode.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Ownership Culture: {activeNode.ownerColor || 'None (Neutralized Local Factions)'}
                          </p>

                          {/* Strength stabilization meter */}
                          {activeNode.ownerColor && (
                            <div className="space-y-1 mt-4">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Ownership Strength:</span>
                                <span className="text-white font-bold">{(activeNode.strength * 100).toFixed(0)}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${activeNode.strength * 100}%`,
                                    backgroundColor: COLOR_SPECS[activeNode.ownerColor].rgb
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Tension / foreign pressures */}
                          <div className="space-y-2 mt-4">
                            <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1">
                              External Cultural Pressures
                            </h4>
                            {hasOtherPressures ? (
                              <div className="space-y-1.5 pt-1">
                                {Object.entries(activeNode.pressure).map(([color, val]) => {
                                  const valNum = val as number;
                                  if (color === activeNode.ownerColor || valNum <= 0) return null;
                                  return (
                                    <div key={color} className="flex justify-between items-center text-[10px] font-mono">
                                      <span style={{ color: COLOR_SPECS[color as SlimeColor].rgb }} className="font-bold">
                                        {color} Influence
                                      </span>
                                      <span className="text-slate-300">{valNum} / 100</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-500 italic pt-1">Local pheromones stable. No foreign tension detected.</p>
                            )}
                          </div>
                        </div>

                        {/* Quick action button to trigger Mediation tab draft */}
                        <button
                          onClick={() => {
                            setSelectedMediationNodeId(activeNode.id);
                            setActiveSubTab('mediation');
                          }}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[10px] uppercase tracking-wider border border-slate-750 rounded-lg cursor-pointer transition-all mt-4 text-center"
                        >
                          Diplomatic Mediation Draft
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeSubTab === 'mediation' ? (
          <motion.div
            key="planet_mediation"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-display text-white">Consular Diplomatic Board</h2>
              <p className="text-xs text-slate-400">Launch mediation teams to pacify hostile nodes, reduce external tension, or capture unclaimed sectors.</p>
            </div>

            {state.activeMediation ? (
              <div className="flex-1 border border-yellow-950/30 bg-yellow-950/5 rounded-xl p-6 pb-12 min-h-[420px] flex flex-col justify-between items-center text-center">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-yellow-950/20 border border-yellow-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                    <Clock className="w-6 h-6 text-yellow-400 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">
                      DIPLOMATIC TRANSDUCTION IN PROGRESS
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono uppercase">
                      LOCKED NODE: [ {activeMediationNode?.name} ]
                    </p>
                  </div>

                  {/* Active diplomatic delegation */}
                  <div className="flex justify-center -space-x-3 pt-2">
                    {state.activeMediation.slimeIds.map((id) => {
                      const s = state.slimes.find(slime => slime.id === id);
                      if (!s) return null;
                      return (
                        <div 
                          key={id} 
                          className="w-12 h-12 rounded-full border border-slate-800 bg-slate-950/50 flex items-center justify-center shadow-lg hover:scale-110 hover:z-10 transition-transform"
                        >
                          <SlimeVisual slime={s} size="xs" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 max-w-sm mx-auto">
                    <div className="text-[10px] text-slate-500 font-mono tracking-wider">CYBERNETIC RESONANCE TIMER</div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-white mt-1 uppercase">
                      1 CYCLE REMAINING
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono leading-relaxed uppercase">
                      Mediation delegates are broadcasting stabilizing pheromones across the sector membrane. Skip or pass cycle to conclude negotiation.
                    </p>
                  </div>
                </div>

                <div className="mt-8 mb-4">
                  <button
                    onClick={handleAdvanceCycle}
                    className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg border border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer transition-all"
                  >
                    Bypass Cycle to complete Mediation
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Side: Select Target Node */}
                <div className="lg:col-span-6 space-y-3 overflow-y-auto max-h-[460px] pr-1">
                  {region.nodes.map((node) => {
                    const isSelected = selectedMediationNodeId === node.id;
                    const isLocked = isNodeLocked(node);

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          if (isLocked) return;
                          setSelectedMediationNodeId(node.id);
                          setMediationDraftIds([]); // Reset team draft
                        }}
                        className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                          isLocked
                            ? 'border-slate-900 bg-slate-950/20 opacity-45 cursor-not-allowed'
                            : isSelected
                              ? 'border-yellow-500/50 bg-yellow-950/15 cursor-pointer'
                              : 'border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-750 cursor-pointer'
                        }`}
                      >
                        <div className="space-y-1 pr-4 min-w-0 flex-1">
                          <h3 className="font-mono text-xs font-bold text-white uppercase truncate">
                            {isLocked ? '🔒 ' : ''}{node.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-mono">
                            Owner: {isLocked ? 'Gated' : (node.ownerColor || 'Unclaimed')} | Strength: {isLocked ? '0%' : (node.ownerColor ? `${(node.strength * 100).toFixed(0)}%` : '0%')}
                          </p>
                          <div className="flex items-center space-x-2 pt-1.5 font-mono text-[9px] flex-wrap gap-y-1">
                            {node.isCapitol ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950/30 border border-purple-900/30 text-purple-400 font-bold uppercase">
                                Capitol Fortress
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-950/30 border border-slate-900/30 text-slate-400 font-bold uppercase">
                                Frontier Colony
                              </span>
                            )}
                            {!isLocked && node.ownerColor && (
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${
                                node.isSupplied 
                                  ? 'bg-emerald-950/10 border-emerald-900/20 text-emerald-400' 
                                  : 'bg-red-950/10 border-red-900/20 text-red-400'
                              }`}>
                                {node.isSupplied ? 'Supplied' : 'Isolated'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono text-[10px] shrink-0 ml-2">
                          <div className={isLocked ? "text-slate-600 font-bold uppercase" : "text-yellow-400 font-bold uppercase"}>
                            {isLocked ? "Locked" : "Mediate"}
                          </div>
                          <div className="text-slate-500 mt-1 uppercase">
                            {node.distanceFromCenter < 150 ? "Ring 1" : "Ring 2"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Side: Team Drafting Panel */}
                <div className="lg:col-span-6 border border-slate-800 bg-[#080d16]/30 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2.5 flex items-center justify-between">
                      <span className="flex items-center">
                        <Target className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
                        Diplomatic Delegation Pod
                      </span>
                      <span className="text-[10px] text-slate-500">{mediationDraftIds.length}/3 delegates</span>
                    </h3>

                    {selectedMediationNodeId ? (
                      (() => {
                        const targetNode = region.nodes.find(n => n.id === selectedMediationNodeId)!;
                        
                        // Calculate total delegation CHM and success prognosis
                        let totalChm = 0;
                        mediationDraftIds.forEach(id => {
                          const s = state.slimes.find(slime => slime.id === id);
                          if (s) totalChm += s.stats.chm;
                        });

                        const targetPower = 40 + (targetNode.strength > 0 ? Math.round((1 - targetNode.strength) * 60) : 35);
                        let successChance = totalChm / targetPower;
                        if (successChance > 1) {
                          successChance = 0.85 + (successChance - 1) * 0.1;
                        } else {
                          successChance = 0.2 + successChance * 0.6;
                        }
                        successChance = Math.min(0.98, Math.max(0.15, successChance));

                        return (
                          <div className="mt-4 space-y-4">
                            <div className="space-y-1.5">
                              <div className="text-[10px] text-slate-500 uppercase font-mono">Consular Node: {targetNode.name}</div>
                              <div className="flex items-center space-x-2 font-mono text-xs">
                                <span className="text-slate-400 font-medium">Alignment Chance:</span>
                                <span className={`font-bold ${successChance >= 0.75 ? 'text-emerald-400' : successChance >= 0.45 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {mediationDraftIds.length > 0 ? `${(successChance * 100).toFixed(1)}%` : '0%'}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono leading-normal uppercase">
                                Total Charm Power: <span className="text-yellow-400 font-bold">{totalChm}</span> / Resistance Target: {targetPower}
                              </div>
                            </div>

                            {/* Delegation slots */}
                            <div className="grid grid-cols-3 gap-2">
                              {[0, 1, 2].map((index) => {
                                const slotSlimeId = mediationDraftIds[index];
                                const slotSlime = slotSlimeId ? state.slimes.find(s => s.id === slotSlimeId) : null;
                                return (
                                  <div 
                                    key={index}
                                    onClick={() => {
                                      if (slotSlimeId) {
                                        setMediationDraftIds(prev => prev.filter(id => id !== slotSlimeId));
                                      } else {
                                        setPickerType('mediation');
                                      }
                                    }}
                                    className="border border-dashed border-slate-800 bg-slate-900/10 rounded-lg p-2.5 flex flex-col items-center justify-center cursor-pointer min-h-[95px] hover:border-slate-700/60"
                                  >
                                    {slotSlime ? (
                                      <>
                                        <SlimeVisual slime={slotSlime} size="xs" />
                                        <span className="text-[9px] text-slate-300 font-mono truncate w-14 text-center mt-1.5">{slotSlime.name}</span>
                                        <span className="text-[8px] text-yellow-500 font-mono">CHM {slotSlime.stats.chm}</span>
                                      </>
                                    ) : (
                                      <div className="text-center">
                                        <Play className="w-4 h-4 text-slate-700 mx-auto animate-pulse rotate-90" />
                                        <span className="text-[8px] text-slate-600 font-mono block mt-1 uppercase">Assign</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="mt-8 text-center py-6">
                        <Info className="w-6 h-6 text-slate-800 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Please choose a target sector on the left board first.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-900 mt-6">
                    <button
                      onClick={handleLaunchMediation}
                      disabled={!selectedMediationNodeId || mediationDraftIds.length === 0}
                      className={`w-full py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        selectedMediationNodeId && mediationDraftIds.length > 0
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white border border-yellow-500 cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                          : 'bg-slate-900 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      LAUNCH DIPLOMATIC DELEGATION
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="planet_exploration"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-4">
              <h2 className="text-base font-bold font-display text-white">Cartographic Exploration Board</h2>
              <p className="text-xs text-slate-400 font-mono">Launch scouting teams using MND + AGI to clear the Fog of War from undiscovered sectors.</p>
            </div>

            {state.activeExploration ? (
              <div className="flex-1 border border-cyan-950/30 bg-cyan-950/5 rounded-xl p-6 pb-12 min-h-[420px] flex flex-col justify-between items-center text-center">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <Clock className="w-6 h-6 text-cyan-400 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">
                      CARTOGRAPHIC SCOUTING IN PROGRESS
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono uppercase">
                      LOCKED NODE: [ {state.planetRegion?.nodes.find(n => n.id === state.activeExploration?.targetNodeId)?.name} ]
                    </p>
                  </div>

                  {/* Active scouting delegation */}
                  <div className="flex justify-center -space-x-3 pt-2">
                    {state.activeExploration.slimeIds.map((id) => {
                      const s = state.slimes.find(slime => slime.id === id);
                      if (!s) return null;
                      return (
                        <div 
                          key={id} 
                          className="w-12 h-12 rounded-full border border-slate-800 bg-slate-950/50 flex items-center justify-center shadow-lg hover:scale-110 hover:z-10 transition-transform"
                        >
                          <SlimeVisual slime={s} size="xs" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 max-w-sm mx-auto">
                    <div className="text-[10px] text-slate-500 font-mono tracking-wider">CYBERNETIC RESONANCE TIMER</div>
                    <div className="text-2xl font-bold font-mono tracking-tight text-white mt-1 uppercase">
                      1 CYCLE REMAINING
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono leading-relaxed uppercase">
                      Scouting pods are mapping local topology and scanning chemical trace elements. Skip or pass cycle to conclude mapping.
                    </p>
                  </div>
                </div>

                <div className="mt-8 mb-4">
                  <button
                    onClick={handleAdvanceCycle}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer transition-all"
                  >
                    Bypass Cycle to complete Exploration
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Side: Select Target Node */}
                <div className="lg:col-span-6 space-y-3 overflow-y-auto max-h-[460px] pr-1">
                  {region.nodes.map((node) => {
                    const isSelected = selectedExplorationNodeId === node.id;
                    const isLocked = isNodeLocked(node);
                    const isDiscovered = node.discovered || node.isCapitol;

                    return (
                      <div
                        key={node.id}
                        onClick={() => {
                          if (isLocked || isDiscovered) return;
                          setSelectedExplorationNodeId(node.id);
                          setExplorationDraftIds([]); // Reset team draft
                        }}
                        className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                          isLocked
                            ? 'border-slate-900 bg-slate-950/20 opacity-45 cursor-not-allowed'
                            : isDiscovered
                              ? 'border-slate-900 bg-slate-950/20 opacity-45 cursor-not-allowed'
                              : isSelected
                                ? 'border-cyan-500/50 bg-cyan-950/15 cursor-pointer'
                                : 'border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-750 cursor-pointer'
                        }`}
                      >
                        <div className="space-y-1 pr-4 min-w-0 flex-1">
                          <h3 className="font-mono text-xs font-bold text-white uppercase truncate">
                            {isLocked ? '🔒 ' : isDiscovered ? '✓ ' : ''}{node.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-mono">
                            Status: {isLocked ? 'Gated' : isDiscovered ? 'Discovered' : 'Fog of War'}
                          </p>
                          <div className="flex items-center space-x-2 pt-1.5 font-mono text-[9px] flex-wrap gap-y-1">
                            {node.isCapitol ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950/30 border border-purple-900/30 text-purple-400 font-bold uppercase">
                                Capitol Fortress
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-950/30 border border-slate-900/30 text-slate-400 font-bold uppercase">
                                Frontier Colony
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono text-[10px] shrink-0 ml-2">
                          <div className={isLocked || isDiscovered ? "text-slate-600 font-bold uppercase" : "text-cyan-400 font-bold uppercase"}>
                            {isLocked ? "Locked" : isDiscovered ? "Explored" : "Scout"}
                          </div>
                          <div className="text-slate-500 mt-1 uppercase">
                            {node.distanceFromCenter < 150 ? "Ring 1" : "Ring 2"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Side: Team Drafting Panel */}
                <div className="lg:col-span-6 border border-slate-800 bg-[#080d16]/30 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2.5 flex items-center justify-between">
                      <span className="flex items-center">
                        <Target className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                        Scouting Expedition Pod
                      </span>
                      <span className="text-[10px] text-slate-500">{explorationDraftIds.length}/3 scouts</span>
                    </h3>

                    {selectedExplorationNodeId ? (
                      (() => {
                        const targetNode = region.nodes.find(n => n.id === selectedExplorationNodeId)!;
                        
                        // Calculate total delegation MND+AGI and success prognosis
                        let totalMndAgi = 0;
                        explorationDraftIds.forEach(id => {
                          const s = state.slimes.find(slime => slime.id === id);
                          if (s) totalMndAgi += s.stats.int + s.stats.agi;
                        });

                        const targetPower = 60 + (targetNode.distanceFromCenter >= 150 ? 50 : 0);
                        let successChance = totalMndAgi / targetPower;
                        if (successChance > 1) {
                          successChance = 0.85 + (successChance - 1) * 0.1;
                        } else {
                          successChance = 0.2 + successChance * 0.6;
                        }
                        successChance = Math.min(0.98, Math.max(0.15, successChance));

                        return (
                          <div className="mt-4 space-y-4">
                            <div className="space-y-1.5">
                              <div className="text-[10px] text-slate-500 uppercase font-mono">Target Node: {targetNode.name}</div>
                              <div className="flex items-center space-x-2 font-mono text-xs">
                                <span className="text-slate-400 font-medium">Scouting Success Chance:</span>
                                <span className={`font-bold ${successChance >= 0.75 ? 'text-emerald-400' : successChance >= 0.45 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {explorationDraftIds.length > 0 ? `${(successChance * 100).toFixed(1)}%` : '0%'}
                                </span>
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono leading-normal uppercase">
                                Total MND + AGI Power: <span className="text-cyan-400 font-bold">{totalMndAgi}</span> / Scout Gating Target: {targetPower}
                              </div>
                            </div>

                            {/* Scouting slots */}
                            <div className="grid grid-cols-3 gap-2">
                              {[0, 1, 2].map((index) => {
                                const slotSlimeId = explorationDraftIds[index];
                                const slotSlime = slotSlimeId ? state.slimes.find(s => s.id === slotSlimeId) : null;
                                return (
                                  <div 
                                    key={index}
                                    onClick={() => {
                                      if (slotSlimeId) {
                                        setExplorationDraftIds(prev => prev.filter(id => id !== slotSlimeId));
                                      } else {
                                        setPickerType('exploration');
                                      }
                                    }}
                                    className="border border-dashed border-slate-800 bg-slate-900/10 rounded-lg p-2.5 flex flex-col items-center justify-center cursor-pointer min-h-[95px] hover:border-slate-700/60"
                                  >
                                    {slotSlime ? (
                                      <>
                                        <SlimeVisual slime={slotSlime} size="xs" />
                                        <span className="text-[9px] text-slate-300 font-mono truncate w-14 text-center mt-1.5">{slotSlime.name}</span>
                                        <span className="text-[8px] text-cyan-500 font-mono">INT+AGI {slotSlime.stats.int + slotSlime.stats.agi}</span>
                                      </>
                                    ) : (
                                      <div className="text-center">
                                        <Play className="w-4 h-4 text-slate-700 mx-auto animate-pulse rotate-90" />
                                        <span className="text-[8px] text-slate-600 font-mono block mt-1 uppercase">Assign</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="mt-8 text-center py-6">
                        <Info className="w-6 h-6 text-slate-800 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Please choose a target sector on the left board first.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-900 mt-6">
                    <button
                      onClick={handleLaunchExploration}
                      disabled={!selectedExplorationNodeId || explorationDraftIds.length === 0}
                      className={`w-full py-2.5 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        selectedExplorationNodeId && explorationDraftIds.length > 0
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      LAUNCH SCOUT EXPEDITION
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Diplomatic/Scouting Specimen Selection Modal overlay */}
      <AnimatePresence>
        {pickerType !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 max-w-md w-full max-h-[85vh] flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-2.5 mb-4">
                  <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                    {pickerType === 'mediation' ? 'DIPLOMAT COGNITION SPECIMENS' : 'SCOUT CARTOGRAPHY SPECIMENS'} ({draftIds.length}/3)
                  </h3>
                  <button 
                    onClick={() => setPickerType(null)}
                    className="text-slate-500 hover:text-white font-mono text-[10px] uppercase cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                  {availableSlimes.length === 0 ? (
                    <div className="text-center py-8">
                      <ShieldAlert className="w-6 h-6 text-slate-800 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-500 font-mono uppercase">All specimens are busy, dispatched, or on corporate assignment.</p>
                    </div>
                  ) : (
                    availableSlimes.map((slime) => {
                      const isSelected = draftIds.includes(slime.id);
                      return (
                        <div
                          key={slime.id}
                          onClick={() => handleTogglePickerSelect(slime.id)}
                          className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? pickerType === 'mediation'
                                ? 'border-yellow-500 bg-yellow-950/10'
                                : 'border-cyan-500 bg-cyan-950/10'
                              : 'border-slate-850 bg-slate-900/5 hover:bg-slate-900/20'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded-full border border-slate-800 bg-slate-950/50 flex items-center justify-center">
                              <SlimeVisual slime={slime} size="xs" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-mono text-[11px] font-bold text-white truncate leading-tight uppercase">
                                {slime.name}
                              </h4>
                              <p className="text-[9px] text-slate-400 mt-0.5 font-mono flex items-center gap-1.5 flex-wrap">
                                <span>LV. {slime.level} | {slime.color} {slime.pattern}</span>
                                {slime.lockedRole === 'mediation' && (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider bg-yellow-950/40 text-yellow-400 border border-yellow-900/30 whitespace-nowrap">
                                    🔒 MEDIATION LOCK
                                  </span>
                                )}
                                {slime.lockedRole === 'exploration' && (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider bg-cyan-950/40 text-cyan-400 border border-cyan-900/30 whitespace-nowrap">
                                    🔒 EXPLORATION LOCK
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right font-mono text-[10px]">
                            {pickerType === 'mediation' ? (
                              <div className="text-yellow-400 font-bold">CHM: {slime.stats.chm}</div>
                            ) : (
                              <div className="text-cyan-400 font-bold">INT+AGI: {slime.stats.int + slime.stats.agi}</div>
                            )}
                            <div className="text-[8px] text-slate-500 mt-0.5">LVL {slime.level}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                onClick={() => setPickerType(null)}
                className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 font-mono text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-all"
              >
                Confirm Specimen Selection
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mediation Resolution Modal (Displaying CHM-weighted Outcome logs) */}
      <AnimatePresence>
        {activeMediationReport && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e16] border border-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    {activeMediationReport.success ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                      DIPLOMATIC DELEGATION REPORT
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    activeMediationReport.success ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30'
                  }`}>
                    {activeMediationReport.success ? 'SUCCESS' : 'PARTIAL PROGRESS'}
                  </span>
                </div>

                {/* Mediation details & log */}
                <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3.5 max-h-[300px] overflow-y-auto font-mono text-[10px] space-y-2 text-slate-300 leading-relaxed uppercase">
                  {activeMediationReport.logs.map((logLine, idx) => (
                    <div key={idx} className={logLine.startsWith('  -') ? 'pl-4 text-slate-500' : logLine.startsWith('SUCCESS') || logLine.startsWith('SUCCESS') ? 'text-emerald-400 font-bold' : ''}>
                      {logLine}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Regional Stability Alteration:</span>
                  <span className="text-emerald-400 font-bold">+{activeMediationReport.stabilityChange}%</span>
                </div>
              </div>

              <button
                onClick={() => setActiveMediationReport(null)}
                className="mt-6 w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg border border-yellow-500 cursor-pointer shadow-lg transition-all"
              >
                Close Diplomatic Logs & Terminate Report
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exploration Resolution Modal (Displaying Outcome logs) */}
      <AnimatePresence>
        {activeExplorationReport && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e16] border border-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    {activeExplorationReport.success ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                      CARTOGRAPHIC SCOUT EXPEDITION REPORT
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    activeExplorationReport.success ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-red-950/40 text-red-400 border border-red-900/30'
                  }`}>
                    {activeExplorationReport.success ? 'SUCCESS' : 'FAILURE'}
                  </span>
                </div>

                {/* Exploration details & log */}
                <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3.5 max-h-[300px] overflow-y-auto font-mono text-[10px] space-y-2 text-slate-300 leading-relaxed uppercase">
                  {activeExplorationReport.logs.map((logLine, idx) => (
                    <div key={idx} className={logLine.startsWith('  -') ? 'pl-4 text-slate-500' : logLine.startsWith('SUCCESS') || logLine.startsWith('MAPPING COMPLETE') ? 'text-emerald-400 font-bold' : ''}>
                      {logLine}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveExplorationReport(null)}
                className="mt-6 w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg border border-cyan-500 cursor-pointer shadow-lg transition-all"
              >
                Close Scouting Logs & Terminate Report
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
