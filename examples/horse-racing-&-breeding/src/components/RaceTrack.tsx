/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Race, RaceParticipant, Bet, Horse } from '../types';
import { SVGRacer } from './SVGRacer';
import { Play, FastForward, SkipForward, Landmark, Trophy, RefreshCw, Activity, MessageSquare } from 'lucide-react';

interface RaceTrackProps {
  race: Race;
  bets: Bet[];
  funds: number;
  onRaceFinish: (results: { rank: number; horseId: string; winEarnings: number }[], updatedRace: Race) => void;
  onClose: () => void;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({
  race,
  bets,
  funds,
  onRaceFinish,
  onClose
}) => {
  const [activeRace, setActiveRace] = useState<Race>({ ...race });
  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x or 3x speed
  const [announcement, setAnnouncement] = useState("Equines are heading to the starting gates...");
  const [raceTime, setRaceTime] = useState(0); // in seconds
  const [resultsDeclared, setResultsDeclared] = useState(false);

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const announcementTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const distance = activeRace.distance;

  // Track coordinates and physics constants
  // Standard speeds: ~14m/s to 18m/s (roughly 50km/h - 65km/h)
  const TICK_RATE_MS = 50; // physics tick every 50ms

  const handleStartRace = () => {
    if (isRunning || resultsDeclared) return;
    setIsRunning(true);
    setAnnouncement("And they're OFF! An explosive head start!");
    startTimeRef.current = Date.now();
  };

  // Skip the race animation entirely, calculate physics immediately to the end and render results
  const handleSkipRace = () => {
    const updatedParticipants = activeRace.participants.map(p => ({ ...p }));
    let timeElapsed = 0;
    
    // Simulating until all horse are finished
    while (updatedParticipants.some(p => !p.isFinished)) {
      timeElapsed += 0.2; // advance in larger chunks
      
      updatedParticipants.forEach(p => {
        if (p.isFinished) return;
        
        // Physics logic duplicate
        const staminaEffect = Math.max(0.3, p.energy / 100);
        // Base average speed of 12 m/s + stats (up to 7 m/s extra)
        const maxCapableSpeed = 12 + (p.horse.speed / 100) * 8;
        
        // Target speed including stamina decay
        const targetSpeed = maxCapableSpeed * staminaEffect;
        
        // Smooth acceleration based on acceleration stat
        const accelerationRate = 0.5 + (p.horse.acceleration / 100) * 1.5;
        p.currentSpeed += (targetSpeed - p.currentSpeed) * accelerationRate * 0.2;
        
        // Random temperament factor
        const tempVariance = (100 - p.horse.temperament) / 200; // lower temperament = bigger swings
        const factor = 1 + (Math.random() - 0.5) * tempVariance;
        
        // Cap speed
        const actualTickSpeed = p.currentSpeed * factor;
        p.currentDistance += actualTickSpeed * 0.2;
        
        // Stamina cost: Sprints burn less stamina per meter than marathons, but time matters
        // Stamina factor: 100 stat means custom low energy drop (0.04/tick), 0 stat means high energy drop (0.12/tick)
        const energyBurn = (0.12 - (p.horse.stamina / 100) * 0.08) * (distance / 1200) * 0.6;
        p.energy = Math.max(0, p.energy - energyBurn);

        p.progress = Math.min(100, (p.currentDistance / distance) * 100);

        if (p.currentDistance >= distance) {
          p.isFinished = true;
          // Calculate realistic finish times around 40s (800m) to 105s (1600m)
          const baseOffset = distance / 16; // e.g. 50s for 800m
          p.finishTime = parseFloat((baseOffset + (100 - p.horse.speed) * 0.15 + (100 - p.horse.stamina) * 0.05 + Math.random() * 2).toFixed(2));
          p.progress = 100;
        }
      });
    }

    // Sort to determine place ranks
    const sortedByTime = [...updatedParticipants].sort((a, b) => (a.finishTime || 999) - (b.finishTime || 999));
    sortedByTime.forEach((p, idx) => {
      p.finalRank = idx + 1;
    });

    // Match back into original gate order
    const finishedParticipants = updatedParticipants.map(orig => {
      const match = sortedByTime.find(s => s.horse.id === orig.horse.id)!;
      return match;
    });

    const finishedRace: Race = {
      ...activeRace,
      participants: finishedParticipants,
      status: 'completed'
    };

    setActiveRace(finishedRace);
    setIsRunning(false);
    setResultsDeclared(true);
    settleBets(finishedRace);
  };

  // Run the interval physics simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRaceTime(prev => prev + (TICK_RATE_MS / 1000) * speedMultiplier);

      setActiveRace(prevRace => {
        const timeStep = (TICK_RATE_MS / 1000) * speedMultiplier;
        const updatedParticipants = prevRace.participants.map(p => {
          if (p.isFinished) return p;

          // Physics Simulation
          // Stamina depletion curve: energy drops over time, affecting relative speed
          const staminaFactor = p.horse.stamina; // 0 to 100
          // depletion speed based on overall race distance is relative
          const energyBurnRate = (0.12 - (staminaFactor / 100) * 0.08) * (distance / 800) * 0.45;
          const newEnergy = Math.max(0, p.energy - energyBurnRate * speedMultiplier);
          
          // Speed calculations
          // Base speed 13m/s + up to 8m/s speed factor based on speed stats
          const baseMaxSpeed = 12.5 + (p.horse.speed / 100) * 8.5;
          
          // Current optimal speed based on current energy reserves
          const energyRatio = 0.45 + (newEnergy / 100) * 0.55; // ranges 45% speed (fully tired) to 100% capacity
          const maxCapableSpeed = baseMaxSpeed * energyRatio;
          
          // Acceleration determines how quickly horse matches their optimal running capability
          const accFactor = 0.08 + (p.horse.acceleration / 100) * 0.12; 
          const targetCap = maxCapableSpeed;
          const currentVelocity = p.currentSpeed + (targetCap - p.currentSpeed) * accFactor * speedMultiplier;
          
          // Consistency / Volatility adjustment via Temperament
          // Low temperament introduces erratic movements (speed bursts or dropouts)
          const tempScore = p.horse.temperament;
          const temperamentVarianceRange = (100 - tempScore) / 120; // up to 8% swing
          const temperamentMultiplier = 1 + (Math.random() - 0.5) * temperamentVarianceRange;
          
          // Final displacement for this tick
          const currentVelocityWithTemperament = currentVelocity * temperamentMultiplier;
          const addedDistance = currentVelocityWithTemperament * timeStep;
          const newDistance = p.currentDistance + addedDistance;
          
          const progressPercent = Math.min(100, (newDistance / distance) * 100);
          const finished = newDistance >= distance;

          return {
            ...p,
            progress: progressPercent,
            currentDistance: finished ? distance : newDistance,
            currentSpeed: currentVelocity,
            energy: newEnergy,
            isFinished: finished,
          };
        });

        // Check if finished and record finish timings
        const currentlyFinishedCount = prevRace.participants.filter(p => p.isFinished).length;
        let finishedIndexTemp = currentlyFinishedCount;

        updatedParticipants.forEach(p => {
          // If they just crossed this tick
          const previouslyFinished = prevRace.participants.find(prevP => prevP.horse.id === p.horse.id)?.isFinished;
          if (p.isFinished && !previouslyFinished) {
            finishedIndexTemp++;
            // Calculate a fair simulated finish time based on actual distance and their speeds
            // Sprints 800m takes around 42-49 seconds. Marathons 1600m takes 90-104 seconds.
            const rawTime = (distance / 16) + (100 - p.horse.speed) * 0.12 + Math.random() * 2;
            p.finishTime = parseFloat((rawTime + (finishedIndexTemp * 0.3)).toFixed(2));
          }
        });

        // Sort to check positions and compute ranks for those who finished
        const anyJustFinished = updatedParticipants.some((p, index) => p.isFinished && !prevRace.participants[index].isFinished);
        if (anyJustFinished) {
          const finishedSub = updatedParticipants.filter(p => p.isFinished).sort((a,b) => (a.finishTime || 999) - (b.finishTime || 999));
          finishedSub.forEach((p, idx) => {
            const indexInOrig = updatedParticipants.findIndex(orig => orig.horse.id === p.horse.id);
            if (indexInOrig !== -1) {
              updatedParticipants[indexInOrig].finalRank = idx + 1;
            }
          });
        }

        // All finished?
        const allDone = updatedParticipants.every(p => p.isFinished);
        if (allDone) {
          clearInterval(interval);
          setIsRunning(false);
          setResultsDeclared(true);
          
          // Make sure final ranks exist for everyone
          const sortedFinal = [...updatedParticipants].sort((a,b) => (a.finishTime || 999) - (b.finishTime || 999));
          sortedFinal.forEach((p, rankIdx) => {
            const index = updatedParticipants.findIndex(x => x.horse.id === p.horse.id);
            updatedParticipants[index].finalRank = rankIdx + 1;
          });

          const completedRace: Race = {
            ...prevRace,
            participants: updatedParticipants,
            status: 'completed'
          };
          
          // Settle bets and trigger completion callbacks
          setTimeout(() => {
            settleBets(completedRace);
          }, 300);
          
          return completedRace;
        }

        return {
          ...prevRace,
          participants: updatedParticipants
        };
      });
    }, TICK_RATE_MS);

    simulationTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier, distance]);

  // Dynamic Race Announcements
  useEffect(() => {
    if (!isRunning) return;

    const phrases = [
      "They are neck and neck in the middle lane!",
      "An outstanding show of raw speed here today!",
      "Approaching the home stretch, stamina is wearing raw!",
      "The crowd is roaring! Who will take the crown?",
      "Unbelievable acceleration from the outside runner!",
      "The jockeys are whipping hard, urging their mounts forward!",
    ];

    const interval = setInterval(() => {
      // Find current leader
      const sortedByPos = [...activeRace.participants].sort((a, b) => b.progress - a.progress);
      const leader = sortedByPos[0];
      const secondPlace = sortedByPos[1];
      const trailer = sortedByPos[sortedByPos.length - 1];

      if (leader.progress >= 95) {
        setAnnouncement(`IT'S AN INCREDIBLE PHOTOSHOOT FINISH! ${leader.horse.name.toUpperCase()} HAS CROSSED THE LINE!`);
      } else if (leader.progress >= 75) {
        setAnnouncement(`Entering the peak home stretch! ${leader.horse.name.toUpperCase()} is leading, with ${secondPlace.horse.name.toUpperCase()} hot on their tail!`);
      } else if (leader.progress >= 40) {
        setAnnouncement(`Passing the halfways! ${leader.horse.name.toUpperCase()} maintains the standard line. ${trailer.horse.name.toUpperCase()} has a lot of ground to cover!`);
      } else {
        setAnnouncement(`${leader.horse.name.toUpperCase()} surges ahead! ${getRandomItem(phrases)}`);
      }
    }, 2800 / speedMultiplier);

    announcementTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [isRunning, activeRace.participants, speedMultiplier]);

  function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Settle bets and update stable funds / career statistics
  const settleBets = (completedRace: Race) => {
    // 1. Sort participants by finish rank
    const standings = [...completedRace.participants].sort((a,b) => (a.finalRank || 9) - (b.finalRank || 9));
    const firstPlace = standings[0];
    const secondPlace = standings[1];
    const thirdPlace = standings[2];

    const resultsForCallback: { rank: number; horseId: string; winEarnings: number }[] = [];

    // Calculate payouts for player-placed bets
    let totalWinnings = 0;
    bets.forEach(bet => {
      let isWinningBet = false;
      if (bet.type === 'Win') {
        isWinningBet = firstPlace.horse.id === bet.horseId;
      } else if (bet.type === 'Place') {
        // Place means 1st, 2nd, or 3rd
        isWinningBet = 
          firstPlace.horse.id === bet.horseId || 
          secondPlace.horse.id === bet.horseId || 
          thirdPlace.horse.id === bet.horseId;
      }

      if (isWinningBet) {
        const winAmount = Math.round(bet.amount * bet.payoutOdds);
        totalWinnings += winAmount;
      }
    });

    // Structure findings
    standings.forEach(p => {
      // Calculate share of prize pool for player-owned horses
      let racePrizeEarnings = 0;
      if (p.horse.isPlayerOwned) {
        if (p.finalRank === 1) racePrizeEarnings = Math.round(completedRace.prizePool * 0.60);
        else if (p.finalRank === 2) racePrizeEarnings = Math.round(completedRace.prizePool * 0.25);
        else if (p.finalRank === 3) racePrizeEarnings = Math.round(completedRace.prizePool * 0.15);
      }

      resultsForCallback.push({
        rank: p.finalRank || 6,
        horseId: p.horse.id,
        winEarnings: racePrizeEarnings
      });
    });

    // Deliver callbacks
    onRaceFinish(resultsForCallback, completedRace);
    
    // Set matching summary announcement
    setAnnouncement(`Race Finished! 1st: ${firstPlace.horse.name}, 2nd: ${secondPlace.horse.name}, 3rd: ${thirdPlace.horse.name}. Your bets returned $${totalWinnings}!`);
  };

  // Sort participants by progress dynamically for live leaderboard display
  const standings = [...activeRace.participants].sort((a, b) => b.progress - a.progress);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto items-stretch animate-fade-in" id="racetrack-viewport">
      {/* Simulation Arena */}
      <div className="flex-1 bg-white border-3 border-slate-900 rounded-xl p-4 md:p-6 shadow-[4px_4px_0px_0px_#0f172a] flex flex-col justify-between" id="arena-deck">
        
        {/* Header Information */}
        <div className="flex flex-wrap justify-between items-start gap-4 border-b-2 border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bento-badge px-2 py-0.5 bg-amber-50 text-amber-700 border-2 border-slate-900 text-xs font-black">
                {activeRace.class}
              </span>
              <span className="text-slate-400 text-xs font-mono font-bold">
                {activeRace.distance}m Turf Lane
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 mt-1 uppercase">
              {activeRace.name}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {activeRace.description}
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_0px_#000]">
            <div>
              <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">PRIZE POOL</span>
              <span className="text-sm font-black text-emerald-600 font-mono">${activeRace.prizePool}</span>
            </div>
            <div className="border-l-2 border-slate-200 h-8"></div>
            <div>
              <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">YOUR BETS</span>
              <span className="text-sm font-black text-indigo-700 font-mono">
                ${bets.reduce((sum, b) => sum + b.amount, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Live Race Track Visualizer */}
        <div className="relative bg-emerald-600 border-3 border-slate-900 rounded-xl p-3 flex flex-col gap-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.15)] overflow-hidden" id="turf-strip">
          {/* Decorative lines & textures */}
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500 to-transparent pointer-events-none opacity-40"></div>
          
          <div className="flex items-center justify-between px-2 text-[10px] text-emerald-100 font-bold font-sans tracking-wide border-b-2 border-emerald-700 pb-1.5 uppercase select-none">
            <span>Starting Gates</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>Finish Line</span>
          </div>

          {/* 6 Race Lanes */}
          {activeRace.participants.map((p, idx) => {
            const progressValue = p.progress;
            const absoluteLeft = `calc(${progressValue}% - ${progressValue === 100 ? '48px' : '40px'})`;
            
            return (
              <div 
                key={p.horse.id} 
                className="relative h-14 md:h-16 w-full bg-emerald-700 border-y-2 border-emerald-850 flex items-center shadow-[inset_0_2px_5px_rgba(0,0,0,0.08)] rounded-md"
              >
                {/* Lane Number on Track */}
                <div className="absolute left-2 text-xl font-black text-emerald-800/40 select-none">
                  {p.gate}
                </div>

                {/* Grid guidelines */}
                <div className="absolute left-1/4 h-full border-r-2 border-emerald-800/15 pointer-events-none"></div>
                <div className="absolute left-2/4 h-full border-r-2 border-emerald-800/15 pointer-events-none"></div>
                <div className="absolute left-3/4 h-full border-r-2 border-emerald-800/15 pointer-events-none"></div>

                {/* Finish line bar */}
                <div className="absolute right-12 top-0 bottom-0 w-2.5 bg-repeating-checkers bg-[length:10px_10px] bg-white opacity-90 shadow-sm border-x-2 border-emerald-950 pointer-events-none"></div>

                {/* Horse on Track */}
                <div 
                  className="absolute transition-all duration-75 ease-out select-none"
                  style={{ 
                    left: progressValue === 0 ? '6px' : absoluteLeft,
                    zIndex: 10 + idx
                  }}
                >
                  <div className="flex flex-col items-center">
                    {/* Energy Bar over Horse */}
                    <div className="w-10 bg-slate-950 h-1.5 rounded-full border border-slate-900 overflow-hidden mb-0.5 shadow-sm">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          p.energy > 50 ? 'bg-emerald-400' : p.energy > 20 ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${p.energy}%` }}
                      ></div>
                    </div>
                    {/* SVG Graphic */}
                    <SVGRacer 
                      colorBody={p.horse.colorBody}
                      colorMane={p.horse.colorMane}
                      colorSocks={p.horse.colorSocks}
                      colorJockeySilk={p.horse.colorJockeySilk}
                      gateNumber={p.gate}
                      isRunning={isRunning && !p.isFinished}
                      runTick={isRunning ? raceTime * 20 : 0}
                      size={55}
                    />
                  </div>
                </div>

                {/* Finished badge overlay */}
                {p.isFinished && (
                  <div className="absolute right-2 bg-white text-[10px] text-slate-800 border-2 border-slate-900 font-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000] z-20 animate-pulse font-mono uppercase">
                    Rank {p.finalRank} ({p.finishTime}s)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Race Announcer & Logs */}
        <div className="bg-slate-50 border-2 border-slate-900 px-4 py-3 rounded-xl mt-4 flex items-center justify-between gap-4 shadow-[2px_2px_0px_0px_#0f172a]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-indigo-50 border border-slate-200 text-indigo-700 ${isRunning ? 'animate-pulse' : ''}`}>
              <MessageSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-black uppercase text-slate-400 block leading-none">RACE COMMENTARY</span>
              <p className="text-sm font-black text-slate-800 mt-1 italic">
                "{announcement}"
              </p>
            </div>
          </div>
          {isRunning && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000]">
              <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-sm text-slate-800 font-extrabold font-mono">
                {raceTime.toFixed(1)}s
              </span>
            </div>
          )}
        </div>

        {/* Dash Controls */}
        <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-2">
            {!isRunning && !resultsDeclared && (
              <button
                onClick={handleStartRace}
                id="start-race-btn"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] text-white font-black px-6 py-3 rounded-xl text-sm transition-all hover:translate-y-[-1px] uppercase tracking-tight active:translate-y-[1px] active:shadow-sm"
              >
                <Play className="w-4 h-4 fill-current text-white" />
                BANG! START RACE
              </button>
            )}

            {isRunning && (
              <div className="flex items-center gap-1.5 bg-white border-2 border-slate-900 rounded-xl p-1 shadow-[2px_2px_0px_0px_#000]">
                <button
                  onClick={() => setSpeedMultiplier(1)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                    speedMultiplier === 1 ? 'bg-indigo-600 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-950 font-bold'
                  }`}
                >
                  1x Speed
                </button>
                <button
                  onClick={() => setSpeedMultiplier(3)}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                    speedMultiplier === 3 ? 'bg-indigo-600 text-white shadow-sm font-black animate-pulse' : 'text-slate-500 hover:text-slate-950 font-bold'
                  }`}
                >
                  3x Speed
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!resultsDeclared && (
              <button
                onClick={handleSkipRace}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] text-slate-700 px-4 py-2.5 rounded-xl text-xs font-black transition-all hover:translate-y-[-1px]"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip Animation
              </button>
            )}

            {resultsDeclared && (
              <button
                onClick={onClose}
                id="close-race-btn"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] text-white font-black px-6 py-3 rounded-xl text-sm transition-all hover:translate-y-[-1px] uppercase tracking-tight active:translate-y-[1px] active:shadow-sm"
              >
                CONTINUE TO STABLE
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Side Standings Log (Bento Style) */}
      <div className="w-full lg:w-80 flex flex-col gap-6" id="standings-deck">
        
        {/* Live Leaderboard */}
        <div className="bg-white border-3 border-slate-900 rounded-xl p-4 md:p-5 shadow-[4px_4px_0px_0px_#0f172a] flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                {isRunning ? 'Live positions' : resultsDeclared ? 'Contest timings' : 'Starting Grid'}
              </h3>
              <span className="bento-badge px-2.5 py-0.5 text-slate-700 bg-slate-100 border-2 border-slate-900 text-[10px] leading-none">
                {activeRace.participants.length} Racers
              </span>
            </div>

            {/* Grid listings */}
            <div className="flex flex-col gap-2">
              {standings.map((p, idx) => {
                const isWinner = resultsDeclared && p.finalRank === 1;
                const isPlayer = p.horse.isPlayerOwned;
                
                return (
                  <div 
                    key={p.horse.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all shadow-[1px_1px_0px_0px_#000] ${
                      isWinner 
                        ? 'bg-amber-50 border-amber-600 text-amber-950' 
                        : isPlayer 
                        ? 'bg-indigo-50/20 border-indigo-500 text-slate-800' 
                        : 'bg-white border-slate-900 text-slate-800'
                    }`}
                  >
                    {/* Rank indicator */}
                    <div className={`w-6 h-6 flex items-center justify-center font-black rounded text-[10px] border border-slate-900 shadow-sm ${
                      idx === 0 
                        ? 'bg-amber-400 text-slate-950' 
                        : idx === 1 
                        ? 'bg-slate-200 text-slate-950' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.isFinished ? p.finalRank : idx + 1}
                    </div>

                    {/* Color dot */}
                    <div 
                      className="w-4 h-4 rounded-full border border-slate-900 flex items-center justify-center text-[8px] font-black text-white shadow-sm font-mono"
                      style={{ backgroundColor: p.horse.colorBody }}
                    >
                      {p.gate}
                    </div>

                    {/* Horse & Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs truncate text-slate-900 uppercase">
                          {p.horse.name}
                        </span>
                        {isPlayer && (
                          <span className="px-1.5 py-0.5 text-[7px] bg-indigo-600 text-white border border-slate-900 font-extrabold rounded-full leading-none">
                            MINE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        <span>Odds: {p.odds}x</span>
                        <span>•</span>
                        <span>{Math.round(p.progress)}% progress</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Betting Slip breakdown for this race */}
          <div className="mt-6 border-t-2 border-slate-100 pt-4">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-indigo-600" />
              Committed Tickets ({bets.length})
            </h4>
            
            {bets.length === 0 ? (
              <p className="text-slate-450 text-[11px] italic font-bold">
                No active betting coupons for this race.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {bets.map((bet, idx) => {
                  let isSettledWinning = false;
                  if (resultsDeclared) {
                    const finishedRank = activeRace.participants.find(p => p.horse.id === bet.horseId)?.finalRank;
                    if (bet.type === 'Win' && finishedRank === 1) isSettledWinning = true;
                    if (bet.type === 'Place' && finishedRank && finishedRank <= 3) isSettledWinning = true;
                  }

                  return (
                    <div key={idx} className="bg-slate-50 border-2 border-slate-900 p-2.5 rounded-lg flex items-center justify-between text-xs text-slate-800 shadow-[1px_1px_0px_0px_#000] font-bold">
                      <div>
                        <div className="font-extrabold text-slate-900 truncate w-32 uppercase">
                          {bet.horseName}
                        </div>
                        <div className="text-[9px] text-slate-400 font-block uppercase">
                          {bet.type} @ {bet.payoutOdds}x
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-900 font-black">${bet.amount}</div>
                        {resultsDeclared && (
                          <div className={`text-[10px] font-black uppercase ${isSettledWinning ? 'text-emerald-700' : 'text-red-650'}`}>
                            {isSettledWinning ? `+$${Math.round(bet.amount * bet.payoutOdds)}` : 'Lost'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
