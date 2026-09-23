import { Dispatch, SetStateAction } from 'react';
import { LabState, ExplorationMission } from '../types';

interface UseExplorationActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
  selectedExplorationNodeId: string | null;
  setSelectedExplorationNodeId: (id: string | null) => void;
  explorationDraftIds: string[];
  setExplorationDraftIds: (ids: string[]) => void;
  setPlanetSubTab: (tab: 'regions' | 'mediation' | 'exploration' | 'active' | 'zones') => void;
  setRoleLockConfirm: (confirm: any) => void;
}

export function useExplorationActions({
  state,
  setState,
  selectedExplorationNodeId,
  setSelectedExplorationNodeId,
  explorationDraftIds,
  setExplorationDraftIds,
  setPlanetSubTab,
  setRoleLockConfirm
}: UseExplorationActionsProps) {

  // Launch Exploration Mission with locks
  const executeLaunchExplorationWithLocks = (idsToLock: string[]) => {
    if (!selectedExplorationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedExplorationNodeId);
    if (!node || explorationDraftIds.length === 0) return;

    const exploration: ExplorationMission = {
      id: `exploration_${Date.now()}`,
      targetNodeId: selectedExplorationNodeId,
      slimeIds: [...explorationDraftIds],
      cyclesRemaining: 1,
      totalDurationMs: 15000,
      startedAt: Date.now(),
      status: 'active'
    };

    setState(prev => {
      // Set roles of drafted slimes to dispatch and lock unspecialized ones
      const updatedSlimes = prev.slimes.map(s => {
        let updated = { ...s };
        if (explorationDraftIds.includes(s.id)) {
          updated.role = 'dispatch' as const;
        }
        if (idsToLock.includes(s.id)) {
          updated.lockedRole = 'exploration';
        }
        return updated;
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return {
        ...prev,
        activeExploration: exploration,
        slimes: updatedSlimes,
        logs: [
          ...prev.logs,
          {
            id: `log_launch_exp_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `EXPLORATION LAUNCH: Scouting pod dispatched to Node [${node.name}] with ${explorationDraftIds.length} representatives.`,
            type: 'corporate'
          }
        ]
      };
    });

    // Reset draft fields
    setExplorationDraftIds([]);
    setSelectedExplorationNodeId(null);
    setPlanetSubTab('exploration'); // switch subtab to exploration
    setRoleLockConfirm(null);
  };

  const handleLaunchExploration = () => {
    if (!selectedExplorationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedExplorationNodeId);
    if (!node || explorationDraftIds.length === 0) return;

    const draftedSlimes = state.slimes.filter(s => explorationDraftIds.includes(s.id));
    const unlockedSlimes = draftedSlimes.filter(s => !s.lockedRole);

    if (unlockedSlimes.length > 0) {
      setRoleLockConfirm({
        type: 'exploration',
        unlockedSlimes,
        onConfirm: () => {
          executeLaunchExplorationWithLocks(unlockedSlimes.map(s => s.id));
        }
      });
      return;
    }

    executeLaunchExplorationWithLocks([]);
  };

  return {
    executeLaunchExplorationWithLocks,
    handleLaunchExploration
  };
}
