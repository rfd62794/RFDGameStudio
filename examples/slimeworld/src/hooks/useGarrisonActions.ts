import { Dispatch, SetStateAction } from 'react';
import { LabState } from '../types';

interface UseGarrisonActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
}

export function useGarrisonActions({
  state,
  setState
}: UseGarrisonActionsProps) {

  // Assign a slime to garrison a specific node
  const handleAssignGarrison = (nodeId: string, slimeId: string) => {
    setState(prev => {
      // Find the slime
      const slime = prev.slimes.find(s => s.id === slimeId);
      if (!slime || slime.role !== 'idle' || slime.lockedRole) return prev;

      // Find the node in region
      if (!prev.planetRegion) return prev;
      const node = prev.planetRegion.nodes.find(n => n.id === nodeId);
      if (!node || !node.ownerColor) return prev;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // If there is an existing garrison on this node, release it first
      const updatedSlimes = prev.slimes.map(s => {
        if (s.id === slimeId) {
          return {
            ...s,
            lockedRole: 'garrison' as const,
            garrisonedAt: nodeId
          };
        }
        // Release any other slime currently garrisoned at this node
        if (s.lockedRole === 'garrison' && s.garrisonedAt === nodeId) {
          return {
            ...s,
            lockedRole: null,
            garrisonedAt: null
          };
        }
        return s;
      });

      const updatedNodes = prev.planetRegion.nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            garrisonSlimeId: slimeId
          };
        }
        // If this slime was garrisoning another node, clear it
        if (n.garrisonSlimeId === slimeId) {
          return {
            ...n,
            garrisonSlimeId: null
          };
        }
        return n;
      });

      return {
        ...prev,
        slimes: updatedSlimes,
        planetRegion: {
          ...prev.planetRegion,
          nodes: updatedNodes
        },
        logs: [
          ...prev.logs,
          {
            id: `log_garrison_assign_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `GARRISON ASSIGNED: Specimen ${slime.name} deployed to Garrison duty at Node [${node.name}]. Revolt risk decreased by 50%.`,
            type: 'system'
          }
        ]
      };
    });
  };

  // Recall a garrisoned slime
  const handleRecallGarrison = (slimeId: string) => {
    setState(prev => {
      const slime = prev.slimes.find(s => s.id === slimeId);
      if (!slime || slime.lockedRole !== 'garrison' || !slime.garrisonedAt) return prev;

      const nodeId = slime.garrisonedAt;
      if (!prev.planetRegion) return prev;
      const node = prev.planetRegion.nodes.find(n => n.id === nodeId);
      const nodeName = node ? node.name : 'Unknown';

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const updatedSlimes = prev.slimes.map(s => {
        if (s.id === slimeId) {
          return {
            ...s,
            lockedRole: null,
            garrisonedAt: null
          };
        }
        return s;
      });

      const updatedNodes = prev.planetRegion.nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            garrisonSlimeId: null
          };
        }
        return n;
      });

      return {
        ...prev,
        slimes: updatedSlimes,
        planetRegion: {
          ...prev.planetRegion,
          nodes: updatedNodes
        },
        logs: [
          ...prev.logs,
          {
            id: `log_garrison_recall_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `GARRISON RECALLED: Specimen ${slime.name} recalled from Node [${nodeName}] to containment roster.`,
            type: 'system'
          }
        ]
      };
    });
  };

  return {
    handleAssignGarrison,
    handleRecallGarrison
  };
}
