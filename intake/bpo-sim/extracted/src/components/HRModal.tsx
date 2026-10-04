import React from 'react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  money: number;
  happiness: number;
  onTriggerPerk: (title: string, cost: number, moraleBoost: number, happinessBoost: number) => void;
}

interface HRPerk {
  id: string;
  title: string;
  category: string;
  cost: number;
  icon: string;
  moraleBoost: number;
  happinessBoost: number;
  description: string;
}

export const HRModal: React.FC<Props> = ({
  isOpen,
  onClose,
  money,
  happiness,
  onTriggerPerk,
}) => {
  if (!isOpen) return null;

  const perks: HRPerk[] = [
    {
      id: 'jollibee',
      title: 'Jollibee Chickenjoy & Spaghetti Feast',
      category: 'Food & Morale',
      cost: 6500,
      icon: '🍗',
      moraleBoost: 25,
      happinessBoost: 15,
      description: 'The ultimate Pinoy comfort meal delivered straight to the pantry floor. Clears stress instantly!',
    },
    {
      id: 'pizza',
      title: 'Floor Pizza Party & Soda',
      category: 'Food & Morale',
      cost: 5000,
      icon: '🍕',
      moraleBoost: 18,
      happinessBoost: 10,
      description: 'Yellow Cab / Domino\'s box stack for agents handling peak queue surges.',
    },
    {
      id: 'videoke',
      title: 'Friday Videoke / Karaoke Night',
      category: 'Team Building',
      cost: 12000,
      icon: '🎤',
      moraleBoost: 35,
      happinessBoost: 20,
      description: 'Birit sessions in the lounge! Unleashes the natural singing talent of your agents.',
    },
    {
      id: 'townhall',
      title: 'Town Hall & Top Performer Awards',
      category: 'Recognition',
      cost: 8500,
      icon: '🏆',
      moraleBoost: 22,
      happinessBoost: 12,
      description: 'Plaques, certificates and gift vouchers for Top CSAT and Perfect Attendance champions.',
    },
    {
      id: 'coaching',
      title: '1-on-1 Wellness & Mental Health Coaching',
      category: 'Wellness',
      cost: 4500,
      icon: '❤️',
      moraleBoost: 15,
      happinessBoost: 10,
      description: 'Empathetic counseling session with HR specialist to resolve personal and work stress.',
    },
    {
      id: 'shuttle',
      title: 'Late Night Company Shuttle Vans',
      category: 'Logistics',
      cost: 16000,
      icon: '🚐',
      moraleBoost: 28,
      happinessBoost: 18,
      description: 'Safe transport to/from MRT/EDSA for Graveyard shift employees during rain and late nights.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-orange-500 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <h2 className="font-bold text-lg text-orange-400 tracking-wide uppercase font-pixel text-xs">
                HUMAN RESOURCES & EMPLOYEE RELATIONS
              </h2>
              <p className="text-xs text-slate-400">Boost floor morale, prevent AWOL/attrition, and reward hard work</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-emerald-400 font-bold">
              Happiness: {happiness}% 😊
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
        </div>

        {/* Perks Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {perks.map((perk) => {
            const canAfford = money >= perk.cost;

            return (
              <div
                key={perk.id}
                className="bg-slate-800/80 border border-slate-700 hover:border-orange-400 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                        {perk.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{perk.title}</h3>
                        <span className="text-[10px] text-orange-300 font-semibold uppercase tracking-wider">
                          {perk.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-300 block">
                        ₱ {perk.cost.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">{perk.description}</p>
                  
                  <div className="flex items-center gap-3 text-[11px] mb-4">
                    <span className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      +{perk.moraleBoost}% Morale
                    </span>
                    <span className="bg-sky-950/60 border border-sky-800 text-sky-300 px-2 py-0.5 rounded font-bold">
                      +{perk.happinessBoost}% Happiness
                    </span>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => {
                    sounds.playLevelUp();
                    onTriggerPerk(perk.title, perk.cost, perk.moraleBoost, perk.happinessBoost);
                  }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canAfford
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-md active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>🎉</span>
                  <span>{canAfford ? 'Treat the Floor!' : 'Insufficient Funds'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
