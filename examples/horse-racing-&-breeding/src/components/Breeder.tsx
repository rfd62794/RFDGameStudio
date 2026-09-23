/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { Horse } from '../types';
import { SVGRacer } from './SVGRacer';
import { breedHorses, generateRandomHorse, SILK_COLORS } from '../utils';
import { Heart, Sparkles, AlertTriangle, Play, RefreshCw, Layers, Plus, Star, Landmark, Check } from 'lucide-react';

interface BreederProps {
  horses: Horse[];
  funds: number;
  onAddOffspring: (offspring: Horse, cost: number) => void;
}

// Pre-defined high-tier stud/mare options to hire for public breeding
const PUBLIC_STUDS: Horse[] = [
  {
    id: 'stud_gold_sovereign',
    name: 'Gold Sovereign',
    gender: 'Stallion',
    generation: 1,
    speed: 78,
    stamina: 66,
    acceleration: 74,
    temperament: 80,
    colorBody: '#EAB308', // Gold
    colorMane: '#FEF08A',
    colorSocks: '#FEF08A',
    colorJockeySilk: '#EF4444',
    runs: 24,
    wins: 12,
    places: 6,
    thirds: 3,
    careerEarnings: 15400,
    cooldownUntil: 0,
    isPlayerOwned: false,
    price: 550 // Stud Fee
  },
  {
    id: 'stud_emerald_fury',
    name: 'Emerald Fury',
    gender: 'Stallion',
    generation: 2,
    speed: 86,
    stamina: 84,
    acceleration: 80,
    temperament: 62,
    colorBody: '#059669', // Emerald Green
    colorMane: '#34D399',
    colorSocks: '#059669',
    colorJockeySilk: '#8B5CF6',
    runs: 40,
    wins: 22,
    places: 8,
    thirds: 4,
    careerEarnings: 32000,
    cooldownUntil: 0,
    isPlayerOwned: false,
    price: 1100
  },
  {
    id: 'stud_steel_breeze',
    name: 'Steel Breeze',
    gender: 'Stallion',
    generation: 1,
    speed: 52,
    stamina: 60,
    acceleration: 55,
    temperament: 88,
    colorBody: '#D6D3D1', // White/Gray
    colorMane: '#FAFAF9',
    colorSocks: '#A8A29E',
    colorJockeySilk: '#3B82F6',
    runs: 10,
    wins: 3,
    places: 2,
    thirds: 1,
    careerEarnings: 1800,
    cooldownUntil: 0,
    isPlayerOwned: false,
    price: 180
  },
  {
    id: 'mate_ruby_dream',
    name: 'Ruby Dream',
    gender: 'Mare',
    generation: 2,
    speed: 82,
    stamina: 86,
    acceleration: 82,
    temperament: 72,
    colorBody: '#DC2626', // Ruby Red
    colorMane: '#F87171',
    colorSocks: '#DC2626',
    colorJockeySilk: '#10B981',
    runs: 35,
    wins: 16,
    places: 9,
    thirds: 4,
    careerEarnings: 24500,
    cooldownUntil: 0,
    isPlayerOwned: false,
    price: 1050
  },
  {
    id: 'mate_sassy_spark',
    name: 'Sassy Spark',
    gender: 'Mare',
    generation: 1,
    speed: 46,
    stamina: 42,
    acceleration: 50,
    temperament: 90,
    colorBody: '#91532B', // Bay
    colorMane: '#1C1917',
    colorSocks: '#1C1917',
    colorJockeySilk: '#EC4899',
    runs: 6,
    wins: 1,
    places: 1,
    thirds: 0,
    careerEarnings: 450,
    cooldownUntil: 0,
    isPlayerOwned: false,
    price: 100
  }
];

export const Breeder: React.FC<BreederProps> = ({
  horses,
  funds,
  onAddOffspring
}) => {
  const [selectedSire, setSelectedSire] = useState<Horse | null>(null);
  const [selectedDam, setSelectedDam] = useState<Horse | null>(null);
  
  // Born foal overlay
  const [bornFoal, setBornFoal] = useState<Horse | null>(null);
  const [breedingAnimation, setBreedingAnimation] = useState(false);

  const playerHorses = horses.filter(h => h.isPlayerOwned);
  const playerStallions = playerHorses.filter(h => h.gender === 'Stallion');
  const playerMares = playerHorses.filter(h => h.gender === 'Mare');

  const publicStallions = PUBLIC_STUDS.filter(h => h.gender === 'Stallion');
  const publicMares = PUBLIC_STUDS.filter(h => h.gender === 'Mare');

  // Facilities standard fee: $100 to breed
  const BASE_FACILITY_FEE = 100;
  
  const calculateTotalCost = (): number => {
    if (!selectedSire || !selectedDam) return 0;
    
    let cost = BASE_FACILITY_FEE;
    // Add stud fee if not player owned
    if (!selectedSire.isPlayerOwned) cost += selectedSire.price || 0;
    if (!selectedDam.isPlayerOwned) cost += selectedDam.price || 0;
    
    return cost;
  };

  const totalCost = calculateTotalCost();
  const stableFull = playerHorses.length >= 12;
  const isAffordable = funds >= totalCost;
  const canBreed = selectedSire && selectedDam && isAffordable && !stableFull;

  const handleBreed = () => {
    if (!canBreed || !selectedSire || !selectedDam) return;

    setBreedingAnimation(true);
    
    // Simulate ultrasound/labor sparks
    setTimeout(() => {
      const foal = breedHorses(selectedSire, selectedDam);
      setBornFoal(foal);
      setBreedingAnimation(false);
    }, 2200);
  };

  const handleClaimFoal = () => {
    if (!bornFoal) return;
    onAddOffspring(bornFoal, totalCost);
    setBornFoal(null);
    setSelectedSire(null);
    setSelectedDam(null);
  };

  // Render parent selector panel
  const renderSelector = (
    gender: 'Stallion' | 'Mare',
    currentSelected: Horse | null,
    onSelect: (h: Horse | null) => void,
    playerList: Horse[],
    publicList: Horse[]
  ) => {
    const isSire = gender === 'Stallion';
    return (
      <div className="flex-1 bg-white border-3 border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_#0f172a]" id={`${gender}-selector`}>
        <div>
          <h3 className={`text-sm font-black uppercase flex items-center gap-1.5 border-b-2 border-slate-200 pb-2.5 mb-3 ${
            isSire ? 'text-blue-700' : 'text-rose-700'
          }`}>
            <span>
              {isSire ? '♂ Select Father (Sire)' : '♀ Select Mother (Dam)'}
            </span>
          </h3>

          {currentSelected ? (
            // Selected Horse Panel
            <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-xl flex flex-col gap-3 relative overflow-hidden shadow-[2px_2px_0px_0px_#0f172a]">
              <button 
                onClick={() => onSelect(null)}
                className="absolute top-2.5 right-2 text-slate-800 font-extrabold hover:bg-slate-200 text-[10px] uppercase bg-white px-2.5 py-1 rounded border-2 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a] hover:translate-y-[1px] active:translate-y-[2px] transition-all"
              >
                Change
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-16 h-14 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden shadow-[1px_1px_0px_0px_#0f172a]">
                  <SVGRacer 
                    colorBody={currentSelected.colorBody}
                    colorMane={currentSelected.colorMane}
                    colorSocks={currentSelected.colorSocks}
                    colorJockeySilk={currentSelected.colorJockeySilk}
                    size={52}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2 bg-emerald-100"></div>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase leading-none">{currentSelected.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                    Gen {currentSelected.generation} • {currentSelected.isPlayerOwned ? 'Player Stable' : 'Public Stud'}
                  </p>
                </div>
              </div>

              {/* Mini Stats display */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t-2 border-slate-200 pt-2.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Speed:</span>
                  <span className="text-slate-900 font-black">{currentSelected.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Stamina:</span>
                  <span className="text-slate-900 font-black">{currentSelected.stamina}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Accel:</span>
                  <span className="text-slate-900 font-black">{currentSelected.acceleration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase">Temper:</span>
                  <span className="text-slate-900 font-black">{currentSelected.temperament}</span>
                </div>
              </div>

              {!currentSelected.isPlayerOwned && (
                <div className="flex items-center gap-1 text-[10px] text-amber-800 font-extrabold bg-amber-50 px-2 py-1 rounded-full border border-slate-300 mt-1">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                  Stud Fee: <span className="font-black">${currentSelected.price}</span>
                </div>
              )}
            </div>
          ) : (
            // Listing Panel
            <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
              {/* Player Horses Sublisting */}
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase font-mono tracking-wider block mb-2">
                  YOUR ELIGIBLE STALLS ({playerList.length})
                </span>
                
                {playerList.length === 0 ? (
                  <p className="text-slate-400 font-bold text-[11px] italic pl-1 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
                    No rested {gender.toLowerCase()}s in stables.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {playerList.map(h => {
                      const resting = h.cooldownUntil > Date.now();
                      return (
                        <button
                          key={h.id}
                          disabled={resting}
                          onClick={() => onSelect(h)}
                          className={`flex items-center justify-between p-2 rounded-xl text-left border-2 transition-all ${
                            resting 
                              ? 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed shadow-none' 
                              : 'bg-white hover:bg-slate-50 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[-1px]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-10 h-10 bg-slate-50 rounded border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                              <SVGRacer 
                                colorBody={h.colorBody}
                                colorMane={h.colorMane}
                                colorSocks={h.colorSocks}
                                colorJockeySilk={h.colorJockeySilk}
                                size={32}
                              />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-black text-slate-800 truncate uppercase">{h.name}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase">
                                Avg Stat: {Math.round((h.speed + h.stamina + h.acceleration + h.temperament) / 4)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {resting ? (
                              <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-slate-300 px-1.5 py-0.5 rounded-full font-sans uppercase">RESTING</span>
                            ) : (
                              <span className="text-[8px] text-emerald-800 font-black uppercase border-2 border-slate-900 bg-emerald-50 px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_0px_#0f172a] font-sans">
                                CHOOSE
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Public Stud Offering */}
              <div className="mt-2">
                <span className="text-[10px] text-amber-700 font-black uppercase font-mono tracking-wider block mb-2 flex items-center gap-1 pt-1.5 border-t border-slate-200">
                  <Landmark className="w-3.5 h-3.5 text-amber-600" />
                  PUBLIC REGISTER SELECTIONS
                </span>
                <div className="flex flex-col gap-2">
                  {publicList.map(h => (
                    <button
                      key={h.id}
                      onClick={() => onSelect(h)}
                      className="flex items-center justify-between p-2 rounded-xl text-left border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[-1px] transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-10 h-10 bg-slate-50 rounded border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                          <SVGRacer 
                            colorBody={h.colorBody}
                            colorMane={h.colorMane}
                            colorSocks={h.colorSocks}
                            colorJockeySilk={h.colorJockeySilk}
                            size={32}
                          />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-black text-slate-800 truncate uppercase">{h.name}</div>
                          <div className="text-[9px] text-amber-600 font-bold uppercase">
                            Avg Stat: {Math.round((h.speed + h.stamina + h.acceleration + h.temperament) / 4)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-black text-xs text-amber-800 font-mono bg-yellow-50 border-2 border-slate-900 px-2 py-0.5 rounded-full shadow-[1px_1px_0px_0px_#0f172a]">
                        +${h.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6" id="breeder-viewport">
      
      {/* Birth Success Overlay */}
      {bornFoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border-3 border-slate-900 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_#0f172a] text-center flex flex-col items-center gap-5 relative animate-zoom-in">
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-400/10 rounded-full filter blur-xl"></div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-xl"></div>
            </div>

            <div className="p-4 bg-yellow-400 text-slate-950 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] relative">
              <Sparkles className="w-8 h-8 animate-pulse text-slate-950 fill-current" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">IT&apos;S A HEALTHY BABY FOAL!</h2>
              <p className="text-slate-500 text-xs mt-1.5 font-bold">
                Pedigree connection: bloodlines have integrated successfully.
              </p>
            </div>

            {/* Giant SVG horse graphic of the foal */}
            <div className="w-40 h-28 bg-slate-50 border-2 border-slate-900 rounded-2xl flex items-center justify-center p-2 relative shadow-[3px_3px_0px_0px_#0f172a] overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-4 bg-teal-100"></div>
              <SVGRacer 
                colorBody={bornFoal.colorBody}
                colorMane={bornFoal.colorMane}
                colorSocks={bornFoal.colorSocks}
                colorJockeySilk={bornFoal.colorJockeySilk}
                size={130}
                className="relative z-10"
              />
            </div>

            <div className="w-full text-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{bornFoal.name}</h3>
              <span className={`inline-block bento-badge px-3 py-1 font-extrabold uppercase mt-1.5 text-[9px] ${
                bornFoal.gender === 'Stallion' 
                  ? 'bg-blue-50 text-blue-700 border-2 border-slate-900' 
                  : 'bg-rose-50 text-rose-700 border-2 border-slate-900'
              }`}>
                {bornFoal.gender === 'Stallion' ? '♂ Colt (Stallion)' : '♀ Filly (Mare)'}
              </span>
            </div>

            {/* Genetics values inheritance */}
            <div className="w-full bg-slate-50 p-4 border-2 border-slate-900 rounded-xl flex flex-col gap-2.5 text-xs text-left shadow-[2px_2px_0px_0px_#0f172a]">
              <div className="text-[9px] text-slate-400 font-black pb-1.5 border-b border-slate-200 uppercase tracking-widest text-center">
                Inherited Genetic Attributes
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Speed:</span>
                  <span className="text-rose-600 font-extrabold">{bornFoal.speed}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stamina:</span>
                  <span className="text-emerald-600 font-extrabold">{bornFoal.stamina}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accel:</span>
                  <span className="text-amber-600 font-extrabold">{bornFoal.acceleration}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Temper:</span>
                  <span className="text-sky-600 font-extrabold">{bornFoal.temperament}/100</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 text-center font-bold border-t border-slate-200/80 pt-2">
                Sire: {bornFoal.parents?.fatherName} x Dam: {bornFoal.parents?.motherName}
              </div>
            </div>

            <button
              onClick={handleClaimFoal}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] transition-all uppercase text-xs"
            >
              WELCOME FOAL TO YOUR STABLE
            </button>
          </div>
        </div>
      )}

      {/* Breeding Main view */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Sire Selector */}
        {renderSelector('Stallion', selectedSire, setSelectedSire, playerStallions, publicStallions)}

        {/* Marriage / Lab / Cost Panel */}
        <div className="w-full lg:w-96 bg-white border-3 border-slate-900 rounded-xl p-5 flex flex-col justify-between text-center items-center gap-6 shadow-[4px_4px_0px_0px_#0f172a]" id="marriage-deck">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              Laboratory Integration
            </h3>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed font-bold">
              Pair bloodlines to combine colors and statistics. Child inherits average values of parents with a Gaussian mutation swing (opportunity for elite champions!).
            </p>
          </div>

          <div className="relative my-4">
            {breedingAnimation ? (
              <div className="flex flex-col items-center gap-2">
                <Heart className="w-16 h-16 text-rose-500 animate-ping fill-current" />
                <span className="text-xs text-rose-600 font-black animate-pulse font-mono uppercase tracking-tight">INCUBATING SEEDS...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-[2px_2px_0px_0px_#0f172a] font-black ${
                  selectedSire ? 'bg-blue-50 border-slate-900 text-blue-700' : 'bg-slate-100 border-slate-300 text-slate-400 shadow-none'
                }`}>
                  <span className="text-xs">{selectedSire ? '♂' : 'Sire'}</span>
                </div>
                <div className="text-slate-400 font-black text-xl select-none mx-2">×</div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shadow-[2px_2px_0px_0px_#0f172a] font-black ${
                  selectedDam ? 'bg-rose-50 border-slate-900 text-rose-700' : 'bg-slate-100 border-slate-300 text-slate-400 shadow-none'
                }`}>
                  <span className="text-xs">{selectedDam ? '♀' : 'Dam'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Warnings Block */}
          <div className="w-full bg-slate-50 border-2 border-slate-900 p-4 rounded-xl flex flex-col gap-3 shadow-[2px_2px_0px_0px_#0f172a]">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Facility Laboratory Fee:</span>
              <span className="text-slate-900 font-extrabold">${BASE_FACILITY_FEE}</span>
            </div>
            
            {selectedSire && !selectedSire.isPlayerOwned && (
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Sire Stud Rental Fee:</span>
                <span className="text-amber-700 font-extrabold">+${selectedSire.price}</span>
              </div>
            )}

            {selectedDam && !selectedDam.isPlayerOwned && (
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Dam Stud Rental Fee:</span>
                <span className="text-amber-700 font-extrabold">+${selectedDam.price}</span>
              </div>
            )}

            <div className="border-t-2 border-slate-200 mt-2 pt-2.5 flex justify-between items-center text-xs">
              <span className="font-black text-slate-900 uppercase">Total Cost:</span>
              <span className="text-lg font-black text-emerald-600 font-mono">${totalCost}</span>
            </div>

            {/* Limitations warns */}
            {selectedSire && selectedDam && (
              <div className="mt-2 text-left flex flex-col gap-1.5 border-t-2 border-slate-200 pt-2 text-[10px]">
                {stableFull ? (
                  <p className="text-red-600 font-black flex items-center gap-1.5 leading-tight uppercase font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Stable full (12/12 stalls occupied)
                  </p>
                ) : !isAffordable ? (
                  <p className="text-red-600 font-black flex items-center gap-1.5 leading-tight uppercase font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Insufficient stable balance
                  </p>
                ) : (
                  <p className="text-emerald-700 font-black flex items-center gap-1.5 leading-tight uppercase font-sans">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    Requirements check OK
                  </p>
                )}
                <p className="text-slate-400 font-bold italic leading-relaxed">
                  Notice: Parent horses rest afterwards for 3 minutes.
                </p>
              </div>
            )}
          </div>

          <button
            disabled={!canBreed || breedingAnimation}
            onClick={handleBreed}
            className={`w-full py-3 px-4 transition-all flex items-center justify-center gap-2 ${
              canBreed && !breedingAnimation
                ? 'bento-btn bg-amber-400 border-3 border-slate-900 text-slate-900 font-black cursor-pointer shadow-[3px_3px_0px_0px_#0f172a]'
                : 'bento-btn bg-slate-100 text-slate-400 border-2 border-slate-300 font-black cursor-not-allowed shadow-none'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-current text-slate-900 shrink-0" />
            {breedingAnimation ? 'BIRTHING FOAL...' : 'COMMENCE COUPLING'}
          </button>

        </div>

        {/* Dam Selector */}
        {renderSelector('Mare', selectedDam, setSelectedDam, playerMares, publicMares)}

      </div>
    </div>
  );
};
