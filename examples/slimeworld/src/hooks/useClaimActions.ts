import { Dispatch, SetStateAction } from 'react';
import { LabState, PlanetNode, Slime, SlimeColor } from '../types';
import { resolveForceClaim, resolveBribeClaim, resolveConvertClaim } from '../gameLogic';

interface UseClaimActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
}

export function useClaimActions({ state, setState }: UseClaimActionsProps) {
  
  // Force Claim
  const handleForceClaim = (nodeId: string, slimeIds: string[]) => {
    let resultLog: string[] = [];
    let isSuccess = false;

    setState(prev => {
      if (!prev.planetRegion) return prev;
      const node = prev.planetRegion.nodes.find(n => n.id === nodeId);
      if (!node) return prev;

      const party = prev.slimes.filter(s => slimeIds.includes(s.id));
      if (party.length === 0) return prev;

      const result = resolveForceClaim(node, party, node.discovered);
      isSuccess = result.success;
      resultLog = result.log;

      // Update nodes
      const updatedNodes = prev.planetRegion.nodes.map(n => {
        if (n.id === nodeId) {
          return result.updatedNode;
        }
        return n;
      });

      // If success, we release any previous garrison on this node
      let updatedSlimes = prev.slimes;
      if (isSuccess && node.garrisonSlimeId) {
        updatedSlimes = prev.slimes.map(s => {
          if (s.id === node.garrisonSlimeId) {
            return {
              ...s,
              lockedRole: null,
              garrisonedAt: null
            };
          }
          return s;
        });
      }

      // Also award XP on success or failure!
      // Like exploration, let's award 45 XP on success, 20 XP on fail to the party slimes
      updatedSlimes = updatedSlimes.map(s => {
        if (slimeIds.includes(s.id)) {
          const xpGained = isSuccess ? 45 : 20;
          let nextXp = s.xp + xpGained;
          let nextLevel = s.level;
          // Check level up (simplified: 100 XP per level)
          if (nextXp >= 100) {
            nextXp -= 100;
            nextLevel += 1;
            resultLog.push(`LEVEL UP: Specimen ${s.name} has reached Level ${nextLevel}!`);
          }
          return {
            ...s,
            xp: nextXp,
            level: nextLevel
          };
        }
        return s;
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Create log entries for each line of the result log
      const newLogs = resultLog.map((text, idx) => ({
        id: `log_force_claim_${Date.now()}_${idx}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text,
        type: (isSuccess ? 'combat' : 'system') as any
      }));

      return {
        ...prev,
        slimes: updatedSlimes,
        planetRegion: {
          ...prev.planetRegion,
          nodes: updatedNodes
        },
        logs: [...prev.logs, ...newLogs]
      };
    });

    return { success: isSuccess, log: resultLog };
  };

  // Bribe Claim
  const handleBribeClaim = (nodeId: string, creditsSpent: number) => {
    let resultLog: string[] = [];
    let isSuccess = false;

    setState(prev => {
      if (!prev.planetRegion) return prev;
      const node = prev.planetRegion.nodes.find(n => n.id === nodeId);
      if (!node) return prev;

      if (prev.credits < creditsSpent) return prev;

      const result = resolveBribeClaim(node, creditsSpent, node.discovered);
      isSuccess = result.success;
      resultLog = result.log;

      // Update nodes
      const updatedNodes = prev.planetRegion.nodes.map(n => {
        if (n.id === nodeId) {
          return result.updatedNode;
        }
        return n;
      });

      // If success, we release any previous garrison on this node
      let updatedSlimes = prev.slimes;
      if (isSuccess && node.garrisonSlimeId) {
        updatedSlimes = prev.slimes.map(s => {
          if (s.id === node.garrisonSlimeId) {
            return {
              ...s,
              lockedRole: null,
              garrisonedAt: null
            };
          }
          return s;
        });
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newLogs = resultLog.map((text, idx) => ({
        id: `log_bribe_claim_${Date.now()}_${idx}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text,
        type: (isSuccess ? 'corporate' : 'system') as any
      }));

      return {
        ...prev,
        credits: prev.credits - creditsSpent,
        slimes: updatedSlimes,
        planetRegion: {
          ...prev.planetRegion,
          nodes: updatedNodes
        },
        logs: [...prev.logs, ...newLogs]
      };
    });

    return { success: isSuccess, log: resultLog };
  };

  // Convert Claim
  const handleConvertClaim = (nodeId: string, slimeIds: string[]) => {
    let resultLog: string[] = [];
    let isSuccess = false;

    setState(prev => {
      if (!prev.planetRegion) return prev;
      const node = prev.planetRegion.nodes.find(n => n.id === nodeId);
      if (!node) return prev;

      const party = prev.slimes.filter(s => slimeIds.includes(s.id));
      if (party.length === 0) return prev;

      // Find controlling or highest pressure color to fetch relationship
      let targetColor: SlimeColor = node.ownerColor || 'Gray';
      if (!node.ownerColor) {
        let maxPressure = -1;
        Object.entries(node.pressure).forEach(([c, val]) => {
          if ((val as number) > maxPressure) {
            maxPressure = val as number;
            targetColor = c as SlimeColor;
          }
        });
      }

      const currentRelationship = prev.cultureRelationships?.[targetColor] ?? 50;

      const result = resolveConvertClaim(node, party, currentRelationship, node.discovered);
      isSuccess = result.success;
      resultLog = result.log;

      // Update nodes
      const updatedNodes = prev.planetRegion.nodes.map(n => {
        if (n.id === nodeId) {
          return result.updatedNode;
        }
        return n;
      });

      // If success, we release any previous garrison on this node
      let updatedSlimes = prev.slimes;
      if (isSuccess && node.garrisonSlimeId) {
        updatedSlimes = prev.slimes.map(s => {
          if (s.id === node.garrisonSlimeId) {
            return {
              ...s,
              lockedRole: null,
              garrisonedAt: null
            };
          }
          return s;
        });
      }

      // Award XP to party slimes (45 on success, 20 on fail)
      updatedSlimes = updatedSlimes.map(s => {
        if (slimeIds.includes(s.id)) {
          const xpGained = isSuccess ? 45 : 20;
          let nextXp = s.xp + xpGained;
          let nextLevel = s.level;
          if (nextXp >= 100) {
            nextXp -= 100;
            nextLevel += 1;
            resultLog.push(`LEVEL UP: Specimen ${s.name} has reached Level ${nextLevel}!`);
          }
          return {
            ...s,
            xp: nextXp,
            level: nextLevel
          };
        }
        return s;
      });

      // Adjust Relationship slightly based on outcome:
      // success -> +5 relationship with the converted color
      // failure -> -2 relationship
      const nextRelationships = { ...prev.cultureRelationships };
      const nextRelVal = isSuccess 
        ? Math.min(100, (nextRelationships[targetColor] ?? 50) + 5)
        : Math.max(0, (nextRelationships[targetColor] ?? 50) - 2);
      nextRelationships[targetColor] = nextRelVal;
      resultLog.push(`RELATIONS: ${targetColor} relationship adjusted to ${nextRelVal}/100.`);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newLogs = resultLog.map((text, idx) => ({
        id: `log_convert_claim_${Date.now()}_${idx}`,
        cycle: prev.cycle,
        timestamp: timeStr,
        text,
        type: (isSuccess ? 'breeding' : 'system') as any
      }));

      return {
        ...prev,
        cultureRelationships: nextRelationships,
        slimes: updatedSlimes,
        planetRegion: {
          ...prev.planetRegion,
          nodes: updatedNodes
        },
        logs: [...prev.logs, ...newLogs]
      };
    });

    return { success: isSuccess, log: resultLog };
  };

  return {
    handleForceClaim,
    handleBribeClaim,
    handleConvertClaim
  };
}
