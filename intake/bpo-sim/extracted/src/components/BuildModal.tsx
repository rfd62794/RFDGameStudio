import React from 'react';
import { sounds } from '../utils/audio';
import { TileType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  money: number;
  onSelectBuildItem: (itemType: TileType, name: string, cost: number) => void;
}

interface BuildableItem {
  type: TileType;
  name: string;
  category: string;
  cost: number;
  icon: string;
  description: string;
  benefits: string;
}

export const BuildModal: React.FC<Props> = ({ isOpen, onClose, money, onSelectBuildItem }) => {
  if (!isOpen) return null;

  const items: BuildableItem[] = [
    {
      type: 'CUBICLE',
      name: 'Agent Cubicle Station',
      category: 'Workstations',
      cost: 15000,
      icon: '🖥️',
      description: 'Standard acoustic partition desk with computer, headset & ergonomic chair.',
      benefits: '+1 Employee seat capacity, enables taking calls.',
    },
    {
      type: 'SERVER_RACK',
      name: 'Blade Server Chassis',
      category: 'Infrastructure',
      cost: 45000,
      icon: '🖧',
      description: 'High-density telecommunication rack for PBX SIP trunks and CRM database.',
      benefits: '+50 Simultaneous call capacity, +10% network reliability.',
    },
    {
      type: 'COFFEE_MAKER',
      name: 'Kopiko 3-in-1 Coffee Station',
      category: 'Pantry & Perks',
      cost: 8500,
      icon: '☕',
      description: 'The lifeblood of Philippine call center graveyard shift workers.',
      benefits: 'Agents replenish energy 40% faster during breaks.',
    },
    {
      type: 'WATER_DISPENSER',
      name: 'Mineral Water Dispenser',
      category: 'Pantry & Perks',
      cost: 3500,
      icon: '💧',
      description: 'Cold & hot mineral water for soothing throats after 4-hour call marathons.',
      benefits: 'Reduces vocal fatigue, +5% agent stamina.',
    },
    {
      type: 'SLEEPING_POD',
      name: 'Graveyard Sleeping Cot',
      category: 'Rest & Wellness',
      cost: 12000,
      icon: '🛏️',
      description: 'Quiet dark-room bunk bed for 30-minute power naps between midnight shifts.',
      benefits: '-30% Stress, prevents agent burnout and AWOL.',
    },
    {
      type: 'PANTRY_TABLE',
      name: 'Pantry Dining Set',
      category: 'Pantry & Perks',
      cost: 9000,
      icon: '🪑',
      description: 'Spacious dining table for eating home-cooked baon and instant noodles.',
      benefits: '+8% Floor morale, agents socialize and relax.',
    },
    {
      type: 'PLANT',
      name: 'Potted Monstera / Snake Plant',
      category: 'Decor',
      cost: 2500,
      icon: '🪴',
      description: 'Lush indoor green foliage to freshen up the air-conditioned office air.',
      benefits: '+3% Floor happiness, cleaner aesthetic.',
    },
    {
      type: 'VENDING_MACHINE',
      name: 'Pinoy Snack Vending Machine',
      category: 'Pantry & Perks',
      cost: 18000,
      icon: '🥫',
      description: 'Stocked with Chippy, Piattos, Lucky Me Pancit Canton and cold drinks.',
      benefits: 'Generates ~₱800/day passive snack profit, keeps agents happy.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <h2 className="font-bold text-lg text-emerald-400 tracking-wide uppercase font-pixel text-xs">
                BUILD & FLOOR EXPANSION
              </h2>
              <p className="text-xs text-slate-400">Add cubicles, server racks, coffee stations and wellness amenities</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 text-amber-300 text-sm font-bold flex items-center gap-1.5">
              <span>🪙</span>
              <span>₱ {money.toLocaleString()}</span>
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

        {/* Item Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const canAfford = money >= item.cost;

            return (
              <div
                key={item.name}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  canAfford
                    ? 'bg-slate-800/70 border-slate-700 hover:border-emerald-400 hover:shadow-lg hover:bg-slate-800'
                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{item.name}</h3>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-semibold">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-amber-300 text-sm">
                        ₱ {item.cost.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">{item.description}</p>
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md mb-3 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>{item.benefits}</span>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => {
                    sounds.playClick();
                    onSelectBuildItem(item.type, item.name, item.cost);
                    onClose();
                  }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>🛠️</span>
                  <span>{canAfford ? 'Place on Floor' : 'Insufficient Funds'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
