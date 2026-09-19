import React from 'react';
import {
  Factory,
  Sparkles,
  Cpu,
  Zap,
  FlaskConical,
  Radio,
  Database,
  Crosshair,
  ArrowRight,
} from 'lucide-react';
import { HideoutState } from '../../types';

interface HideoutHeaderProps {
  hideout: HideoutState;
  activeTab: 'refinement' | 'deployment';
  setActiveTab: (tab: 'refinement' | 'deployment') => void;
  onDeploy: () => void;
  onOpenInspector: () => void;
}

export const HideoutHeader: React.FC<HideoutHeaderProps> = ({
  hideout,
  activeTab,
  setActiveTab,
  onDeploy,
  onOpenInspector,
}) => {
  return (
    <header className="border-b border-[#1e293b] bg-[#0f172a]/95 backdrop-blur px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-lg font-mono">
      {/* BRAND & SECTOR BADGE */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center shadow-lg border border-[#38bdf8]/30 shrink-0">
          <Factory className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base md:text-lg text-white tracking-wide">
              PROJECT // SYSTEMIC EXTRACT
            </h1>
            <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0369a1]/30 text-[#38bdf8] border border-[#0284c7]/40">
              HIDEOUT SUB-04
            </span>
          </div>
          <p className="text-[11px] text-[#94a3b8]">
            ADR 002: Abiotic Research &bull; ADR 008: Hostile Ballistics &amp; Sector Gate
          </p>
        </div>
      </div>

      {/* CORE WORKBENCH TABS */}
      <div className="flex items-center bg-[#090d13] p-1 rounded-xl border border-[#1e293b] gap-1">
        <button
          id="tab-refinement"
          onClick={() => setActiveTab('refinement')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'refinement'
              ? 'bg-[#0284c7] text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>1. REFINEMENT &amp; RESEARCH</span>
        </button>

        <button
          id="tab-deployment"
          onClick={() => setActiveTab('deployment')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'deployment'
              ? 'bg-[#10b981] text-white shadow-md'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>2. ARMORY &amp; DEPLOYMENT</span>
        </button>
      </div>

      {/* 4 DISCRETE RESOURCE MATRICES & ACTIONS */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Scrap */}
        <div className="flex items-center gap-1.5 bg-[#1e293b]/70 border border-[#334155] px-2.5 py-1 rounded-lg">
          <div className="w-5 h-5 rounded bg-[#f59e0b]/20 border border-[#f59e0b]/40 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-[#fbbf24]" />
          </div>
          <div>
            <div className="text-[8px] text-[#94a3b8]">SCRAP</div>
            <div className="text-xs font-bold text-[#fbbf24] leading-none">{hideout.resources.scrap}</div>
          </div>
        </div>

        {/* Silicon */}
        <div className="flex items-center gap-1.5 bg-[#1e293b]/70 border border-[#334155] px-2.5 py-1 rounded-lg">
          <div className="w-5 h-5 rounded bg-[#0284c7]/20 border border-[#0284c7]/40 flex items-center justify-center">
            <Cpu className="w-3 h-3 text-[#38bdf8]" />
          </div>
          <div>
            <div className="text-[8px] text-[#94a3b8]">SILICON</div>
            <div className="text-xs font-bold text-[#38bdf8] leading-none">{hideout.resources.silicon}</div>
          </div>
        </div>

        {/* Copper */}
        <div className="flex items-center gap-1.5 bg-[#1e293b]/70 border border-[#334155] px-2.5 py-1 rounded-lg">
          <div className="w-5 h-5 rounded bg-[#ea580c]/20 border border-[#ea580c]/40 flex items-center justify-center">
            <Zap className="w-3 h-3 text-[#fb923c]" />
          </div>
          <div>
            <div className="text-[8px] text-[#94a3b8]">COPPER</div>
            <div className="text-xs font-bold text-[#fb923c] leading-none">{hideout.resources.copper}</div>
          </div>
        </div>

        {/* Plasma */}
        <div className="flex items-center gap-1.5 bg-[#1e293b]/70 border border-[#334155] px-2.5 py-1 rounded-lg">
          <div className="w-5 h-5 rounded bg-[#9333ea]/20 border border-[#9333ea]/40 flex items-center justify-center">
            <FlaskConical className="w-3 h-3 text-[#c084fc]" />
          </div>
          <div>
            <div className="text-[8px] text-[#94a3b8]">PLASMA</div>
            <div className="text-xs font-bold text-[#c084fc] leading-none">{hideout.resources.plasma}</div>
          </div>
        </div>

        {/* Ontological Cores */}
        {hideout.relicOntologicalCoresInStash > 0 && (
          <div className="flex items-center gap-1.5 bg-[#3b0764]/70 border border-[#a855f7]/60 px-2.5 py-1 rounded-lg shadow-lg animate-pulse">
            <div className="w-5 h-5 rounded bg-[#a855f7]/25 border border-[#c084fc]/50 flex items-center justify-center">
              <Radio className="w-3 h-3 text-[#f0abfc]" />
            </div>
            <div>
              <div className="text-[8px] text-[#e9d5ff]">CORES</div>
              <div className="text-xs font-bold text-[#f0abfc] leading-none">{hideout.relicOntologicalCoresInStash}</div>
            </div>
          </div>
        )}

        {/* FAST DEPLOY BUTTON */}
        <button
          id="header-btn-fast-deploy"
          onClick={onDeploy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-xs font-bold text-white shadow-md hover:shadow-[#10b981]/30 transition cursor-pointer"
          title="Deploy Immediately to Selected Sector"
        >
          <span>DEPLOY</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Telemetry Inspector Button */}
        <button
          id="btn-open-inspector-hideout"
          onClick={onOpenInspector}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/30 text-xs text-[#38bdf8] transition shadow-md cursor-pointer"
          title="Inspect Architecture & Backend Telemetry"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">API TELEMETRY</span>
        </button>
      </div>
    </header>
  );
};
