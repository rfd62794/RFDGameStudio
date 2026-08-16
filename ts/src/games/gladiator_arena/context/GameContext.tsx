/**
 * Gladiator Arena — Central Game State Context
 * Handles persistent manager economy, roster frames, inventory, and active combat state.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArenaOpponent, BodyPart, BodySlot, BoutState, Gladiator } from '../types';
import { STARTER_PARTS } from '../data/defaultParts';
import { calculateSurgeryCosts, createNewFrameGladiator, generateShopInventory, getNextFrameCost, getPartScrapValue } from '../simulation/forgeEconomy';
import { executeNextCombatTurn, initializeBout } from '../simulation/combatEngine';
import { getGladiatorAnatomySummary } from '../../../engine/shared/anatomy';
import { ARENA_TIERS } from '../simulation/championLadder';
import { sound } from '../utils/soundEffects';

interface GameContextType {
  gold: number;
  roster: Gladiator[];
  inventory: BodyPart[];
  currentTierId: number;
  wins: number;
  losses: number;
  shopInventory: BodyPart[];
  activeBout: BoutState | null;
  selectedGladiatorId: string;
  setSelectedGladiatorId: (id: string) => void;
  combatSpeed: 1 | 2 | 4;
  setCombatSpeed: (speed: 1 | 2 | 4) => void;
  isCombatAutoPlaying: boolean;
  setIsCombatAutoPlaying: (auto: boolean) => void;
  
  // Economy & Equipment Actions
  buyPart: (part: BodyPart, targetGladiatorId?: string) => boolean;
  scrapPart: (partId: string, isFromInventory: boolean, gladiatorId?: string, slot?: BodySlot) => void;
  equipPart: (gladiatorId: string, part: BodyPart) => void;
  unequipPart: (gladiatorId: string, slot: BodySlot) => void;
  buyNewFrame: (name?: string, personality?: Gladiator['personality']) => boolean;
  updateGladiatorProfile: (gladiatorId: string, name: string, title: string, personality: Gladiator['personality']) => void;
  
  // Medbay & Surgery Actions
  patchWounds: (gladiatorId: string, slot?: BodySlot) => boolean;
  removeScar: (gladiatorId: string, slot: BodySlot) => boolean;
  
  // Arena Combat Actions
  startBout: (opponent: ArenaOpponent, selectedFighterIds: string[]) => void;
  stepCombatTurn: () => void;
  instantResolveCombat: () => void;
  concludeBout: () => void;
  refreshShop: () => void;
  resetGame: () => void;
}

const STORAGE_KEY = 'gladiator_arena_save_v1.0';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state with 1 starting Frame
  const [gold, setGold] = useState<number>(180);
  const [roster, setRoster] = useState<Gladiator[]>(() => [createNewFrameGladiator(1, 'Brutus', 'brawler')]);
  const [inventory, setInventory] = useState<BodyPart[]>([]);
  const [currentTierId, setCurrentTierId] = useState<number>(1);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [shopInventory, setShopInventory] = useState<BodyPart[]>(() => generateShopInventory(1));
  const [selectedGladiatorId, setSelectedGladiatorId] = useState<string>('');
  const [activeBout, setActiveBout] = useState<BoutState | null>(null);
  const [combatSpeed, setCombatSpeed] = useState<1 | 2 | 4>(1);
  const [isCombatAutoPlaying, setIsCombatAutoPlaying] = useState<boolean>(true);

  // Initialize selected gladiator id
  useEffect(() => {
    if (roster.length > 0 && (!selectedGladiatorId || !roster.some(g => g.id === selectedGladiatorId))) {
      setSelectedGladiatorId(roster[0].id);
    }
  }, [roster, selectedGladiatorId]);

  // Load from LocalStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gold !== undefined) setGold(parsed.gold);
        if (parsed.roster?.length) {
          const upgradedRoster = parsed.roster.map((g: Gladiator) => {
            const newParts = { ...g.parts };
            (['head', 'torso', 'left_arm', 'right_arm', 'left_leg', 'right_leg'] as BodySlot[]).forEach(slot => {
              const p = newParts[slot];
              if (p && STARTER_PARTS[slot] && p.maxHp < STARTER_PARTS[slot].maxHp) {
                const hpDiff = STARTER_PARTS[slot].maxHp - p.maxHp;
                newParts[slot] = {
                  ...p,
                  maxHp: STARTER_PARTS[slot].maxHp,
                  currentHp: Math.min(STARTER_PARTS[slot].maxHp, p.currentHp + hpDiff),
                  armor: Math.max(p.armor, STARTER_PARTS[slot].armor),
                };
              }
            });
            return { ...g, parts: newParts };
          });
          setRoster(upgradedRoster);
        }
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.currentTierId) setCurrentTierId(parsed.currentTierId);
        if (parsed.wins !== undefined) setWins(parsed.wins);
        if (parsed.losses !== undefined) setLosses(parsed.losses);
        if (parsed.shopInventory?.length) setShopInventory(parsed.shopInventory);
      }
    } catch (e) {
      console.error('Failed to load local save', e);
    }
  }, []);

  // Save to LocalStorage on mutations
  useEffect(() => {
    try {
      const stateToSave = {
        gold,
        roster,
        inventory,
        currentTierId,
        wins,
        losses,
        shopInventory,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [gold, roster, inventory, currentTierId, wins, losses, shopInventory]);

  // Auto-play combat step interval
  useEffect(() => {
    if (!activeBout || activeBout.isFinished || !isCombatAutoPlaying) return;

    const intervalMs = combatSpeed === 4 ? 200 : combatSpeed === 2 ? 550 : 1100;

    const timer = setTimeout(() => {
      setActiveBout(prev => {
        if (!prev || prev.isFinished) return prev;
        const next = executeNextCombatTurn(prev);
        
        // Trigger sounds on actions
        const latestLog = next.logs[next.logs.length - 1];
        if (latestLog) {
          if (latestLog.crit) sound.playHit(true);
          else if (latestLog.hit) sound.playHit(false);
          else if (latestLog.action === 'defend') sound.playParry();
          else if (latestLog.malfunctionTriggered) sound.playMalfunction();
        }

        return next;
      });
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [activeBout, isCombatAutoPlaying, combatSpeed]);

  const refreshShop = () => {
    setShopInventory(generateShopInventory(currentTierId));
    sound.playCoins();
  };

  const buyPart = (part: BodyPart, targetGladiatorId?: string): boolean => {
    if (gold < part.cost) return false;

    setGold(prev => prev - part.cost);
    setShopInventory(prev => prev.filter(p => p.id !== part.id));
    sound.playCoins();

    if (targetGladiatorId) {
      equipPart(targetGladiatorId, part);
    } else {
      setInventory(prev => [...prev, part]);
    }
    return true;
  };

  const scrapPart = (partId: string, isFromInventory: boolean, gladiatorId?: string, slot?: BodySlot) => {
    let partToScrap: BodyPart | undefined;

    if (isFromInventory) {
      partToScrap = inventory.find(p => p.id === partId);
      if (partToScrap) {
        setInventory(prev => prev.filter(p => p.id !== partId));
      }
    } else if (gladiatorId && slot) {
      const gladiator = roster.find(g => g.id === gladiatorId);
      if (gladiator) {
        partToScrap = gladiator.parts[slot];
      }
    }

    if (partToScrap) {
      const scrapVal = getPartScrapValue(partToScrap);
      setGold(prev => prev + scrapVal);
      sound.playCoins();
    }
  };

  const equipPart = (gladiatorId: string, part: BodyPart) => {
    setRoster(prev =>
      prev.map(g => {
        if (g.id !== gladiatorId) return g;
        const currentEquipped = g.parts[part.slot];
        
        // Move current part to inventory
        if (currentEquipped) {
          setInventory(inv => [...inv.filter(p => p.id !== part.id), currentEquipped]);
        } else {
          setInventory(inv => inv.filter(p => p.id !== part.id));
        }

        return {
          ...g,
          parts: {
            ...g.parts,
            [part.slot]: part,
          },
        };
      })
    );
    sound.playParry();
  };

  const unequipPart = (gladiatorId: string, slot: BodySlot) => {
    // Cannot unequip without a replacement limb in Gladiator Arena,
    // but user can swap with items in inventory
  };

  const buyNewFrame = (name?: string, personality?: Gladiator['personality']): boolean => {
    const cost = getNextFrameCost(roster.length);
    if (gold < cost) return false;

    const newGladiator = createNewFrameGladiator(roster.length + 1, name, personality);
    setGold(prev => prev - cost);
    setRoster(prev => [...prev, newGladiator]);
    setSelectedGladiatorId(newGladiator.id);
    sound.playCoins();
    return true;
  };

  const updateGladiatorProfile = (
    gladiatorId: string,
    name: string,
    title: string,
    personality: Gladiator['personality']
  ) => {
    setRoster(prev =>
      prev.map(g => (g.id === gladiatorId ? { ...g, name, title, personality } : g))
    );
  };

  const patchWounds = (gladiatorId: string, slot?: BodySlot): boolean => {
    const gladiator = roster.find(g => g.id === gladiatorId);
    if (!gladiator) return false;

    const costs = calculateSurgeryCosts(gladiator);
    const requiredGold = slot ? costs.perPartCost[slot].repairHpCost : costs.totalPatchCost;

    if (requiredGold <= 0 || gold < requiredGold) return false;

    setGold(prev => prev - requiredGold);
    setRoster(prev =>
      prev.map(g => {
        if (g.id !== gladiatorId) return g;
        const updatedParts = { ...g.parts };

        if (slot) {
          const p = updatedParts[slot];
          p.currentHp = p.maxHp - p.scarHpPenalty;
        } else {
          (Object.keys(updatedParts) as BodySlot[]).forEach(s => {
            const p = updatedParts[s];
            p.currentHp = p.maxHp - p.scarHpPenalty;
          });
        }

        return { ...g, parts: updatedParts };
      })
    );
    sound.playCoins();
    return true;
  };

  const removeScar = (gladiatorId: string, slot: BodySlot): boolean => {
    const gladiator = roster.find(g => g.id === gladiatorId);
    if (!gladiator) return false;

    const part = gladiator.parts[slot];
    if (part.scarHpPenalty <= 0) return false;

    const cost = part.scarHpPenalty * 18;
    if (gold < cost) return false;

    setGold(prev => prev - cost);
    setRoster(prev =>
      prev.map(g => {
        if (g.id !== gladiatorId) return g;
        const updatedParts = { ...g.parts };
        const p = { ...updatedParts[slot] };
        p.scarHpPenalty = 0;
        p.currentHp = p.maxHp;
        updatedParts[slot] = p;
        return { ...g, parts: updatedParts };
      })
    );
    sound.playParry();
    return true;
  };

  const startBout = (opponent: ArenaOpponent, selectedFighterIds: string[]) => {
    const participatingFighters = roster.filter(g => selectedFighterIds.includes(g.id));
    if (participatingFighters.length === 0) return;

    const bout = initializeBout(participatingFighters, opponent);
    setActiveBout(bout);
    setIsCombatAutoPlaying(true);
  };

  const stepCombatTurn = () => {
    if (!activeBout || activeBout.isFinished) return;
    setActiveBout(prev => (prev ? executeNextCombatTurn(prev) : null));
  };

  const instantResolveCombat = () => {
    if (!activeBout || activeBout.isFinished) return;
    let current = activeBout;
    let iterations = 0;
    while (!current.isFinished && iterations < 80) {
      current = executeNextCombatTurn(current);
      iterations++;
    }
    setActiveBout(current);
  };

  const concludeBout = () => {
    if (!activeBout || !activeBout.isFinished) return;

    const isVictory = activeBout.winner === 'player';

    if (isVictory) {
      // Award base purse + crowd favor bonus (up to +40%)
      const crowdMultiplier = 1 + Math.max(0, activeBout.crowdFavor) / 250;
      const purseWon = Math.round(activeBout.opponent.purseReward * crowdMultiplier);

      setGold(prev => prev + purseWon);
      setWins(prev => prev + 1);

      // Check if unlocked next tier
      const nextTier = ARENA_TIERS.find(t => t.minWinsToUnlock <= wins + 1 && t.id > currentTierId);
      if (nextTier) {
        setCurrentTierId(nextTier.id);
      }

      // Check special loot part
      if (activeBout.opponent.specialLootPart) {
        const loot = { ...activeBout.opponent.specialLootPart, id: `loot-${Date.now()}` };
        setInventory(prev => [...prev, loot]);
      }

      // Victory Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      sound.playCrowdCheer();
    } else {
      setLosses(prev => prev + 1);
    }

    // Persist real post-combat anatomy damage & scars onto the player's roster
    setRoster(prevRoster =>
      prevRoster.map(playerGladiator => {
        const matchGladiator = activeBout.playerRoster.find(g => g.id === playerGladiator.id);
        if (!matchGladiator) return playerGladiator;

        return {
          ...playerGladiator,
          parts: matchGladiator.parts,
          wins: playerGladiator.wins + (isVictory ? 1 : 0),
          losses: playerGladiator.losses + (isVictory ? 0 : 1),
          totalDamageDealt: playerGladiator.totalDamageDealt + matchGladiator.totalDamageDealt,
        };
      })
    );

    // Refresh shop stock on bout finish
    setShopInventory(generateShopInventory(currentTierId));
    setActiveBout(null);
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGold(180);
    const starter = createNewFrameGladiator(1, 'Brutus', 'brawler');
    setRoster([starter]);
    setSelectedGladiatorId(starter.id);
    setInventory([]);
    setCurrentTierId(1);
    setWins(0);
    setLosses(0);
    setShopInventory(generateShopInventory(1));
    setActiveBout(null);
  };

  return (
    <GameContext.Provider
      value={{
        gold,
        roster,
        inventory,
        currentTierId,
        wins,
        losses,
        shopInventory,
        activeBout,
        selectedGladiatorId,
        setSelectedGladiatorId,
        combatSpeed,
        setCombatSpeed,
        isCombatAutoPlaying,
        setIsCombatAutoPlaying,
        buyPart,
        scrapPart,
        equipPart,
        unequipPart,
        buyNewFrame,
        updateGladiatorProfile,
        patchWounds,
        removeScar,
        startBout,
        stepCombatTurn,
        instantResolveCombat,
        concludeBout,
        refreshShop,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
