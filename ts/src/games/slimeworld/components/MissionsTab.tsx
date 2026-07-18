import { useState } from 'react';
import { TabBar } from '../../../ui/components/TabBar';
import { PlanetTab } from './PlanetTab';

type MissionSubTab = 'regions' | 'mediation' | 'exploration' | 'active' | 'zones';
type MissionsTabProps = Omit<React.ComponentProps<typeof PlanetTab>, 'activeSubTab' | 'setActiveSubTab' | 'selectedNodeId' | 'setSelectedNodeId' | 'setActiveTab' | 'handleAssignGarrison' | 'handleRecallGarrison' | 'handleForceClaim' | 'handleBribeClaim' | 'handleConvertClaim'>;

export function MissionsTab(props: MissionsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<MissionSubTab>('regions');

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
        selectedNodeId={null}
        setSelectedNodeId={() => {}}
        setActiveTab={() => {}}
        handleAssignGarrison={() => {}}
        handleRecallGarrison={() => {}}
        handleForceClaim={() => ({ success: false, log: [] })}
        handleBribeClaim={() => ({ success: false, log: [] })}
        handleConvertClaim={() => ({ success: false, log: [] })}
      />
    </div>
  );
}
