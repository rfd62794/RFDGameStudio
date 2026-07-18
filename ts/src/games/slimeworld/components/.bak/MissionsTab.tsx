import React, { useState } from 'react';
import { TabBar } from '../../../ui/components/TabBar';
import { PlanetTab } from './PlanetTab';

type MissionSubTab = 'regions' | 'mediation' | 'exploration' | 'active' | 'zones';
type MissionsTabProps = Omit<React.ComponentProps<typeof PlanetTab>, 'activeSubTab' | 'setActiveSubTab' | 'selectedNodeId' | 'setSelectedNodeId' | 'setActiveTab'>;

export function MissionsTab(props: MissionsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<MissionSubTab>('regions');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1">
      <TabBar
        tabs={[{ id: 'regions', label: 'TERRITORY' }, { id: 'active', label: 'ACTIVE' }, { id: 'zones', label: 'ZONES' }, { id: 'mediation', label: 'MEDIATION' }, { id: 'exploration', label: 'EXPLORATION' }]}
        active={activeSubTab}
        onSelect={id => setActiveSubTab(id as MissionSubTab)}
      />
      <PlanetTab
        {...props}
        activeSubTab={activeSubTab}
        setActiveSubTab={id => setActiveSubTab(id as MissionSubTab)}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        setActiveTab={() => {}}
      />
    </div>
  );
}
