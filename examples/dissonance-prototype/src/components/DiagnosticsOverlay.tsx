import React from 'react';
import { RefreshCw } from 'lucide-react';
import { RunState } from '../types';
import { computeLiveDifficultyMultiplier, computeDeckPowerLevel, MAX_MAP_ATTEMPTS } from '../utils';

interface DiagnosticsOverlayProps {
  runState: RunState | null;
  highestFloorUnlocked: number;
  onClose: () => void;
  onUnlockFloor: (floor: number) => void;
  onBypassCheat: () => void;
  onWipeBypass: () => void;
}

export default function DiagnosticsOverlay({
  runState,
  highestFloorUnlocked,
  onClose,
  onUnlockFloor,
  onBypassCheat,
  onWipeBypass
}: DiagnosticsOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto" id="diagnostics-modal-overlay">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-3xl w-full flex flex-col gap-5 shadow-2xl relative my-auto animate-fade-in" id="debug-popout-panel">
        {/* HEADER */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1">
              🧪 Dedicated Diagnostics & Telemetry Overlay
            </span>
            <h3 className="text-xl font-display font-bold text-slate-100 mt-1">
              System Diagnostics Console
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Dev-facing controls, live difficulty parameters, map graph metrics, and telemetry audit logs.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer font-mono text-xs font-bold border border-slate-700"
            id="close-diagnostics-modal-btn"
          >
            ✕ Close
          </button>
        </div>

        {/* DEV QUICK ACTIONS */}
        <div className="flex flex-wrap gap-2.5 items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">Dev Actions:</span>
          <button 
            onClick={() => onUnlockFloor(highestFloorUnlocked + 1)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 rounded-lg text-xs font-mono transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            id="unlock-floor-cheat-btn"
          >
            Unlock Next Floor (Current: Floor {highestFloorUnlocked})
          </button>
          <button 
            onClick={onBypassCheat}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 rounded-lg text-xs font-mono transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            id="bypass-cheat-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-amber-400" /> Dev Cheat (+100 ESS)
          </button>
          <button 
            onClick={onWipeBypass}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-lg text-xs font-mono transition-all border border-rose-800/60 flex items-center gap-1 cursor-pointer sm:ml-auto"
            id="wipe-bypass-btn"
          >
            Wipe Local Storage
          </button>
        </div>

        {/* THREE CLEAR LABELED SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SECTION 1: LIVE DIFFICULTY */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-amber-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1 border-b border-slate-850 pb-2">
              ⚡ Live Difficulty (DDA)
            </span>
            {runState ? (
              <div className="font-mono text-xs space-y-2 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">DDA Multiplier:</span>
                  <strong className="text-indigo-400">
                    {(computeLiveDifficultyMultiplier(computeDeckPowerLevel(runState.deckCardIds || []), runState.playerHp, runState.playerMaxHp) * 100).toFixed(0)}% ({computeLiveDifficultyMultiplier(computeDeckPowerLevel(runState.deckCardIds || []), runState.playerHp, runState.playerMaxHp).toFixed(2)}x)
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Deck Power Level:</span>
                  <strong className="text-amber-300">
                    {computeDeckPowerLevel(runState.deckCardIds || []).toFixed(1)} PWR
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Health:</span>
                  <strong className="text-emerald-400">
                    {runState.playerHp} / {runState.playerMaxHp} HP
                  </strong>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-900 text-[11px]">
                  <span className="text-slate-400">Gift Skips / Effective Tier:</span>
                  <strong className="text-sky-400">
                    {runState.giftSkippedCount || 0} skips (Tier {Math.min(3, 1 + (runState.giftSkippedCount || 0))})
                  </strong>
                </div>
              </div>
            ) : (
              <span className="text-xs font-mono text-slate-500 italic py-4">No active run in progress</span>
            )}
          </div>

          {/* SECTION 2: MAP BALANCE */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-amber-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1 border-b border-slate-850 pb-2">
              ⚖️ Map Balance
            </span>
            {runState?.lastMapBalance ? (
              <div className="font-mono text-xs space-y-2 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Net Expected Damage:</span>
                  <strong className="text-amber-300">{runState.lastMapBalance.netDamage} HP</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Risk Band Target:</span>
                  <strong className="text-sky-400">[{runState.lastMapBalance.band[0]} – {runState.lastMapBalance.band[1]}] HP</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Balance Status:</span>
                  <strong className={runState.lastMapBalance.inBand ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {runState.lastMapBalance.inBand ? "In-Band Optimal" : "Fallback Best-Fit"}
                  </strong>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                  <span className="text-slate-400">Real Attempt Count:</span>
                  <strong className="text-purple-400">{runState.lastMapBalance.attempts} / {MAX_MAP_ATTEMPTS}</strong>
                </div>
              </div>
            ) : (
              <span className="text-xs font-mono text-slate-500 italic py-4">Map balance data not calculated yet</span>
            )}
          </div>
        </div>

        {/* SECTION 3: BOON & RELIC LOG */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
          <span className="text-purple-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1 border-b border-slate-850 pb-2">
            📜 Boon & Relic Purchase / Trigger Log
          </span>
          <div className="max-h-40 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono space-y-1.5">
            {runState?.logs && runState.logs.filter(l => l.includes('Boon') || l.includes('Relic') || l.includes('Acquired') || l.includes('Bought') || l.includes('Integrated') || l.includes('Triggered') || l.includes('Echo') || l.includes('Anchor') || l.includes('Cracked') || l.includes('Residue') || l.includes('Fragment') || l.includes('Choir') || l.includes('Cache')).length > 0 ? (
              runState.logs
                .filter(l => l.includes('Boon') || l.includes('Relic') || l.includes('Acquired') || l.includes('Bought') || l.includes('Integrated') || l.includes('Triggered') || l.includes('Echo') || l.includes('Anchor') || l.includes('Cracked') || l.includes('Residue') || l.includes('Fragment') || l.includes('Choir') || l.includes('Cache'))
                .map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start border-b border-slate-900/60 pb-1">
                    <span className="text-slate-500 text-[10px] shrink-0">[{idx + 1}]</span>
                    <span className="text-slate-300">{log}</span>
                  </div>
                ))
            ) : (
              <div className="text-slate-600 italic py-2">No Boon, Relic, or Anomaly events logged in current run yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
