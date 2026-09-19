/**
 * Project "Systemic Extract" - The Anchor Meta-Progression Backend Service
 * 
 * ARCHITECTURE (SOLID TS Ecosystem - Dependency Inversion):
 * - Decoupled persistence via injected IStorageProvider<HideoutState>
 * - No direct localStorage or fetch() calls in business logic
 * - Asynchronous state loading with synchronous cache hydration
 * 
 * DIEGETIC CONTEXT (Cassette-Futurist Quarantine):
 * - The Anchor: Lead-lined Faraday bunker scrubbed of dimensional radiation.
 * - Inert Matter: Scrubbed base currency (previously Scrap).
 * - Biomass Partitions: Reality-warping resin barriers (previously Wood Walls).
 * - Spacial Disruptor: Matter-erasing ordnance (previously Breaching Charge / C4).
 * - Trauma Patch: Battlefield stabilizer (previously Medkit).
 * - Tether Point: Evacuation warp portal (previously Extraction Zone).
 */

import {
  HideoutState,
  HideoutResources,
  CraftingJob,
  DeconstructionJob,
  RaidExtractRequest,
  RaidExtractResponse,
  HideoutTickResponse,
  DeconstructRequest,
  DeconstructResponse,
  ResearchSubmitRequest,
  ResearchSubmitResponse,
  CraftRequest,
  CraftResponse,
  ApiTelemetryLog,
} from '../types';
import { ITEM_REGISTRY, INITIAL_BLUEPRINTS } from './item-registry';
import { IStorageProvider, IndexedDbStorageProvider } from './storage';

export class HideoutBackendService {
  private storage: IStorageProvider<HideoutState>;
  private state: HideoutState;
  private telemetry: ApiTelemetryLog[] = [];
  private listeners: (() => void)[] = [];
  private isReady: boolean = false;
  private initPromise: Promise<void>;

  /**
   * Constraint 3: Dependency Injection
   * HideoutBackendService accepts IStorageProvider via constructor.
   */
  constructor(storage: IStorageProvider<HideoutState>) {
    this.storage = storage;
    this.state = this.getDefaultState();
    this.initPromise = this.initStorage();
  }

  /**
   * Asynchronously hydrates state from the injected storage provider
   */
  private async initStorage(): Promise<void> {
    try {
      const persistedState = await this.storage.load();
      if (persistedState) {
        const defaultState = this.getDefaultState();
        this.state = {
          ...defaultState,
          ...persistedState,
          resources: {
            ...defaultState.resources,
            ...(persistedState.resources ?? {}),
          },
          componentTags: {
            ...defaultState.componentTags,
            ...(persistedState.componentTags ?? {}),
          },
          faradayShield: {
            ...defaultState.faradayShield,
            ...(persistedState.faradayShield ?? {}),
          },
          stats: {
            ...defaultState.stats,
            ...(persistedState.stats ?? {}),
          },
          // Strict null-coalescing and fallbacks for legacy saves
          equippedWeapon: persistedState.equippedWeapon ?? defaultState.equippedWeapon ?? 'kinetic_scattergun',
          unlockedWeapons: (Array.isArray(persistedState.unlockedWeapons) && persistedState.unlockedWeapons.length > 0)
            ? persistedState.unlockedWeapons
            : ['kinetic_scattergun'],
          unlockedSectors: (Array.isArray(persistedState.unlockedSectors) && persistedState.unlockedSectors.length > 0)
            ? persistedState.unlockedSectors
            : ['sector_01'],
          selectedSector: persistedState.selectedSector ?? 'sector_01',
          equippedCharges: persistedState.equippedCharges ?? 1,
          equippedEmp: persistedState.equippedEmp ?? 0,
          equippedFlares: persistedState.equippedFlares ?? 2,
          equippedLures: persistedState.equippedLures ?? 0,
          equippedMedkits: persistedState.equippedMedkits ?? 1,
          dimensionalLuresInStash: persistedState.dimensionalLuresInStash ?? 1,
          hasHazmatRig: persistedState.hasHazmatRig ?? false,
          inventory: Array.isArray(persistedState.inventory) ? persistedState.inventory : defaultState.inventory,
          deconstructionQueue: Array.isArray(persistedState.deconstructionQueue) ? persistedState.deconstructionQueue : [],
          craftingQueue: Array.isArray(persistedState.craftingQueue) ? persistedState.craftingQueue : [],
        };

        // Merge newly added blueprints into legacy save
        const existingBpIds = new Set(this.state.blueprints.map((b) => b.blueprint_id));
        for (const initBp of INITIAL_BLUEPRINTS) {
          if (!existingBpIds.has(initBp.blueprint_id)) {
            this.state.blueprints.push(JSON.parse(JSON.stringify(initBp)));
          }
        }

        this.notify();
      }
    } catch (err) {
      console.warn('[Anchor Service] Error initializing from storage provider:', err);
    } finally {
      this.isReady = true;
    }
  }

  /**
   * Returns a promise resolving once the injected storage provider has hydrated.
   */
  public async ready(): Promise<void> {
    return this.initPromise;
  }

  private getDefaultState(): HideoutState {
    return {
      resources: {
        scrap: 45, // Inert Matter
        silicon: 15,
        copper: 10,
        plasma: 2,
      },
      // ADR 002 Component Data Tags stripped by the Faraday Deconstructor
      componentTags: {
        digital: 8,
        volatile: 4,
        chemical: 2,
        metallic: 12,
        corporate: 3,
        encrypted: 2,
      },
      // Starter Ontological Salvage in the Anchor inventory
      inventory: [
        { item_id: 'corp_server_drive', count: 2 },
        { item_id: 'radio_transceiver', count: 2 },
        { item_id: 'chemical_canister', count: 1 },
        { item_id: 'scrap_metal_salvage', count: 3 },
      ],
      blueprints: JSON.parse(JSON.stringify(INITIAL_BLUEPRINTS)),
      deconstructionQueue: [],
      craftingQueue: [],
      breachingChargesInStash: 2, // Spacial Disruptors
      empGrenadesInStash: 1,      // Echo Disrupters
      thermiteFlaresInStash: 2,   // Thermal Flares
      dimensionalLuresInStash: 1, // ADR 006: Dimensional Lures (starter lure)
      equippedCharges: 1,
      equippedEmp: 0,
      equippedFlares: 2,
      equippedLures: 1,           // ADR 006: Equipped Lure
      equippedMedkits: 1,         // Trauma Patches
      hasHazmatRig: false,        // ADR 006: Lead-Shielded Quarantine Rig
      equippedWeapon: 'kinetic_scattergun', // ADR 007: Autonomous hardpoint weapon
      unlockedWeapons: ['kinetic_scattergun'],
      unlockedSectors: ['sector_01'],
      selectedSector: 'sector_01',
      lastTickTimestamp: Date.now(),
      deconstructorSpeedMultiplier: 1.0,
      faradayShield: {
        integrity: 100,
        isCompromised: false,
        hourlyScrapUpkeep: 20,
        hourlyPlasmaUpkeep: 1,
        lastUpkeepTimestamp: Date.now(),
        totalDrainedScrap: 0,
        totalDrainedPlasma: 0,
        decayedTagsCount: 0,
      },
      stats: {
        totalRaids: 0,
        successfulExtractions: 0,
        deaths: 0,
        scrapExtracted: 0,
        itemsExtracted: 0,
        wallsBreached: 0,
        guardsEliminated: 0,
        blueprintsUnlocked: 2,
        relicsExtracted: 0,
      },
    };
  }

  private async persistState(): Promise<void> {
    try {
      await this.storage.save(this.state);
    } catch (err) {
      console.warn('[Anchor Service] Failed to persist state through storage provider:', err);
    }
    this.notify();
  }

  private logApi(
    method: 'GET' | 'POST',
    endpoint: string,
    requestBody: any,
    responseBody: any,
    latencyMs: number = 18
  ) {
    const entry: ApiTelemetryLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      method,
      endpoint,
      requestBody,
      responseBody,
      latencyMs,
    };
    this.telemetry.unshift(entry);
    if (this.telemetry.length > 50) this.telemetry.pop();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getState(): HideoutState {
    return { ...this.state };
  }

  public getTelemetry(): ApiTelemetryLog[] {
    return [...this.telemetry];
  }

  // ========================================================
  // ENDPOINT: GET /hideout/tick
  // Faraday Anchor background loop & offline time simulation
  // ========================================================
  public async getHideoutTick(): Promise<HideoutTickResponse> {
    const startTime = performance.now();
    const now = Date.now();
    const last = this.state.lastTickTimestamp || now;
    const elapsedSeconds = Math.max(0, Math.floor((now - last) / 1000));

    // Passive Inert Matter stabilization in lead-lined Faraday scrubbers
    const passiveScrap = Math.floor(elapsedSeconds * 0.05);
    this.state.resources.scrap += passiveScrap;
    this.state.lastTickTimestamp = now;

    // ADR 004: Faraday Reality Shield Upkeep (Drain Inert Matter & Plasma)
    const hourlyScrap = this.state.faradayShield.hourlyScrapUpkeep || 20;
    const hourlyPlasma = this.state.faradayShield.hourlyPlasmaUpkeep || 1;
    const scrapDrain = (elapsedSeconds / 3600) * hourlyScrap;
    const plasmaDrain = (elapsedSeconds / 3600) * hourlyPlasma;

    this.state.faradayShield.totalDrainedScrap += scrapDrain;
    this.state.faradayShield.totalDrainedPlasma += plasmaDrain;
    this.state.resources.scrap = Math.max(0, Math.round((this.state.resources.scrap - scrapDrain) * 100) / 100);
    this.state.resources.plasma = Math.max(0, Math.round((this.state.resources.plasma - plasmaDrain) * 100) / 100);
    this.state.faradayShield.lastUpkeepTimestamp = now;

    // ADR 004: Graceful Degradation & Data Decay Check
    if (this.state.resources.scrap <= 0 || this.state.resources.plasma <= 0) {
      // Shields fail: 0% integrity
      this.state.faradayShield.integrity = 0;
      this.state.faradayShield.isCompromised = true;

      // Unspent Component Tags in the research data bank slowly decay
      const activeTags = Object.entries(this.state.componentTags).filter(([_, count]) => count > 0);
      if (activeTags.length > 0 && elapsedSeconds > 0) {
        // Target the highest accumulated tag pool
        activeTags.sort((a, b) => b[1] - a[1]);
        const [targetTag, currentCount] = activeTags[0];
        const tagsToDecay = Math.max(1, Math.floor(elapsedSeconds / 30));
        const actualDecayed = Math.min(currentCount, tagsToDecay);

        this.state.componentTags[targetTag] -= actualDecayed;
        this.state.faradayShield.decayedTagsCount += actualDecayed;
        this.state.faradayShield.lastDecayedTag = targetTag;
      }
    } else {
      // Sufficient resources: Faraday shields nominal at 100%
      this.state.faradayShield.integrity = 100;
      this.state.faradayShield.isCompromised = false;
    }

    // Advance deconstruction queue: Deconstruct Ontological Salvage into Component Data Tags
    const completedDeconstruct: string[] = [];
    for (const job of this.state.deconstructionQueue) {
      if (now >= job.finishAt && !job.isClaimed) {
        completedDeconstruct.push(job.id);
        job.isClaimed = true;

        // Strip data tags into the Anchor component bank
        for (const [tag, count] of Object.entries(job.tagsYielded || {})) {
          this.state.componentTags[tag] = (this.state.componentTags[tag] || 0) + count;
        }

        // Deposit scrubbed elemental resources
        for (const [res, amt] of Object.entries(job.yields)) {
          if (res === 'scrap') this.state.resources.scrap += amt;
          else if (res === 'silicon') this.state.resources.silicon += amt;
          else if (res === 'copper') this.state.resources.copper += amt;
          else if (res === 'plasma') this.state.resources.plasma += amt;
        }
      }
    }
    if (completedDeconstruct.length > 0) {
      this.state.deconstructionQueue = this.state.deconstructionQueue.filter((j) => !j.isClaimed);
    }

    // Advance munitions crafting queue
    const completedCraft: string[] = [];
    for (const job of this.state.craftingQueue) {
      if (now >= job.finishAt && !job.isClaimed) {
        completedCraft.push(job.id);
      }
    }

    this.persistState();

    const response: HideoutTickResponse = {
      elapsedSeconds,
      passiveScrap,
      completedDeconstructJobs: completedDeconstruct,
      completedCraftJobs: completedCraft,
      resources: { ...this.state.resources },
      componentTags: { ...this.state.componentTags },
      faradayShield: { ...this.state.faradayShield },
      timestamp: now,
    };

    this.logApi(
      'GET',
      '/hideout/tick',
      { last_timestamp: last, current_timestamp: now, sector_anchor: 'lead_faraday_bunker' },
      response,
      Math.round(performance.now() - startTime + 10)
    );

    return response;
  }

  // ========================================================
  // ENDPOINT: POST /hideout/deconstruct
  // Strips Ontological Salvage into Component Tags & Inert Matter
  // ========================================================
  public async postHideoutDeconstruct(req: DeconstructRequest): Promise<DeconstructResponse> {
    const startTime = performance.now();
    const itemDef = ITEM_REGISTRY[req.item_id];
    if (!itemDef) {
      const err = { success: false, job: null, remainingInventoryCount: 0, message: 'Invalid ontological salvage item_id' };
      this.logApi('POST', '/hideout/deconstruct', req, err, 10);
      return err;
    }

    const invEntry = this.state.inventory.find((i) => i.item_id === req.item_id);
    if (!invEntry || invEntry.count < req.quantity) {
      const err = {
        success: false,
        job: null,
        remainingInventoryCount: invEntry ? invEntry.count : 0,
        message: 'Insufficient salvage in Anchor vault to deconstruct',
      };
      this.logApi('POST', '/hideout/deconstruct', req, err, 10);
      return err;
    }

    invEntry.count -= req.quantity;
    if (invEntry.count <= 0) {
      this.state.inventory = this.state.inventory.filter((i) => i.item_id !== req.item_id);
    }

    // Calculate discrete material yields
    const totalYields: Record<string, number> = {};
    for (const [res, amt] of Object.entries(itemDef.deconstruct_yield)) {
      totalYields[res] = amt * req.quantity;
    }

    // Calculate component data tags extracted from 1980s circuitry
    const totalTags: Record<string, number> = {};
    for (const [tag, val] of Object.entries(itemDef.research_tags)) {
      totalTags[tag] = val * req.quantity;
    }

    const durationSeconds = Math.max(5, Math.round((8 * req.quantity) / this.state.deconstructorSpeedMultiplier));
    const now = Date.now();

    const job: DeconstructionJob = {
      id: `decon_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      item_id: req.item_id,
      itemName: itemDef.name,
      quantity: req.quantity,
      yields: totalYields,
      tagsYielded: totalTags,
      durationSeconds,
      startedAt: now,
      finishAt: now + durationSeconds * 1000,
      isClaimed: false,
    };

    this.state.deconstructionQueue.push(job);
    this.persistState();

    const response: DeconstructResponse = {
      success: true,
      job,
      remainingInventoryCount: invEntry ? invEntry.count : 0,
      message: `Enqueued ${req.quantity}x ${itemDef.name} for deconstruction and radiation scrubbing (${durationSeconds}s).`,
    };

    this.logApi('POST', '/hideout/deconstruct', req, response, Math.round(performance.now() - startTime + 15));
    return response;
  }

  // ========================================================
  // ENDPOINT: POST /hideout/deconstruct/claim
  // Deposits Inert Matter and Component Data Tags into the Anchor
  // ========================================================
  public claimDeconstructionJob(jobId: string): boolean {
    const job = this.state.deconstructionQueue.find((j) => j.id === jobId);
    if (!job || job.isClaimed || Date.now() < job.finishAt) return false;

    job.isClaimed = true;
    for (const [res, amt] of Object.entries(job.yields)) {
      if (res === 'scrap') this.state.resources.scrap += amt;
      else if (res === 'silicon') this.state.resources.silicon += amt;
      else if (res === 'copper') this.state.resources.copper += amt;
      else if (res === 'plasma') this.state.resources.plasma += amt;
    }

    for (const [tag, count] of Object.entries(job.tagsYielded || {})) {
      this.state.componentTags[tag] = (this.state.componentTags[tag] || 0) + count;
    }

    this.state.deconstructionQueue = this.state.deconstructionQueue.filter((j) => j.id !== jobId);
    this.persistState();

    this.logApi(
      'POST',
      '/hideout/deconstruct/claim',
      { job_id: jobId },
      {
        success: true,
        claimedYields: job.yields,
        claimedTags: job.tagsYielded,
        updatedResources: this.state.resources,
        updatedTags: this.state.componentTags,
      },
      12
    );
    return true;
  }

  // ========================================================
  // ENDPOINT: POST /research/brainstorm
  // Tag-Based Ontological Research Desk (Abiotic Factor style)
  // ========================================================
  public async postResearchBrainstorm(req: ResearchSubmitRequest): Promise<ResearchSubmitResponse> {
    const startTime = performance.now();
    const blueprint = this.state.blueprints.find((b) => b.blueprint_id === req.blueprint_id);

    if (!blueprint) {
      const err = {
        success: false,
        blueprint_id: req.blueprint_id,
        tagsAdded: {},
        unlocked: false,
        message: 'Invalid schematic ID',
      };
      this.logApi('POST', '/research/brainstorm', req, err, 10);
      return err;
    }

    if (blueprint.unlocked) {
      const err = {
        success: false,
        blueprint_id: req.blueprint_id,
        tagsAdded: {},
        unlocked: true,
        message: `Schematic [${blueprint.name}] is already unlocked and ready for fabrication.`,
      };
      this.logApi('POST', '/research/brainstorm', req, err, 10);
      return err;
    }

    const tagsAdded: Record<string, number> = {};

    // Branch A: Direct Tag Allocation from Component Data Tags Bank
    if (req.tag && req.tagAmount && req.tagAmount > 0) {
      const available = this.state.componentTags[req.tag] || 0;
      if (available < req.tagAmount) {
        const err = {
          success: false,
          blueprint_id: req.blueprint_id,
          tagsAdded: {},
          unlocked: false,
          message: `Insufficient [${req.tag}] data tags. Available: ${available}, requested: ${req.tagAmount}. Deconstruct more salvage!`,
        };
        this.logApi('POST', '/research/brainstorm', req, err, 10);
        return err;
      }

      this.state.componentTags[req.tag] -= req.tagAmount;
      tagsAdded[req.tag] = req.tagAmount;
      blueprint.contributed_tags[req.tag] = (blueprint.contributed_tags[req.tag] || 0) + req.tagAmount;
    }
    // Branch B: Direct Item Sacrifice
    else if (req.item_id) {
      const itemDef = ITEM_REGISTRY[req.item_id];
      if (!itemDef) {
        const err = {
          success: false,
          blueprint_id: req.blueprint_id,
          tagsAdded: {},
          unlocked: false,
          message: 'Invalid ontological salvage item ID',
        };
        this.logApi('POST', '/research/brainstorm', req, err, 10);
        return err;
      }

      const quantity = req.quantity || 1;
      const invEntry = this.state.inventory.find((i) => i.item_id === req.item_id);
      if (!invEntry || invEntry.count < quantity) {
        const err = {
          success: false,
          blueprint_id: req.blueprint_id,
          tagsAdded: {},
          unlocked: false,
          message: 'Item not available in Anchor inventory',
        };
        this.logApi('POST', '/research/brainstorm', req, err, 10);
        return err;
      }

      invEntry.count -= quantity;
      if (invEntry.count <= 0) {
        this.state.inventory = this.state.inventory.filter((i) => i.item_id !== req.item_id);
      }

      for (const [tag, val] of Object.entries(itemDef.research_tags)) {
        const totalToAdd = val * quantity;
        tagsAdded[tag] = totalToAdd;
        blueprint.contributed_tags[tag] = (blueprint.contributed_tags[tag] || 0) + totalToAdd;
      }
    } else {
      const err = {
        success: false,
        blueprint_id: req.blueprint_id,
        tagsAdded: {},
        unlocked: false,
        message: 'Must provide either tag & tagAmount or item_id to research',
      };
      this.logApi('POST', '/research/brainstorm', req, err, 10);
      return err;
    }

    // Check unlock conditions
    let allMet = true;
    for (const [reqTag, requiredAmt] of Object.entries(blueprint.requirements_to_unlock)) {
      const currentAmt = blueprint.contributed_tags[reqTag] || 0;
      if (currentAmt < requiredAmt) {
        allMet = false;
        break;
      }
    }

    if (allMet) {
      blueprint.unlocked = true;
      this.state.stats.blueprintsUnlocked += 1;
    }

    this.persistState();

    const response: ResearchSubmitResponse = {
      success: true,
      blueprint_id: blueprint.blueprint_id,
      tagsAdded,
      unlocked: blueprint.unlocked,
      message: blueprint.unlocked
        ? `Research Breakthrough! Schematic for [${blueprint.name}] has been synthesized.`
        : `Analysis complete. Ontological tags injected into [${blueprint.name}].`,
    };

    this.logApi('POST', '/research/brainstorm', req, response, Math.round(performance.now() - startTime + 18));
    return response;
  }

  // ========================================================
  // ENDPOINT: POST /hideout/craft
  // Assembles Spacial Disruptors and tactical munitions
  // ========================================================
  public async postHideoutCraft(req: CraftRequest): Promise<CraftResponse> {
    const startTime = performance.now();
    const blueprint = this.state.blueprints.find((b) => b.blueprint_id === req.blueprint_id);

    if (!blueprint || !blueprint.unlocked) {
      const err = {
        success: false,
        job: null,
        remainingResources: { ...this.state.resources },
        message: 'Schematic not unlocked yet.',
      };
      this.logApi('POST', '/hideout/craft', req, err, 10);
      return err;
    }

    // Check material costs (scrap = Inert Matter)
    for (const [mat, cost] of Object.entries(blueprint.requirements_to_craft)) {
      const current = (this.state.resources as any)[mat] || 0;
      if (current < cost) {
        const matName = mat === 'scrap' ? 'Inert Matter' : mat;
        const err = {
          success: false,
          job: null,
          remainingResources: { ...this.state.resources },
          message: `Insufficient ${matName}: Requires ${cost}, you have ${current}.`,
        };
        this.logApi('POST', '/hideout/craft', req, err, 10);
        return err;
      }
    }

    for (const [mat, cost] of Object.entries(blueprint.requirements_to_craft)) {
      (this.state.resources as any)[mat] -= cost;
    }

    const now = Date.now();
    const duration = blueprint.craftDurationSeconds;

    const job: CraftingJob = {
      id: `craft_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      blueprint_id: blueprint.blueprint_id,
      itemName: blueprint.name,
      costMaterials: { ...blueprint.requirements_to_craft },
      durationSeconds: duration,
      startedAt: now,
      finishAt: now + duration * 1000,
      isClaimed: false,
    };

    this.state.craftingQueue.push(job);
    this.persistState();

    const response: CraftResponse = {
      success: true,
      job,
      remainingResources: { ...this.state.resources },
      message: `Fabricating 1x ${blueprint.name}. Synthesized in ${duration}s.`,
    };

    this.logApi('POST', '/hideout/craft', req, response, Math.round(performance.now() - startTime + 16));
    return response;
  }

  // ========================================================
  // CLAIM COMPLETED CRAFT JOB
  // ========================================================
  public claimCraftJob(jobId: string): boolean {
    const job = this.state.craftingQueue.find((j) => j.id === jobId);
    if (!job || job.isClaimed || Date.now() < job.finishAt) return false;

    job.isClaimed = true;
    if (job.blueprint_id === 'breaching_charge_t1') {
      this.state.breachingChargesInStash += 1; // Spacial Disruptor
    } else if (job.blueprint_id === 'emp_device_t1') {
      this.state.empGrenadesInStash += 1;     // Echo Disrupter
    } else if (job.blueprint_id === 'thermite_flare_t1') {
      this.state.thermiteFlaresInStash += 2;   // Thermal Flare
    } else if (job.blueprint_id === 'dimensional_lure_t1') {
      this.state.dimensionalLuresInStash += 1; // ADR 006: Dimensional Lure
    } else if (job.blueprint_id === 'hazmat_rig_t1') {
      this.state.hasHazmatRig = true;          // ADR 006: Lead-Shielded Quarantine Rig
    } else if (job.blueprint_id === 'kinetic_scattergun_t1') {
      if (!this.state.unlockedWeapons.includes('kinetic_scattergun')) {
        this.state.unlockedWeapons.push('kinetic_scattergun');
      }
    } else if (job.blueprint_id === 'plasma_pulse_array_t1') {
      if (!this.state.unlockedWeapons.includes('plasma_pulse_array')) {
        this.state.unlockedWeapons.push('plasma_pulse_array');
      }
      this.state.equippedWeapon = 'plasma_pulse_array';
    }

    this.state.craftingQueue = this.state.craftingQueue.filter((j) => j.id !== jobId);
    this.persistState();
    return true;
  }

  public setEquippedWeapon(weapon: 'kinetic_scattergun' | 'plasma_pulse_array'): boolean {
    if (!this.state.unlockedWeapons || this.state.unlockedWeapons.length === 0) {
      this.state.unlockedWeapons = ['kinetic_scattergun'];
    }
    const target = weapon ?? 'kinetic_scattergun';
    if (this.state.unlockedWeapons.includes(target)) {
      this.state.equippedWeapon = target;
      this.persistState();
      return true;
    }
    // Fallback to first unlocked weapon
    this.state.equippedWeapon = this.state.unlockedWeapons[0];
    this.persistState();
    return true;
  }

  // ========================================================
  // ENDPOINT: POST /raid/extract
  // Persists extracted Ontological Salvage & Inert Matter
  // ========================================================
  public async postRaidExtract(req: RaidExtractRequest): Promise<RaidExtractResponse> {
    const startTime = performance.now();
    this.state.stats.totalRaids += 1;
    this.state.stats.wallsBreached += req.wallsDestroyed;
    this.state.stats.guardsEliminated += req.guardsEliminated;

    let creditedScrap = 0;
    let creditedItems: any[] = [];
    let inventoryPreserved = false;

    if (req.extracted) {
      this.state.stats.successfulExtractions += 1;
      this.state.stats.scrapExtracted += req.scrapCollected;
      creditedScrap = req.scrapCollected;
      this.state.resources.scrap += creditedScrap; // Inert Matter

      // Add scavenged ontological salvage to Anchor vault
      let extractedRelic = false;
      for (const scav of req.scavengedItems) {
        const existing = this.state.inventory.find((i) => i.item_id === scav.item_id);
        if (existing) {
          existing.count += scav.count;
        } else {
          this.state.inventory.push({ item_id: scav.item_id, count: scav.count });
        }
        this.state.stats.itemsExtracted += scav.count;

        if (scav.item_id === 'relic_ontological_core') {
          extractedRelic = true;
          this.state.stats.relicsExtracted = (this.state.stats.relicsExtracted || 0) + scav.count;
        }
      }
      creditedItems = req.scavengedItems;

      // ADR 006 Relic Gate: Extracting with Apex Ontological Core permanently unlocks Sector 02!
      if (extractedRelic && !this.state.unlockedSectors.includes('sector_02')) {
        this.state.unlockedSectors.push('sector_02');
      }

      // Recover unspent ordnance
      this.state.breachingChargesInStash += req.chargesRemaining;
      if (req.empRemaining) this.state.empGrenadesInStash += req.empRemaining;
      if (req.flaresRemaining) this.state.thermiteFlaresInStash += req.flaresRemaining;
      if (req.luresRemaining) this.state.dimensionalLuresInStash += req.luresRemaining;
      inventoryPreserved = true;
    } else {
      this.state.stats.deaths += 1;
      creditedScrap = 0;
      creditedItems = [];
      inventoryPreserved = false;
    }

    this.state.equippedCharges = 0;
    this.state.equippedEmp = 0;
    this.state.equippedFlares = 0;
    this.state.equippedLures = 0;
    this.state.lastTickTimestamp = Date.now();
    this.persistState();

    const response: RaidExtractResponse = {
      success: true,
      status: req.extracted ? 'EXTRACTED' : 'KIA',
      creditedScrap,
      creditedItems,
      newResources: { ...this.state.resources },
      inventoryPreserved,
      timestamp: Date.now(),
    };

    this.logApi('POST', '/raid/extract', req, response, Math.round(performance.now() - startTime + 25));
    return response;
  }

  // ========================================================
  // SECTOR ROUTING & LOADOUT SELECTION (ADR 006)
  // ========================================================
  public isSectorUnlocked(sectorId: 'sector_01' | 'sector_02'): boolean {
    if (sectorId === 'sector_01') return true;
    // Unlocked if in array OR player currently possesses an Apex Ontological Core in stash
    return (
      (this.state.unlockedSectors && this.state.unlockedSectors.includes('sector_02')) ||
      this.state.inventory.some((i) => i.item_id === 'relic_ontological_core' && i.count > 0) ||
      (this.state.stats.relicsExtracted || 0) > 0
    );
  }

  public setSelectedSector(sectorId: 'sector_01' | 'sector_02'): boolean {
    if (!this.isSectorUnlocked(sectorId)) {
      return false;
    }
    this.state.selectedSector = sectorId;
    if (!this.state.unlockedSectors.includes(sectorId)) {
      this.state.unlockedSectors.push(sectorId);
    }
    this.persistState();
    return true;
  }

  public setEquippedLoadout(charges: number, emp: number, flares: number, lures: number = 0) {
    this.state.equippedCharges = charges;
    this.state.equippedEmp = emp;
    this.state.equippedFlares = flares;
    this.state.equippedLures = lures;
    this.state.breachingChargesInStash = Math.max(0, this.state.breachingChargesInStash - charges);
    this.state.empGrenadesInStash = Math.max(0, this.state.empGrenadesInStash - emp);
    this.state.thermiteFlaresInStash = Math.max(0, this.state.thermiteFlaresInStash - flares);
    this.state.dimensionalLuresInStash = Math.max(0, this.state.dimensionalLuresInStash - lures);
    this.persistState();
  }

  // ADR 004: Emergency Shield Fuel Injection
  public async postEmergencyRefuel(scrapAmt: number = 30, plasmaAmt: number = 2): Promise<{ success: boolean; message: string }> {
    this.state.resources.scrap += scrapAmt;
    this.state.resources.plasma += plasmaAmt;
    this.state.faradayShield.integrity = 100;
    this.state.faradayShield.isCompromised = false;
    this.persistState();
    return { success: true, message: `Emergency stabilizer cells injected: +${scrapAmt} Inert Matter, +${plasmaAmt} Plasma.` };
  }

  public async resetState(): Promise<void> {
    this.state = this.getDefaultState();
    this.telemetry = [];
    try {
      await this.storage.clear();
      await this.storage.save(this.state);
    } catch (err) {
      console.warn('[Anchor Service] Error clearing storage during reset:', err);
    }
    this.notify();
  }
}

/**
 * Default Singleton Instance
 * Injected with native browser IndexedDB persistence.
 */
export const defaultAnchorStorage = new IndexedDbStorageProvider();
export const hideoutBackend = new HideoutBackendService(defaultAnchorStorage);
