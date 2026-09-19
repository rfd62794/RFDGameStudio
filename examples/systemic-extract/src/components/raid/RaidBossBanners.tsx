import React from 'react';
import { ShieldAlert, Skull } from 'lucide-react';

interface RaidBossBannersProps {
  realityCollapseActive: boolean;
  collapseRingDepth: number;
  apexBossActive: boolean;
  apexHp: { current: number; max: number } | null;
}

export const RaidBossBanners: React.FC<RaidBossBannersProps> = ({
  realityCollapseActive,
  collapseRingDepth,
  apexBossActive,
  apexHp,
}) => {
  return (
    <>
      {/* ADR 004: REALITY COLLAPSE EMERGENCY CASCADE BANNER */}
      {realityCollapseActive && (
        <div className="absolute top-20 sm:top-16 left-1/2 -translate-x-1/2 bg-[#ef4444]/95 border-2 border-white text-white px-4 py-1.5 rounded-full shadow-2xl z-20 flex items-center gap-2 pointer-events-none animate-pulse">
          <ShieldAlert className="w-4 h-4 text-white animate-bounce" />
          <span className="text-xs font-mono font-black tracking-wider uppercase">
            REALITY COLLAPSE CASCADE (DEPTH {collapseRingDepth}/22) — VOLATILE GAS ENCROACHING INWARD!
          </span>
        </div>
      )}

      {/* ADR 005: APEX ECHO TITAN BOSS ENCOUNTER BANNER */}
      {apexBossActive && apexHp && (
        <div className="absolute top-28 sm:top-24 left-1/2 -translate-x-1/2 bg-[#2e1065]/95 border-2 border-[#c084fc] text-white px-5 py-2.5 rounded-2xl shadow-2xl z-20 flex items-center gap-3 pointer-events-none animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-[#581c87]/80 border border-[#a855f7] flex items-center justify-center">
            <Skull className="w-5 h-5 text-[#f0abfc] animate-bounce" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-4 text-[10px] font-mono text-[#e9d5ff]">
              <span className="font-black text-[#f0abfc] tracking-widest uppercase">
                APEX ECHO // REALITY ANCHOR
              </span>
              <span className="font-bold text-white">{apexHp.current} / {apexHp.max} HP</span>
            </div>
            <div className="w-52 sm:w-72 h-2.5 bg-[#0f0d24] rounded-full overflow-hidden border border-[#a855f7]/60 mt-1">
              <div
                className="h-full bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#f43f5e] transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (apexHp.current / apexHp.max) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
