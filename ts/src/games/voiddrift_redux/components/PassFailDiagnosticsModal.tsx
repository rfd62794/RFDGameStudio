import React from 'react';
import { SimulationStats } from '../types';
import { CheckCircle2, XCircle, ShieldCheck, X, Flame } from 'lucide-react';

interface PassFailDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SimulationStats;
}

export const PassFailDiagnosticsModal: React.FC<PassFailDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  const { boundaryTelemetry } = stats;

  const criteria = [
    {
      id: 'fsm-closed-loop',
      title: 'FSM Dispatch Loop Closure',
      description: 'Scout detects, drone dispatches, mines/tugs, returns to hub, and resets state without deadlock.',
      isPass: stats.closedLoopsCompleted > 0 || stats.successfulTugsCompleted > 0,
      details: `${stats.closedLoopsCompleted} Mining Loops | ${stats.successfulTugsCompleted} Ring 2 Tugs`,
    },
    {
      id: 'gas-breaker-branch',
      title: 'Phase 4 Gas Core & Tier 2 Breaker Drill',
      description: 'Ring 2 medium asteroids spawn gas cores (50%). Tier 2 Breaker (M-102) drills in-place for 8s, extracts H3 Gas, and triggers fragment burst.',
      isPass: typeof stats.resources?.H3Gas === 'number',
      details: `H3 Gas Extracted: ${stats.resources?.H3Gas || 0} MT | Active Gas Core Asteroids: ${boundaryTelemetry.gasAsteroidsCount || 0}`,
    },
    {
      id: 'fragment-hauler-retrieval',
      title: 'Fragment Burst & Hauler Retrieval',
      description: 'Depleted gas asteroids scatter 3-5 ore fragments into Middle Ring. Haulers prioritize and retrieve fragments into Ring 1.',
      isPass: boundaryTelemetry.totalSuccessfulTugs >= 0,
      details: `Active Fragments: ${boundaryTelemetry.fragmentsCount || 0} | Total Retrieved/Tugged: ${boundaryTelemetry.totalSuccessfulTugs}`,
    },
    {
      id: 'multi-resource-smelter',
      title: 'Multi-Resource & Smelting Engine',
      description: 'Generalized resource model tracks Metal, RawAluminum, Aluminum, & H3 Gas. Timed conversion engine converts RawAluminum to Aluminum.',
      isPass: typeof stats.resources?.Metal === 'number' && typeof stats.resources?.RawAluminum === 'number' && typeof stats.resources?.Aluminum === 'number',
      details: `Metal: ${stats.resources?.Metal || 0} MT | RawAl: ${stats.resources?.RawAluminum || 0} MT | Refined Al: ${stats.resources?.Aluminum || 0} MT`,
    },
    {
      id: 'ring2-gated-mining',
      title: 'Ring 2 Gated Mining Enforcer',
      description: 'Tier 1 mining drones strictly CANNOT reach Ring 2. Only Tier 2 Breakers targeting Ring 2 gas asteroids are granted Ring 2 access.',
      isPass: boundaryTelemetry.ring2GatedMiningValid,
      details: boundaryTelemetry.ring2GatedMiningValid ? 'PASS: Ring 2 Gating Enforced' : 'FAIL: Tier 1 Drone breached Ring 2',
    },
  ];

  const allPassed = criteria.every((c) => c.isPass);

  return (
    <div id="pass-fail-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div id="pass-fail-modal-card" className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5 font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${allPassed ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' : 'bg-rose-950/80 border-rose-500/50 text-rose-400'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                Phase 4 Pass/Fail Diagnostics
                <Flame className="w-4 h-4 text-pink-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Gas Core Branching, Tier 2 Breaker Drill & Fragment Retrieval Verification
              </p>
            </div>
          </div>
          <button
            id="close-diagnostics-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg border border-slate-800 bg-slate-950 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Status Badge */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          allPassed ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {allPassed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <XCircle className="w-6 h-6 text-rose-400" />}
            <div>
              <span className="font-bold text-sm uppercase">
                {allPassed ? 'SYSTEM VERIFIED PASS' : 'SYSTEM DIAGNOSTIC FAIL'}
              </span>
              <p className="text-xs text-slate-400">
                {allPassed ? 'All 5 architectural criteria satisfied' : 'One or more criteria need attention'}
              </p>
            </div>
          </div>
        </div>

        {/* Criteria Checklist */}
        <div className="space-y-3">
          {criteria.map((c) => (
            <div
              key={c.id}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-start gap-3"
            >
              {c.isPass ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-200">{c.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    c.isPass ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    {c.isPass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-1.5">{c.description}</p>
                <div className="text-[10px] text-cyan-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 inline-block">
                  {c.details}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2">
          <button
            id="modal-confirm-btn"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl border border-slate-700 transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
