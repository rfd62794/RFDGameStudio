/**
 * Gladiator Arena — Cyber-Organic Compatibility Inspector
 * Visualizes Frame average lean, variance, synergy bonuses, and malfunction risk.
 */

import React from 'react';
import { Gladiator } from '../types';
import { calculateCompatibility } from '../../../engine/shared/anatomy';
import { Dna, Zap, Cpu, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface CompatibilityInspectorProps {
  gladiator: Gladiator;
}

export const CompatibilityInspector: React.FC<CompatibilityInspectorProps> = ({ gladiator }) => {
  const report = calculateCompatibility(gladiator);

  const getTierBadge = () => {
    switch (report.compatibilityTier) {
      case 'pure_synergy':
        return {
          label: 'Pure Synergy',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        };
      case 'stable':
        return {
          label: 'Stable Alignment',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
        };
      case 'dissonant':
        return {
          label: 'System Dissonance',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      case 'critical_rejection':
        return {
          label: 'Critical Bio-Rejection',
          color: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
          icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
        };
    }
  };

  const badge = getTierBadge();

  // Position percentage for the average lean (-1.0 -> 0%, 0.0 -> 50%, +1.0 -> 100%)
  const leanPercent = Math.min(100, Math.max(0, ((report.averageLean + 1) / 2) * 100));

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-stone-200">
            Cyber-Organic Lean & Compatibility
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${badge.color}`}>
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Visual Lean Slider Spectrum */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="flex items-center gap-1 text-emerald-400">
            <Dna className="w-3 h-3" /> Pure Bio (-1.0)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Cpu className="w-3 h-3" /> Hybrid (0.0)
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Zap className="w-3 h-3" /> Pure Cyber (+1.0)
          </span>
        </div>

        {/* Gradient Track */}
        <div className="relative w-full h-4 rounded-full bg-gradient-to-r from-emerald-600 via-amber-600 to-cyan-500 border border-stone-700 shadow-inner">
          {/* Active Average Lean Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-stone-950 shadow-md flex items-center justify-center transition-all duration-300"
            style={{ left: `${leanPercent}%` }}
            title={`Average Lean: ${report.averageLean.toFixed(2)}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          </div>
        </div>

        {/* Individual Limb Markers plotted underneath */}
        <div className="relative w-full h-3">
          {report.partMismatches.map(pm => {
            const pLeanPos = Math.min(100, Math.max(0, ((pm.partLean + 1) / 2) * 100));
            return (
              <div
                key={pm.slot}
                className="absolute top-0 -translate-x-1/2 w-1.5 h-2.5 rounded-sm bg-stone-300 opacity-70 hover:opacity-100 hover:scale-150 transition cursor-help"
                style={{ left: `${pLeanPos}%` }}
                title={`${pm.partName} (${pm.slot}): ${pm.partLean > 0 ? `+${pm.partLean}` : pm.partLean}`}
              />
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-stone-800 text-xs">
        <div className="p-2 rounded-lg bg-stone-950/60 border border-stone-800/80">
          <span className="text-[10px] text-stone-400 block uppercase">Average Lean</span>
          <span className="font-mono font-bold text-stone-200">
            {report.averageLean > 0 ? `+${report.averageLean.toFixed(2)}` : report.averageLean.toFixed(2)}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-stone-950/60 border border-stone-800/80">
          <span className="text-[10px] text-stone-400 block uppercase">System Variance</span>
          <span className="font-mono font-bold text-stone-200">{report.variance.toFixed(2)}</span>
        </div>

        <div className="p-2 rounded-lg bg-stone-950/60 border border-stone-800/80">
          <span className="text-[10px] text-stone-400 block uppercase">Synergy Status</span>
          <span className="font-mono font-bold text-emerald-400">
            {report.synergyBonus.speedPercent > 0 || report.synergyBonus.powerPercent > 0
              ? `+${Math.max(report.synergyBonus.speedPercent, report.synergyBonus.powerPercent)}% Bonus`
              : 'Neutral'}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-stone-950/60 border border-stone-800/80">
          <span className="text-[10px] text-stone-400 block uppercase">Malfunction Risk</span>
          <span
            className={`font-mono font-bold ${
              report.malfunctionRiskPercent > 10
                ? 'text-red-400'
                : report.malfunctionRiskPercent > 0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {report.malfunctionRiskPercent}% / turn
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="text-xs text-stone-300 bg-stone-950/40 p-2 rounded-lg border border-stone-800/60">
        <span className="font-semibold text-amber-300">System Report: </span>
        {report.synergyBonus.description}
        {report.malfunctionRiskPercent > 0 && (
          <span className="text-amber-400 ml-1">
            (Mismatched bio-cyber limbs create ongoing risk of neural feed glitches in battle!)
          </span>
        )}
      </div>
    </div>
  );
};
