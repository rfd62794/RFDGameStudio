import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Swords, Lock, Unlock, Clock, Target, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2, Moon, Sliders, Play 
} from 'lucide-react';
import { Slime, LabState, CombatZone, ActiveDispatch } from '../types';
import { COLOR_SPECS } from '../gameLogic';
import { SlimeVisual } from './SlimeVisual';
import { SpecimenPicker } from './SpecimenPicker';

interface MissionsTabProps {
  key?: any;
  state: LabState;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  dispatchDraftIds: string[];
  setDispatchDraftIds: React.Dispatch<React.SetStateAction<string[]>>;
  realtimeRemainingMs: number;
  activeDispatchReport: { logs: string[]; success: boolean; xp: number; credits: number } | null;
  setActiveDispatchReport: (report: any) => void;
  handleLaunchDispatch: () => void;
  handleRetrieveCompletedPod: () => void;
  handleAdvanceCycle: () => void;
  activeSubTab: 'active' | 'zones';
  setActiveSubTab: (subTab: 'active' | 'zones') => void;
}

export function MissionsTab({
  state,
  selectedZoneId,
  setSelectedZoneId,
  dispatchDraftIds,
  setDispatchDraftIds,
  realtimeRemainingMs,
  activeDispatchReport,
  setActiveDispatchReport,
  handleLaunchDispatch,
  handleRetrieveCompletedPod,
  handleAdvanceCycle,
  activeSubTab,
  setActiveSubTab
}: MissionsTabProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const activeDispatchZone = state.zones.find(z => z.id === state.activeDispatch?.zoneId);

  // Calculate remaining time nicely
  const formatTime = (ms: number) => {
    const totalSecs = Math.ceil(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePickerSelect = (id: string) => {
    setDispatchDraftIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, id];
      }
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch flex-1">
      {/* Sub-tab Sidebar */}
      <div className="md:w-44 shrink-0 flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/50 pb-4 md:pb-0 md:pr-4">
        <button
          onClick={() => setActiveSubTab('active')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer relative ${
            activeSubTab === 'active'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Active Deployment</span>
          {state.activeDispatch && (
            <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('zones')}
          className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider text-left transition-all cursor-pointer ${
            activeSubTab === 'zones'
              ? 'bg-slate-800/80 text-white border border-slate-700/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>Zones Board</span>
        </button>
      </div>

      {/* Main Content Pane */}
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
                                        setIsPickerOpen(true);
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
                              onClick={() => setIsPickerOpen(true)}
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

      {/* Specimen Selection Modal */}
      {selectedZoneId && (
        <SpecimenPicker
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          slimes={state.slimes}
          selectedIds={dispatchDraftIds}
          onToggleSelect={handleTogglePickerSelect}
          maxSelection={3}
          allowedRole="dispatch"
          title={`Draft [ ${state.zones.find(z => z.id === selectedZoneId)?.name} ] Team`}
          subtitle={`Assign up to 3 idle cores. Leader color matches zone spec for extreme bonuses.`}
        />
      )}
    </div>
  );
}
