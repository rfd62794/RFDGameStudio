/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Horse } from '../types';
import { SVGRacer } from './SVGRacer';
import { Sparkles, Edit2, Check, X, Shield, Coins, Activity, TrendingUp, HelpCircle } from 'lucide-react';

interface StableProps {
  horses: Horse[];
  onRenameHorse: (id: string, newName: string) => void;
  onSellHorse: (id: string, price: number) => void;
}

export const Stable: React.FC<StableProps> = ({
  horses,
  onRenameHorse,
  onSellHorse
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [sellingConfirmId, setSellingConfirmId] = useState<string | null>(null);

  const playerHorses = horses.filter(h => h.isPlayerOwned);

  const handleStartRename = (horse: Horse) => {
    setEditingId(horse.id);
    setEditName(horse.name);
  };

  const handleSaveRename = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed) {
      onRenameHorse(id, trimmed);
    }
    setEditingId(null);
  };

  // Helper to calculate the current real sale value of the horse
  const calculateSaleValue = (h: Horse): number => {
    const avgStat = (h.speed + h.stamina + h.acceleration + h.temperament) / 4;
    // Base stat merit + achievements
    const baseValue = Math.floor(avgStat * avgStat * 0.35 + (h.generation * 100));
    const winBonus = h.wins * 250;
    const placeBonus = h.places * 100 + h.thirds * 50;
    const earningsCut = h.careerEarnings * 0.15;
    return Math.round(baseValue + winBonus + placeBonus + earningsCut);
  };

  const renderStatBar = (label: string, value: number, colorClass: string) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-tight">
          <span>{label}</span>
          <span className="font-extrabold text-slate-900">{value}/100</span>
        </div>
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]">
          <div 
            className={`h-full ${colorClass} rounded-full transition-all border-r-2 border-slate-900`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6" id="stable-roster-viewport">
      
      {/* Intro Header */}
      <div className="bento-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border-3 border-slate-900 p-5 md:p-6 shadow-[4px_4px_0px_0px_#0f172a]">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 uppercase">
            <Shield className="w-6 h-6 text-emerald-600" />
            Your Private Stables
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1.5 max-w-xl">
            Inspect your breeding pedigree, stats distribution, and race metrics. Trade your equine slots back to the market or customize their names.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-100 border-2 border-slate-900 px-4 py-2 rounded-xl shrink-0">
          <Activity className="w-4 h-4 text-emerald-600" />
          <div className="font-bold text-xs text-slate-900">
            <span className="text-slate-400 block text-[9px] uppercase font-black tracking-wider leading-none">TOTAL CAPACITY</span>
            <span className="text-sm font-black text-slate-900">{playerHorses.length} / 12 slots</span>
          </div>
        </div>
      </div>

      {playerHorses.length === 0 ? (
        <div className="bento-card border-3 border-slate-900 border-dashed rounded-2xl bg-white p-12 text-center flex flex-col items-center gap-4 shadow-[4px_4px_0px_0px_#0f172a]">
          <div className="p-4 bg-yellow-100 rounded-full text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
            <HelpCircle className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Your Stables are Empty</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto font-medium leading-relaxed">
              You do not own any race horses yet. Head over to the Betting Office, place some lucky wagers, purchase foundation stock, and begin breeding your legacy pedigree!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="horses-grid">
          {playerHorses.map(horse => {
            const salePrice = calculateSaleValue(horse);
            const isEditing = editingId === horse.id;
            const isResting = horse.cooldownUntil > Date.now();
            const restTimeSecondsLeft = Math.max(0, Math.round((horse.cooldownUntil - Date.now()) / 1000));
            const isConfirmingSale = sellingConfirmId === horse.id;

            return (
              <div 
                key={horse.id}
                className="bg-white border-3 border-slate-900 rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_#0f172a] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0f172a] transition-all flex flex-col justify-between"
                id={`horse-card-${horse.id}`}
              >
                {/* Visual Top Header */}
                <div className="relative bg-slate-50 pb-2.5 pt-3.5 px-4 border-b-2 border-slate-900 flex items-center justify-between">
                  {/* Status Cooldown badges */}
                  <div>
                    {isResting ? (
                      <span className="bento-badge px-2 py-0.5 bg-rose-50 text-rose-700 border-2 border-slate-900 text-[8px]">
                        Resting ({restTimeSecondsLeft}s)
                      </span>
                    ) : (
                      <span className="bento-badge px-2 py-0.5 bg-emerald-50 text-emerald-700 border-2 border-slate-900 text-[8px]">
                        Ready to Race
                      </span>
                    )}
                  </div>
                  {/* Generation Tag */}
                  <span className="bento-badge px-2.5 py-0.5 bg-yellow-50 text-amber-700 border-2 border-slate-900 text-[8px]">
                    GEN {horse.generation}
                  </span>
                </div>

                {/* SVG Visual and Name Deck */}
                <div className="flex gap-4 p-4 md:p-5 items-center">
                  <div className="w-24 h-21 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-center justify-center p-1 relative shadow-inner overflow-hidden shadow-[2px_2px_0px_0px_#0f172a]">
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-teal-100"></div>
                    <SVGRacer 
                      colorBody={horse.colorBody}
                      colorMane={horse.colorMane}
                      colorSocks={horse.colorSocks}
                      colorJockeySilk={horse.colorJockeySilk}
                      isRunning={false}
                      size={80}
                      className="relative z-10"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1 bg-slate-50 border-2 border-slate-900 rounded-lg p-1">
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          maxLength={24}
                          className="w-full bg-transparent text-sm font-black text-slate-900 outline-none px-2 py-1"
                        />
                        <button 
                          onClick={() => handleSaveRename(horse.id)}
                          className="p-1 text-emerald-600 hover:bg-slate-200 rounded"
                        >
                          <Check className="w-4 h-4 font-black" />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-slate-900 text-sm md:text-base truncate tracking-tight uppercase">
                          {horse.name}
                        </h3>
                        <button 
                          onClick={() => handleStartRename(horse)}
                          className="p-1 text-slate-400 hover:text-slate-900 transition-all rounded hover:bg-slate-100"
                          title="Rename Horse"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Gender pill and properties */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`bento-badge py-0.5 px-2.5 text-[8px] sm:text-[9px] ${
                        horse.gender === 'Stallion' 
                          ? 'bg-blue-50 text-blue-700 border-2 border-slate-900' 
                          : 'bg-rose-50 text-rose-700 border-2 border-slate-900'
                      }`}>
                        {horse.gender === 'Stallion' ? '♂ Stallion' : '♀ Mare'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lineage Tree */}
                <div className="px-4 md:px-5 pb-3">
                  <div className="bg-slate-50 border-2 border-slate-900 p-2.5 rounded-lg text-[9px] font-bold">
                    <div className="text-slate-400 uppercase font-black tracking-wider text-[8px] mb-1">HERITAGE PEDIGREE</div>
                    <div className="flex justify-between mt-1 text-slate-600">
                      <span className="truncate w-1/2 border-r border-slate-200 pr-2">
                        SIRE: <span className="text-slate-900 font-extrabold">{horse.parents?.fatherName || 'Foundation'}</span>
                      </span>
                      <span className="truncate w-1/2 pl-2">
                        DAM: <span className="text-slate-900 font-extrabold">{horse.parents?.motherName || 'Foundation'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Genetic Stats Graph */}
                <div className="px-4 md:px-5 py-4 border-y-2 border-slate-900 flex flex-col gap-3 bg-[#fafcfd]">
                  {renderStatBar('Top Speed', horse.speed, 'bg-rose-500')}
                  {renderStatBar('Stamina Capacity', horse.stamina, 'bg-emerald-500')}
                  {renderStatBar('Launch Acceleration', horse.acceleration, 'bg-amber-400')}
                  {renderStatBar('consistency TEMPERAMENT', horse.temperament, 'bg-sky-500')}
                </div>

                {/* Career records list */}
                <div className="px-5 py-3 bg-slate-50 flex justify-between items-center text-center text-xs font-bold border-b-2 border-slate-900">
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase font-black tracking-wider mb-0.5">Runs</span>
                    <span className="font-extrabold text-[#0f172a] text-sm">{horse.runs}</span>
                  </div>
                  <div>
                    <span className="text-emerald-600 block text-[8px] uppercase font-black tracking-wider mb-0.5">Wins</span>
                    <span className="font-black text-emerald-700 text-sm">{horse.wins}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase font-black tracking-wider mb-0.5">Place</span>
                    <span className="font-extrabold text-[#0f172a] text-sm">{horse.places}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[8px] uppercase font-black tracking-wider mb-0.5">Show</span>
                    <span className="font-extrabold text-[#0f172a] text-sm">{horse.thirds}</span>
                  </div>
                  <div>
                    <span className="text-amber-600 block text-[8px] uppercase font-black tracking-wider mb-0.5">Earnings</span>
                    <span className="font-extrabold text-amber-700 text-sm">${horse.careerEarnings}</span>
                  </div>
                </div>

                {/* Sale and interactions block */}
                <div className="p-4 bg-white flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider">Turf Bid Value</span>
                    <span className="text-base font-black text-emerald-600 font-mono">${salePrice}</span>
                  </div>

                  <div>
                    {isConfirmingSale ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => onSellHorse(horse.id, salePrice)}
                          className="bg-red-500 text-white font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] text-[10px] px-3.5 py-1.5 rounded-lg whitespace-nowrap"
                        >
                          SELL NOW
                        </button>
                        <button
                          onClick={() => setSellingConfirmId(null)}
                          className="bg-slate-100 border-2 border-slate-900 text-slate-700 font-black text-[10px] px-3 py-1.5 rounded-lg"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSellingConfirmId(horse.id)}
                        className="text-xs font-black text-slate-950 hover:text-white border-2 border-slate-900 hover:bg-slate-900 px-4 py-2.5 rounded-xl transition-all shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-sm flex items-center gap-1.5 bg-white uppercase tracking-tight"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Sell Stall
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
