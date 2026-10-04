import { Dispatch, SetStateAction } from 'react';
import { LabState } from '../types';

interface UseUpgradeActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
}

export function useUpgradeActions({
  state,
  setState
}: UseUpgradeActionsProps) {

  // Buy Upgrades
  const handleBuyUpgrade = (type: 'capacity' | 'stabilizer' | 'autofeeder') => {
    if (type === 'capacity') {
      const cost = 150;
      if (state.credits < cost) return;
      setState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        rosterCap: prev.rosterCap + 5,
        logs: [
          ...prev.logs,
          {
            id: `log_upg_cap_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: `LAB UPGRADE: Roster containment cells expanded (+5 Capacity). Max is now ${prev.rosterCap + 5}.`,
            type: 'system'
          }
        ]
      }));
    } else if (type === 'stabilizer') {
      const cost = 200;
      if (state.credits < cost) return;
      setState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        breedingSuccessRateModifier: prev.breedingSuccessRateModifier + 0.1,
        logs: [
          ...prev.logs,
          {
            id: `log_upg_stb_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: `LAB UPGRADE: Splicer Stabilizer magnetic focus upgraded (+10% mutation stability).`,
            type: 'system'
          }
        ]
      }));
    } else if (type === 'autofeeder') {
      const cost = 250;
      if (state.credits < cost || state.hasAutoFeeder) return;
      setState(prev => ({
        ...prev,
        credits: prev.credits - cost,
        hasAutoFeeder: true,
        logs: [
          ...prev.logs,
          {
            id: `log_upg_feed_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            text: `LAB UPGRADE: Global Auto-Feeder module activated. Baseline credit generation for all Lab Workers doubled.`,
            type: 'system'
          }
        ]
      }));
    }
  };

  // Toggle Specimen Worker role lock
  const handleToggleWorkerRole = (slimeId: string) => {
    setState(prev => {
      const updatedSlimes = prev.slimes.map(s => {
        if (s.id === slimeId) {
          // If already worker, remove the role lock
          if (s.lockedRole === 'worker') {
            return { ...s, lockedRole: null };
          }
          // If not locked, lock as worker
          if (!s.lockedRole) {
            return { ...s, lockedRole: 'worker' as const };
          }
        }
        return s;
      });
      return {
        ...prev,
        slimes: updatedSlimes
      };
    });
  };

  return {
    handleBuyUpgrade,
    handleToggleWorkerRole
  };
}
