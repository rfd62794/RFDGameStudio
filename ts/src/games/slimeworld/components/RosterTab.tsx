import { useState } from 'react';
import { TabBar } from '../../../ui/components/TabBar';
import { LabTab } from './LabTab';

type RosterTabProps = Omit<React.ComponentProps<typeof LabTab>, 'activeSubTab' | 'setActiveSubTab' | 'handleBuyUpgrade' | 'handlePurchaseSeedSlime' | 'handleDeliverContract' | 'handleSellOnMarket'>;

export function RosterTab(props: RosterTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'collection' | 'breeding' | 'slimedex'>('collection');

  return (
    <div className="flex flex-col flex-1">
      <TabBar
        tabs={[{ id: 'collection', label: 'COLLECTION' }, { id: 'breeding', label: 'SPLICING' }, { id: 'slimedex', label: 'SLIMEDEX' }]}
        active={activeSubTab}
        onSelect={id => setActiveSubTab(id as 'collection' | 'breeding' | 'slimedex')}
      />
      <LabTab
        {...props}
        activeSubTab={activeSubTab}
        setActiveSubTab={id => setActiveSubTab(id as 'collection' | 'breeding' | 'slimedex')}
        handleBuyUpgrade={() => {}}
        handlePurchaseSeedSlime={() => {}}
        handleDeliverContract={() => {}}
        handleSellOnMarket={() => {}}
      />
    </div>
  );
}
