// @ts-nocheck
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, ShieldAlert, ShieldCheck, Database, Target, Play, Info, Sparkles, CheckCircle2, AlertTriangle, RefreshCw,
  Swords, Compass, Users, Lock, Unlock, Moon, Sliders, Shield
} from 'lucide-react';
import { Slime, SlimeColor, PlanetNode, LabState } from '../types';
import { COLOR_SPECS, isCapitolHardened } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';
import { SpecimenPicker } from './SpecimenPicker';

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
  activeSubTab: 'regions' | 'mediation' | 'exploration' | 'active' | 'zones';
  setActiveSubTab: (subTab: 'regions' | 'mediation' | 'exploration' | 'active' | 'zones') => void;

  // Click-to-Select and Target Picker properties
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedZoneId: (id: string | null) => void;
  setActiveTab: (tab: 'lab' | 'planet') => void;

  // Missions / Dispatch properties
  selectedZoneId: string | null;
  dispatchDraftIds: string[];
  setDispatchDraftIds: React.Dispatch<React.SetStateAction<string[]>>;
  realtimeRemainingMs: number;
  activeDispatchReport: { logs: string[]; success: boolean; xp: number; credits: number } | null;
  setActiveDispatchReport: (report: any) => void;
  handleLaunchDispatch: () => void;
  handleRetrieveCompletedPod: () => void;
  handleAssignGarrison: (nodeId: string, slimeId: string) => void;
  handleRecallGarrison: (slimeId: string) => void;
  handleForceClaim: (nodeId: string, slimeIds: string[]) => { success: boolean; log: string[] };
  handleBribeClaim: (nodeId: string, creditsSpent: number) => { success: boolean; log: string[] };
  handleConvertClaim: (nodeId: string, slimeIds: string[]) => { success: boolean; log: string[] };
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
  setActiveSubTab,
  selectedNodeId,
  setSelectedNodeId,
  setSelectedZoneId,
  setActiveTab,
  selectedZoneId,
  dispatchDraftIds,
  setDispatchDraftIds,
  realtimeRemainingMs,
  activeDispatchReport,
  setActiveDispatchReport,
  handleLaunchDispatch,
  handleRetrieveCompletedPod,
  handleAssignGarrison,
  handleRecallGarrison,
  handleForceClaim,
  handleBribeClaim,
  handleConvertClaim
}: PlanetTabProps) {
  const [pickerType, setPickerType] = useState<'mediation' | 'exploration' | 'claim' | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isDispatchPickerOpen, setIsDispatchPickerOpen] = useState(false);

  // Claim states
  const [claimMethod, setClaimMethod] = useState<'force' | 'bribe' | 'convert' | null>(null);
  const [claimDraftIds, setClaimDraftIds] = useState<string[]>([]);
  const [bribeCredits, setBribeCredits] = useState<number>(100);
  const [claimReport, setClaimReport] = useState<{ success: boolean; log: string[] } | null>(null);

  const region = state.planetRegion;

  const activeDispatchZone = state.zones.find(z => z.id === state.activeDispatch?.zoneId);

  // Calculate remaining time nicely
  const formatTime = (ms: number) => {
    const totalSecs = Math.ceil(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleToggleDispatchPickerSelect = (id: string) => {
    setDispatchDraftIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, id];
      }
    });
  };

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
    } else if (pickerType === 'claim') {
      setClaimDraftIds(prev => {
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
    <div className="flex flex-col flex-1" id="planet_tab_root">
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
                        onClick={() => {
                          if (selectedNodeId === node.id) {
                            setSelectedNodeId(null);
                          } else {
                            setSelectedNodeId(node.id);
                          }
                        }}
                        className={`transition-all ${isLocked ? 'cursor-not-allowed opacity-65' : 'cursor-pointer'}`}
                      >
                        <path
                          d={node.cellShape}
                          fill={colorSpec.fill}
                          stroke={selectedNodeId === node.id ? '#eab308' : (isFogged ? (isHovered ? '#06b6d4' : '#1e293b') : (isLocked ? (isHovered ? '#64748b' : '#334155') : (isHovered ? '#f1f5f9' : colorSpec.rgb)))}
                          strokeWidth={selectedNodeId === node.id ? 4 : (isHovered ? 2.5 : (isFogged ? 1 : (node.isCapitol ? 2 : 1)))}
                          strokeDasharray={isFogged ? '3 3' : (!isLocked && node.ownerColor && !node.isSupplied ? '4 2' : 'none')}
                          className={`transition-all duration-200 ${selectedNodeId === node.id ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]' : ''}`}
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
                <div className="border border-slate-800 bg-[#080d16]/30 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[380px]">
                  {(() => {
                    if (!selectedNodeId) {
                      return (
                        <div className="space-y-4 flex-1 flex flex-col justify-center items-center text-center p-4">
                          <Target className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
                          <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">No Target Selected</h4>
                          <p className="text-[11px] text-slate-500 font-mono leading-relaxed max-w-[240px]">
                            Select any node on the planetary conflict map to initiate orbital dispatch, diplomatic mediation, or view resource details.
                          </p>
                        </div>
                      );
                    }

                    const activeNode = region.nodes.find(n => n.id === selectedNodeId);
                    if (!activeNode) return null;

                    const isFogged = !activeNode.discovered && !activeNode.isCapitol;
                    const isLocked = isNodeLocked(activeNode);

                    if (isFogged) {
                      return (
                        <div className="space-y-4 flex-1 flex flex-col justify-between p-1">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-cyan-500 font-mono uppercase tracking-widest">
                                UNCHARTED SECTOR
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-900/30">
                                FOG OF WAR
                              </span>
                            </div>
                            
                            <h3 className="text-sm font-bold text-white font-mono uppercase">
                              {activeNode.name}
                            </h3>

                            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                              Sector shrouded in atmospheric interference and Fog of War. Use the Exploration role to lock scouts and clear this sector.
                            </p>
                            
                            <div className="border border-slate-800/80 bg-slate-950/40 p-2.5 rounded text-[10px] text-slate-400 font-mono mt-2 w-full text-left">
                              <span className="text-cyan-500 font-bold">SCOUT REVEAL CRITERIA:</span>
                              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 text-[9px]">
                                <li>Discover the sector's associated color via breeding to trigger a passive capital-centered reveal, or</li>
                                <li>Launch an active Exploration mission using MND + AGI of scouts in the Exploration tab.</li>
                              </ul>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedExplorationNodeId(activeNode.id);
                              setActiveSubTab('exploration');
                            }}
                            className="w-full py-2.5 bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-400 font-mono text-[10px] uppercase tracking-wider border border-cyan-800/40 rounded-lg cursor-pointer transition-all mt-4 text-center font-bold"
                          >
                            Launch Exploration Draft
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
                    
                    // Helper to map node to zone
                    const mapNodeToZoneId = (node: PlanetNode): string | null => {
                      const color = node.ownerColor;
                      if (!color) {
                        if (node.pressure) {
                          const topPressureColor = Object.entries(node.pressure)
                            .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] as SlimeColor;
                          if (topPressureColor === 'Red') return 'zone_cinder';
                          if (topPressureColor === 'Yellow') return 'zone_sulphur';
                          if (topPressureColor === 'Blue') return 'zone_abyssal';
                          if (topPressureColor === 'Green') return 'zone_jungle';
                        }
                        return 'zone_cinder';
                      }
                      if (color === 'Red' || color === 'Orange') return 'zone_cinder';
                      if (color === 'Yellow') return 'zone_sulphur';
                      if (color === 'Blue' || color === 'Purple') return 'zone_abyssal';
                      if (color === 'Green') return 'zone_jungle';
                      return 'zone_cinder';
                    };
                    
                    const zoneId = mapNodeToZoneId(activeNode);
                    
                    // Rule check: is a capitol owned by player's culture fully secure?
                    const isSecureCapitol = activeNode.isCapitol && !!activeNode.ownerColor && activeNode.strength >= 1.0 && !hasOtherPressures;
                    const availableGarrisonSlimes = state.slimes.filter(s => s.role === 'idle' && !s.lockedRole);
                    const garrisonedSlime = state.slimes.find(s => s.lockedRole === 'garrison' && s.garrisonedAt === activeNode.id);

                    return (
                      <div className="space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
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
                                  : 'UNSUPPLIED COLLAPSE'
                                : 'UNCLAIMED'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-white font-mono uppercase">
                              {activeNode.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-1.5">
                              <span>Ownership Culture:</span>
                              {activeNode.ownerColor ? (
                                <span style={{ color: COLOR_SPECS[activeNode.ownerColor].rgb }} className="font-bold">
                                  {activeNode.ownerColor} Domain
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">None (Neutralized Local Factions)</span>
                              )}
                            </p>
                          </div>

                          {/* Strength stabilization meter */}
                          {activeNode.ownerColor && (
                            <div className="space-y-1">
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
                          <div className="space-y-1.5">
                            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1">
                              External Cultural Pressures
                            </h4>
                            {hasOtherPressures ? (
                              <div className="space-y-1 pt-0.5">
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
                              <p className="text-[10px] text-slate-500 italic pt-0.5">Local pheromones stable. No foreign tension detected.</p>
                            )}
                          </div>

                          {/* Worker Assignment Section */}
                          <div className="border border-slate-800/60 bg-slate-950/20 p-2.5 rounded-lg text-[10px] font-mono text-slate-400 space-y-1">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1 font-bold">
                              <span className="text-slate-300 uppercase flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                Workers
                              </span>
                              <span className="text-slate-500 text-[8px] uppercase">Lab-Wide</span>
                            </div>
                            <p className="text-[9px] leading-relaxed text-slate-500">
                              Specimens set to LAB WORKER role in Specimens tab generate credits.
                            </p>
                            {activeNode.ownerColor ? (
                              <div style={{ color: COLOR_SPECS[activeNode.ownerColor].rgb, borderColor: `${COLOR_SPECS[activeNode.ownerColor].rgb}20`, backgroundColor: `${COLOR_SPECS[activeNode.ownerColor].rgb}05` }} className="font-bold border p-1 rounded text-[9px] mt-1">
                                ✓ Active {activeNode.ownerColor} Culture matching: Workers of this color receive 2x income!
                              </div>
                            ) : (
                              <div className="text-slate-600 italic text-[9px]">
                                No culture match bonus active in this neutral sector.
                              </div>
                            )}
                            <div className="text-slate-600 text-[8px] pt-0.5">
                              *Individual cell-scoped worker assignments pending upgrade.
                            </div>
                          </div>

                          {/* Garrison Duty Section */}
                          {activeNode.ownerColor && (
                            <div className="border border-slate-800/60 bg-[#060c18]/50 p-2.5 rounded-lg text-[10px] font-mono text-slate-400 space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-1 font-bold">
                                <span className="text-slate-300 uppercase flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                                  Garrison Duty
                                </span>
                                <span className="text-slate-500 text-[8px] uppercase">Node-Scoped</span>
                              </div>
                              
                              {garrisonedSlime ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-slate-300 bg-slate-950/60 p-1.5 rounded border border-slate-800/50">
                                    <div className="flex flex-col font-mono">
                                      <span className="font-bold text-[10px] text-slate-200">{garrisonedSlime.name}</span>
                                      <span className="text-[8px] text-slate-500 font-mono">
                                        {garrisonedSlime.color} {garrisonedSlime.pattern} (Lv.{garrisonedSlime.level})
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleRecallGarrison(garrisonedSlime.id)}
                                      className="px-2 py-0.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded text-[8px] uppercase tracking-wider font-mono cursor-pointer transition-all"
                                    >
                                      Recall
                                    </button>
                                  </div>
                                  <p className="text-[9px] text-emerald-400 flex items-center gap-1 font-bold">
                                    <span>✓</span> Reducing local revolt risk by 50%.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-[9px] text-yellow-500/90 leading-normal">
                                    ⚠️ VACANT: Vulnerable to revolt from surrounding cultural pressure.
                                  </p>
                                  {availableGarrisonSlimes.length > 0 ? (
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleAssignGarrison(activeNode.id, e.target.value);
                                        }
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-[9px] rounded p-1 cursor-pointer font-mono"
                                      value=""
                                    >
                                      <option value="">Assign Specimen...</option>
                                      {availableGarrisonSlimes.map(s => (
                                        <option key={s.id} value={s.id}>
                                          {s.name} ({s.color} {s.pattern}, Lv.{s.level})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p className="text-[9px] text-slate-600 italic">No idle specimens available for garrison duty.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Claiming Protocols Section (For unclaimed nodes) */}
                          {!activeNode.ownerColor && (
                            <div className="border border-slate-800 bg-[#070d18]/70 p-3 rounded-lg text-[10px] font-mono text-slate-300 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 font-bold">
                                <span className="text-cyan-400 uppercase flex items-center gap-1">
                                  <Target className="w-3.5 h-3.5" />
                                  Claiming Protocols
                                </span>
                                <span className="text-slate-500 text-[8px] uppercase font-bold">Unclaimed Sector</span>
                              </div>

                              {/* Mode selection tabs */}
                              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded border border-slate-900">
                                <button
                                  onClick={() => {
                                    setClaimMethod('force');
                                    setClaimDraftIds([]);
                                    setClaimReport(null);
                                  }}
                                  className={`py-1 text-[8px] rounded uppercase font-bold transition-all cursor-pointer ${
                                    claimMethod === 'force'
                                      ? 'bg-red-950/50 text-red-400 border border-red-900/40'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  Force
                                </button>
                                <button
                                  onClick={() => {
                                    setClaimMethod('bribe');
                                    setClaimDraftIds([]);
                                    setClaimReport(null);
                                    // Set default credits to match required credits roughly
                                    const effStr = activeNode.discovered ? activeNode.strength : 0.8;
                                    const tp = 50 + Math.round(effStr * 100);
                                    setBribeCredits(Math.round(tp * 2.0));
                                  }}
                                  className={`py-1 text-[8px] rounded uppercase font-bold transition-all cursor-pointer ${
                                    claimMethod === 'bribe'
                                      ? 'bg-yellow-950/50 text-yellow-400 border border-yellow-900/40'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  Bribe
                                </button>
                                <button
                                  onClick={() => {
                                    setClaimMethod('convert');
                                    setClaimDraftIds([]);
                                    setClaimReport(null);
                                  }}
                                  className={`py-1 text-[8px] rounded uppercase font-bold transition-all cursor-pointer ${
                                    claimMethod === 'convert'
                                      ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  Convert
                                </button>
                              </div>

                              {/* Path Details */}
                              {claimMethod === 'force' && (
                                <div className="space-y-2.5">
                                  <div className="text-slate-400 leading-normal text-[9px]">
                                    Use combat specifications (ATK + DEF + Level) to overwhelm sector defenses. Leaves a <span className="text-red-400 font-bold">heavy civilian grudge</span> (high revolt pressure).
                                  </div>

                                  {/* Draft display */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[8px] uppercase font-bold text-slate-500">
                                      <span>Team Draft ({claimDraftIds.length}/3)</span>
                                      <button
                                        onClick={() => setPickerType('claim')}
                                        className="text-cyan-400 hover:underline cursor-pointer"
                                      >
                                        Select Raiders...
                                      </button>
                                    </div>

                                    {claimDraftIds.length > 0 ? (
                                      <div className="space-y-1 bg-slate-950/50 p-1.5 rounded border border-slate-900">
                                        {claimDraftIds.map(id => {
                                          const s = state.slimes.find(slime => slime.id === id);
                                          if (!s) return null;
                                          return (
                                            <div key={id} className="flex justify-between items-center text-[9px] font-mono">
                                              <span className="font-bold text-slate-300">{s.name}</span>
                                              <span className="text-slate-500">
                                                {s.color} (Lv.{s.level}) | ATK:{s.stats.atk} DEF:{s.stats.def}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-center p-3 border border-dashed border-slate-800 rounded text-slate-500 text-[9px]">
                                        No raiders selected. Click 'Select Raiders' above.
                                      </div>
                                    )}
                                  </div>

                                  {/* Metrics & Action button */}
                                  {claimDraftIds.length > 0 && (() => {
                                    const party = state.slimes.filter(s => claimDraftIds.includes(s.id));
                                    let totalForce = 0;
                                    party.forEach(s => totalForce += (s.level * 10 + s.stats.atk + s.stats.def));
                                    const effStr = activeNode.discovered ? activeNode.strength : 0.8;
                                    const tp = 50 + Math.round(effStr * 100);
                                    let successChance = totalForce / tp;
                                    if (successChance > 1) {
                                      successChance = 0.85 + (successChance - 1) * 0.1;
                                    } else {
                                      successChance = 0.2 + successChance * 0.6;
                                    }
                                    successChance = Math.min(0.98, Math.max(0.15, successChance));

                                    return (
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] bg-slate-950 p-1.5 rounded border border-slate-900 font-mono">
                                          <span>Force Power: <strong className="text-red-400">{totalForce}</strong> vs Defense: <strong>{tp}</strong></span>
                                          <span>Success: <strong className="text-emerald-400">{(successChance * 100).toFixed(1)}%</strong></span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const res = handleForceClaim(activeNode.id, claimDraftIds);
                                            setClaimReport(res);
                                            setClaimDraftIds([]);
                                          }}
                                          className="w-full py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded uppercase font-bold tracking-wider cursor-pointer text-[9px] transition-all"
                                        >
                                          Execute Military Conquest
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {claimMethod === 'bribe' && (
                                <div className="space-y-2.5">
                                  <div className="text-slate-400 leading-normal text-[9px]">
                                    Bypass physical stats and use liquid capital to buyout local leaders. Leaves a <span className="text-yellow-400 font-bold">moderate civilian grudge</span>.
                                  </div>

                                  {/* Parameters */}
                                  <div className="space-y-2 bg-slate-950/50 p-2 rounded border border-slate-900">
                                    {/* Current Controlling Culture & Relations */}
                                    {(() => {
                                      let targetColor: SlimeColor = activeNode.ownerColor || 'Gray';
                                      if (!activeNode.ownerColor) {
                                        let maxPressure = -1;
                                        Object.entries(activeNode.pressure).forEach(([c, val]) => {
                                          if ((val as number) > maxPressure) {
                                            maxPressure = val as number;
                                            targetColor = c as SlimeColor;
                                          }
                                        });
                                      }
                                      const rel = state.cultureRelationships?.[targetColor] ?? 50;
                                      return (
                                        <div className="flex items-center justify-between text-[9px] font-mono">
                                          <span className="text-slate-500 uppercase font-bold">Target Culture: {targetColor}</span>
                                          <span className="text-slate-400">
                                            Relations: <strong className={rel >= 50 ? 'text-emerald-400' : 'text-red-400'}>{rel}/100</strong>
                                          </span>
                                        </div>
                                      );
                                    })()}

                                    {/* Credits slider / input */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[9px]">
                                        <span className="text-slate-500 uppercase font-bold">Offer Credits:</span>
                                        <span className={state.credits >= bribeCredits ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                          {bribeCredits} / {state.credits} CR
                                        </span>
                                      </div>
                                      <input
                                        type="range"
                                        min={50}
                                        max={Math.max(500, state.credits)}
                                        step={10}
                                        value={bribeCredits}
                                        onChange={(e) => setBribeCredits(Number(e.target.value))}
                                        className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1"
                                      />
                                    </div>
                                  </div>

                                  {/* Buyout analysis */}
                                  {(() => {
                                    const effStr = activeNode.discovered ? activeNode.strength : 0.8;
                                    const tp = 50 + Math.round(effStr * 100);
                                    const requiredCredits = Math.round(tp * 2.0);
                                    let successChance = bribeCredits / requiredCredits;
                                    if (successChance > 1) {
                                      successChance = 0.85 + (successChance - 1) * 0.1;
                                    } else {
                                      successChance = 0.2 + successChance * 0.6;
                                    }
                                    successChance = Math.min(0.98, Math.max(0.15, successChance));

                                    const canAfford = state.credits >= bribeCredits;

                                    return (
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] bg-slate-950 p-1.5 rounded border border-slate-900 font-mono">
                                          <span>Minimum Buyout: <strong>{requiredCredits} CR</strong></span>
                                          <span>Success: <strong className={successChance > 0.5 ? 'text-emerald-400' : 'text-yellow-400'}>{(successChance * 100).toFixed(1)}%</strong></span>
                                        </div>
                                        <button
                                          disabled={!canAfford}
                                          onClick={() => {
                                            const res = handleBribeClaim(activeNode.id, bribeCredits);
                                            setClaimReport(res);
                                          }}
                                          className={`w-full py-1.5 rounded uppercase font-bold tracking-wider text-[9px] transition-all ${
                                            canAfford
                                              ? 'bg-yellow-950/45 hover:bg-yellow-900/40 text-yellow-400 border border-yellow-900/30 cursor-pointer'
                                              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                                          }`}
                                        >
                                          {canAfford ? 'Launch Corporate Buyout' : 'Insufficient Corporate Credits'}
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {claimMethod === 'convert' && (
                                <div className="space-y-2.5">
                                  <div className="text-slate-400 leading-normal text-[9px]">
                                    Use diplomatic and cultural delegation (CHM stat) to unify minds. Factored by global culture relationships. Leaves <span className="text-emerald-400 font-bold">minimal or no civilian grudge</span>.
                                  </div>

                                  {/* Draft display */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[8px] uppercase font-bold text-slate-500">
                                      <span>Team Draft ({claimDraftIds.length}/3)</span>
                                      <button
                                        onClick={() => setPickerType('claim')}
                                        className="text-cyan-400 hover:underline cursor-pointer"
                                      >
                                        Select Envoys...
                                      </button>
                                    </div>

                                    {claimDraftIds.length > 0 ? (
                                      <div className="space-y-1 bg-slate-950/50 p-1.5 rounded border border-slate-900">
                                        {claimDraftIds.map(id => {
                                          const s = state.slimes.find(slime => slime.id === id);
                                          if (!s) return null;
                                          return (
                                            <div key={id} className="flex justify-between items-center text-[9px] font-mono">
                                              <span className="font-bold text-slate-300">{s.name}</span>
                                              <span className="text-slate-500">
                                                {s.color} (Lv.{s.level}) | Charm:{s.stats.chm}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-center p-3 border border-dashed border-slate-800 rounded text-slate-500 text-[9px]">
                                        No envoys selected. Click 'Select Envoys' above.
                                      </div>
                                    )}
                                  </div>

                                  {/* Metrics & Action button */}
                                  {claimDraftIds.length > 0 && (() => {
                                    const party = state.slimes.filter(s => claimDraftIds.includes(s.id));
                                    let totalChm = 0;
                                    party.forEach(s => totalChm += s.stats.chm);

                                    // Get relationship of target culture
                                    let targetColor: SlimeColor = 'Gray';
                                    let maxPressure = -1;
                                    Object.entries(activeNode.pressure).forEach(([c, val]) => {
                                      if ((val as number) > maxPressure) {
                                        maxPressure = val as number;
                                        targetColor = c as SlimeColor;
                                      }
                                    });
                                    const rel = state.cultureRelationships?.[targetColor] ?? 50;
                                    const relBonus = (rel - 50) / 100;
                                    const adjustedChm = Math.round(totalChm * (1 + relBonus));

                                    const effStr = activeNode.discovered ? activeNode.strength : 0.8;
                                    const tp = 40 + Math.round(effStr * 80);
                                    let successChance = adjustedChm / tp;
                                    if (successChance > 1) {
                                      successChance = 0.85 + (successChance - 1) * 0.1;
                                    } else {
                                      successChance = 0.2 + successChance * 0.6;
                                    }
                                    successChance = Math.min(0.98, Math.max(0.15, successChance));

                                    return (
                                      <div className="space-y-2">
                                        <div className="space-y-1 bg-slate-950 p-1.5 rounded border border-slate-900 text-[9px] font-mono">
                                          <div className="flex justify-between">
                                            <span>Relations with {targetColor}: <strong>{rel}/100</strong></span>
                                            <span>Mod: <strong className={relBonus >= 0 ? 'text-emerald-400' : 'text-red-400'}>{relBonus >= 0 ? '+' : ''}{(relBonus * 100).toFixed(0)}%</strong></span>
                                          </div>
                                          <div className="flex justify-between border-t border-slate-900 pt-1 mt-1">
                                            <span>Effective Charm: <strong className="text-emerald-400">{adjustedChm}</strong> vs Resistance: <strong>{tp}</strong></span>
                                            <span>Success: <strong className="text-emerald-400">{(successChance * 100).toFixed(1)}%</strong></span>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const res = handleConvertClaim(activeNode.id, claimDraftIds);
                                            setClaimReport(res);
                                            setClaimDraftIds([]);
                                          }}
                                          className="w-full py-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/30 rounded uppercase font-bold tracking-wider cursor-pointer text-[9px] transition-all"
                                        >
                                          Initiate Ideological Conversion
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Local result report display */}
                              {claimReport && (
                                <div className={`p-2 rounded border text-[9px] font-mono leading-normal ${
                                  claimReport.success
                                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                                    : 'bg-red-950/20 border-red-900/40 text-red-300'
                                }`}>
                                  <div className="flex justify-between items-center font-bold border-b border-current/10 pb-1 mb-1">
                                    <span>{claimReport.success ? '✓ SECURED SUCCESS' : '✗ DISPATCH REPELLED'}</span>
                                    <button onClick={() => setClaimReport(null)} className="hover:underline cursor-pointer">Dismiss</button>
                                  </div>
                                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                                    {claimReport.log.map((line, idx) => (
                                      <p key={idx}>{line}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Deployment Options Footer */}
                        <div className="space-y-2 pt-2 border-t border-slate-900">
                          {isSecureCapitol ? (
                            <div className="w-full">
                              {!garrisonedSlime ? (
                                <div className="space-y-2.5 p-3 rounded-lg border border-yellow-900/30 bg-yellow-950/20 font-mono text-[10px]">
                                  <div className="text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-4 h-4" />
                                    Garrison Required
                                  </div>
                                  <p className="text-slate-300 text-[9px] leading-relaxed">
                                    This capitol is secure but has no garrison assigned. A standing garrison is required to prevent revolt from surrounding cultural pressures.
                                  </p>
                                  {availableGarrisonSlimes.length > 0 ? (
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleAssignGarrison(activeNode.id, e.target.value);
                                        }
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-[9px] rounded p-1.5 cursor-pointer font-mono"
                                      value=""
                                    >
                                      <option value="">Assign Garrison Specimen...</option>
                                      {availableGarrisonSlimes.map(s => (
                                        <option key={s.id} value={s.id}>
                                          {s.name} ({s.color} {s.pattern}, Lv.{s.level})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div className="text-slate-500 italic text-[9px]">No idle specimens available for garrison duty. Create or free one to protect this sector.</div>
                                  )}
                                </div>
                              ) : !isCapitolHardened(activeNode, state.planetRegion?.nodes || []) ? (
                                (() => {
                                  // Find missing neighbors
                                  const missingNeighbors = activeNode.neighbors.filter(id => {
                                    const n = state.planetRegion?.nodes.find(node => node.id === id);
                                    return !n || n.ownerColor !== activeNode.ownerColor;
                                  }).map(id => state.planetRegion?.nodes.find(node => node.id === id)?.name || id);

                                  return (
                                    <div className="space-y-2.5 p-3 rounded-lg border border-blue-900/30 bg-blue-950/20 font-mono text-[10px]">
                                      <div className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 animate-pulse" />
                                        Consolidation Pending
                                      </div>
                                      <p className="text-slate-300 text-[9px] leading-relaxed">
                                        Capitol is secured and garrisoned by <span className="font-bold text-white">{garrisonedSlime.name}</span>, but the surrounding cluster is not fully aligned under the <span className="font-bold" style={{ color: COLOR_SPECS[activeNode.ownerColor!].rgb }}>{activeNode.ownerColor} Domain</span>.
                                      </p>
                                      <div className="text-[9px] text-slate-400">
                                        <span className="font-bold text-slate-300">Missing adjacent nodes:</span>
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-yellow-500">
                                          {missingNeighbors.map(name => (
                                            <li key={name}>{name}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="space-y-2.5 p-3 rounded-lg border border-emerald-900/30 bg-emerald-950/20 font-mono text-[10px]">
                                  <div className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                    ✓ CLUSTER HARDENED
                                  </div>
                                  <p className="text-slate-300 text-[9px] leading-relaxed font-sans">
                                    This capitol and all adjacent frontier nodes are fully unified under the <span className="font-bold" style={{ color: COLOR_SPECS[activeNode.ownerColor!].rgb }}>{activeNode.ownerColor} Domain</span>!
                                  </p>
                                  <div className="bg-emerald-950/40 p-2 border border-emerald-900/30 rounded text-[9px] font-bold text-emerald-400">
                                    Standing Bonus Active: +15 Requisition Credits generated per cycle.
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
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
        ) : activeSubTab === 'exploration' ? (
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
        ) : activeSubTab === 'active' || activeSubTab === 'zones' ? (
          <motion.div
            key="planet_missions"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex flex-col">
              {activeSubTab === 'active' ? (
                <motion.div
                  key="sub_active"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <h2 className="text-base font-bold font-display text-white">Orbit Monitoring</h2>
                    <p className="text-xs text-slate-400">Track and monitor tactical teams dispatched into hazardous planetary sectors.</p>
                  </div>

                  {state.activeDispatch ? (
                    <div className="flex-1 border border-red-950/30 bg-red-950/5 rounded-xl p-6 pb-12 min-h-[420px] flex flex-col justify-between items-center text-center">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-red-950/20 border border-red-500/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                          <Swords className="w-6 h-6 text-red-400 animate-pulse" />
                        </div>

                        <div>
                          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">
                            SECTOR EXTRACTION ACTIVE: [ {activeDispatchZone?.name} ]
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 font-mono uppercase">
                            LOCKED TARGET: DIFFICULTY TIER {activeDispatchZone?.difficulty}
                          </p>
                        </div>

                        {/* Active team layout */}
                        <div className="flex justify-center -space-x-3 pt-2">
                          {state.activeDispatch.slimeIds.map((id) => {
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

                        {/* Timer display */}
                        <div className="pt-2">
                          <div className="text-[10px] text-slate-500 font-mono tracking-wider">REALTIME DROP POD RETRIEVAL TIMER</div>
                          <div className="text-2xl font-bold font-mono tracking-tight text-white mt-1">
                            {state.activeDispatch.status === 'completed' ? 'READY' : formatTime(realtimeRemainingMs)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 mb-4 space-y-3">
                        {state.activeDispatch.status === 'completed' ? (
                          <button
                            onClick={handleRetrieveCompletedPod}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer transition-all"
                          >
                            Retrieve landing Pod & Claim rewards
                          </button>
                        ) : (
                          <div className="space-y-3 text-center">
                            <div className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed font-mono uppercase">
                              Drop pod containment fields require real-time stabilization.
                            </div>
                            <button
                              onClick={handleAdvanceCycle}
                              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-mono text-[10px] uppercase tracking-wider rounded cursor-pointer transition-all"
                            >
                              Sleep / Advance cycle to bypass
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-slate-850 rounded-xl bg-slate-950/10 min-h-[400px]">
                      <Clock className="w-10 h-10 text-slate-800 animate-pulse mb-3" />
                      <h3 className="text-xs font-bold text-slate-400 font-mono uppercase">No active operations</h3>
                      <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                        Draft a spec-pod team on the "Zones Board" sub-tab to launch orbital extraction drops.
                      </p>
                      <button
                        onClick={() => setActiveSubTab('zones')}
                        className="mt-4 px-4 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider border border-slate-800 rounded-lg cursor-pointer transition-all"
                      >
                        Browse Zones Board
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="sub_zones"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-4">
                    <h2 className="text-base font-bold font-display text-white">Orbital Quest Board</h2>
                    <p className="text-xs text-slate-400">Launch tactical deployments to claim high-grade credits and specimen growth data.</p>
                  </div>

                  {state.activeDispatch ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-slate-850 rounded-xl bg-slate-950/10 min-h-[360px]">
                      <ShieldAlert className="w-10 h-10 text-red-500/80 mb-3 animate-bounce" />
                      <h3 className="text-xs font-bold text-slate-400 font-mono uppercase">Landing Pod unavailable</h3>
                      <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                        An extraction team is already deployed on orbital sector [{state.zones.find(z => z.id === state.activeDispatch?.zoneId)?.name}]. Retrieve the active pod first.
                      </p>
                      <button
                        onClick={() => setActiveSubTab('active')}
                        className="mt-4 px-4 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-red-300 font-mono text-[10px] uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                      >
                        Monitor Deployment
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left Side: Zones list */}
                      <div className="lg:col-span-6 space-y-3 overflow-y-auto max-h-[460px] pr-1">
                        {state.zones.map((zone) => {
                          const isSelected = selectedZoneId === zone.id;
                          return (
                            <div
                              key={zone.id}
                              onClick={() => {
                                if (zone.isUnlocked) {
                                  setSelectedZoneId(zone.id);
                                  setDispatchDraftIds([]); // Reset draft on zone change
                                }
                              }}
                              className={`p-3.5 rounded-xl border flex justify-between items-center transition-all ${
                                !zone.isUnlocked 
                                  ? 'border-slate-900 bg-slate-950/10 opacity-30 cursor-not-allowed'
                                  : isSelected
                                    ? 'border-red-500/50 bg-red-950/15 cursor-pointer'
                                    : 'border-slate-800 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-750 cursor-pointer'
                              }`}
                            >
                              <div className="space-y-1 pr-4 min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-mono text-xs font-bold text-white uppercase truncate">{zone.name}</h3>
                                  {!zone.isUnlocked ? (
                                    <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                                  ) : (
                                    <Unlock className="w-3 h-3 text-slate-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed truncate">{zone.flavorText}</p>
                                
                                {zone.isUnlocked && (
                                  <div className="flex items-center space-x-2 pt-1.5 font-mono text-[9px] flex-wrap gap-y-1">
                                    <span 
                                      className="px-1.5 py-0 rounded border font-bold"
                                      style={{ 
                                        color: COLOR_SPECS[zone.requiredColor].rgb,
                                        borderColor: `${COLOR_SPECS[zone.requiredColor].rgb}30`,
                                        backgroundColor: `${COLOR_SPECS[zone.requiredColor].rgb}10`
                                      }}
                                    >
                                      {zone.requiredColor} Leader
                                    </span>
                                    <span className="text-slate-500">Rec Lv. {zone.recommendedLevel}</span>
                                  </div>
                                )}
                              </div>

                              <div className="text-right font-mono text-[10px] shrink-0 ml-2">
                                <div className="text-emerald-400 font-bold">+{zone.creditsReward} Cr</div>
                                <div className="text-cyan-400">+{zone.xpReward} XP</div>
                                <div className="text-slate-500 mt-1 uppercase">Tier {zone.difficulty}</div>
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
                              <Target className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                              Landing Pod Roster
                            </span>
                            <span className="text-[10px] text-slate-500">{dispatchDraftIds.length}/3 units</span>
                          </h3>

                          {selectedZoneId ? (
                            (() => {
                              const zone = state.zones.find(z => z.id === selectedZoneId)!;
                              
                              // Calculate projected success chance
                              let totalPower = 0;
                              let colorMatchCount = 0;
                              dispatchDraftIds.forEach(id => {
                                const s = state.slimes.find(slime => slime.id === id);
                                if (!s) return;
                                const bonus = s.color === zone.requiredColor ? 2.0 : 1.0;
                                totalPower += (s.level * 10 + (s.stats.hp / 15) + s.stats.atk + s.stats.def) * bonus;
                                if (s.color === zone.requiredColor) colorMatchCount++;
                              });

                              const powerTarget = zone.recommendedLevel * 30 + zone.difficulty * 25;
                              let successChance = totalPower / powerTarget;
                              if (successChance > 1) {
                                successChance = 0.85 + (successChance - 1) * 0.1;
                              } else {
                                successChance = 0.2 + successChance * 0.6;
                              }
                              successChance = Math.min(0.98, Math.max(0.1, successChance));

                              return (
                                <div className="mt-4 space-y-4">
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] text-slate-500 uppercase font-mono">Sector Target: {zone.name}</div>
                                    <div className="flex items-center space-x-2 font-mono text-xs">
                                      <span className="text-slate-400 font-medium">Clear Prognosis:</span>
                                      <span className={`font-bold ${successChance >= 0.7 ? 'text-emerald-400' : successChance >= 0.45 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {dispatchDraftIds.length > 0 ? `${(successChance * 100).toFixed(1)}%` : '0%'}
                                      </span>
                                    </div>
                                    {dispatchDraftIds.length > 0 && colorMatchCount === 0 && (
                                      <div className="text-[10px] text-yellow-500/80 font-mono italic leading-normal">
                                        ⚠️ WARNING: No color-matched {zone.requiredColor} slime in party. Power penalty applied.
                                      </div>
                                    )}
                                  </div>

                                  {/* Draft Slots */}
                                  <div className="grid grid-cols-3 gap-2">
                                    {[0, 1, 2].map((index) => {
                                      const slotSlimeId = dispatchDraftIds[index];
                                      const slotSlime = slotSlimeId ? state.slimes.find(s => s.id === slotSlimeId) : null;
                                      return (
                                        <div 
                                          key={index}
                                          onClick={() => {
                                            if (slotSlimeId) {
                                              setDispatchDraftIds(prev => prev.filter(id => id !== slotSlimeId));
                                            } else {
                                              setIsDispatchPickerOpen(true);
                                            }
                                          }}
                                          className="border border-dashed border-slate-800 bg-slate-900/10 rounded-lg p-2.5 flex flex-col items-center justify-center cursor-pointer min-h-[95px] hover:border-slate-700/60"
                                        >
                                          {slotSlime ? (
                                            <>
                                              <SlimeVisual slime={slotSlime} size="xs" />
                                              <span className="text-[9px] text-slate-300 font-mono truncate w-14 text-center mt-1.5">{slotSlime.name}</span>
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

                                  <button
                                    onClick={() => setIsDispatchPickerOpen(true)}
                                    className="w-full py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                  >
                                    Open Specimen Picker
                                  </button>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="mt-8 text-center text-slate-500 py-12">
                              <Sliders className="w-8 h-8 text-slate-850 mx-auto mb-2 animate-pulse" />
                              <p className="text-[11px] font-mono leading-relaxed">
                                Select an unlocked hazard zone from the left board to draft your landing pod party.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-6">
                          <button
                            disabled={!selectedZoneId || dispatchDraftIds.length === 0}
                            onClick={handleLaunchDispatch}
                            className={`w-full py-3 text-xs font-bold font-mono uppercase tracking-wider rounded-lg border transition-all ${
                              selectedZoneId && dispatchDraftIds.length > 0
                                ? 'bg-red-950/40 hover:bg-red-950/60 text-red-300 border-red-500/30 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                            }`}
                          >
                            Initiate Orbital Drop
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : null}

      {/* Specimen Selection Modals */}
      {selectedZoneId && (
        <SpecimenPicker
          isOpen={isDispatchPickerOpen}
          onClose={() => setIsDispatchPickerOpen(false)}
          slimes={state.slimes}
          selectedIds={dispatchDraftIds}
          onToggleSelect={handleToggleDispatchPickerSelect}
          maxSelection={3}
          allowedRole="dispatch"
          title={`Draft [ ${state.zones.find(z => z.id === selectedZoneId)?.name} ] Team`}
          subtitle="Assign up to 3 idle cores. Leader color matches zone spec for extreme bonuses."
        />
      )}

      {/* Specimen Selection Modals */}
      <SpecimenPicker
        isOpen={pickerType === 'mediation'}
        onClose={() => setPickerType(null)}
        slimes={state.slimes}
        selectedIds={mediationDraftIds}
        onToggleSelect={handleTogglePickerSelect}
        maxSelection={3}
        allowedRole="mediation"
        title="DIPLOMAT COGNITION SPECIMENS"
        subtitle="Draft up to 3 idle cores for the consular team. High Charm stats speed up regional alignment."
      />

      <SpecimenPicker
        isOpen={pickerType === 'exploration'}
        onClose={() => setPickerType(null)}
        slimes={state.slimes}
        selectedIds={explorationDraftIds}
        onToggleSelect={handleTogglePickerSelect}
        maxSelection={3}
        allowedRole="exploration"
        title="SCOUT CARTOGRAPHY SPECIMENS"
        subtitle="Draft up to 3 idle cores for the exploration team. High Mind and Agility stats speed up map discovery."
      />

      <SpecimenPicker
        isOpen={pickerType === 'claim'}
        onClose={() => setPickerType(null)}
        slimes={state.slimes.filter(s => !s.lockedRole)}
        selectedIds={claimDraftIds}
        onToggleSelect={handleTogglePickerSelect}
        maxSelection={3}
        title="CLAIM EXPEDITION DELEGATES"
        subtitle="Draft up to 3 idle cores for the claiming division. High stats of the chosen path increase success."
      />

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
