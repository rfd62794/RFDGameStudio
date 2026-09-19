import React from 'react';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Crosshair,
  Database,
  Volume2,
  VolumeX,
  HelpCircle,
} from 'lucide-react';
import { SectorId, WeaponId } from '../../types';

interface RaidHUDProps {
  playerHp: number;
  playerMaxHp: number;
  overclockStacks: number;
  overclockTimer: number;
  scrapCollected: number;
  bankedScrap?: number;
  isInsideSanctuary?: boolean;
  currentZoneName?: string;
  currentMapType?: string;
  onExtractNow?: () => void;
  realityCollapseActive: boolean;
  dimensionalStability: number;
  collapseRingDepth: number;
  raidDuration: number;
  sectorId: SectorId;
  hasHazmatSuit: boolean;
  activeWeapon: WeaponId;
  extractionTimer: number;
  isMuted: boolean;
  onToggleWeapon: () => void;
  onOpenInspector: () => void;
  onToggleMute: () => void;
  onOpenHelp: () => void;
}

export const RaidHUD: React.FC<RaidHUDProps> = ({
  playerHp,
  playerMaxHp,
  overclockStacks,
  overclockTimer,
  scrapCollected,
  bankedScrap = 0,
  isInsideSanctuary = true,
  currentZoneName = 'Faraday Central Sanctuary',
  currentMapType = 'overworld',
  onExtractNow,
  realityCollapseActive,
  dimensionalStability,
  collapseRingDepth,
  raidDuration,
  sectorId,
  hasHazmatSuit,
  activeWeapon,
  extractionTimer,
  isMuted,
  onToggleWeapon,
  onOpenInspector,
  onToggleMute,
  onOpenHelp,
}) => {
  const hpPercentage = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));

  return (
    <div id="raid-hud-top" className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
      {/* Operative HP & Loadout */}
      <div className="bg-[#0f172a]/90 backdrop-blur border border-[#334155] p-3 rounded-lg pointer-events-auto flex items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8] mb-1">
            <span className="font-bold text-[#34d399] tracking-wider">OPERATIVE // STATUS</span>
            <span>{playerHp} / {playerMaxHp} HP</span>
          </div>
          <div className="w-44 h-3 bg-[#1e293b] rounded overflow-hidden border border-[#334155]">
            <div
              className={`h-full transition-all duration-200 ${
                hpPercentage > 50 ? 'bg-[#10b981]' : hpPercentage > 25 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
              }`}
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>

        <div className="h-8 w-px bg-[#334155]" />

        {/* ADR 005: Overclock Kinetic Gauge */}
        {overclockStacks > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#083344]/90 border border-[#06b6d4]/70 shadow-lg animate-pulse">
            <Zap className="w-4 h-4 text-[#22d3ee] animate-bounce" />
            <div>
              <div className="flex items-center justify-between gap-1.5 text-[10px] text-[#22d3ee] font-mono font-bold leading-none">
                <span>OVERCLOCK x{overclockStacks}</span>
                <span className="text-[#a5f3fc] font-mono">{overclockTimer.toFixed(1)}s</span>
              </div>
              <div className="text-xs font-mono font-black text-[#cffafe] mt-0.5">
                +{overclockStacks * 10} KINETIC DMG
              </div>
            </div>
          </div>
        )}

        {/* Carried & Banked Loot */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center">
              <span className="text-[#fbbf24] font-bold text-xs">SCR</span>
            </div>
            <div>
              <div className="text-[10px] text-[#94a3b8] font-mono leading-none">RAID LOOT</div>
              <div className="text-base font-mono font-bold text-[#fbbf24]">+{scrapCollected}</div>
            </div>
          </div>

          <div className="h-7 w-px bg-[#334155]" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center">
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-[10px] text-[#94a3b8] font-mono leading-none">BASE VAULT</div>
              <div className="text-base font-mono font-bold text-cyan-300">{bankedScrap}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ADR 004: OVERWORLD SAFE HAVEN MONITOR (UNTIMED / NO DISSOLVE) OR DUNGEON ESCALATION MONITOR */}
      {currentMapType === 'overworld' ? (
        <div className="bg-[#0f172a]/90 backdrop-blur border border-cyan-500/40 p-2.5 sm:p-3 rounded-lg pointer-events-auto flex items-center gap-2.5 shadow-xl">
          <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <span>OVERWORLD SANCTUARY</span>
              <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[9px] font-normal">
                SAFE ZONE
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-300">SECURE BUFFER</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 text-[11px]">UNTIMED / NO DISSOLVE</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f172a]/90 backdrop-blur border border-[#334155] p-2.5 sm:p-3 rounded-lg pointer-events-auto flex items-center gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded flex items-center justify-center border ${
                realityCollapseActive
                  ? 'bg-[#ef4444]/20 border-[#ef4444] animate-pulse text-[#ef4444]'
                  : dimensionalStability <= 25
                  ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]'
                  : 'bg-[#0284c7]/20 border-[#38bdf8]/40 text-[#38bdf8]'
              }`}
            >
              {realityCollapseActive ? (
                <ShieldAlert className="w-4 h-4 text-[#ef4444] animate-bounce" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#94a3b8]">
                <span>{realityCollapseActive ? 'REALITY COLLAPSE' : 'SECTOR STABILITY'}</span>
                <span
                  className={`font-bold ${
                    realityCollapseActive
                      ? 'text-[#ef4444] animate-pulse'
                      : dimensionalStability <= 25
                      ? 'text-[#f59e0b]'
                      : 'text-[#38bdf8]'
                  }`}
                >
                  {realityCollapseActive ? `DEPTH ${collapseRingDepth}/22` : `${dimensionalStability}%`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-24 sm:w-32 h-2 bg-[#1e293b] rounded overflow-hidden border border-[#334155]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      realityCollapseActive
                        ? 'bg-[#ef4444] animate-pulse'
                        : dimensionalStability <= 25
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#38bdf8]'
                    }`}
                    style={{ width: `${realityCollapseActive ? 100 : dimensionalStability}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-white whitespace-nowrap">
                  {realityCollapseActive
                    ? 'COLLAPSED'
                    : `${Math.max(0, Math.floor((180 - raidDuration) / 60))}:${String(
                        Math.max(0, (180 - raidDuration) % 60)
                      ).padStart(2, '0')}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADR 011: CONTIGUOUS MATRIX ZONE INTEL BADGE */}
      <div className="bg-[#0f172a]/90 backdrop-blur border border-[#334155] px-3 py-2 rounded-lg pointer-events-auto flex items-center gap-2.5 shadow-xl hidden lg:flex">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            currentMapType === 'overworld'
              ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse'
              : 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
          }`}
        />
        <div className="text-left">
          <div className="text-[9px] font-mono text-[#94a3b8] leading-none">
            {currentMapType === 'overworld' ? 'SANCTUARY OVERWORLD' : 'DUNGEON EXPEDITION'}
          </div>
          <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            {currentZoneName.split('[')[0].trim()}
          </div>
        </div>
        <span
          className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
            currentMapType === 'overworld'
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
              : 'bg-rose-950/80 text-rose-300 border-rose-500/50'
          }`}
        >
          {currentMapType === 'overworld'
            ? 'NO ENEMIES • SANCTUARY'
            : 'HOSTILE • ENEMIES & TREASURE'}
        </span>

        {currentMapType === 'dungeon' && onExtractNow && (
          <button
            onClick={onExtractNow}
            className="ml-1 text-[10px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded border border-emerald-400 transition cursor-pointer shadow-lg animate-pulse"
          >
            EXTRACT [RETURN]
          </button>
        )}
      </div>

      {/* ADR 007: AUTONOMOUS HARDPOINT MATRIX HUD */}
      <div className="bg-[#0f172a]/90 backdrop-blur border border-[#334155] p-2 sm:p-2.5 rounded-lg pointer-events-auto flex items-center gap-2.5 shadow-xl hidden md:flex">
        <button
          id="btn-hud-toggle-weapon"
          onClick={onToggleWeapon}
          className={`w-8 h-8 rounded flex items-center justify-center border transition cursor-pointer ${
            activeWeapon === 'plasma_pulse_array'
              ? 'bg-[#083344] border-[#22d3ee] text-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.4)]'
              : 'bg-[#854d0e]/30 border-[#fbbf24] text-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.3)]'
          }`}
          title="Switch weapon hardpoint [X]"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-[#94a3b8] leading-none">
            <span>HARDPOINT [X]</span>
            <span className="text-[#34d399] font-bold">AUTO-360°</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-mono font-bold whitespace-nowrap ${
              activeWeapon === 'plasma_pulse_array' ? 'text-[#22d3ee]' : 'text-[#fbbf24]'
            }`}>
              {activeWeapon === 'plasma_pulse_array' ? 'PLASMA PULSE' : 'KINETIC SCATTER'}
            </span>
            <span className={`text-[8px] font-mono px-1 rounded border ${
              activeWeapon === 'plasma_pulse_array'
                ? 'bg-[#06b6d4]/20 text-[#67e8f9] border-[#06b6d4]/40'
                : 'bg-[#f59e0b]/20 text-[#fde047] border-[#f59e0b]/40'
            }`}>
              {activeWeapon === 'plasma_pulse_array' ? 'ANTI-ARMOR' : 'ANTI-ORGANIC'}
            </span>
          </div>
        </div>
      </div>

      {/* EXTRACTION STATUS INDICATOR (CENTER) */}
      {extractionTimer > 0 && (
        <div className="bg-[#064e3b]/95 border-2 border-[#10b981] px-5 py-2 rounded-xl pointer-events-auto shadow-2xl animate-pulse">
          <div className="text-xs font-mono font-bold text-[#34d399] tracking-wider text-center">
            EXTRACTING FROM SECTOR
          </div>
          <div className="text-lg font-mono font-black text-white text-center">
            HOLD POSITION: {(5.0 - extractionTimer).toFixed(1)}s
          </div>
        </div>
      )}

      {/* TOP RIGHT CONTROLS */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          id="btn-ecs-inspector"
          onClick={onOpenInspector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e293b]/90 hover:bg-[#334155] text-xs font-mono text-[#38bdf8] border border-[#38bdf8]/40 transition shadow-lg cursor-pointer"
          title="Inspect Bevy ECS Components & Architecture"
        >
          <Database className="w-3.5 h-3.5" />
          <span>ECS INSPECT</span>
        </button>

        <button
          id="btn-toggle-audio"
          onClick={onToggleMute}
          className="p-2 rounded-lg bg-[#1e293b]/90 hover:bg-[#334155] text-[#94a3b8] hover:text-white border border-[#334155] transition shadow-lg cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          id="btn-help-guide"
          onClick={onOpenHelp}
          className="p-2 rounded-lg bg-[#1e293b]/90 hover:bg-[#334155] text-[#94a3b8] hover:text-white border border-[#334155] transition shadow-lg cursor-pointer"
          title="Controls & GDD Rules"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
