import React from 'react';
import { HideoutState } from '../../types';

interface HideoutFooterProps {
  hideout: HideoutState;
}

export const HideoutFooter: React.FC<HideoutFooterProps> = ({ hideout }) => {
  return (
    <footer className="border-t border-[#1e293b] bg-[#0b0e14] px-6 py-3 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-6 text-[#94a3b8]">
          <div>
            <span className="text-[#64748b] block text-[10px]">TOTAL RAIDS</span>
            <span className="text-white font-bold">{hideout.stats.totalRaids}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px]">SUCCESSFUL EXTRACTIONS</span>
            <span className="text-[#10b981] font-bold">{hideout.stats.successfulExtractions}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px]">OPERATIVE KIA</span>
            <span className="text-[#ef4444] font-bold">{hideout.stats.deaths}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px]">ITEMS EXTRACTED</span>
            <span className="text-[#38bdf8] font-bold">{hideout.stats.itemsExtracted}</span>
          </div>
          <div>
            <span className="text-[#64748b] block text-[10px]">SCHEMATICS DISCOVERED</span>
            <span className="text-[#c084fc] font-bold">{hideout.stats.blueprintsUnlocked}</span>
          </div>
        </div>

        <div className="text-[10px] text-[#64748b]">
          ADR 002 RESEARCH &amp; REFINEMENT ENGINE
        </div>
      </div>
    </footer>
  );
};
