import { Dispatch, SetStateAction } from 'react';
import { LabState, ActiveDispatch } from '../types';

interface UseDispatchActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  dispatchDraftIds: string[];
  setDispatchDraftIds: (ids: string[]) => void;
  setRealtimeRemainingMs: (ms: number) => void;
  setPlanetSubTab: (subTab: 'regions' | 'mediation' | 'exploration' | 'active' | 'zones') => void;
  setRoleLockConfirm: (confirm: any) => void;
  handleAdvanceCycle: () => void;
}

export function useDispatchActions({
  state,
  setState,
  selectedZoneId,
  setSelectedZoneId,
  dispatchDraftIds,
  setDispatchDraftIds,
  setRealtimeRemainingMs,
  setPlanetSubTab,
  setRoleLockConfirm,
  handleAdvanceCycle
}: UseDispatchActionsProps) {

  const executeLaunchDispatchWithLocks = (idsToLock: string[]) => {
    if (!selectedZoneId) return;
    const zone = state.zones.find(z => z.id === selectedZoneId);
    if (!zone || dispatchDraftIds.length === 0) return;

    const dispatch: ActiveDispatch = {
      id: `dispatch_${Date.now()}`,
      zoneId: selectedZoneId,
      slimeIds: [...dispatchDraftIds],
      cyclesRemaining: 1, // Resolves upon cycle skip or real-time timer
      totalDurationMs: 15000, // 15 seconds real-time
      startedAt: Date.now(),
      status: 'active'
    };

    setRealtimeRemainingMs(15000);

    setState(prev => {
      // Set roles of drafted slimes to dispatch and lock unspecialized ones
      const updatedSlimes = prev.slimes.map(s => {
        let updated = { ...s };
        if (dispatchDraftIds.includes(s.id)) {
          updated.role = 'dispatch' as const;
        }
        if (idsToLock.includes(s.id)) {
          updated.lockedRole = 'dispatch';
        }
        return updated;
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return {
        ...prev,
        activeDispatch: dispatch,
        slimes: updatedSlimes,
        logs: [
          ...prev.logs,
          {
            id: `log_launch_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `EXTRACTOR CAP: Launched landing pod with ${dispatchDraftIds.length} specimens into orbit of [${zone.name}].`,
            type: 'combat' as const
          }
        ]
      };
    });

    // Reset draft fields
    setDispatchDraftIds([]);
    setSelectedZoneId(null);
    setPlanetSubTab('active'); // auto focus to active sub tab to monitor
    setRoleLockConfirm(null);
  };

  const handleLaunchDispatch = () => {
    if (!selectedZoneId) return;
    const zone = state.zones.find(z => z.id === selectedZoneId);
    if (!zone || dispatchDraftIds.length === 0) return;

    const draftedSlimes = state.slimes.filter(s => dispatchDraftIds.includes(s.id));
    const unlockedSlimes = draftedSlimes.filter(s => !s.lockedRole);

    if (unlockedSlimes.length > 0) {
      setRoleLockConfirm({
        type: 'dispatch',
        unlockedSlimes,
        onConfirm: () => {
          executeLaunchDispatchWithLocks(unlockedSlimes.map(s => s.id));
        }
      });
      return;
    }

    executeLaunchDispatchWithLocks([]);
  };

  const handleRetrieveCompletedPod = () => {
    if (!state.activeDispatch || state.activeDispatch.status !== 'completed') return;
    
    // Resolve right away
    handleAdvanceCycle();
  };

  return {
    handleLaunchDispatch,
    handleRetrieveCompletedPod,
    executeLaunchDispatchWithLocks
  };
}
