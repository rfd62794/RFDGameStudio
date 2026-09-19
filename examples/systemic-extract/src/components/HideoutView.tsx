/**
 * Hideout View Component (Phase 10: Pragmatic Segregation)
 * Refactored to modular architecture:
 * - State and loop logic encapsulated in useHideoutState
 * - Sub-components extracted to /components/hideout/
 *   - HideoutHeader: discrete resource telemetry and tab navigation
 *   - FaradayShieldBanner: ADR 004 attrition and sub-space reality shield
 *   - DeconstructorPanel: extracted inventory and SS13 idle deconstructor queue
 *   - ResearchBenchPanel: data tags bank and Abiotic Factor schematic synthesis
 *   - FabricatorPanel: munitions assembly queue and discrete crafting
 *   - DeploymentBayPanel: tactical loadout, weapons matrix, and sector routing
 *   - HideoutFooter: persistent extraction statistics
 */

import React from 'react';
import { useHideoutState } from '../hooks/useHideoutState';
import { SectorId, WeaponId } from '../types';
import { HideoutHeader } from './hideout/HideoutHeader';
import { FaradayShieldBanner } from './hideout/FaradayShieldBanner';
import { DeconstructorPanel } from './hideout/DeconstructorPanel';
import { ResearchBenchPanel } from './hideout/ResearchBenchPanel';
import { FabricatorPanel } from './hideout/FabricatorPanel';
import { DeploymentBayPanel } from './hideout/DeploymentBayPanel';
import { HideoutFooter } from './hideout/HideoutFooter';

interface HideoutViewProps {
  onDeployRaid: (
    equippedCharges: number,
    medkits: number,
    flares: number,
    equippedLures?: number,
    selectedSector?: SectorId,
    hasHazmatRig?: boolean,
    equippedWeapon?: WeaponId,
    unlockedWeapons?: WeaponId[]
  ) => void;
  onOpenInspector: () => void;
}

export const HideoutView: React.FC<HideoutViewProps> = ({
  onDeployRaid,
  onOpenInspector,
}) => {
  const {
    hideout,
    activeTab,
    setActiveTab,
    now,
    selectedBlueprintId,
    setSelectedBlueprintId,
    selectedBrainstormItemId,
    setSelectedBrainstormItemId,
    researchFeedback,
    equippedCharges,
    setEquippedCharges,
    equippedEmp,
    setEquippedEmp,
    equippedFlares,
    setEquippedFlares,
    equippedLures,
    setEquippedLures,
    equippedWeapon,
    setEquippedWeaponState,
    selectedBlueprint,
    setSelectedSector,
    isSectorUnlocked,
    handleEmergencyRefuel,
    handleDeconstructItem,
    handleClaimDeconstruction,
    handleInvestTag,
    handleInvestAllNeededTags,
    handleBrainstormSubmit,
    handleStartCraft,
    handleClaimCraft,
    handleDeploy,
  } = useHideoutState({ onDeployRaid });

  return (
    <div id="hideout-view-root" className="min-h-full w-full bg-[#090d13] text-[#e2e8f0] font-sans flex flex-col select-none">
      {/* TOP HEADER & TAB NAVIGATION */}
      <HideoutHeader
        hideout={hideout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDeploy={handleDeploy}
        onOpenInspector={onOpenInspector}
      />

      {/* ADR 004: FARADAY REALITY SHIELD & ATTRITION STATUS BANNER */}
      <FaradayShieldBanner
        hideout={hideout}
        onEmergencyRefuel={handleEmergencyRefuel}
      />

      {/* TAB NAVIGATION STRIP (MOBILE & DESKTOP DUAL ACCESS) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1 flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('refinement')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'refinement'
                ? 'bg-[#0284c7] text-white shadow-md'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-white border border-[#1e293b]'
            }`}
          >
            <span>🔬 1. REFINEMENT &amp; RESEARCH</span>
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'deployment'
                ? 'bg-[#10b981] text-white shadow-md'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-white border border-[#1e293b]'
            }`}
          >
            <span>🚀 2. ARMORY &amp; DEPLOYMENT BAY</span>
          </button>
        </div>

        {activeTab === 'refinement' && (
          <button
            onClick={() => setActiveTab('deployment')}
            className="text-xs text-[#34d399] hover:text-white bg-[#065f46]/40 hover:bg-[#059669] border border-[#10b981]/40 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>PROCEED TO DEPLOYMENT BAY &rarr;</span>
          </button>
        )}
      </div>

      {/* TAB 1: REFINEMENT & RESEARCH BENCH */}
      {activeTab === 'refinement' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section A: Extracted Inventory & SS13 Deconstructor Queue */}
          <DeconstructorPanel
            hideout={hideout}
            now={now}
            selectedBrainstormItemId={selectedBrainstormItemId}
            setSelectedBrainstormItemId={setSelectedBrainstormItemId}
            onDeconstructItem={handleDeconstructItem}
            onClaimDeconstruction={handleClaimDeconstruction}
          />

          {/* Section B: Abiotic Factor Research Bench & Tag Synthesis */}
          <ResearchBenchPanel
            hideout={hideout}
            selectedBlueprintId={selectedBlueprintId}
            setSelectedBlueprintId={setSelectedBlueprintId}
            selectedBlueprint={selectedBlueprint}
            selectedBrainstormItemId={selectedBrainstormItemId}
            setSelectedBrainstormItemId={setSelectedBrainstormItemId}
            researchFeedback={researchFeedback}
            onInvestTag={handleInvestTag}
            onInvestAllNeededTags={handleInvestAllNeededTags}
            onBrainstormSubmit={handleBrainstormSubmit}
          />
        </main>
      )}

      {/* TAB 2: MUNITIONS FABRICATOR & DEPLOYMENT */}
      {activeTab === 'deployment' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section A: Munitions Fabricator & Discrete Material Assembly */}
          <FabricatorPanel
            hideout={hideout}
            now={now}
            onStartCraft={handleStartCraft}
            onClaimCraft={handleClaimCraft}
          />

          {/* Section B: Tactical Armory, Weapons Matrix & Deployment Routing */}
          <DeploymentBayPanel
            hideout={hideout}
            equippedWeapon={equippedWeapon}
            setEquippedWeaponState={setEquippedWeaponState}
            equippedCharges={equippedCharges}
            setEquippedCharges={setEquippedCharges}
            equippedEmp={equippedEmp}
            setEquippedEmp={setEquippedEmp}
            equippedFlares={equippedFlares}
            setEquippedFlares={setEquippedFlares}
            equippedLures={equippedLures}
            setEquippedLures={setEquippedLures}
            setSelectedSector={setSelectedSector}
            isSectorUnlocked={isSectorUnlocked}
            onDeploy={handleDeploy}
          />
        </main>
      )}

      {/* FOOTER: STATS & PERSISTENCE RECORD */}
      <HideoutFooter hideout={hideout} />
    </div>
  );
};
