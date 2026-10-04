import React from 'react';
import { ITInfrastructure } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  money: number;
  itConfig: ITInfrastructure;
  onUpgradeIT: (newConfig: ITInfrastructure, cost: number) => void;
}

export const ITSupportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  money,
  itConfig,
  onUpgradeIT,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-cyan-500 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <h2 className="font-bold text-lg text-cyan-400 tracking-wide uppercase font-pixel text-xs">
                IT & TELECOM INFRASTRUCTURE
              </h2>
              <p className="text-xs text-slate-400">Server room, fiber leased lines, workstation specs & headsets</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white px-2 py-1 text-xl font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Server Health Status */}
          <div className="bg-slate-950 border border-cyan-900/60 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Server Health</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-lg font-bold text-emerald-400">{itConfig.serverHealth}% Optimal</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Server Load / SIP Trunk</span>
              <span className="text-lg font-bold text-cyan-300">{itConfig.serverLoad}% Utilization</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">ISP Bandwidth</span>
              <span className="text-lg font-bold text-sky-400">{itConfig.bandwidthMbps} Mbps Leased Line</span>
            </div>
          </div>

          {/* 1. Telecom Leased Line Provider */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              1. Telecom & Internet Leased Line (Submarine Cable Redundancy)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: 'PLDT_BASIC',
                  title: 'PLDT Enterprise Basic Fiber',
                  cost: 25000,
                  speed: '200 Mbps',
                  desc: 'Standard commercial fiber. Susceptible to occasional Luzon submarine fiber cuts.',
                  reliability: '94%',
                },
                {
                  id: 'GLOBE_CORP',
                  title: 'Globe Corporate Dedicated Leased Line',
                  cost: 45000,
                  speed: '500 Mbps',
                  desc: 'Dedicated CIR 1:1 business line with 4-hour SLA response time.',
                  reliability: '98%',
                },
                {
                  id: 'DUAL_FIBER_FAILOVER',
                  title: 'Dual-Fiber BGP Auto-Failover (PLDT + Globe)',
                  cost: 85000,
                  speed: '1,000 Mbps',
                  desc: 'Carrier-neutral automatic switchover. If one line snaps, traffic routes seamlessly in 50ms.',
                  reliability: '99.9%',
                },
                {
                  id: 'STARLINK_REDUNDANT',
                  title: 'Starlink Low-Earth Satellite Backup Array',
                  cost: 140000,
                  speed: '2,000 Mbps',
                  desc: 'Completely immune to terrestrial fiber severed cables and typhoons. Zero downtime guarantee.',
                  reliability: '99.99%',
                },
              ].map(isp => {
                const isCurrent = itConfig.ispProvider === isp.id;
                const canAfford = money >= isp.cost;

                return (
                  <div
                    key={isp.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-cyan-950/70 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-cyan-300">{isp.title}</span>
                        <span className="text-[10px] font-bold text-emerald-400">{isp.reliability} Uptime</span>
                      </div>
                      <span className="text-[11px] text-sky-400 font-semibold block mb-1">Bandwidth: {isp.speed}</span>
                      <p className="text-[11px] text-slate-300 mb-3">{isp.desc}</p>
                    </div>

                    {isCurrent ? (
                      <span className="w-full py-1.5 text-center text-[11px] font-bold text-cyan-400 bg-cyan-900/40 rounded border border-cyan-700">
                        ✓ Currently Active ISP
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          sounds.playCash();
                          onUpgradeIT({ ...itConfig, ispProvider: isp.id as any, bandwidthMbps: parseInt(isp.speed) }, isp.cost);
                        }}
                        className={`w-full py-1.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          canAfford ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        Upgrade (₱ {isp.cost.toLocaleString()})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. PC Workstation Tier */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              2. Agent Workstation Hardware Specs
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { tier: 1, name: 'Intel Core i3 Legacy', cost: 0, benefit: 'Basic CRM access, slow multi-tab lag' },
                { tier: 2, name: 'Intel Core i5 SSD + 24" LCD', cost: 35000, benefit: '+25% typing speed, -20s AHT' },
                { tier: 3, name: 'Intel Core i7 Dual-Screen Hub', cost: 75000, benefit: '+50% multi-tasking, -45s AHT' },
              ].map(pc => {
                const isCurrent = itConfig.pcTier === pc.tier;
                const canAfford = money >= pc.cost;

                return (
                  <div
                    key={pc.tier}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isCurrent ? 'bg-cyan-950/70 border-cyan-400' : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-200 block mb-1">{pc.name}</span>
                      <p className="text-[11px] text-slate-300 mb-2">{pc.benefit}</p>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] text-cyan-400 font-bold">✓ Installed on floor</span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          sounds.playCash();
                          onUpgradeIT({ ...itConfig, pcTier: pc.tier }, pc.cost);
                        }}
                        className={`py-1 px-2 rounded text-[10px] font-bold ${
                          canAfford ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        Upgrade (₱ {pc.cost.toLocaleString()})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Noise-Cancelling Headsets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              3. Call Center Noise-Cancelling Headsets
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { tier: 1, name: 'Standard 3.5mm Headset', cost: 0, desc: 'Callers hear floor chatter and sirens' },
                { tier: 2, name: 'USB Digital Noise Reduction', cost: 22000, desc: 'Filters out 80% background floor noise (+8% CSAT)' },
                { tier: 3, name: 'Plantronics Blackwire Studio', cost: 55000, desc: 'Ultra-crisp broadcast mic (+16% CSAT, zero caller strain)' },
              ].map(hs => {
                const isCurrent = itConfig.headsetTier === hs.tier;
                const canAfford = money >= hs.cost;

                return (
                  <div
                    key={hs.tier}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isCurrent ? 'bg-cyan-950/70 border-cyan-400' : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-200 block mb-1">{hs.name}</span>
                      <p className="text-[11px] text-slate-300 mb-2">{hs.desc}</p>
                    </div>

                    {isCurrent ? (
                      <span className="text-[10px] text-cyan-400 font-bold">✓ Equipped on all agents</span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          sounds.playCash();
                          onUpgradeIT({ ...itConfig, headsetTier: hs.tier }, hs.cost);
                        }}
                        className={`py-1 px-2 rounded text-[10px] font-bold ${
                          canAfford ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        Equip (₱ {hs.cost.toLocaleString()})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase transition-all"
          >
            Close IT Panel
          </button>
        </div>
      </div>
    </div>
  );
};
