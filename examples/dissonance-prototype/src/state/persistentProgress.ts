import { useState, useEffect, useCallback } from 'react';
import { BankedEssence } from '../types';

export function usePersistentProgress() {
  const [essence, setEssence] = useState<number>(() => {
    const saved = localStorage.getItem('dissonance_essence_v6');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [unlockedCardIds, setUnlockedCardIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dissonance_unlocked_cards_v6');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [deckCardIds, setDeckCardIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dissonance_deck_cards_v6');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [globalCombinationCounts, setGlobalCombinationCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('dissonance_global_combo_counts_v6');
    return saved ? JSON.parse(saved) : {};
  });

  const [highestFloorUnlocked, setHighestFloorUnlocked] = useState<number>(() => {
    const saved = localStorage.getItem('dissonance_highest_floor_v6');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [bankedEssence, setBankedEssence] = useState<BankedEssence>(() => {
    const saved = localStorage.getItem('dissonance_banked_essence_v6');
    return saved ? JSON.parse(saved) : { amount: 0, available: false };
  });

  const [discoveredBoonIds, setDiscoveredBoonIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dissonance_discovered_boons_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [discoveredRelicIds, setDiscoveredRelicIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dissonance_discovered_relics_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [discoveredEnemyIds, setDiscoveredEnemyIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dissonance_discovered_enemies_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [discoveredRoomTypes, setDiscoveredRoomTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('dissonance_discovered_room_types_v6');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('dissonance_essence_v6', essence.toString());
  }, [essence]);

  useEffect(() => {
    localStorage.setItem('dissonance_unlocked_cards_v6', JSON.stringify(unlockedCardIds));
  }, [unlockedCardIds]);

  useEffect(() => {
    localStorage.setItem('dissonance_deck_cards_v6', JSON.stringify(deckCardIds));
  }, [deckCardIds]);

  useEffect(() => {
    localStorage.setItem('dissonance_global_combo_counts_v6', JSON.stringify(globalCombinationCounts));
  }, [globalCombinationCounts]);

  useEffect(() => {
    localStorage.setItem('dissonance_highest_floor_v6', highestFloorUnlocked.toString());
  }, [highestFloorUnlocked]);

  useEffect(() => {
    localStorage.setItem('dissonance_banked_essence_v6', JSON.stringify(bankedEssence));
  }, [bankedEssence]);

  useEffect(() => {
    localStorage.setItem('dissonance_discovered_boons_v6', JSON.stringify(discoveredBoonIds));
  }, [discoveredBoonIds]);

  useEffect(() => {
    localStorage.setItem('dissonance_discovered_relics_v6', JSON.stringify(discoveredRelicIds));
  }, [discoveredRelicIds]);

  useEffect(() => {
    localStorage.setItem('dissonance_discovered_enemies_v6', JSON.stringify(discoveredEnemyIds));
  }, [discoveredEnemyIds]);

  useEffect(() => {
    localStorage.setItem('dissonance_discovered_room_types_v6', JSON.stringify(discoveredRoomTypes));
  }, [discoveredRoomTypes]);

  const recordBoonDiscovery = useCallback((boonIds: string | string[]) => {
    const list = Array.isArray(boonIds) ? boonIds : [boonIds];
    setDiscoveredBoonIds(prev => {
      const next = [...prev];
      let changed = false;
      list.forEach(id => {
        if (id && !next.includes(id)) {
          next.push(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const recordRelicDiscovery = useCallback((relicIds: string | string[]) => {
    const list = Array.isArray(relicIds) ? relicIds : [relicIds];
    setDiscoveredRelicIds(prev => {
      const next = [...prev];
      let changed = false;
      list.forEach(id => {
        if (id && !next.includes(id)) {
          next.push(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const recordEnemyDiscovery = useCallback((enemyIds: string | string[]) => {
    const list = Array.isArray(enemyIds) ? enemyIds : [enemyIds];
    setDiscoveredEnemyIds(prev => {
      const next = [...prev];
      let changed = false;
      list.forEach(id => {
        if (id && !next.includes(id)) {
          next.push(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const recordRoomTypeDiscovery = useCallback((roomTypeIds: string | string[]) => {
    const list = Array.isArray(roomTypeIds) ? roomTypeIds : [roomTypeIds];
    setDiscoveredRoomTypes(prev => {
      const next = [...prev];
      let changed = false;
      list.forEach(id => {
        if (id && !next.includes(id)) {
          next.push(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const unlockFloor = useCallback((floor: number) => {
    setHighestFloorUnlocked(prev => Math.min(5, Math.max(prev, floor)));
  }, []);

  const updateBankedEssence = useCallback((newBanked: BankedEssence) => {
    setBankedEssence(newBanked);
  }, []);

  const consumeBankedEssence = useCallback(() => {
    if (bankedEssence.available && bankedEssence.amount > 0) {
      const amount = bankedEssence.amount;
      setBankedEssence({ amount: bankedEssence.amount, available: false });
      return amount;
    }
    return 0;
  }, [bankedEssence]);

  const unlockCards = useCallback((
    ids: string[],
    runComboCounts?: Record<string, number>,
    newDeckCardIds?: string[]
  ) => {
    if (ids.length > 0) {
      setUnlockedCardIds(prev => {
        const next = [...prev];
        ids.forEach(id => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        return next;
      });
    }

    if (runComboCounts) {
      setGlobalCombinationCounts(prev => {
        const next = { ...prev };
        Object.entries(runComboCounts).forEach(([key, val]) => {
          next[key] = (next[key] || 0) + val;
        });
        return next;
      });
    }

    if (newDeckCardIds) {
      setDeckCardIds(newDeckCardIds);
    }
  }, []);

  const gainEssence = useCallback((amount: number) => {
    setEssence(prev => prev + amount);
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem('dissonance_essence_v6');
    localStorage.removeItem('dissonance_unlocked_cards_v6');
    localStorage.removeItem('dissonance_deck_cards_v6');
    localStorage.removeItem('dissonance_global_combo_counts_v6');
    localStorage.removeItem('dissonance_highest_floor_v6');
    localStorage.removeItem('dissonance_discovered_boons_v6');
    localStorage.removeItem('dissonance_discovered_relics_v6');
    localStorage.removeItem('dissonance_discovered_enemies_v6');
    localStorage.removeItem('dissonance_discovered_room_types_v6');
    
    setEssence(0);
    setGlobalCombinationCounts({});
    setHighestFloorUnlocked(1);
    
    setUnlockedCardIds([]);
    setDeckCardIds([]);
    setDiscoveredBoonIds([]);
    setDiscoveredRelicIds([]);
    setDiscoveredEnemyIds([]);
    setDiscoveredRoomTypes([]);
  }, []);

  return {
    essence,
    unlockedCardIds,
    deckCardIds,
    globalCombinationCounts,
    highestFloorUnlocked,
    bankedEssence,
    discoveredBoonIds,
    discoveredRelicIds,
    discoveredEnemyIds,
    discoveredRoomTypes,
    recordBoonDiscovery,
    recordRelicDiscovery,
    recordEnemyDiscovery,
    recordRoomTypeDiscovery,
    updateBankedEssence,
    consumeBankedEssence,
    unlockCards,
    gainEssence,
    unlockFloor,
    resetAll
  };
}
