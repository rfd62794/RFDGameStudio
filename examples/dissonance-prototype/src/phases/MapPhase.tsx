import React, { useState, useEffect } from 'react';
import { Compass, Swords, Hammer, ArrowRight, Heart, Shield, Gem, Award, ShoppingBag, Sparkles, Eye } from 'lucide-react';
import { RunState, RunNode } from '../types';
import { RELIC_POOL } from '../utils';
import MapGraphView from '../components/MapGraphView';

interface MapPhaseProps {
  runState: RunState;
  onEnterNode: () => void;
  onTravelToNode: (targetNodeId: string) => void;
}

export default function MapPhase({
  runState,
  onEnterNode,
  onTravelToNode
}: MapPhaseProps) {
  const mapNodesList = runState.nodes || [];
  const currentNodeDef = mapNodesList.find(n => n.id === runState.currentNodeId) || mapNodesList[0];
  const visitedNodeIds = runState.visitedNodeIds || [];
  const isCurrentCompleted = visitedNodeIds.includes(runState.currentNodeId);
  
  const nextConnections = currentNodeDef?.connectsTo || [];
  const [selectedNextId, setSelectedNextId] = useState<string | null>(null);

  const getCurrentLayerIndex = () => {
    if (!currentNodeDef) return 0;
    if (currentNodeDef.id === 'boss') return 7;
    const parts = currentNodeDef.id.split('_');
    if (parts.length >= 2) {
      return parseInt(parts[1], 10);
    }
    return 0;
  };

  useEffect(() => {
    if (isCurrentCompleted && nextConnections.length > 0) {
      if (!selectedNextId || !nextConnections.includes(selectedNextId)) {
        setSelectedNextId(nextConnections[0]);
      }
    } else {
      setSelectedNextId(null);
    }
  }, [runState.currentNodeId, isCurrentCompleted, nextConnections, selectedNextId]);

  const getNextBranchNodes = (): RunNode[] => {
    const parts = currentNodeDef.id.split('_');
    if (parts.length >= 2 && parts[0] === 'node') {
      const currentLayer = parseInt(parts[1], 10);
      const nextLayer = currentLayer + 1;
      const nextNodes = mapNodesList.filter(n => n.id.startsWith(`node_${nextLayer}_`));
      if (nextNodes.length > 0) return nextNodes;
    }
    return nextConnections.map(id => mapNodesList.find(n => n.id === id)).filter((n): n is RunNode => n !== undefined);
  };

  const getECHOFlavorText = (count: number) => {
    if (count % 3 === 0) {
      return `"I... can still hear you. The frequency is decaying, but my voice remains. Do not let the frequencies scatter. Stabilize them... before they fade into the quiet."`;
    }
    if (count % 3 === 1) {
      return `"The echo is fracturing further. My words are turning to static. But you are close. Build the core... find the resonance... I will wait on the other side."`;
    }
    return `"Seek the perfect combination. Maintain synchronization."`;
  };

  const handleConfirmTravel = () => {
    if (selectedNextId) {
      onTravelToNode(selectedNextId);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col gap-6 shadow-2xl relative" id="viewport-map-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Resonant Timeline Map</span>
        <h2 className="text-xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-1">
          <Compass className="text-amber-400 w-5 h-5 animate-pulse" />
          Branching Sequence Navigation Hub
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review your current coordinate calibrations. Stand on completed nodes, inspect upcoming forks, and confirm your route toward the resonance core.
        </p>
      </div>

      {/* Banked Essence Bonus Banner */}
      {runState.startingBankedBonus && runState.startingBankedBonus > 0 && runState.currentNodeId === mapNodesList[0]?.id && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl p-3 text-amber-200 font-mono text-xs flex flex-wrap items-center justify-between shadow-lg gap-2 animate-fade-in" id="banked-essence-fresh-start-banner">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>+{runState.startingBankedBonus} Essence</strong> from your last attempt applied to starting Run Essence!</span>
          </div>
          <span className="text-[10px] text-amber-300 font-bold bg-amber-900/60 px-2.5 py-0.5 rounded border border-amber-700 uppercase tracking-wider">
            Banked Bonus Applied
          </span>
        </div>
      )}

      {/* Player Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 border border-slate-800/60 rounded-xl font-mono text-xs shadow-inner">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Player Integrity</span>
            <span className="text-slate-200 font-bold">{runState.playerHp} / {runState.playerMaxHp} HP</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Active Shield</span>
            <span className="text-slate-200 font-bold">{runState.playerShield} Def</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-500" />
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Unspent Run Essence</span>
            <span className="text-amber-400 font-bold">{runState.essence} ESSENCE</span>
          </div>
        </div>
      </div>

      {/* FRACTURED LENS ORACLE BAR */}
      {runState.relics?.includes('fractured_lens') && (
        <div className="p-4 bg-teal-950/20 border border-teal-800/40 rounded-xl flex flex-col gap-2 shadow-inner text-left animate-fade-in" id="map-timeline-oracle">
          <div className="flex items-center gap-1.5 text-teal-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-teal-400 animate-pulse" />
            Fractured Lens: Node Timeline Oracle
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Your optics slice through chronological static. Below is the precise telemetry of the next 3 layer depths along the active sequence timeline:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1.5">
            {[1, 2, 3].map((depth) => {
              const currentLayer = getCurrentLayerIndex();
              const targetLayer = currentLayer + depth;
              if (targetLayer >= 7) {
                return (
                  <div key={depth} className="p-2.5 bg-slate-950/85 border border-purple-900/40 rounded-lg">
                    <span className="text-[8px] font-mono text-purple-400 uppercase font-bold block">Depth +{depth} (Layer 7)</span>
                    <span className="text-xs font-bold text-slate-200 mt-1 block uppercase">Resonance Core</span>
                    <span className="text-[10px] text-slate-400 leading-normal block mt-1">Boss confrontation segment. Zero timeline deviation remains.</span>
                  </div>
                );
              }

              const layerNodes = mapNodesList.filter(n => {
                const parts = n.id.split('_');
                return parts.length >= 2 && parseInt(parts[1], 10) === targetLayer;
              });

              return (
                <div key={depth} className="p-2.5 bg-slate-950/85 border border-slate-800/80 rounded-lg flex flex-col gap-1.5">
                  <span className="text-[8px] font-mono text-slate-500 uppercase font-bold block">Depth +{depth} (Layer {targetLayer})</span>
                  {layerNodes.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {layerNodes.map(node => (
                        <div key={node.id} className="text-[10px] flex items-center justify-between border-b border-slate-900/40 pb-1 last:border-0 last:pb-0">
                          <span className="text-slate-300 capitalize font-medium flex items-center gap-1">
                            {node.type === 'fight' ? '⚔️' : node.type === 'restCraft' ? '🛠️' : node.type === 'treasure' ? '🎁' : node.type === 'store' ? '🛒' : node.type === 'boss' ? '💀' : '❓'} {node.type === 'restCraft' ? 'Haven' : node.type === 'treasure' ? 'Cache' : node.type === 'store' ? 'Market' : node.type === 'boss' ? 'Boss' : 'Encounter'}
                          </span>
                          <span className="text-[9px] font-mono text-teal-400 font-bold truncate max-w-[120px]" title={node.enemyName || ''}>
                            {node.type === 'fight' ? node.enemyName : node.type === 'treasure' ? 'Essence/Relic' : node.type === 'store' ? 'Relics & Cards' : node.type === 'boss' ? node.enemyName : 'Calibrations'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-650 italic">No nodes detected</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ORACLE'S EYE RELIC AUTOMATIC NEXT-BRANCH DETAIL */}
      {runState.relics?.includes('oracles_eye') && (
        <div className="p-4 bg-indigo-950/30 border border-indigo-500/50 rounded-xl flex flex-col gap-2 shadow-inner text-left animate-fade-in" id="map-oracles-eye-panel">
          <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            <Eye className="w-4 h-4 text-indigo-400 animate-pulse" />
            Oracle's Eye: Automatic Next-Branch Detail Vision
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Your relic automatically projects the full telemetry of all lanes in the upcoming layer without requiring a Haven visit:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
            {getNextBranchNodes().map((pn, i) => (
              <div key={pn.id} className="p-2.5 bg-slate-950 border border-indigo-900/60 rounded-lg flex flex-col gap-0.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-indigo-300 font-bold uppercase">Lane {i + 1} • Node {pn.id.replace('node_', '')}</span>
                  <span className="text-[8px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800 uppercase font-bold">
                    Revealed
                  </span>
                </div>
                <span className="font-bold text-slate-200 capitalize mt-0.5 flex items-center gap-1">
                  {pn.type === 'fight' ? '⚔️' : pn.type === 'restCraft' ? '🛠️' : pn.type === 'treasure' ? '🎁' : pn.type === 'store' ? '🛒' : pn.type === 'anomaly' ? '🔮' : '💀'}
                  {pn.type === 'fight' ? 'Fight' : pn.type === 'restCraft' ? 'Haven' : pn.type === 'treasure' ? 'Cache' : pn.type === 'store' ? 'Market' : pn.type === 'anomaly' ? 'Anomaly' : 'Boss'}
                </span>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">
                  {pn.type === 'fight' ? `Target: ${pn.enemyName} (${pn.enemyTier} tier)` :
                   pn.type === 'restCraft' ? 'Haven Calibration' :
                   pn.type === 'treasure' ? 'Essence/Relic Cache' :
                   pn.type === 'store' ? 'Resonance Market' :
                   pn.type === 'anomaly' ? 'Void Anomaly Phenomenon' : 'Boss Core'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Map Nodes Graph (SVG) */}
      <MapGraphView
        mapNodesList={mapNodesList}
        currentNodeId={runState.currentNodeId}
        visitedNodeIds={visitedNodeIds}
        isCurrentCompleted={isCurrentCompleted}
        nextConnections={nextConnections}
        selectedNextId={selectedNextId}
        onSelectNextId={setSelectedNextId}
      />

      {/* ECHO flavor text */}
      {visitedNodeIds.length > 0 && visitedNodeIds.length % 2 === 0 && (
        <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl italic text-xs text-slate-400 leading-relaxed font-mono">
          <div className="text-amber-500/80 font-bold text-[9px] uppercase tracking-wider mb-1">
            ⚠️ Incoming Echo Wave:
          </div>
          {getECHOFlavorText(visitedNodeIds.length)}
        </div>
      )}

      {/* Navigation Controls Panel */}
      <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col gap-4">
        
        {/* Branch Choice Cards */}
        {isCurrentCompleted && nextConnections.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              👉 CHOOSE YOUR CONNECTING ROUTE:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nextConnections.map((targetId) => {
                const node = mapNodesList.find(n => n.id === targetId);
                if (!node) return null;
                const isSelected = selectedNextId === targetId;

                return (
                  <button
                    key={targetId}
                    onClick={() => setSelectedNextId(targetId)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/20 text-amber-200 ring-1 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                        : 'border-slate-850 bg-slate-900/30 hover:bg-slate-900/70 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-mono text-slate-500">Node {node.id.replace("node_", "")}</span>
                      {isSelected && (
                        <span className="text-[8px] bg-amber-950/80 text-amber-400 px-1.5 py-0.5 border border-amber-900/50 rounded uppercase font-bold tracking-wider">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    <span className="font-display font-bold text-xs uppercase text-slate-200 flex items-center gap-1.5 mt-0.5">
                      {node.type === 'fight' && <Swords className="w-3.5 h-3.5 text-rose-500" />}
                      {node.type === 'boss' && <Award className="w-3.5 h-3.5 text-purple-500" />}
                      {node.type === 'restCraft' && <Hammer className="w-3.5 h-3.5 text-sky-400" />}
                      {node.type === 'treasure' && <Gem className="w-3.5 h-3.5 text-amber-400" />}
                      {node.type === 'store' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />}
                      {node.type === 'anomaly' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}

                      {node.type === 'fight' ? '⚡ FIGHT ENCOUNTER' :
                       node.type === 'restCraft' ? '🛠️ SAFE HAVEN' :
                       node.type === 'treasure' ? '🎁 ANOMALOUS CACHE' :
                       node.type === 'store' ? '🛒 RESONANCE MARKET' :
                       node.type === 'anomaly' ? '🔮 VOID ANOMALY' :
                       node.type === 'boss' ? '💀 BOSS CORE' : '❓ UNKNOWN NODE'}
                    </span>

                    <span className="text-[11px] text-slate-400 mt-1 leading-normal">
                      {node.type === 'fight' && `Fight against ${node.enemyName} (${node.enemyTier} tier)`}
                      {node.type === 'boss' && `The ultimate confrontation: ${node.enemyName}`}
                      {node.type === 'restCraft' && 'Calibrate multipliers and restore physical integrity.'}
                      {node.type === 'treasure' && 'Safe cache loaded with raw anomalous unspent Essence.'}
                      {node.type === 'store' && 'Acquire rare cards and relics with Essence.'}
                      {node.type === 'anomaly' && 'Encounter anomalous void phenomena and risk/reward choices.'}
                    </span>

                    {node.type === 'fight' && (node.enemyTier === 'elite' || node.enemyTier === 'advanced') && (
                      <span className="text-[9px] font-mono text-amber-500 mt-1 uppercase font-semibold">
                        ⚠️ High Dissonance: Risky Path Shortcut
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE RUN BOONS & RELICS TRACKING PANEL */}
        {((runState.boons && runState.boons.length > 0) || (runState.relics && runState.relics.length > 0)) && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-inner" id="map-active-enhancements-panel">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Active Run Enhancements (Boons & Relics)
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {(runState.boons || []).length} Boons • {(runState.relics || []).length} Relics
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* BOONS */}
              {runState.boons && runState.boons.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono text-amber-500/80 uppercase font-bold tracking-wider">Acquired Boons ({runState.boons.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {runState.boons.map((boon) => (
                      <div 
                        key={`map-boon-${boon.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 font-mono text-[10px] flex items-center gap-2"
                        title={`Target: ${boon.targetType} (${boon.targetId})`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold block leading-tight">{boon.targetId.toUpperCase()}</span>
                          <span className="text-[9px] text-amber-400/80 block">
                            {boon.modifier ? `+${boon.modifier} to ${boon.targetType} ${boon.targetId.toUpperCase()}` : (boon.qualitativeEffect || boon.id)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RELICS */}
              {runState.relics && runState.relics.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-mono text-cyan-500/80 uppercase font-bold tracking-wider">Acquired Relics ({runState.relics.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {runState.relics.map((relicId) => {
                      const relic = RELIC_POOL.find(r => r.id === relicId);
                      if (!relic) return null;
                      return (
                        <div 
                          key={`map-relic-${relic.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 font-mono text-[10px] flex items-center gap-2"
                          title={relic.description}
                        >
                          <Award className="w-3 h-3 text-cyan-400 shrink-0" />
                          <div>
                            <span className="font-bold block leading-tight">{relic.name}</span>
                            <span className="text-[9px] text-cyan-400/80 block line-clamp-1">{relic.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Confirmation Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-slate-900">
          <div>
            {isCurrentCompleted ? (
              <>
                <span className="text-[9px] font-mono text-slate-500 uppercase">Awaiting Departure</span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Confirm the highlighted route. Remaining parallel branches will collapse.
                </p>
              </>
            ) : (
              <>
                <span className="text-[9px] font-mono text-slate-500 uppercase">Coordinates Locked</span>
                <p className="text-xs text-slate-300 mt-0.5 capitalize flex items-center gap-1.5 font-semibold text-amber-400/90">
                  {currentNodeDef.type === 'fight' && <Swords className="w-4 h-4 text-rose-500" />}
                  {currentNodeDef.type === 'boss' && <Award className="w-4 h-4 text-purple-500" />}
                  {currentNodeDef.type === 'restCraft' && <Hammer className="w-4 h-4 text-sky-400" />}
                  {currentNodeDef.type === 'treasure' && <Gem className="w-4 h-4 text-amber-400" />}
                  {currentNodeDef.type === 'store' && <ShoppingBag className="w-4 h-4 text-emerald-400" />}
                  {currentNodeDef.type === 'anomaly' && <Sparkles className="w-4 h-4 text-purple-400" />}
                  
                  {currentNodeDef.type === 'fight' ? `Engage: ${currentNodeDef.enemyName} (${currentNodeDef.enemyTier} tier)` :
                   currentNodeDef.type === 'restCraft' ? 'Safe Haven Calibration Stop' :
                   currentNodeDef.type === 'treasure' ? 'Unstable Essence Crystals' :
                   currentNodeDef.type === 'store' ? 'Resonance Market Merchant' :
                   currentNodeDef.type === 'anomaly' ? 'Void Anomaly Encounter' :
                   currentNodeDef.type === 'boss' ? `Resonance Center: ${currentNodeDef.enemyName}` : 'Unknown Location'}
                </p>
              </>
            )}
          </div>

          {isCurrentCompleted ? (
            <button
              onClick={handleConfirmTravel}
              disabled={!selectedNextId}
              className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all font-display uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
              id="confirm-route-advance-btn"
            >
              Confirm Route & Travel
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onEnterNode}
              className={`w-full sm:w-auto px-6 py-3.5 font-bold rounded-xl transition-all font-display uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg ${
                currentNodeDef.type === 'fight' || currentNodeDef.type === 'boss'
                  ? 'bg-rose-600 hover:bg-rose-500 text-slate-100 shadow-rose-950/10'
                  : currentNodeDef.type === 'treasure'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/10'
                  : currentNodeDef.type === 'store'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/10'
                  : currentNodeDef.type === 'anomaly'
                  ? 'bg-purple-600 hover:bg-purple-500 text-slate-100 shadow-purple-950/10'
                  : 'bg-sky-600 hover:bg-sky-500 text-slate-950 shadow-sky-950/10'
              }`}
              id="enter-active-node-btn"
            >
              {currentNodeDef.type === 'fight' && 'Engage Anomaly'}
              {currentNodeDef.type === 'boss' && 'Confront Resonance'}
              {currentNodeDef.type === 'restCraft' && 'Enter Safe Haven'}
              {currentNodeDef.type === 'treasure' && 'Collect Cache'}
              {currentNodeDef.type === 'store' && 'Enter Market'}
              {currentNodeDef.type === 'anomaly' && 'Explore Anomaly'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
