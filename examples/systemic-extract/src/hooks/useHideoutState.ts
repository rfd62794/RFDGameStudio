import { useState, useEffect, useCallback } from 'react';
import { hideoutBackend } from '../backend/hideout-service';
import { HideoutState, SectorId } from '../types';
import { sound } from '../game/audio';

export interface UseHideoutStateProps {
  onDeployRaid: (
    equippedCharges: number,
    medkits: number,
    flares: number,
    equippedLures?: number,
    selectedSector?: SectorId,
    hasHazmatRig?: boolean,
    equippedWeapon?: 'kinetic_scattergun' | 'plasma_pulse_array',
    unlockedWeapons?: ('kinetic_scattergun' | 'plasma_pulse_array')[]
  ) => void;
}

export function useHideoutState({ onDeployRaid }: UseHideoutStateProps) {
  const [hideout, setHideout] = useState<HideoutState>(hideoutBackend.getState());
  const [activeTab, setActiveTab] = useState<'refinement' | 'deployment'>('deployment');
  const [now, setNow] = useState(Date.now());

  // Research workbench selection
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('emp_device_t1');
  const [selectedBrainstormItemId, setSelectedBrainstormItemId] = useState<string>('');
  const [researchFeedback, setResearchFeedback] = useState<string | null>(null);

  // Loadout state before deployment
  const [equippedCharges, setEquippedCharges] = useState(
    Math.min(hideout.breachingChargesInStash, 2) || (hideout.breachingChargesInStash > 0 ? 1 : 0)
  );
  const [equippedEmp, setEquippedEmp] = useState(
    Math.min(hideout.empGrenadesInStash, 1)
  );
  const [equippedFlares, setEquippedFlares] = useState(
    Math.min(hideout.thermiteFlaresInStash, 2)
  );
  const [equippedLures, setEquippedLures] = useState(
    hideout.equippedLures || 0
  );
  const [equippedMedkits] = useState(1);
  const [equippedWeapon, setEquippedWeaponState] = useState<'kinetic_scattergun' | 'plasma_pulse_array'>(
    hideout.equippedWeapon || 'kinetic_scattergun'
  );

  // 1. Subscribe to backend state changes
  useEffect(() => {
    const unsubscribe = hideoutBackend.subscribe(() => {
      const state = hideoutBackend.getState();
      setHideout(state);
    });
    return unsubscribe;
  }, []);

  // 2. Regular background ticker (every 1s) to advance queues and passive atmospheric scrap
  useEffect(() => {
    hideoutBackend.getHideoutTick();
    const interval = setInterval(() => {
      setNow(Date.now());
      hideoutBackend.getHideoutTick();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize loadout caps if stash changes
  useEffect(() => {
    if (equippedCharges > hideout.breachingChargesInStash) {
      setEquippedCharges(hideout.breachingChargesInStash);
    }
    if (equippedEmp > hideout.empGrenadesInStash) {
      setEquippedEmp(hideout.empGrenadesInStash);
    }
    if (equippedFlares > hideout.thermiteFlaresInStash) {
      setEquippedFlares(hideout.thermiteFlaresInStash);
    }
    if (equippedLures > hideout.dimensionalLuresInStash) {
      setEquippedLures(hideout.dimensionalLuresInStash);
    }
  }, [hideout.breachingChargesInStash, hideout.empGrenadesInStash, hideout.thermiteFlaresInStash, hideout.dimensionalLuresInStash]);

  // Set default brainstorm item when inventory changes
  useEffect(() => {
    if (hideout.inventory.length > 0 && !selectedBrainstormItemId) {
      setSelectedBrainstormItemId(hideout.inventory[0].item_id);
    }
  }, [hideout.inventory, selectedBrainstormItemId]);

  // ADR 004: Emergency Shield Fuel Injection
  const handleEmergencyRefuel = useCallback(async () => {
    sound.playExtractSuccess();
    await hideoutBackend.postEmergencyRefuel(30, 2);
    setHideout({ ...hideoutBackend.getState() });
  }, []);

  // ==========================================
  // HANDLERS: DECONSTRUCTION
  // ==========================================
  const handleDeconstructItem = useCallback(async (itemId: string) => {
    sound.playBeep();
    const resp = await hideoutBackend.postHideoutDeconstruct({
      item_id: itemId,
      quantity: 1,
    });
    return resp;
  }, []);

  const handleClaimDeconstruction = useCallback((jobId: string) => {
    const ok = hideoutBackend.claimDeconstructionJob(jobId);
    if (ok) {
      sound.playScrapPickup();
    }
    return ok;
  }, []);

  // ==========================================
  // HANDLERS: RESEARCH BRAINSTORM & TAG INVESTMENT (ADR 002)
  // ==========================================
  const handleInvestTag = useCallback(async (blueprintId: string, tag: string, amount: number = 1) => {
    sound.playBeep();
    const resp = await hideoutBackend.postResearchBrainstorm({
      blueprint_id: blueprintId,
      tag,
      tagAmount: amount,
    });
    if (resp.success) {
      if (resp.unlocked) {
        sound.playExtractSuccess();
        setResearchFeedback(`BREAKTHROUGH! Schematic unlocked: ${resp.message}`);
      } else {
        setResearchFeedback(`Data linked: Injected +${amount} [${tag}] into schematic.`);
      }
      setTimeout(() => setResearchFeedback(null), 5000);
    } else {
      setResearchFeedback(resp.message);
      setTimeout(() => setResearchFeedback(null), 4000);
    }
    return resp;
  }, []);

  const handleInvestAllNeededTags = useCallback(async (blueprintId: string) => {
    const bp = hideout.blueprints.find((b) => b.blueprint_id === blueprintId);
    if (!bp || bp.unlocked) return;
    sound.playBeep();

    let totalInjected = 0;
    for (const [tag, req] of Object.entries(bp.requirements_to_unlock)) {
      const current = bp.contributed_tags[tag] || 0;
      const needed = Math.max(0, Number(req) - current);
      const available = hideout.componentTags[tag] || 0;
      const toSend = Math.min(needed, available);
      if (toSend > 0) {
        await hideoutBackend.postResearchBrainstorm({
          blueprint_id: blueprintId,
          tag,
          tagAmount: toSend,
        });
        totalInjected += toSend;
      }
    }

    const updatedBp = hideout.blueprints.find((b) => b.blueprint_id === blueprintId);
    if (updatedBp?.unlocked) {
      sound.playExtractSuccess();
      setResearchFeedback(`BREAKTHROUGH! Schematic fully synthesized and unlocked!`);
    } else if (totalInjected > 0) {
      setResearchFeedback(`Injected ${totalInjected} data tags from deconstructed salvage.`);
    } else {
      setResearchFeedback(`No matching data tags available in Bank. Deconstruct salvage first.`);
    }
    setTimeout(() => setResearchFeedback(null), 5000);
  }, [hideout.blueprints, hideout.componentTags]);

  const handleBrainstormSubmit = useCallback(async () => {
    if (!selectedBlueprintId || !selectedBrainstormItemId) return;
    sound.playBeep();
    const resp = await hideoutBackend.postResearchBrainstorm({
      blueprint_id: selectedBlueprintId,
      item_id: selectedBrainstormItemId,
      quantity: 1,
    });
    if (resp.success) {
      if (resp.unlocked) {
        sound.playExtractSuccess();
        setResearchFeedback(`BREAKTHROUGH! Schematic unlocked: ${resp.message}`);
      } else {
        setResearchFeedback(`Analysis complete. Added tags to prototype.`);
      }
      setTimeout(() => setResearchFeedback(null), 5000);
    } else {
      setResearchFeedback(resp.message);
      setTimeout(() => setResearchFeedback(null), 4000);
    }
  }, [selectedBlueprintId, selectedBrainstormItemId]);

  // ==========================================
  // HANDLERS: FABRICATOR / CRAFTING
  // ==========================================
  const handleStartCraft = useCallback(async (blueprintId: string) => {
    sound.playBeep();
    const resp = await hideoutBackend.postHideoutCraft({
      blueprint_id: blueprintId,
    });
    if (!resp.success) {
      alert(resp.message);
    }
    return resp;
  }, []);

  const handleClaimCraft = useCallback((jobId: string) => {
    const ok = hideoutBackend.claimCraftJob(jobId);
    if (ok) {
      sound.playScrapPickup();
    }
    return ok;
  }, []);

  // ==========================================
  // DEPLOYMENT TO RAID
  // ==========================================
  const handleDeploy = useCallback(() => {
    sound.playAlert();
    try {
      if (typeof hideoutBackend.setEquippedLoadout === 'function') {
        hideoutBackend.setEquippedLoadout(
          equippedCharges ?? 1,
          equippedEmp ?? 0,
          equippedFlares ?? 2,
          equippedLures ?? 0
        );
      }
      if (typeof hideoutBackend.setEquippedWeapon === 'function') {
        hideoutBackend.setEquippedWeapon(equippedWeapon ?? 'kinetic_scattergun');
      }
    } catch (e) {
      console.warn('[Deployment Warning] Failed to sync loadout with backend prior to raid:', e);
    }
    onDeployRaid(
      equippedCharges ?? 1,
      equippedMedkits ?? 1,
      equippedFlares ?? 2,
      equippedLures ?? 0,
      hideout.selectedSector ?? 'sector_01',
      hideout.hasHazmatRig ?? false,
      equippedWeapon ?? 'kinetic_scattergun',
      (hideout.unlockedWeapons && hideout.unlockedWeapons.length > 0) ? hideout.unlockedWeapons : ['kinetic_scattergun']
    );
  }, [
    equippedCharges,
    equippedEmp,
    equippedFlares,
    equippedLures,
    equippedWeapon,
    equippedMedkits,
    hideout.selectedSector,
    hideout.hasHazmatRig,
    hideout.unlockedWeapons,
    onDeployRaid,
  ]);

  const setSelectedSector = useCallback((sector: SectorId) => {
    hideoutBackend.setSelectedSector(sector);
    setHideout({ ...hideoutBackend.getState() });
  }, []);

  const isSectorUnlocked = useCallback((sector: SectorId) => {
    return hideoutBackend.isSectorUnlocked(sector);
  }, []);

  const selectedBlueprint = hideout.blueprints.find((b) => b.blueprint_id === selectedBlueprintId);

  return {
    hideout,
    activeTab,
    setActiveTab,
    now,
    selectedBlueprintId,
    setSelectedBlueprintId,
    selectedBrainstormItemId,
    setSelectedBrainstormItemId,
    researchFeedback,
    setResearchFeedback,
    equippedCharges,
    setEquippedCharges,
    equippedEmp,
    setEquippedEmp,
    equippedFlares,
    setEquippedFlares,
    equippedLures,
    setEquippedLures,
    equippedMedkits,
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
  };
}
