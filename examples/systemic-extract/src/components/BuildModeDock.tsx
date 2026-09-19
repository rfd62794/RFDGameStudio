import React from 'react';
import { Hammer, Shield, Zap, Sparkles, HeartPulse, Lock, CheckCircle2, ChevronUp } from 'lucide-react';
import { STRUCTURE_BLUEPRINTS } from '../game/blueprints';
import { ActiveBuffs } from '../types';

interface BuildModeDockProps {
  isBuildMode: boolean;
  selectedBlueprintId: string;
  unlockedBlueprints: string[];
  bankedScrap: number;
  scrapCollected: number;
  isInsideSanctuary: boolean;
  activeBuffs: ActiveBuffs;
  onToggleBuildMode: (force?: boolean) => void;
  onSelectBlueprint: (blueprintId: string) => void;
}

export const BuildModeDock: React.FC<BuildModeDockProps> = ({
  isBuildMode,
  selectedBlueprintId,
  unlockedBlueprints,
  bankedScrap,
  scrapCollected,
  isInsideSanctuary,
  activeBuffs,
  onToggleBuildMode,
  onSelectBlueprint,
}) => {
  const totalScrap = bankedScrap + scrapCollected;

  const getIcon = (type: string) => {
    switch (type) {
      case 'damage':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'regen':
        return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'armor':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'speed':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Hammer className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div
      id="build-mode-dock-container"
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-auto"
    >
      {/* 1. Operational Buffs Pill */}
      <div
        id="base-operational-buffs"
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/85 border border-cyan-500/30 backdrop-blur-md text-[11px] font-mono shadow-lg text-slate-300"
      >
        <span className="flex items-center gap-1 text-cyan-400 font-semibold tracking-wider uppercase text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Base Buffs:
        </span>
        <span className="flex items-center gap-1 text-amber-300">
          <Zap className="w-3.5 h-3.5" /> +{Math.round(activeBuffs.damageBonus * 100)}% DMG
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1 text-emerald-300">
          <HeartPulse className="w-3.5 h-3.5" /> +{activeBuffs.regenRate} HP/S
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1 text-cyan-300">
          <Shield className="w-3.5 h-3.5" /> +{activeBuffs.armorRating} DEF
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1 text-purple-300">
          <Sparkles className="w-3.5 h-3.5" /> {Math.round(activeBuffs.speedMultiplier * 100)}% SPD
        </span>
      </div>

      {/* 2. Build Mode Hologram Tray */}
      {isBuildMode && (
        <div
          id="build-mode-tray"
          className="bg-slate-950/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-2xl w-full animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Hammer className="w-4 h-4 text-cyan-400" />
              <span>SANCTUARY EXPANSION MATRIX [3x3]</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>
                Banked: <strong className="text-amber-400">{bankedScrap}</strong>
              </span>
              <span>
                Available: <strong className="text-emerald-400">{totalScrap}</strong> Scrap
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.values(STRUCTURE_BLUEPRINTS).map((bp) => {
              const isUnlocked = unlockedBlueprints.includes(bp.id);
              const isSelected = selectedBlueprintId === bp.id;
              const canAfford = totalScrap >= bp.cost;

              return (
                <button
                  key={bp.id}
                  id={`blueprint-btn-${bp.id}`}
                  disabled={!isUnlocked}
                  onClick={() => onSelectBlueprint(bp.id)}
                  className={`relative p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    !isUnlocked
                      ? 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                      : 'bg-slate-900/70 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1 rounded bg-slate-800 border border-slate-700">
                        {getIcon(bp.buffType)}
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          canAfford ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40' : 'bg-red-950/70 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {bp.cost} SCRAP
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-100 font-mono leading-tight mb-1">
                      {bp.name}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono leading-tight mb-2">
                      {bp.description}
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80">
                    {isUnlocked ? (
                      <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                        <span>{isSelected ? 'ACTIVE' : 'SELECT'}</span>
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-mono text-red-400">
                        <Lock className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="truncate">Requires Specialist</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>
              {isInsideSanctuary ? (
                <span className="text-emerald-400">✓ In Sanctuary: Left-click empty area to place 3x3</span>
              ) : (
                <span className="text-amber-400">⚠ Head to Faraday Central Sanctuary to place structures</span>
              )}
            </span>
            <span className="text-slate-500">Toggle: [B] or Mouse Wheel</span>
          </div>
        </div>
      )}

      {/* 3. Build Mode Floating Toggle Button */}
      <button
        id="toggle-build-mode-btn"
        onClick={() => onToggleBuildMode()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold tracking-wider uppercase transition-all shadow-xl backdrop-blur-md ${
          isBuildMode
            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-2 ring-cyan-300'
            : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/40 hover:bg-slate-800 hover:border-cyan-400'
        }`}
      >
        <Hammer className="w-4 h-4" />
        <span>{isBuildMode ? 'EXIT BUILD MODE [B]' : 'BUILD MODE [B / WHEEL]'}</span>
        {isBuildMode && <ChevronUp className="w-3.5 h-3.5 rotate-180 transition-transform" />}
      </button>
    </div>
  );
};
