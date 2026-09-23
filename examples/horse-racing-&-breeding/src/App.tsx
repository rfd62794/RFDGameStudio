/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Horse, Race, Bet, GameState } from './types';
import { generateRandomHorse, createNewRace } from './utils';
import { Stable } from './components/Stable';
import { Breeder } from './components/Breeder';
import { BettingOffice } from './components/BettingOffice';
import { RaceTrack } from './components/RaceTrack';
import { SVGRacer } from './components/SVGRacer';
import { 
  Trophy, 
  Shield, 
  Heart, 
  History, 
  Coins, 
  DollarSign, 
  RefreshCw, 
  HelpCircle, 
  Landmark, 
  Activity, 
  Settings, 
  BookmarkCheck, 
  Moon,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Seeding standard foundation horses if local storage doesn't exist
const initialStarterHorses = (): Horse[] => {
  return [
    {
      id: 'horse_starter_sire',
      name: 'Vanguard Spirit',
      gender: 'Stallion',
      generation: 1,
      speed: 48,
      stamina: 52,
      acceleration: 45,
      temperament: 70,
      colorBody: '#A15C21', // Chestnut
      colorMane: '#1C1917',
      colorSocks: '#A15C21',
      colorJockeySilk: '#EF4444', // Red
      runs: 0,
      wins: 0,
      places: 0,
      thirds: 0,
      careerEarnings: 0,
      cooldownUntil: 0,
      isPlayerOwned: true,
      price: 400
    },
    {
      id: 'horse_starter_dam',
      name: 'Starlight Dream',
      gender: 'Mare',
      generation: 1,
      speed: 44,
      stamina: 56,
      acceleration: 50,
      temperament: 78,
      colorBody: '#FAFAF9', // Albino/White-silvery
      colorMane: '#FAFAF9',
      colorSocks: '#FAFAF9',
      colorJockeySilk: '#3B82F6', // Blue
      runs: 0,
      wins: 0,
      places: 0,
      thirds: 0,
      careerEarnings: 0,
      cooldownUntil: 0,
      isPlayerOwned: true,
      price: 400
    }
  ];
};

export default function App() {
  const [funds, setFunds] = useState<number>(1000);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [activeTab, setActiveTab] = useState<'stable' | 'betting' | 'breeder' | 'history'>('stable');
  const [raceHistory, setRaceHistory] = useState<any[]>([]);
  const [ticker, setTicker] = useState<number>(0);
  const [isRacingActive, setIsRacingActive] = useState<boolean>(false);

  // Safe wrapper for localStorage access in sandboxed contexts
  const safeGetLocalStorage = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
      return null;
    }
  };

  const safeSetLocalStorage = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
  };

  // Load state on mount
  useEffect(() => {
    try {
      const stored = safeGetLocalStorage('turf_pedigree_state_save_v1');
      if (stored) {
        const parsed: GameState = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.horses) && parsed.horses.length > 0) {
          // Robust mapping of horses to guarantee every expected property has a safe default value
          const validatedHorses: Horse[] = parsed.horses.map((raw: any, index: number): Horse => {
            return {
              id: typeof raw.id === 'string' ? raw.id : `horse_valid_${index}_${Math.random().toString(36).substring(2, 6)}`,
              name: typeof raw.name === 'string' ? raw.name : 'Unknown Equine',
              gender: raw.gender === 'Mare' ? 'Mare' : 'Stallion',
              generation: typeof raw.generation === 'number' ? raw.generation : 1,
              speed: typeof raw.speed === 'number' ? raw.speed : 50,
              stamina: typeof raw.stamina === 'number' ? raw.stamina : 50,
              acceleration: typeof raw.acceleration === 'number' ? raw.acceleration : 50,
              temperament: typeof raw.temperament === 'number' ? raw.temperament : 50,
              colorBody: typeof raw.colorBody === 'string' ? raw.colorBody : '#A15C21',
              colorMane: typeof raw.colorMane === 'string' ? raw.colorMane : '#1C1917',
              colorSocks: typeof raw.colorSocks === 'string' ? raw.colorSocks : '#A15C21',
              colorJockeySilk: typeof raw.colorJockeySilk === 'string' ? raw.colorJockeySilk : '#EF4444',
              runs: typeof raw.runs === 'number' ? raw.runs : 0,
              wins: typeof raw.wins === 'number' ? raw.wins : 0,
              places: typeof raw.places === 'number' ? raw.places : 0,
              thirds: typeof raw.thirds === 'number' ? raw.thirds : 0,
              careerEarnings: typeof raw.careerEarnings === 'number' ? raw.careerEarnings : 0,
              cooldownUntil: typeof raw.cooldownUntil === 'number' ? raw.cooldownUntil : 0,
              isPlayerOwned: typeof raw.isPlayerOwned === 'boolean' ? raw.isPlayerOwned : true,
              price: typeof raw.price === 'number' ? raw.price : 400
            };
          });

          setFunds(typeof parsed.funds === 'number' ? parsed.funds : 1000);
          setHorses(validatedHorses);
          
          // Sanitize raceHistory to ensure results and inner values are safe and correct structures
          const rawHistory = Array.isArray(parsed.raceHistory) ? parsed.raceHistory : [];
          const validatedHistory = rawHistory.filter((h: any) => h && typeof h.raceName === 'string').map((h: any) => {
            return {
              raceName: h.raceName,
              distance: typeof h.distance === 'number' ? h.distance : 1000,
              prizePool: typeof h.prizePool === 'number' ? h.prizePool : 500,
              results: Array.isArray(h.results) ? h.results.map((r: any) => ({
                rank: typeof r.rank === 'number' ? r.rank : 1,
                horseName: typeof r.horseName === 'string' ? r.horseName : 'Unknown Equine',
                isPlayerOwned: typeof r.isPlayerOwned === 'boolean' ? r.isPlayerOwned : false,
                payout: typeof r.payout === 'number' ? r.payout : 0
              })) : [],
              timestamp: typeof h.timestamp === 'number' ? h.timestamp : Date.now()
            };
          });
          setRaceHistory(validatedHistory);
          
          // Re-generate race based on loaded stats
          const nextFixture = createNewRace([], validatedHorses);
          setCurrentRace(nextFixture);
          return;
        }
      }
    } catch (e) {
      console.error("Local storage load failed", e);
    }

    // Seeding fallback
    const seedHorses = initialStarterHorses();
    setHorses(seedHorses);
    const nextFixture = createNewRace([], seedHorses);
    setCurrentRace(nextFixture);
  }, []);

  // Save state whenever horses or funds alter
  useEffect(() => {
    if (horses.length === 0) return;
    const saveState: GameState = {
      funds,
      horses,
      bets: [],
      currentRace: null,
      raceHistory
    };
    safeSetLocalStorage('turf_pedigree_state_save_v1', JSON.stringify(saveState));
  }, [horses, funds, raceHistory]);

  // Periodic second tick to refresh rest cooldown badges in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Betting Actions
  const handlePlaceBet = (bet: Bet) => {
    setBets(prev => [...prev, bet]);
    setFunds(prev => prev - bet.amount);
  };

  const handleClearBets = () => {
    const totalRefund = bets.reduce((sum, b) => sum + b.amount, 0);
    setFunds(prev => prev + totalRefund);
    setBets([]);
  };

  // Auction Procurement of Replacement Foundation Stock
  const handlePurchaseStarter = (gender: 'Stallion' | 'Mare', price: number) => {
    const starter = generateRandomHorse({
      playerOwned: true,
      minStat: 35,
      maxStat: 55,
      generation: 1,
      gender
    });

    setHorses(prev => [...prev, starter]);
    setFunds(prev => prev - price);
  };

  // Stable Actions
  const handleRenameHorse = (id: string, newName: string) => {
    setHorses(prev => prev.map(h => h.id === id ? { ...h, name: newName } : h));
  };

  // Selling a horse back to market
  const handleSellHorse = (id: string, price: number) => {
    setHorses(prev => prev.filter(h => h.id !== id));
    setFunds(prev => prev + price);
  };

  // Breeder coupling output
  const handleAddOffspring = (offspring: Horse, cost: number) => {
    // Deduct cost and save foal
    setFunds(prev => prev - cost);
    setHorses(prev => {
      let updated = [...prev, offspring];
      // Place parents on resting cooldown for 3 minutes (180,000ms)
      const fatherId = offspring.parents?.fatherId;
      const motherId = offspring.parents?.motherId;
      
      return updated.map(h => {
        if (h.id === fatherId || h.id === motherId) {
          return {
            ...h,
            cooldownUntil: Date.now() + 180000 // 3 minutes resting cooldown
          };
        }
        return h;
      });
    });
    // Direct player to Stable to welcome their new equine!
    setActiveTab('stable');
  };

  // Handle Race Simulation outcome settlements
  const handleRaceFinish = (results: { rank: number; horseId: string; winEarnings: number }[], updatedRace: Race) => {
    // standings standings
    const sortedStandings = [...updatedRace.participants].sort((a,b) => (a.finalRank || 9) - (b.finalRank || 9));
    const firstPlace = sortedStandings[0];
    const secondPlace = sortedStandings[1];
    const thirdPlace = sortedStandings[2];

    // Compute bet wins
    let betPayoutTotal = 0;
    bets.forEach(bet => {
      let isWin = false;
      if (bet.type === 'Win') {
        isWin = firstPlace.horse.id === bet.horseId;
      } else if (bet.type === 'Place') {
        isWin = 
          firstPlace.horse.id === bet.horseId || 
          secondPlace.horse.id === bet.horseId || 
          thirdPlace.horse.id === bet.horseId;
      }

      if (isWin) {
        betPayoutTotal += Math.round(bet.amount * bet.payoutOdds);
      }
    });

    // Update player horse statistics and earnings
    setHorses(prev => {
      return prev.map(h => {
        const participantResult = results.find(r => r.horseId === h.id);
        
        if (participantResult) {
          // Horse ran in the race! Put them on a 1.5 minute (90,000ms) resting cooldown
          const isWinner = participantResult.rank === 1;
          const isPlace = participantResult.rank === 2;
          const isThird = participantResult.rank === 3;

          return {
            ...h,
            runs: h.runs + 1,
            wins: h.wins + (isWinner ? 1 : 0),
            places: h.places + (isPlace ? 1 : 0),
            thirds: h.thirds + (isThird ? 1 : 0),
            careerEarnings: h.careerEarnings + participantResult.winEarnings,
            cooldownUntil: Date.now() + 90000 // resting cooldown (90s)
          };
        }
        return h;
      });
    });

    // Add prize pool earnings
    const horsePrizePoolEarnings = results.reduce((sum, res) => sum + res.winEarnings, 0);
    const netGains = betPayoutTotal + horsePrizePoolEarnings;
    setFunds(prev => prev + netGains);

    // Record race results log
    const simpleRecord = {
      raceName: updatedRace.name,
      distance: updatedRace.distance,
      prizePool: updatedRace.prizePool,
      results: sortedStandings.map(p => ({
        rank: p.finalRank || 6,
        horseName: p.horse.name,
        isPlayerOwned: p.horse.isPlayerOwned,
        payout: p.horse.isPlayerOwned 
          ? (p.finalRank === 1 ? Math.round(updatedRace.prizePool * 0.6) : p.finalRank === 2 ? Math.round(updatedRace.prizePool * 0.25) : p.finalRank === 3 ? Math.round(updatedRace.prizePool * 0.15) : 0)
          : 0
      })),
      timestamp: Date.now()
    };
    
    setRaceHistory(prev => [simpleRecord, ...prev]);
    setBets([]); // wipe current betslip
  };

  // Settle active racetrack and schedule upcoming Program
  const handleCloseRaceTrackView = () => {
    setIsRacingActive(false);
    // Auto-generate fresh scheduled race
    const nextFixture = createNewRace([], horses);
    setCurrentRace(nextFixture);
    setActiveTab('stable');
  };

  const handleSkipAndGenerateNewRace = () => {
    const nextFixture = createNewRace([], horses);
    setCurrentRace(nextFixture);
    setBets([]); // wipe old active bets as line-up changes!
  };

  // Quick failsafe check: if player completely goes broke, offer an instant $200 Emergency grant!
  const hasNoFundsOrHorses = funds < 50 && horses.filter(h => h.isPlayerOwned).length === 0;
  
  const handleClaimEmergencyGrant = () => {
    setFunds(250);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between font-sans selection:bg-yellow-200" id="root-layout">
      
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-3 border-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-18 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] rounded-lg text-white">
              <Trophy className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-black tracking-tight text-slate-900 leading-none">
                DERBY SIM <span className="text-emerald-600 text-[10px] md:text-xs uppercase font-extrabold ml-1">v1.2</span>
              </h1>
              <span className="text-[9px] text-slate-400 font-extrabold tracking-widest block mt-1 uppercase">
                CHAMPIONSHIP SEASON • RACING & BREEDING
              </span>
            </div>
          </div>

          {/* Central Tabs navigation */}
          {!isRacingActive && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 border-2 border-slate-900 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('stable')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'stable'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                My Stable
              </button>
              <button
                onClick={() => setActiveTab('betting')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'betting'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Betting & Track
              </button>
              <button
                onClick={() => setActiveTab('breeder')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'breeder'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Breeding Lab
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Heritage Logs
              </button>
            </nav>
          )}

          {/* User Account / Wealth indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border-2 border-slate-900 px-3 md:px-4 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_#0f172a] font-bold text-slate-900">
              <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-slate-900 flex items-center justify-center font-black text-slate-900 text-xs">
                $
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[8px] uppercase font-black block leading-none">STABLE BANK</span>
                <span className="text-xs md:text-sm font-black text-slate-900 leading-none">${funds.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </header>      {/* Main Core Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col justify-start">
        
        {/* Emergency Grant warning bar */}
        {hasNoFundsOrHorses && (
          <div className="bg-rose-50 border-3 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] rounded-xl p-6 mb-8 text-center max-w-md mx-auto flex flex-col items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg border-2 border-slate-900">
              <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">Bankruptcy Protection</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                You have lost all stable funding and racing inventory. Claim an automated $250 grant to restock your stable!
              </p>
            </div>
            <button
              onClick={handleClaimEmergencyGrant}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] transition-all uppercase"
            >
              CASH OUT $250 GRANT
            </button>
          </div>
        )}

        {/* Dynamic Mobile Navigator tabs */}
        {!isRacingActive && !hasNoFundsOrHorses && (
          <div className="flex md:hidden bg-slate-100 border-2 border-slate-900 rounded-xl p-1 mb-6 flex-wrap justify-center">
            <button
              onClick={() => setActiveTab('stable')}
              className={`flex-1 min-w-[80px] text-center py-2 text-[10px] font-black rounded-lg transition-all ${
                activeTab === 'stable' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              Stable
            </button>
            <button
              onClick={() => setActiveTab('betting')}
              className={`flex-1 min-w-[80px] text-center py-2 text-[10px] font-black rounded-lg transition-all ${
                activeTab === 'betting' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              Betting
            </button>
            <button
              onClick={() => setActiveTab('breeder')}
              className={`flex-1 min-w-[80px] text-center py-2 text-[10px] font-black rounded-lg transition-all ${
                activeTab === 'breeder' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              Breed
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 min-w-[80px] text-center py-2 text-[10px] font-black rounded-lg transition-all ${
                activeTab === 'history' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              History
            </button>
          </div>
        )}

        {/* Dynamic Switch Component views */}
        <div className="flex-1">
          {isRacingActive && currentRace ? (
            <RaceTrack 
              race={currentRace}
              bets={bets}
              funds={funds}
              onRaceFinish={handleRaceFinish}
              onClose={handleCloseRaceTrackView}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full"
              >
                {activeTab === 'stable' && (
                  <Stable 
                    horses={horses}
                    onRenameHorse={handleRenameHorse}
                    onSellHorse={handleSellHorse}
                  />
                )}

                {activeTab === 'betting' && (
                  <BettingOffice 
                    race={currentRace}
                    bets={bets}
                    funds={funds}
                    stableHorses={horses}
                    onPlaceBet={handlePlaceBet}
                    onClearBets={handleClearBets}
                    onPurchaseStarter={handlePurchaseStarter}
                    onStartRace={() => setIsRacingActive(true)}
                    onSkipAndGenerateNewRace={handleSkipAndGenerateNewRace}
                  />
                )}

                {activeTab === 'breeder' && (
                  <Breeder 
                    horses={horses}
                    funds={funds}
                    onAddOffspring={handleAddOffspring}
                  />
                )}

                {activeTab === 'history' && (
                  <div className="w-full max-w-4xl mx-auto bg-white border-3 border-slate-900 rounded-xl p-5 md:p-6 shadow-[4px_4px_0px_0px_#0f172a]" id="heritage-logs">
                    <div className="flex justify-between items-center border-b-2 border-slate-200 pb-4 mb-6">
                      <div>
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                          <History className="w-5 h-5 text-emerald-600" />
                          Track Records & Payouts
                        </h2>
                        <span className="text-xs text-slate-500 font-bold mt-1 block">Historical logs of your breeding pedigree and lineage performance.</span>
                      </div>
                    </div>

                    {raceHistory.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 font-bold italic text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        No official runs completed yet. Guide your stallions to the track gates!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {raceHistory.map((h, index) => (
                           <div key={index} className="bg-slate-50 border-2 border-slate-900 p-4 rounded-xl flex flex-col gap-3 shadow-[2px_2px_0px_0px_#0f172a]">
                             <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                               <div>
                                 <span className="text-slate-900 font-black text-sm uppercase tracking-tight">{h.raceName}</span>
                                 <span className="text-[10px] text-slate-500 font-bold ml-2 uppercase bg-slate-200 px-2 py-0.5 rounded-full">• {h.distance}m Lane</span>
                               </div>
                               <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-950 px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_0px_#0f172a]">
                                 Purse: ${h.prizePool}
                               </span>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                               <div>
                                 <div className="text-slate-400 uppercase font-black text-[9px] tracking-wider mb-2">Official Standings</div>
                                 <div className="flex flex-col gap-1.5 font-bold">
                                   {h.results.slice(0, 3).map((r: any, rIdx: number) => (
                                     <div key={rIdx} className="flex justify-between items-center text-slate-700">
                                       <span className="flex items-center gap-1.5">
                                         <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-black text-[9px] border border-slate-900">#{r.rank}</span> 
                                         <span className="text-slate-900 font-black text-xs">{r.horseName}</span>
                                         {r.isPlayerOwned && <span className="text-[8px] uppercase tracking-wider bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded-full">Player</span>}
                                       </span>
                                       {r.payout > 0 && <span className="text-emerald-600 font-black font-mono">+${r.payout}</span>}
                                     </div>
                                   ))}
                                 </div>
                               </div>
                               <div className="border-t md:border-t-0 md:border-l border-slate-200 flex items-center justify-center md:pl-4">
                                 <span className="text-[11px] text-slate-400 text-center font-bold font-sans">
                                   Track event completed. Pedigree lineage stats saved permanently.
                                 </span>
                               </div>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </main>

      {/* Styled Footer */}
      <footer className="bg-white border-t-3 border-slate-900 py-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-tight" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-slate-800">© 2026 DERBY SIMULATOR. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-4 font-black">
            <span className="hover:text-amber-600 transition-all cursor-pointer">GAME RULES</span>
            <span className="text-slate-300">•</span>
            <span className="hover:text-amber-600 transition-all cursor-pointer">PEDIGREE GENETICS DATA</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
