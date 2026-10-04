import { Dispatch, SetStateAction } from 'react';
import { LabState, LogEntry, SlimeColor } from '../types';
import {
  generateContract,
  getRandomMelancholicLog,
  resolveDispatch,
  calculateStats,
  applyDispatchStabilityHook,
  resolveMediation,
  createSeedSlime,
  resolveExploration,
  updatePlanetSupplyAndPressure,
  calculateWorkerIncome,
  isSlimeInMatchingCultureEnvironment,
  checkWildsUnlockCondition
} from '../gameLogic';

interface UseCycleActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
  setActiveDispatchReport: (report: any) => void;
  setActiveMediationReport: (report: any) => void;
  setActiveExplorationReport: (report: any) => void;
}

export function useCycleActions({
  state,
  setState,
  setActiveDispatchReport,
  setActiveMediationReport,
  setActiveExplorationReport
}: UseCycleActionsProps) {

  // Advance manual Lab Cycle (Sleeping / Passing time)
  const handleAdvanceCycle = () => {
    setState(prev => {
      const nextCycle = prev.cycle + 1;
      
      // Update corporate contracts
      const updatedContracts = prev.contracts
        .map(c => ({ ...c, cyclesRemaining: c.cyclesRemaining - 1 }))
        .filter(c => c.cyclesRemaining > 0); // Remove expired ones

      // Maybe spawn a new corporate contract (cap of 4)
      const shouldSpawnContract = updatedContracts.length < 4 && (Math.random() < 0.65 || updatedContracts.length < 2);
      if (shouldSpawnContract) {
        updatedContracts.push(generateContract(nextCycle));
      }

      // Add a standard log about cycle progression
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const logs: LogEntry[] = [
        ...prev.logs,
        {
          id: `log_cycle_${Date.now()}`,
          cycle: nextCycle,
          timestamp: timeStr,
          text: `CYCLE ADVANCED: Lab cycle ${nextCycle} initiated. All energy cells replenished.`,
          type: 'system'
        }
      ];

      // Occasional random astronaut diary log (45% chance per cycle shift)
      if (Math.random() < 0.45) {
        logs.push(getRandomMelancholicLog(nextCycle));
      }

      // If there is an active dispatch, resolve it or tick down its cycle limit
      let nextDispatch = prev.activeDispatch;
      let newCredits = prev.credits;
      let newSlimes = [...prev.slimes];
      let newZones = [...prev.zones];
      let nextRegion = prev.planetRegion ? { ...prev.planetRegion, nodes: prev.planetRegion.nodes.map(n => ({ ...n, pressure: { ...n.pressure } })) } : null;
 
      if (nextDispatch && (nextDispatch.status === 'active' || nextDispatch.status === 'completed')) {
        const zone = prev.zones.find(z => z.id === nextDispatch!.zoneId)!;
        const partySlimes = prev.slimes.filter(s => nextDispatch!.slimeIds.includes(s.id));
        
        const result = resolveDispatch(zone, partySlimes);
        
        // Distribute XP and handle level up
        newSlimes = prev.slimes.map(s => {
          if (nextDispatch!.slimeIds.includes(s.id)) {
            let nextXp = s.xp + result.xpGained;
            let nextLevel = s.level;
            let currentStats = { ...s.stats };
 
            const xpNeeded = s.level * 100;
            if (nextXp >= xpNeeded) {
              nextXp -= xpNeeded;
              nextLevel += 1;
              currentStats = calculateStats(s.color, s.pattern, nextLevel);
            }
 
            return {
              ...s,
              xp: nextXp,
              level: nextLevel,
              stats: currentStats,
              role: 'idle' as const, // return to idle
            };
          }
          return s;
        });
 
        // Award Credits
        newCredits += result.creditsGained;
 
        // Unlock next zones if clear successful
        if (result.success) {
          newZones = prev.zones.map(z => {
            if (z.id === zone.id) {
              return { ...z, isFirstClearCompleted: true };
            }
            if (z.id === result.firstClearUnlockedZoneId) {
              return { ...z, isUnlocked: true };
            }
            return z;
          });
 
          // Dispatch -> Planet stability hook
          let hookLogText = "";
          if (nextRegion) {
            const hookRes = applyDispatchStabilityHook(nextRegion.nodes, zone.requiredColor);
            nextRegion.nodes = hookRes.updatedNodes;
            if (hookRes.appliedNodeName) {
              hookLogText = ` Stability hook triggered: [${hookRes.appliedNodeName}] strength increased (+0.05).`;
            }
          }
 
          logs.push({
            id: `log_comb_res_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `DISPATCH SUCCESS: Team cleared [${zone.name}]. Credits received (+${result.creditsGained}).${hookLogText}`,
            type: 'combat'
          });
        } else {
          logs.push({
            id: `log_comb_res_fail_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `DISPATCH ALERT: Team retreated from [${zone.name}]. Structural depletion sustained.`,
            type: 'combat'
          });
        }
 
        // Setup details to display in UI immediately
        setActiveDispatchReport({
          logs: result.victoryLog,
          success: result.success,
          xp: result.xpGained,
          credits: result.creditsGained
        });
 
        nextDispatch = null; // cleared
      }
 
      // --- Planet Mediation Mission Resolution ---
      let nextMediation = prev.activeMediation;
 
      if (nextMediation) {
        const targetNode = nextRegion ? nextRegion.nodes.find(n => n.id === nextMediation!.targetNodeId) : null;
        if (targetNode) {
          const partySlimes = prev.slimes.filter(s => nextMediation!.slimeIds.includes(s.id));
          const result = resolveMediation(targetNode, partySlimes);
 
          // Dominant color determination (fallback to Red if empty)
          let dominantColor: SlimeColor = 'Red';
          if (partySlimes.length > 0) {
            const colorCounts: Record<SlimeColor, number> = {} as any;
            partySlimes.forEach(s => { colorCounts[s.color] = (colorCounts[s.color] || 0) + 1; });
            let maxCount = 0;
            (Object.keys(colorCounts) as SlimeColor[]).forEach(c => {
              if (colorCounts[c]! > maxCount) {
                maxCount = colorCounts[c]!;
                dominantColor = c;
              }
            });
          }
 
          // Award XP and return delegates to idle
          newSlimes = newSlimes.map(s => {
            if (nextMediation!.slimeIds.includes(s.id)) {
              let nextXp = s.xp + (result.success ? 45 : 20);
              let nextLevel = s.level;
              let currentStats = { ...s.stats };
 
              const xpNeeded = s.level * 100;
              if (nextXp >= xpNeeded) {
                nextXp -= xpNeeded;
                nextLevel += 1;
                currentStats = calculateStats(s.color, s.pattern, nextLevel);
              }
 
              return {
                ...s,
                xp: nextXp,
                level: nextLevel,
                stats: currentStats,
                role: 'idle' as const,
              };
            }
            return s;
          });
 
          // Update target node owner and strength in region
          nextRegion.nodes = nextRegion.nodes.map(node => {
            if (node.id === targetNode.id) {
              let newOwner = node.ownerColor;
              let newStrength = node.strength;
              let newPressure = { ...node.pressure };
 
              if (result.success) {
                if (newOwner === null) {
                  newOwner = dominantColor;
                  newStrength = Math.min(1.0, result.stabilityChange / 100);
                  newPressure = {}; // reset
                } else {
                  newStrength = Math.min(1.0, node.strength + result.stabilityChange / 100);
                  // clear other pressures
                  Object.keys(newPressure).forEach(k => {
                    if (k !== newOwner) {
                      newPressure[k as SlimeColor] = 0;
                    }
                  });
                }
              } else {
                newStrength = Math.min(1.0, node.strength + result.stabilityChange / 100);
              }
 
              return {
                ...node,
                ownerColor: newOwner,
                strength: parseFloat(newStrength.toFixed(3)),
                pressure: newPressure,
              };
            }
            return node;
          });
 
          logs.push({
            id: `log_med_res_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `MEDIATION CONCLUDED: Delegation at [${targetNode.name}] resolved. Alignment stability adjusted.`,
            type: 'corporate'
          });
 
          setActiveMediationReport({
            logs: result.log,
            success: result.success,
            stabilityChange: result.stabilityChange,
          });
 
          // Trigger Stray arrival for mediation (always mediation-locked)
          // Always free, color matches dominant color involved
          if (newSlimes.length < prev.rosterCap) {
            const stray = createSeedSlime(dominantColor, 'Solid');
            stray.id = `stray_med_${Date.now()}`;
            stray.lockedRole = 'mediation';
            stray.name = `Refugee ${stray.name}`;
            newSlimes.push(stray);
            logs.push({
              id: `log_stray_med_${Date.now()}`,
              cycle: nextCycle,
              timestamp: timeStr,
              text: `STRAY DETECTION: A stray ${dominantColor} specimen fleeing mediation conflict has arrived at containment. lockedRole assigned to MEDIATION.`,
              type: 'corporate'
            });
          } else {
            logs.push({
              id: `log_stray_med_fail_${Date.now()}`,
              cycle: nextCycle,
              timestamp: timeStr,
              text: `STRAY WARNING: A stray ${dominantColor} specimen from mediation conflict tried to seek refuge but containment cells were full.`,
              type: 'system'
            });
          }
        }
        nextMediation = null; // cleared
      }
 
      // --- Planet Exploration Mission Resolution ---
      let nextExploration = prev.activeExploration;
 
      if (nextExploration) {
        const targetNode = nextRegion ? nextRegion.nodes.find(n => n.id === nextExploration!.targetNodeId) : null;
        if (targetNode) {
          const partySlimes = prev.slimes.filter(s => nextExploration!.slimeIds.includes(s.id));
          const result = resolveExploration(targetNode, partySlimes);
 
          // Award XP and return scouts to idle
          newSlimes = newSlimes.map(s => {
            if (nextExploration!.slimeIds.includes(s.id)) {
              let nextXp = s.xp + (result.success ? 45 : 20);
              let nextLevel = s.level;
              let currentStats = { ...s.stats };
 
              const xpNeeded = s.level * 100;
              if (nextXp >= xpNeeded) {
                nextXp -= xpNeeded;
                nextLevel += 1;
                currentStats = calculateStats(s.color, s.pattern, nextLevel);
              }
 
              return {
                ...s,
                xp: nextXp,
                level: nextLevel,
                stats: currentStats,
                role: 'idle' as const,
              };
            }
            return s;
          });
 
          // Update target node discovered status in region if successful
          if (result.success) {
            nextRegion.nodes = nextRegion.nodes.map(node => {
              if (node.id === targetNode.id) {
                return {
                  ...node,
                  discovered: true
                };
              }
              return node;
            });
          }
 
          logs.push({
            id: `log_exp_res_${Date.now()}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: `EXPLORATION CONCLUDED: Scouting expedition at [${targetNode.name}] resolved. ${result.success ? 'Sector revealed.' : 'Mission failed.'}`,
            type: 'corporate'
          });
 
          setActiveExplorationReport({
            logs: result.log,
            success: result.success,
          });
        }
        nextExploration = null; // cleared
      }
 
      // --- Planet Territory Simulation Ticks ---
      if (nextRegion) {
        const prevNodes = nextRegion.nodes.map(n => ({ ...n }));
        const simResult = updatePlanetSupplyAndPressure(nextRegion.nodes);
        nextRegion.nodes = simResult.updatedNodes;
 
        simResult.logs.forEach((simLog, idx) => {
          logs.push({
            id: `log_sim_${Date.now()}_${idx}`,
            cycle: nextCycle,
            timestamp: timeStr,
            text: simLog,
            type: 'system'
          });
        });
 
        // Detect node flips
        nextRegion.nodes.forEach(node => {
          const prevNode = prevNodes.find(n => n.id === node.id);
          if (prevNode && prevNode.ownerColor !== node.ownerColor && node.ownerColor !== null) {
            const flipColor = node.ownerColor;
            // Generate a stray locked to combat (dispatch)
            if (newSlimes.length < prev.rosterCap) {
              const stray = createSeedSlime(flipColor, 'Solid');
              stray.id = `stray_flip_${Date.now()}_${node.id}`;
              stray.lockedRole = 'dispatch';
              stray.name = `Refugee ${stray.name}`;
              newSlimes.push(stray);
              logs.push({
                id: `log_stray_flip_${Date.now()}_${node.id}`,
                cycle: nextCycle,
                timestamp: timeStr,
                text: `STRAY DETECTION: Node [${node.name}] flipped ownership to ${flipColor}. A stray ${flipColor} refugee fled the conflict zone and arrived at containment. lockedRole assigned to COMBAT/DISPATCH.`,
                type: 'combat'
              });
            } else {
              logs.push({
                id: `log_stray_flip_fail_${Date.now()}_${node.id}`,
                cycle: nextCycle,
                timestamp: timeStr,
                text: `STRAY WARNING: Node [${node.name}] flipped ownership to ${flipColor}. A stray tried to seek refuge but containment cells were full.`,
                type: 'system'
              });
            }
          }
        });
      }
 
      // --- Worker Income Calculation ---
      let workerIncomeTotal = 0;
      const workerDetails: string[] = [];
      const hasAutoFeeder = !!prev.hasAutoFeeder;
      const currentNodes = nextRegion ? nextRegion.nodes : [];
 
      newSlimes.forEach(slime => {
        if (slime.lockedRole === 'worker') {
          const income = calculateWorkerIncome(slime, hasAutoFeeder, currentNodes);
          workerIncomeTotal += income;
          const isMatched = isSlimeInMatchingCultureEnvironment(slime, currentNodes);
          workerDetails.push(`${slime.name} (+${income} Cr${isMatched ? ' - Culture Match!' : ''})`);
        }
      });
 
      if (workerIncomeTotal > 0) {
        newCredits += workerIncomeTotal;
        logs.push({
          id: `log_worker_income_${Date.now()}`,
          cycle: nextCycle,
          timestamp: timeStr,
          text: `WORKER INCOME: Lab workers generated +${workerIncomeTotal} Requisition Credits. Details: ${workerDetails.join(', ')}`,
          type: 'corporate'
        });
      }
 
      // --- Ring 2 (The Wilds) Unlock Check ---
      let isWildsUnlocked = !!prev.wildsUnlocked;
 
      if (!isWildsUnlocked && checkWildsUnlockCondition(newSlimes)) {
        isWildsUnlocked = true;
        logs.push({
          id: `log_wilds_unlock_${Date.now()}`,
          cycle: nextCycle,
          timestamp: timeStr,
          text: `PLANETARY TELEMETRY: Secondary color genetic signature detected in containment cells. Ring-2 [The Wilds] region orbital connection established!`,
          type: 'system'
        });
      }
 
      // Bounded to 5 cycles rolling window (keep records within last 5 cycles, meaning cycle >= nextCycle - 4)
      const keptRecentSales = (prev.recentMarketSales || []).filter(
        record => record.cycle >= nextCycle - 4
      );
 
      return {
        ...prev,
        cycle: nextCycle,
        credits: newCredits,
        contracts: updatedContracts,
        slimes: newSlimes,
        zones: newZones,
        activeDispatch: nextDispatch,
        activeMediation: nextMediation,
        activeExploration: nextExploration,
        planetRegion: nextRegion,
        wildsRegion: null,
        wildsUnlocked: isWildsUnlocked,
        logs: logs,
        recentMarketSales: keptRecentSales
      };
    });
  };

  return {
    handleAdvanceCycle
  };
}
