import React from 'react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  money: number;
  currentOfficeLevel: number;
  onUpgradeSite: (newLevel: number, cost: number, name: string) => void;
}

interface SiteLocation {
  level: number;
  name: string;
  city: string;
  cost: number;
  capacityMultiplier: string;
  prestige: string;
  imageIcon: string;
  description: string;
}

export const FacilitiesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  money,
  currentOfficeLevel,
  onUpgradeSite,
}) => {
  if (!isOpen) return null;

  const sites: SiteLocation[] = [
    {
      level: 1,
      name: 'Eastwood City Cyberpark',
      city: 'Libis, Quezon City',
      cost: 0,
      capacityMultiplier: 'Standard 20x20 Floor',
      prestige: 'Birthplace of PH BPOs',
      imageIcon: '🏙️',
      description: 'The historic pioneer BPO cyberpark in Metro Manila with 24/7 convenience stores and dining.',
    },
    {
      level: 2,
      name: 'Ortigas Center Corporate Tower',
      city: 'Pasig City (Emerald Ave / Julia Vargas)',
      cost: 150000,
      capacityMultiplier: '+30% Seating Capacity',
      prestige: 'Dense Metro Manila Hub',
      imageIcon: '🏢',
      description: 'Strategic location near EDSA & MRT, huge applicant walk-in recruitment rate and faster ISP peering.',
    },
    {
      level: 3,
      name: 'Bonifacio Global City (BGC) High Street',
      city: 'Taguig City',
      cost: 350000,
      capacityMultiplier: '+60% Seating Capacity',
      prestige: 'Prestige Multi-National Campus',
      imageIcon: '🌆',
      description: 'World-class corporate towers attracting Fortune 500 US tech clients with +25% higher payout per call.',
    },
    {
      level: 4,
      name: 'Cebu IT Park & Clark Multi-Site Mega Campus',
      city: 'Cebu City & Clark Freeport',
      cost: 750000,
      capacityMultiplier: 'Dual-Region Geo-Redundancy',
      prestige: 'National Enterprise Giant',
      imageIcon: '🌟',
      description: 'Multi-campus redundancy immune to regional power and typhoon disruptions. Enterprise level client trust.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <h2 className="font-bold text-lg text-purple-400 tracking-wide uppercase font-pixel text-xs">
                FACILITIES & METRO MANILA CYBERPARKS
              </h2>
              <p className="text-xs text-slate-400">Expand your call center footprint across premier Philippine IT corridors</p>
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

        {/* Sites List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {sites.map((site) => {
            const isCurrent = currentOfficeLevel === site.level;
            const isUnlocked = currentOfficeLevel >= site.level;
            const canAfford = money >= site.cost;

            return (
              <div
                key={site.level}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isCurrent
                    ? 'bg-purple-950/70 border-purple-400 ring-1 ring-purple-400'
                    : isUnlocked
                    ? 'bg-slate-800/60 border-slate-700'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {site.imageIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-100 text-sm">{site.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                        {site.city}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2 leading-relaxed">{site.description}</p>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        {site.capacityMultiplier}
                      </span>
                      <span className="text-amber-300 font-semibold">{site.prestige}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
                  <span className="font-bold text-amber-300 text-sm">
                    {site.cost === 0 ? 'Current Starting Site' : `₱ ${site.cost.toLocaleString()}`}
                  </span>

                  {isCurrent ? (
                    <span className="px-3 py-1.5 bg-purple-900/60 text-purple-300 rounded border border-purple-700 text-xs font-bold">
                      ✓ Active Headquarters
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-xs text-slate-400 font-semibold">Already Unlocked</span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sounds.playLevelUp();
                        onUpgradeSite(site.level, site.cost, site.name);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        canAfford
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Expand Campus' : 'Insufficient Funds'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
