import React from 'react';
import { ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { HideoutState } from '../../types';

interface FaradayShieldBannerProps {
  hideout: HideoutState;
  onEmergencyRefuel: () => void;
}

export const FaradayShieldBanner: React.FC<FaradayShieldBannerProps> = ({
  hideout,
  onEmergencyRefuel,
}) => {
  return (
    <section
      id="faraday-attrition-banner"
      className={`border-b px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-all ${
        hideout.faradayShield?.isCompromised
          ? 'bg-[#450a0a]/90 border-[#dc2626]/70 text-[#fca5a5]'
          : 'bg-[#0a1220] border-[#1e293b] text-[#94a3b8]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
            hideout.faradayShield?.isCompromised
              ? 'bg-[#ef4444]/20 border-[#ef4444] text-[#ef4444] animate-pulse'
              : 'bg-[#10b981]/20 border-[#10b981]/40 text-[#34d399]'
          }`}
        >
          {hideout.faradayShield?.isCompromised ? (
            <ShieldAlert className="w-4 h-4 animate-bounce" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`font-bold tracking-wider ${
                hideout.faradayShield?.isCompromised ? 'text-[#f87171]' : 'text-white'
              }`}
            >
              FARADAY REALITY SHIELD: {hideout.faradayShield?.isCompromised ? 'COMPROMISED (0%)' : 'NOMINAL (100%)'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e293b] text-[#cbd5e1] border border-[#334155]">
              ADR 004 ATTRITION
            </span>
          </div>
          <p className="text-[11px] text-[#cbd5e1]">
            {hideout.faradayShield?.isCompromised ? (
              <span className="text-[#fca5a5] font-semibold">
                ⚠️ SUB-SPACE RADIATION BREACH: Unspent Component Tags decaying! Lost:{' '}
                <strong>{hideout.faradayShield.decayedTagsCount} tags</strong>
                {hideout.faradayShield.lastDecayedTag ? ` (Last decayed: ${hideout.faradayShield.lastDecayedTag})` : ''}. Deploy to Quantized Sectors immediately to extract Inert Matter &amp; Plasma!
              </span>
            ) : (
              <span>
                Lead-lined Faraday bunker containment intact. Hourly Upkeep: <strong className="text-[#fbbf24]">20 Inert Matter</strong> &bull; <strong className="text-[#c084fc]">1 Plasma</strong> / hour.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-4 text-[11px]">
          <span>
            Cumulative Drained: <strong className="text-[#fbbf24]">{hideout.faradayShield?.totalDrainedScrap?.toFixed(1) || 0} Scrap</strong> / <strong className="text-[#c084fc]">{hideout.faradayShield?.totalDrainedPlasma?.toFixed(2) || 0} Plasma</strong>
          </span>
        </div>

        <button
          id="btn-emergency-refuel"
          onClick={onEmergencyRefuel}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow cursor-pointer ${
            hideout.faradayShield?.isCompromised
              ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white animate-pulse'
              : 'bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/30'
          }`}
          title="Inject emergency stabilizer cell to replenish Inert Matter and Plasma"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{hideout.faradayShield?.isCompromised ? 'EMERGENCY SHIELD INJECTION (+30 Scrap, +2 Plasma)' : 'TOP-UP STABILIZER CELLS'}</span>
        </button>
      </div>
    </section>
  );
};
