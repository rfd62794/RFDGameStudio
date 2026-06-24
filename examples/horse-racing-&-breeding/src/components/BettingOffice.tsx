/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Race, Bet, Horse } from '../types';
import { SVGRacer } from './SVGRacer';
import { Landmark, TrendingUp, Sparkles, AlertTriangle, Play, Flame, HelpCircle, Coins, Plus, DollarSign, ArrowRight } from 'lucide-react';

interface BettingOfficeProps {
  race: Race | null;
  bets: Bet[];
  funds: number;
  stableHorses: Horse[];
  onPlaceBet: (bet: Bet) => void;
  onClearBets: () => void;
  onPurchaseStarter: (gender: 'Stallion' | 'Mare', price: number) => void;
  onStartRace: () => void;
  onSkipAndGenerateNewRace: () => void;
}

export const BettingOffice: React.FC<BettingOfficeProps> = ({
  race,
  bets,
  funds,
  stableHorses,
  onPlaceBet,
  onClearBets,
  onPurchaseStarter,
  onStartRace,
  onSkipAndGenerateNewRace
}) => {
  const [betAmounts, setBetAmounts] = useState<{ [horseId: string]: string }>({});
  const [betTypes, setBetTypes] = useState<{ [horseId: string]: 'Win' | 'Place' }>({});
  const [auctionFeedback, setAuctionFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const triggerError = (msg: string) => {
    setErrorFeedback(msg);
    setTimeout(() => {
      setErrorFeedback(null);
    }, 4000);
  };

  const STARTER_HORSE_COST = 400;

  if (!race) {
    return (
      <div className="bento-card bg-white border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-2xl p-8 text-center flex flex-col items-center gap-4 w-full max-w-md mx-auto mt-12" id="empty-program-office">
        <HelpCircle className="w-12 h-12 text-slate-400 animate-bounce" />
        <div>
          <h3 className="text-slate-900 font-black text-lg uppercase tracking-tight">No Race Programmed</h3>
          <p className="text-slate-500 text-xs mt-1.5 font-bold">
            Generating custom race schedules...
          </p>
        </div>
        <button 
          onClick={onSkipAndGenerateNewRace}
          className="bento-btn bg-slate-900 border-2 border-slate-900 text-white font-black text-xs py-2 px-4 shadow-[2px_2px_0px_0px_#000000]"
        >
          FORCE RACE ASSIGNMENT
        </button>
      </div>
    );
  }

  const handlePlaceSingleBet = (horseId: string, horseName: string, decimalOdds: number) => {
    const rawAmount = betAmounts[horseId];
    const amount = parseInt(rawAmount);
    const type = betTypes[horseId] || 'Win';

    // Validation
    if (isNaN(amount) || amount <= 0) {
      triggerError("Please enter a valid positive wager amount.");
      return;
    }

    if (amount > funds) {
      triggerError("Insufficient account funds to make this wager.");
      return;
    }

    // Place bet pays matching adjusted Place odds if type is 'Place'
    // Place bets are mathematically easier (must rank 1, 2, or 3).
    // Let's offer: Place odds are 35% of Win odds, minimum 1.15
    const finalOdds = type === 'Win' 
      ? decimalOdds 
      : Math.round(Math.max(1.15, decimalOdds * 0.38) * 100) / 100;

    const newBet: Bet = {
      horseId,
      horseName,
      amount,
      type,
      payoutOdds: finalOdds
    };

    onPlaceBet(newBet);
    
    // Clear inputs for this line
    setBetAmounts(prev => ({ ...prev, [horseId]: '' }));
  };

  const setPresetAmount = (horseId: string, value: number) => {
    setBetAmounts(prev => ({ ...prev, [horseId]: value.toString() }));
  };

  const setAllIn = (horseId: string) => {
    setBetAmounts(prev => ({ ...prev, [horseId]: Math.max(0, funds).toString() }));
  };

  const handleBuyReplacement = (gender: 'Stallion' | 'Mare') => {
    if (funds < STARTER_HORSE_COST) {
      triggerError("Insufficient funds to buy a starter horse. Win some bets first!");
      return;
    }

    if (stableHorses.length >= 12) {
      triggerError("Stables are at max capacity (12 slots). Sell some horse to buy replacements.");
      return;
    }

    onPurchaseStarter(gender, STARTER_HORSE_COST);
    setAuctionFeedback(`Congratulations! A G1 Starter ${gender} has arrived in your stables!`);
    setTimeout(() => setAuctionFeedback(null), 3000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6" id="betting-viewport">
      
      {/* Dynamic Alerts */}
      {auctionFeedback && (
        <div className="bg-emerald-50 text-emerald-800 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] rounded-xl px-4 py-3 text-xs font-bold leading-relaxed flex items-center gap-2 uppercase tracking-wide">
          <Sparkles className="w-4.5 h-4.5 text-emerald-600 shrink-0 fill-current animate-pulse" />
          {auctionFeedback}
        </div>
      )}

      {errorFeedback && (
        <div className="bg-rose-50 text-rose-700 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] rounded-xl px-4 py-3 text-xs font-bold leading-relaxed flex items-center gap-2 uppercase tracking-wide">
          <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 fill-current animate-bounce" />
          {errorFeedback}
        </div>
      )}

      {/* Hero Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Core Scheduled Race Info */}
        <div className="lg:col-span-2 bg-white border-3 border-slate-900 p-6 rounded-xl flex flex-col justify-between shadow-[4px_4px_0px_0px_#0f172a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="bento-badge px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border-2 border-slate-900 text-[10px] leading-none">
                UPCOMING FIXTURE
              </span>
              <span className="text-slate-400 text-xs font-mono font-bold">• {race.distance}m Lane Sprint</span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1.5 uppercase">
              {race.name}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1.5 max-w-xl leading-relaxed">
              Classified rating: <span className="font-extrabold text-amber-700">{race.class}</span> program. {race.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border-2 border-slate-900 rounded-xl mt-6 shadow-[2px_2px_0px_0px_#0f172a]">
            <div>
              <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5 leading-none">PURSE DIVISION</span>
              <span className="text-base font-black text-slate-900 font-mono">${race.prizePool}</span>
              <span className="text-[8px] text-slate-400 block mt-1 font-bold">60% Winner • 25% Second • 15% Third</span>
            </div>
            <div className="border-l-2 border-slate-200 pl-4">
              <span className="text-[9px] text-indigo-700 block uppercase font-bold tracking-wider mb-0.5 leading-none">ACTIVE COMMISSION</span>
              <span className="text-sm font-black text-slate-800">FREE ENTRY</span>
              <span className="text-[8px] text-slate-400 block mt-1 font-bold">100% Payout / No House Margin Cut</span>
            </div>
          </div>
        </div>

        {/* Foundation Auction Shop Lot */}
        <div className="bg-white border-3 border-slate-900 p-6 rounded-xl shadow-[4px_4px_0px_0px_#0f172a] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <Coins className="w-4 h-4 text-amber-600" />
              AIS-TURF MARKETPLACE
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-bold leading-relaxed">
              Import a pure G1 Starter Stallion or Mare to jumpstart or safely rebuild your breeding stable roster.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
            <button
              disabled={funds < STARTER_HORSE_COST || stableHorses.length >= 12}
              onClick={() => handleBuyReplacement('Stallion')}
              className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                funds >= STARTER_HORSE_COST && stableHorses.length < 12
                  ? 'bg-white hover:bg-slate-50 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[-1px] cursor-pointer'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              <div>
                <span className="text-xs font-black text-slate-800 block leading-tight">♂ G1 Starter Stallion</span>
                <span className="text-[9px] text-slate-400 block font-bold mt-0.5">Foundation stats: 35 - 55</span>
              </div>
              <span className="text-xs font-black text-emerald-600 font-mono text-center">
                ${STARTER_HORSE_COST}
              </span>
            </button>

            <button
              disabled={funds < STARTER_HORSE_COST || stableHorses.length >= 12}
              onClick={() => handleBuyReplacement('Mare')}
              className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                funds >= STARTER_HORSE_COST && stableHorses.length < 12
                  ? 'bg-white hover:bg-slate-50 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[-1px] cursor-pointer'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              <div>
                <span className="text-xs font-black text-slate-800 block leading-tight">♀ G1 Starter Mare</span>
                <span className="text-[9px] text-slate-400 block font-bold mt-0.5">Foundation stats: 35 - 55</span>
              </div>
              <span className="text-xs font-black text-emerald-600 font-mono text-center">
                ${STARTER_HORSE_COST}
              </span>
            </button>
          </div>

          <p className="text-[9px] text-slate-400 font-bold text-center mt-3 uppercase">
            Stables slots: {stableHorses.length} / 12 slots full
          </p>
        </div>

      </div>

      {/* Program Entries & Bettor Terminal */}
      <div className="bg-white border-3 border-slate-900 rounded-xl p-4 md:p-6 shadow-[4px_4px_0px_0px_#0f172a]" id="bettor-sheets">
        
        <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-emerald-600" />
            Official Race Program Card
          </h3>
          <span className="bento-badge px-2.5 py-1 text-slate-700 bg-slate-100 border-2 border-slate-900 text-[10px] leading-none">
            {race.participants.length} HORSES FIELD
          </span>
        </div>

        {/* Interactive List table */}
        <div className="flex flex-col gap-4">
          {race.participants.map(p => {
            const h = p.horse;
            const currentBetType = betTypes[h.id] || 'Win';
            const value = betAmounts[h.id] || '';
            
            // Odds recalculates based on Win or Place selection
            const displayedOdds = currentBetType === 'Win' 
              ? p.odds 
              : Math.round(Math.max(1.15, p.odds * 0.38) * 100) / 100;

            const matchesMine = h.isPlayerOwned;
            const avgStat = Math.round((h.speed + h.stamina + h.acceleration + h.temperament) / 4);

            return (
              <div 
                key={h.id}
                className={`flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl border-2 transition-all ${
                  matchesMine 
                    ? 'border-indigo-600 bg-indigo-50/15 shadow-[2px_2px_0px_0px_#0f172a]' 
                    : 'border-slate-900 bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_#0f172a]'
                }`}
              >
                {/* Visual Description block */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-16 h-12 bg-slate-50 border-2 border-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 shadow-[1px_1px_0px_0px_#0f172a]">
                    <SVGRacer 
                      colorBody={h.colorBody}
                      colorMane={h.colorMane}
                      colorSocks={h.colorSocks}
                      colorJockeySilk={h.colorJockeySilk}
                      gateNumber={p.gate}
                      size={44}
                    />
                    <span className="absolute bottom-1 right-2 text-[10px] font-black text-slate-900/10 font-bold leading-none">
                      #{p.gate}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        {h.name}
                      </span>
                      {matchesMine && (
                        <span className="px-2 py-0.5 text-[8px] bg-indigo-600 border border-slate-900 text-white font-black rounded-full uppercase leading-none">
                          Your Stable
                        </span>
                      )}
                    </div>
                    {/* Performance details */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-1 uppercase">
                      <span className={h.gender === 'Stallion' ? 'text-blue-600' : 'text-rose-600'}>
                        {h.gender === 'Stallion' ? '♂ Stallion' : '♀ Mare'}
                      </span>
                      <span>•</span>
                      <span>Gen {h.generation}</span>
                      <span>•</span>
                      <span className="text-slate-700 font-extrabold">
                        Wins: {h.wins} / {h.runs} runs
                      </span>
                      <span>•</span>
                      <span>Avg: {avgStat}</span>
                    </div>
                  </div>
                </div>

                {/* Performance stats mini-meters */}
                <div className="hidden sm:flex items-center gap-3 pr-2 border-r-2 border-slate-200">
                  <div className="text-center">
                    <span className="text-[8px] text-slate-400 block font-black uppercase">Speed</span>
                    <span className="text-[11px] font-black text-rose-600">{h.speed}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[8px] text-slate-400 block font-black uppercase">Stam</span>
                    <span className="text-[11px] font-black text-emerald-600">{h.stamina}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[8px] text-slate-400 block font-black uppercase">Accel</span>
                    <span className="text-[11px] font-black text-amber-600">{h.acceleration}</span>
                  </div>
                  <div className="text-center bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded leading-none">
                    <span className="text-[8px] text-slate-400 block font-black uppercase">Temp</span>
                    <span className="text-[11px] font-black text-indigo-600">{h.temperament}</span>
                  </div>
                </div>

                {/* Betting odds section */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 px-4 py-3 rounded-xl border-2 border-slate-900 xl:w-96 select-none justify-between shadow-[2px_2px_0px_0px_#0f172a]">
                  
                  {/* Select bet type Win or Place */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border-2 border-slate-900 h-9">
                      <button
                        onClick={() => setBetTypes(prev => ({ ...prev, [h.id]: 'Win' }))}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                          currentBetType === 'Win' ? 'bg-indigo-600 text-white font-black' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        WIN
                      </button>
                      <button
                        onClick={() => setBetTypes(prev => ({ ...prev, [h.id]: 'Place' }))}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                          currentBetType === 'Place' ? 'bg-indigo-600 text-white font-black' : 'text-slate-500 hover:text-slate-900'
                        }`}
                        title="Pays if horse ranks 1st, 2nd, or 3rd"
                      >
                        PLACE
                      </button>
                    </div>
                  </div>

                  {/* Calculated Payout odds */}
                  <div className="text-center">
                    <span className="text-[8px] text-slate-400 block uppercase leading-tight font-black">Decimal Odds</span>
                    <span className="text-base font-black text-indigo-700 font-mono">
                      {displayedOdds}x
                    </span>
                  </div>

                  {/* Quick wager input panel */}
                  <div className="flex items-center gap-1.5 flex-1 max-w-[170px] justify-end">
                    <div className="relative w-20">
                      <input 
                        type="number" 
                        placeholder="Bet" 
                        value={value}
                        onChange={(e) => setBetAmounts(prev => ({ ...prev, [h.id]: e.target.value }))}
                        className="bg-white border-2 border-slate-900 rounded-lg text-xs font-black text-slate-900 py-1.5 pl-5 pr-1 w-full outline-none focus:border-indigo-600 shadow-inner leading-none"
                        min={1}
                        max={funds}
                      />
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-1.5 top-2.5" />
                    </div>

                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => setPresetAmount(h.id, 50)}
                        className="text-[8px] bg-white border-2 border-slate-900 text-slate-700 hover:bg-slate-100 px-1 rounded shadow-[1px_1px_0px_0px_#000]"
                      >
                        +$50
                      </button>
                      <button
                        onClick={() => setAllIn(h.id)}
                        className="text-[8px] bg-indigo-50 border-2 border-slate-900 text-indigo-700 hover:bg-indigo-100 px-1 rounded shadow-[1px_1px_0px_0px_#000]"
                      >
                        Max
                      </button>
                    </div>

                    <button
                      onClick={() => handlePlaceSingleBet(h.id, h.name, p.odds)}
                      className="bg-slate-950 hover:bg-slate-800 border-2 border-slate-950 font-black text-white text-[10px] px-3.5 py-1.5 rounded-lg transition-all shadow-[1px_1px_0px_0px_#000]"
                    >
                      BET
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom review or summary slips block */}
        <div className="mt-6 border-t-2 border-slate-100 pt-5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="font-mono text-xs">
              <span className="text-slate-400 block text-[9px] uppercase font-black leading-none mb-0.5">COMMITMENT SLIPS</span>
              <span className="text-base font-black text-slate-900 mt-1 block uppercase">
                {bets.length} tickets placed (${bets.reduce((sum, b) => sum + b.amount, 0)})
              </span>
            </div>
            {bets.length > 0 && (
              <button 
                onClick={onClearBets}
                className="text-slate-400 hover:text-red-650 text-xs font-black uppercase hover:underline cursor-pointer"
              >
                Clear Slip
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSkipAndGenerateNewRace}
              className="px-4 py-3 bg-white hover:bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] text-slate-750 hover:text-slate-900 rounded-xl text-xs font-black transition-all hover:translate-y-[-1px]"
              title="Reschedules race entrants if your horses are tired"
            >
              Skip Program (New Field)
            </button>
            
            <button
              onClick={onStartRace}
              id="confirm-bets-btn"
              className="bg-emerald-600 hover:bg-emerald-500 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] text-white font-black text-sm px-6 py-3 rounded-xl transition-all hover:translate-y-[-1px] flex items-center gap-2 uppercase tracking-tight active:translate-y-[1px] active:shadow-sm"
            >
              CONFIRM & GO TO TRACK
              <ArrowRight className="w-4 h-4 text-white shrink-0 font-black" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
