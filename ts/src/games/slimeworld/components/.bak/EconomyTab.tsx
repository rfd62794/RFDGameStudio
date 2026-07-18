import React from 'react';
import { LabTab } from './LabTab';

type EconomyTabProps = Omit<React.ComponentProps<typeof LabTab>, 'activeSubTab' | 'setActiveSubTab' | 'handleBuyUpgrade' | 'handlePurchaseSeedSlime' | 'selectedSlimeId' | 'setSelectedSlimeId' | 'setRenameSlimeId' | 'setNewNameInput' | 'handleRecycleSlime' | 'parentAId' | 'parentBId' | 'setParentAId' | 'setParentBId' | 'isBreedingHatching' | 'handleInitiateBreeding' | 'activeRegentPattern' | 'setActiveRegentPattern' | 'onBuyRegent' | 'activeRegentColor' | 'setActiveRegentColor' | 'onBuyColorRegent' | 'activeTargetRegent' | 'setActiveTargetRegent' | 'onBuyTargetRegent'>;

export function EconomyTab(props: EconomyTabProps) {
  return (
    <LabTab
      {...props}
      activeSubTab="requisitions"
      setActiveSubTab={() => {}}
      handleBuyUpgrade={() => {}}
      handlePurchaseSeedSlime={() => {}}
      selectedSlimeId={null}
      setSelectedSlimeId={() => {}}
      setRenameSlimeId={() => {}}
      setNewNameInput={() => {}}
      handleRecycleSlime={() => {}}
      parentAId={null}
      parentBId={null}
      setParentAId={() => {}}
      setParentBId={() => {}}
      isBreedingHatching={false}
      handleInitiateBreeding={() => {}}
      activeRegentPattern={null}
      setActiveRegentPattern={() => {}}
      onBuyRegent={() => {}}
      activeRegentColor={null}
      setActiveRegentColor={() => {}}
      onBuyColorRegent={() => {}}
      activeTargetRegent={null}
      setActiveTargetRegent={() => {}}
      onBuyTargetRegent={() => {}}
    />
  );
}
