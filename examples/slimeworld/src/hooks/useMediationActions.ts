import { Dispatch, SetStateAction } from 'react';
import { LabState, MediationMission } from '../types';

interface UseMediationActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
  selectedMediationNodeId: string | null;
  setSelectedMediationNodeId: (id: string | null) => void;
  mediationDraftIds: string[];
  setMediationDraftIds: (ids: string[]) => void;
  setPlanetSubTab: (tab: 'regions' | 'mediation' | 'exploration' | 'active' | 'zones') => void;
  setRoleLockConfirm: (confirm: any) => void;
}

export function useMediationActions({
  state,
  setState,
  selectedMediationNodeId,
  setSelectedMediationNodeId,
  mediationDraftIds,
  setMediationDraftIds,
  setPlanetSubTab,
  setRoleLockConfirm
}: UseMediationActionsProps) {

  // Launch Mediation Mission with locks
  const executeLaunchMediationWithLocks = (idsToLock: string[]) => {
    if (!selectedMediationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedMediationNodeId);
    if (!node || mediationDraftIds.length === 0) return;

    const mediation: MediationMission = {
      id: `mediation_${Date.now()}`,
      targetNodeId: selectedMediationNodeId,
      slimeIds: [...mediationDraftIds],
      cyclesRemaining: 1,
      totalDurationMs: 15000,
      startedAt: Date.now(),
      status: 'active'
    };

    setState(prev => {
      // Set roles of drafted slimes to dispatch and lock unspecialized ones
      const updatedSlimes = prev.slimes.map(s => {
        let updated = { ...s };
        if (mediationDraftIds.includes(s.id)) {
          updated.role = 'dispatch' as const;
        }
        if (idsToLock.includes(s.id)) {
          updated.lockedRole = 'mediation';
        }
        return updated;
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return {
        ...prev,
        activeMediation: mediation,
        slimes: updatedSlimes,
        logs: [
          ...prev.logs,
          {
            id: `log_launch_med_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `MEDIATION LAUNCH: Diplomatic pod dispatched to Node [${node.name}] with ${mediationDraftIds.length} representatives.`,
            type: 'corporate'
          }
        ]
      };
    });

    // Reset draft fields
    setMediationDraftIds([]);
    setSelectedMediationNodeId(null);
    setPlanetSubTab('mediation'); // switch subtab to mediation
    setRoleLockConfirm(null);
  };

  const handleLaunchMediation = () => {
    if (!selectedMediationNodeId || !state.planetRegion) return;
    const node = state.planetRegion.nodes.find(n => n.id === selectedMediationNodeId);
    if (!node || mediationDraftIds.length === 0) return;

    const draftedSlimes = state.slimes.filter(s => mediationDraftIds.includes(s.id));
    const unlockedSlimes = draftedSlimes.filter(s => !s.lockedRole);

    if (unlockedSlimes.length > 0) {
      setRoleLockConfirm({
        type: 'mediation',
        unlockedSlimes,
        onConfirm: () => {
          executeLaunchMediationWithLocks(unlockedSlimes.map(s => s.id));
        }
      });
      return;
    }

    executeLaunchMediationWithLocks([]);
  };

  return {
    executeLaunchMediationWithLocks,
    handleLaunchMediation
  };
}
