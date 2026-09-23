import { Dispatch, SetStateAction } from 'react';
import { LabState, SlimePattern, SlimeColor, LogEntry } from '../types';
import { breedSlimes, calculateStats, syncCodexWithRoster, stageFromLevel, getColorRegentCost, getTargetRegentCost, COLOR_TARGETS } from '../gameLogic';

interface UseBreedingActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
  parentAId: string | null;
  parentBId: string | null;
  setParentAId: (id: string | null) => void;
  setParentBId: (id: string | null) => void;
  activeRegentPattern: SlimePattern | null;
  setActiveRegentPattern: (pattern: SlimePattern | null) => void;
  activeRegentColor: SlimeColor | null;
  setActiveRegentColor: (color: SlimeColor | null) => void;
  activeTargetRegent: string | null;
  setActiveTargetRegent: (targetId: string | null) => void;
  setIsBreedingHatching: (hatching: boolean) => void;
  setNewOffspring: (offspring: any) => void;
  addSystemLog: (text: string, type?: LogEntry['type']) => void;
  setActiveTab: (tab: 'lab' | 'planet') => void;
  setLabSubTab: (subTab: 'collection' | 'breeding' | 'slimedex' | 'upgrades' | 'requisitions') => void;
}

export function useBreedingActions({
  state,
  setState,
  parentAId,
  parentBId,
  setParentAId,
  setParentBId,
  activeRegentPattern,
  setActiveRegentPattern,
  activeRegentColor,
  setActiveRegentColor,
  activeTargetRegent,
  setActiveTargetRegent,
  setIsBreedingHatching,
  setNewOffspring,
  addSystemLog,
  setActiveTab,
  setLabSubTab
}: UseBreedingActionsProps) {
  
  const handleInitiateBreeding = () => {
    if (!parentAId || !parentBId || parentAId === parentBId) return;
    
    const parentA = state.slimes.find(s => s.id === parentAId);
    const parentB = state.slimes.find(s => s.id === parentBId);
    if (!parentA || !parentB) return;

    if (stageFromLevel(parentA.level) === 'Elder' || stageFromLevel(parentB.level) === 'Elder') {
      addSystemLog('SPLICING DENIED: Elder specimens have exhausted genetic viability.', 'system');
      return;
    }

    if (state.slimes.length >= state.rosterCap) {
      addSystemLog('BREEDING HALTED: Specimen Roster capacity limit reached. Expand facility slots first.', 'system');
      return;
    }

    const breedingFee = 10;
    if (state.credits < breedingFee) {
      addSystemLog('BREEDING WARNING: Insufficient credits. Emergency biological grant authorized (-0 Credits).', 'system');
    }

    function circularDistanceLocal(h1: number, h2: number): number {
      const diff = Math.abs(h1 - h2) % 360;
      return Math.min(diff, 360 - diff);
    }

    function isSameParentPair(
      h11: number, h22: number,
      prevH1: number, prevH2: number
    ): boolean {
      const d11 = circularDistanceLocal(h11, prevH1);
      const d22 = circularDistanceLocal(h22, prevH2);
      const d12 = circularDistanceLocal(h11, prevH2);
      const d21 = circularDistanceLocal(h22, prevH1);

      return (d11 <= 5 && d22 <= 5) || (d12 <= 5 && d21 <= 5);
    }

    const HUE_MAP: Record<SlimeColor, number> = {
      Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300, Gray: 0
    };
    const h1 = parentA.hue !== undefined ? parentA.hue : (HUE_MAP[parentA.color] || 0);
    const h2 = parentB.hue !== undefined ? parentB.hue : (HUE_MAP[parentB.color] || 0);

    let nextStreak = 0;
    if (state.lastBredHues) {
      const isSame = isSameParentPair(
        h1, h2,
        state.lastBredHues.hue1, state.lastBredHues.hue2
      );
      if (isSame) {
        nextStreak = state.lastBredHues.streak + 1;
      }
    }

    setIsBreedingHatching(true);
    
    const regentSpent = activeRegentPattern;
    const colorRegentSpent = activeRegentColor;
    const targetRegentSpent = activeTargetRegent;

    setTimeout(() => {
      const offspring = breedSlimes(parentA, parentB, Math.max(parentA.generation, parentB.generation) + 1, nextStreak, targetRegentSpent);
      
      if (colorRegentSpent) {
        offspring.color = colorRegentSpent;
        offspring.hue = HUE_MAP[colorRegentSpent] !== undefined ? HUE_MAP[colorRegentSpent] : 0;
        offspring.saturation = 0;
        offspring.colorSaturation = 0; // Synthetically forced, resets saturation
      }
      if (regentSpent) {
        offspring.pattern = regentSpent;
      }
      if (colorRegentSpent || regentSpent) {
        offspring.stats = calculateStats(offspring.color, offspring.pattern, offspring.level, offspring.hue, offspring.saturation);
      }
      
      setState(prev => {
        const finalFee = prev.credits >= breedingFee ? breedingFee : 0;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const updatedRegentInventory = { ...prev.regentInventory };
        if (regentSpent && (updatedRegentInventory[regentSpent] || 0) > 0) {
          updatedRegentInventory[regentSpent] = (updatedRegentInventory[regentSpent] || 0) - 1;
        }

        const updatedColorRegentInventory = { ...prev.colorRegentInventory };
        if (colorRegentSpent && (updatedColorRegentInventory[colorRegentSpent] || 0) > 0) {
          updatedColorRegentInventory[colorRegentSpent] = (updatedColorRegentInventory[colorRegentSpent] || 0) - 1;
        }

        const updatedTargetRegentInventory = { ...prev.targetRegentInventory } as Record<string, number>;
        if (targetRegentSpent && (updatedTargetRegentInventory[targetRegentSpent] || 0) > 0) {
          updatedTargetRegentInventory[targetRegentSpent] = (updatedTargetRegentInventory[targetRegentSpent] || 0) - 1;
        }

        let logText = `BREEDING: Spliced ${parentA.name} + ${parentB.name}`;
        if (colorRegentSpent && regentSpent) {
          logText += ` using ${colorRegentSpent} Color Regent and ${regentSpent} Pattern Regent. Born: ${offspring.name} (guaranteed ${offspring.color}, guaranteed ${offspring.pattern} pattern).`;
        } else if (colorRegentSpent) {
          logText += ` using ${colorRegentSpent} Color Regent. Born: ${offspring.name} (guaranteed ${offspring.color}, ${offspring.pattern} pattern).`;
        } else if (regentSpent) {
          logText += ` using ${regentSpent} Regent. Born: ${offspring.name} (${offspring.color}, guaranteed ${offspring.pattern} pattern).`;
        } else if (targetRegentSpent) {
          const tName = COLOR_TARGETS.find(t => t.id === targetRegentSpent)?.name || 'Target';
          logText += ` using ${tName} Target Regent to nudge genetics. Born: ${offspring.name} (${offspring.color}, ${offspring.pattern} pattern) [H: ${Math.round(offspring.hue)}° S: ${Math.round(offspring.saturation)}%].`;
        } else {
          logText += `. Born: ${offspring.name} (${offspring.color}, ${offspring.pattern} pattern) [H: ${Math.round(offspring.hue)}° S: ${Math.round(offspring.saturation)}%].`;
        }

        const nextState = {
          ...prev,
          credits: Math.max(0, prev.credits - finalFee),
          slimes: [...prev.slimes, offspring],
          regentInventory: updatedRegentInventory,
          colorRegentInventory: updatedColorRegentInventory,
          targetRegentInventory: updatedTargetRegentInventory,
          lastBredHues: {
            hue1: h1,
            hue2: h2,
            streak: nextStreak
          },
          logs: [
            ...prev.logs,
            {
              id: `log_breed_${Date.now()}`,
              cycle: prev.cycle,
              timestamp: timeStr,
              text: logText,
              type: 'breeding' as const
            }
          ]
        };

        return syncCodexWithRoster(nextState);
      });

      setNewOffspring(offspring);
      setIsBreedingHatching(false);
      setParentAId(null);
      setParentBId(null);
      setActiveRegentPattern(null);
      setActiveRegentColor(null);
      setActiveTargetRegent(null);
    }, 2000);
  };

  const handleBuyRegent = (pattern: SlimePattern) => {
    const patternTiers: Record<SlimePattern, number> = {
      Solid: 0,
      Stripe: 1,
      Polka: 2,
      Glow: 3,
      Crown: 4,
      Ringed: 5,
      Nebula: 6,
      Obsidian: 7
    };
    const tier = patternTiers[pattern] || 0;
    const baseCost = 50 + tier * 25;
    const isDiscovered = state.patternCodex?.[pattern]?.discovered;
    const cost = isDiscovered ? baseCost : Math.round(baseCost * 2);

    if (state.credits < cost) {
      addSystemLog(`TRANSACTION ERROR: Insufficient credits to procure ${pattern} Regent (${cost} Credits required).`, 'system');
      return;
    }

    setState(prev => {
      const updatedCredits = prev.credits - cost;
      const updatedRegentInventory = { ...prev.regentInventory };
      updatedRegentInventory[pattern] = (updatedRegentInventory[pattern] || 0) + 1;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog = {
        id: `log_buy_regent_${Date.now()}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text: `COMMERCE: Procured ${pattern} Membrane Regent for ${cost} Credits. Transferring to splicing lab.`,
        type: 'system' as const
      };

      return {
        ...prev,
        credits: updatedCredits,
        regentInventory: updatedRegentInventory,
        logs: [newLog, ...prev.logs]
      };
    });

    setActiveTab('lab');
    setLabSubTab('breeding');
    setActiveRegentPattern(pattern);
  };

  const handleBuyColorRegent = (color: SlimeColor) => {
    const isDiscovered = state.colorCodex?.[color]?.discovered || false;
    const cost = getColorRegentCost(color, isDiscovered);

    if (state.credits < cost) {
      addSystemLog(`TRANSACTION ERROR: Insufficient credits to procure ${color} Regent (${cost} Credits required).`, 'system');
      return;
    }

    setState(prev => {
      const updatedCredits = prev.credits - cost;
      const updatedColorRegentInventory = { ...prev.colorRegentInventory };
      updatedColorRegentInventory[color] = (updatedColorRegentInventory[color] || 0) + 1;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog = {
        id: `log_buy_color_regent_${Date.now()}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text: `COMMERCE: Procured ${color} Strain Regent for ${cost} Credits. Transferring to splicing lab.`,
        type: 'system' as const
      };

      return {
        ...prev,
        credits: updatedCredits,
        colorRegentInventory: updatedColorRegentInventory,
        logs: [newLog, ...prev.logs]
      };
    });

    setActiveTab('lab');
    setLabSubTab('breeding');
    setActiveRegentColor(color);
  };

  const handleBuyTargetRegent = (targetId: string) => {
    const target = COLOR_TARGETS.find(t => t.id === targetId);
    if (!target) return;
    const isDiscovered = !!state.colorTargetCodex?.[targetId];
    const cost = getTargetRegentCost(targetId, isDiscovered);

    if (state.credits < cost) {
      addSystemLog(`TRANSACTION ERROR: Insufficient credits to procure ${target.name} Target Regent (${cost} Credits required).`, 'system');
      return;
    }

    setState(prev => {
      const updatedCredits = prev.credits - cost;
      const updatedTargetRegentInventory = { ...prev.targetRegentInventory } as Record<string, number>;
      updatedTargetRegentInventory[targetId] = (updatedTargetRegentInventory[targetId] || 0) + 1;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog = {
        id: `log_buy_target_regent_${Date.now()}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text: `COMMERCE: Procured ${target.name} Target Regent for ${cost} Credits. Transferring to splicing lab.`,
        type: 'system' as const
      };

      return {
        ...prev,
        credits: updatedCredits,
        targetRegentInventory: updatedTargetRegentInventory,
        logs: [newLog, ...prev.logs]
      };
    });

    setActiveTab('lab');
    setLabSubTab('breeding');
    setActiveTargetRegent(targetId);
  };

  return {
    handleInitiateBreeding,
    handleBuyRegent,
    handleBuyColorRegent,
    handleBuyTargetRegent
  };
}
