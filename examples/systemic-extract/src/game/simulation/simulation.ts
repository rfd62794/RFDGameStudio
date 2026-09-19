import { World } from '../ecs';
import {
  CombatEvent,
  EntityId,
  ParticleEffect,
  TileState,
  ZoneType,
  MapType,
  DungeonZoneId,
  HazardState,
  Faction,
  ScavengedLootEntry,
  SectorId,
  BiomeProfile,
  ActiveBuffs,
} from '../../types';
import { MAP_WIDTH, MAP_HEIGHT, createOverworldMap, createDungeonMap } from '../map';
import { BIOME_PROFILES } from '../../backend/item-registry';
import { sound } from '../audio';
import { Schedule } from '../core/system-types';
import {
  PlayerInputSystem,
  VisualInterpolationSystem,
  ProjectileSystem,
  ParticleSystem,
  DemolitionSystem,
  ExtractionSystem,
  SwarmSeparationSystem,
  AutoTargetSystem,
  AiPatrolSystem,
  OverclockSystem,
  HazardSpreadSystem,
  EscalationSystem,
  HiveSpawningSystem,
  ResidentSystem,
  BuildSystem,
} from '../systems/index';

// ============================================================================
// SIMULATION ORCHESTRATOR (DECOUPLED VIA SCHEDULE)
// ============================================================================
export class Simulation {
  public world: World;
  public tiles: TileState[][];
  public playerEntityId: EntityId;
  public combatLog: CombatEvent[] = [];
  public particles: ParticleEffect[] = [];
  public isRaidActive: boolean = true;
  public isExtracted: boolean = false;
  public isPlayerDead: boolean = false;
  public extractionTimer: number = 0; // Counts up to 5.0s when in Tether Point
  public readonly EXTRACTION_REQUIRED_TIME: number = 5.0;

  public scrapCollectedInRaid: number = 0;
  public bankedScrap: number = 25; // ADR 011: Banked in Sanctuary Core
  public scavengedItems: ScavengedLootEntry[] = [];
  public chargesUsed: number = 0;
  public guardsEliminated: number = 0;
  public wallsDestroyed: number = 0;
  public raidElapsedSeconds: number = 0;

  // ADR 011: Construction, Specialists & Operational Buffs
  public activeBuffs: ActiveBuffs = {
    damageBonus: 0,
    regenRate: 0,
    armorRating: 0,
    speedMultiplier: 1.0,
  };
  public unlockedBlueprints: Set<string> = new Set(['munitions_forge']);
  public currentMapType: MapType = 'overworld';
  public activeDungeonId: DungeonZoneId | null = null;
  public nearbyDungeonGate: {
    dungeonId: DungeonZoneId;
    name: string;
    x: number;
    y: number;
  } | null = null;
  public currentZoneName: string = 'Operative Home // Faraday Sanctuary [SECURE]';
  public currentZoneType: ZoneType = 'sanctuary';
  public currentDungeonId: string | null = null;
  public isInsideSanctuary: boolean = true;
  public isBuildMode: boolean = false;
  public selectedBlueprintId: string = 'munitions_forge';

  // ADR 004: Escalation Matrix & Reality Collapse
  public dimensionalStability: number = 100; // 0% - 100%
  public realityCollapseActive: boolean = false;
  public collapseRingDepth: number = 0;

  // ADR 005: Overclock & Apex Loop
  public overclockStacks: number = 0; // 0 to 10 stacks
  public overclockTimer: number = 0;
  public apexBossSpawned: boolean = false;
  public apexEntityId: EntityId | null = null;

  // ADR 006: Sector Routing, Gear Check & Dimensional Lure
  public sectorId: SectorId = 'sector_01';
  public biomeProfile: BiomeProfile;
  public hasHazmatSuit: boolean = false;
  public luresRemaining: number = 0;

  // ADR 007: Autonomous Ballistics & Hardpoint Loadout
  public equippedWeaponId: 'kinetic_scattergun' | 'plasma_pulse_array' = 'kinetic_scattergun';

  // ADR 009: Continuous Kinematics & Active Hazards
  public activeHazards: Set<number> = new Set();
  public inputVector: { x: number; y: number } = { x: 0, y: 0 };
  public continuousMeleeCooldown: number = 0;

  // ADR 003: Schedule runner holding decoupled systems
  private schedule: Schedule;
  private nextParticleId: number = 1;

  constructor(
    world: World,
    tiles: TileState[][],
    playerEntityId: EntityId,
    biomeProfile?: BiomeProfile,
    hasHazmatSuit: boolean = false,
    initialLures: number = 0,
    equippedWeaponId: 'kinetic_scattergun' | 'plasma_pulse_array' = 'kinetic_scattergun'
  ) {
    this.world = world;
    this.tiles = tiles;
    this.playerEntityId = playerEntityId;
    this.biomeProfile = biomeProfile || BIOME_PROFILES.sector_01;
    this.sectorId = this.biomeProfile.id;
    this.hasHazmatSuit = hasHazmatSuit;
    this.luresRemaining = initialLures;
    this.equippedWeaponId = equippedWeaponId;

    // Index any initial hazards across the matrix
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.tiles[y]?.[x]?.hazard !== HazardState.None && this.tiles[y]?.[x]?.hazard !== undefined) {
          this.activeHazards.add(y * MAP_WIDTH + x);
        }
      }
    }

    // Initialize player's autonomous weapon hardpoint
    this.initPlayerWeapon(equippedWeaponId);

    // Build the Schedule using System Tick Hierarchy
    this.schedule = new Schedule()
      // 60Hz Tier (Every frame) - ADR 009 Continuous Kinematics
      .addSystem(new PlayerInputSystem(), 60)
      .addSystem(new VisualInterpolationSystem(), 60)
      .addSystem(new ProjectileSystem(), 60)
      .addSystem(new ParticleSystem(), 60)
      .addSystem(new DemolitionSystem(), 60)
      .addSystem(new ExtractionSystem(), 60)
      .addSystem(new ResidentSystem(), 60)
      // 30Hz Tier (ADR 010 - Swarm Separation & Repulsion)
      .addSystem(new SwarmSeparationSystem(), 30)
      // 10Hz Tier (100ms interval)
      .addSystem(new AutoTargetSystem(), 10)
      .addSystem(new AiPatrolSystem(), 10)
      .addSystem(new OverclockSystem(), 10)
      .addSystem(new BuildSystem(), 10)
      // 2Hz Tier (500ms interval - O(ActiveHazards) optimized)
      .addSystem(new HazardSpreadSystem(), 2)
      .addSystem(new EscalationSystem(), 2)
      .addSystem(new HiveSpawningSystem(), 2);
  }

  public setInputVector(x: number, y: number): void {
    this.inputVector.x = x;
    this.inputVector.y = y;
  }

  /**
   * Initializes or reconfigures the player's weapon hardpoint.
   */
  public initPlayerWeapon(weaponId: 'kinetic_scattergun' | 'plasma_pulse_array') {
    this.equippedWeaponId = weaponId;
    if (weaponId === 'plasma_pulse_array') {
      this.world.weapons.set(this.playerEntityId, {
        weaponId: 'plasma_pulse_array',
        name: 'Plasma Pulse Array',
        element: 'plasma',
        damage: 38,
        fireRate: 2.4,
        range: 8.5,
        projectileSpeed: 18.0,
        cooldownTimer: 0,
        piercing: true,
        knockback: 0,
      });
    } else {
      this.world.weapons.set(this.playerEntityId, {
        weaponId: 'kinetic_scattergun',
        name: 'Kinetic Scattergun',
        element: 'kinetic',
        damage: 28,
        fireRate: 3.4,
        range: 7.5,
        projectileSpeed: 15.0,
        cooldownTimer: 0,
        piercing: false,
        knockback: 1.0,
      });
    }
  }

  /**
   * Dynamically toggles active weapon hardpoint in-raid.
   */
  public switchWeapon(weaponId: 'kinetic_scattergun' | 'plasma_pulse_array') {
    this.initPlayerWeapon(weaponId);
    this.addLog(
      'alert',
      `WEAPON HARDPOINT ARMED: [${weaponId === 'plasma_pulse_array' ? 'Plasma Pulse Array (Piercing / Anti-Armor)' : 'Kinetic Scattergun (Knockback / Anti-Organic)'}]`
    );
  }

  /**
   * ADR 006: Dimensional Lure Activation (Speed-farm speed run mechanic)
   * Collapses local reality immediately, setting stability to 0% and drawing out the Apex Echo.
   */
  public activateDimensionalLure(): boolean {
    if (this.currentMapType === 'overworld') {
      this.addLog('alert', 'OVERWORLD SAFEGUARD: Dimensional Lures cannot rupture the Sanctuary Safe Zone!');
      return false;
    }
    if (this.luresRemaining <= 0) {
      this.addLog('alert', 'TACTICAL OVERRIDE ERROR: No Dimensional Resonant Lures loaded in rig!');
      return false;
    }
    if (this.realityCollapseActive) {
      this.addLog('alert', 'DIMENSIONAL RESONANCE ACTIVE: Reality collapse cascade is already underway!');
      return false;
    }

    this.luresRemaining -= 1;
    this.raidElapsedSeconds = Math.max(this.raidElapsedSeconds, EscalationSystem.COLLAPSE_THRESHOLD);
    this.dimensionalStability = 0;
    this.realityCollapseActive = true;

    sound.playRealityKlaxon();
    sound.playRealityCollapseAlarm();

    this.addLog('alert', 'DIMENSIONAL LURE ENGAGED: Tachyon distress beacon transmitted! Reality boundary ruptured!');
    this.addLog('fire', 'APEX EMERGENCY: The Apex Echo has materialized in the central vault sector!');

    if (!this.apexBossSpawned) {
      const pPos = this.world.gridPositions.get(this.playerEntityId);
      const bossX = pPos ? (pPos.x > 25 ? 20 : 30) : 26;
      const bossY = pPos ? (pPos.y > 25 ? 20 : 28) : 24;
      this.spawnApexBoss(bossX, bossY);
    }

    // Tachyon shockwave particles centered on player
    const pPos = this.world.gridPositions.get(this.playerEntityId);
    if (pPos) {
      this.spawnParticles(pPos.x, pPos.y, 25, 'spark', '#22d3ee');
      this.spawnParticles(pPos.x, pPos.y, 20, 'blast', '#c084fc');
      this.spawnParticles(pPos.x, pPos.y, 15, 'flame', '#38bdf8');
    }

    return true;
  }

  public addLog(type: CombatEvent['type'], text: string) {
    this.combatLog.unshift({
      id: Math.random().toString(36).substring(2, 9),
      type,
      text,
      timestamp: Date.now(),
    });
    if (this.combatLog.length > 30) {
      this.combatLog.pop();
    }
  }

  public spawnParticles(
    x: number,
    y: number,
    count: number,
    type: ParticleEffect['type'],
    color: string
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      this.particles.push({
        id: `p_${this.nextParticleId++}`,
        x: x + (Math.random() - 0.5) * 0.4,
        y: y + (Math.random() - 0.5) * 0.4,
        type,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.6,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  /**
  * Main Frame Tick (60 FPS)
  * Dispatches to the Schedule containing all decoupled systems.
  */
  public update(dt: number) {
    if (!this.isRaidActive) return;

    // Overworld is strictly untimed safe zone. Only Dungeons count elapsed raid time and trigger stability decay.
    if (this.currentMapType === 'dungeon') {
      this.raidElapsedSeconds += dt;
    } else {
      this.raidElapsedSeconds = 0;
      this.dimensionalStability = 100;
      this.realityCollapseActive = false;
      this.collapseRingDepth = 0;
    }

    // Run all decoupled systems according to their frequency tier
    this.schedule.run(dt, this.world, this.tiles, this);

    const playerHealth = this.world.healths.get(this.playerEntityId);
    const pPos = this.world.gridPositions.get(this.playerEntityId);

    // 1. Dynamic Map & Sanctuary/Dungeon Logic
    if (pPos) {
      const tileX = Math.floor(pPos.x);
      const tileY = Math.floor(pPos.y);
      const currentTile = this.tiles[tileY]?.[tileX];

      if (this.currentMapType === 'overworld') {
        // OVERWORLD (SANCTUARY) MODE
        this.isInsideSanctuary = true;
        this.currentZoneType = 'sanctuary';

        // Check if player is at Player Home at Center (93..107, 93..107)
        const inPlayerHome = pPos.x >= 93 && pPos.x <= 107 && pPos.y >= 93 && pPos.y <= 107;
        if (inPlayerHome) {
          this.currentZoneName = 'Operative Home // Sanctuary Core [SECURE]';
          // Auto-deposit carried scrap
          if (this.scrapCollectedInRaid > 0) {
            this.bankedScrap += this.scrapCollectedInRaid;
            this.addLog(
              'loot',
              `[SANCTUARY CORE] Banked +${this.scrapCollectedInRaid} scrap into permanent storage! Total: ${this.bankedScrap}`
            );
            this.scrapCollectedInRaid = 0;
            sound.playUpgradeSuccess();
          }
          // Continuous Nanite healing at home
          if (playerHealth && playerHealth.current < playerHealth.max) {
            playerHealth.current = Math.min(playerHealth.max, playerHealth.current + 25 * dt);
          }
        } else if (pPos.x < 92 && pPos.y < 92) {
          this.currentZoneName = 'NW Corner // Dr. Vance Robotics Workshop [SECURE]';
        } else if (pPos.x > 108 && pPos.y < 92) {
          this.currentZoneName = 'NE Corner // Dr. Rostova Bio-Lab [SECURE]';
        } else if (pPos.x < 92 && pPos.y > 108) {
          this.currentZoneName = 'SW Corner // Sgt. Kane Tactical Forge [SECURE]';
        } else if (pPos.x > 108 && pPos.y > 108) {
          this.currentZoneName = 'SE Corner // Dr. Thorne Reality Observatory [SECURE]';
        } else {
          this.currentZoneName = 'Sanctuary Concourse [SAFE BUFFER]';
        }

        // Proximity check for the 4 Cardinal Direction Dungeon Gates
        const CARDINAL_GATES: Array<{ dungeonId: DungeonZoneId; name: string; x: number; y: number }> = [
          { dungeonId: 'nw_robotics', name: 'Dungeon I: Robotics Labs', x: 100, y: 68 },
          { dungeonId: 'ne_biolab', name: 'Dungeon II: Bio-Containment Labs', x: 132, y: 100 },
          { dungeonId: 'sw_foundry', name: 'Dungeon III: Volatile Foundry', x: 100, y: 132 },
          { dungeonId: 'se_void', name: 'Dungeon IV: The Reality Tear', x: 68, y: 100 },
        ];

        let matchedGate: { dungeonId: DungeonZoneId; name: string; x: number; y: number } | null = null;
        for (const g of CARDINAL_GATES) {
          const dist = Math.hypot(pPos.x - g.x, pPos.y - g.y);
          if (dist <= 4.5) {
            matchedGate = g;
            this.currentZoneName = `[GATE] ${g.name} [DEPLOY READY]`;
            break;
          }
        }
        this.nearbyDungeonGate = matchedGate;
      } else {
        // DUNGEON MODE (ENEMY & TREASURE OCCUPIED)
        this.isInsideSanctuary = false;
        this.currentZoneType = 'dungeon';
        this.nearbyDungeonGate = null;
        this.currentZoneName = currentTile?.dungeonName
          ? `${currentTile.dungeonName} [EXPEDITION ACTIVE]`
          : `${this.biomeProfile.name} [EXPEDITION ACTIVE]`;

        // Check if extraction completed
        if (this.isExtracted) {
          this.returnToOverworld(true);
          return;
        }

        // Check player death in dungeon
        if (playerHealth && playerHealth.current <= 0) {
          this.returnToOverworld(false);
          return;
        }
      }
    }
  }

  /**
   * Deploys player into one of the 4 Dungeon Zones with Enemy & Treasure Map Generation.
   */
  public deployToDungeon(dungeonId: DungeonZoneId): void {
    sound.playBreachDetonation();
    const dungeonData = createDungeonMap(this.world, dungeonId);
    this.tiles = dungeonData.tiles;
    this.playerEntityId = dungeonData.playerEntityId;
    this.currentMapType = 'dungeon';
    this.activeDungeonId = dungeonId;
    this.biomeProfile = dungeonData.biomeProfile;
    this.sectorId = dungeonData.biomeProfile.id;
    this.isInsideSanctuary = false;
    this.isRaidActive = true;
    this.isExtracted = false;
    this.extractionTimer = 0;
    this.scrapCollectedInRaid = 0;
    this.raidElapsedSeconds = 0;
    this.dimensionalStability = 100;
    this.realityCollapseActive = false;
    this.collapseRingDepth = 0;
    this.apexBossSpawned = false;
    this.apexEntityId = null;
    this.activeHazards.clear();
    this.particles = [];
    this.nearbyDungeonGate = null;
    this.initPlayerWeapon(this.equippedWeaponId);

    this.addLog(
      'alert',
      `[EXPEDITION COMMENCED] Deployed into ${dungeonData.biomeProfile.name}. Scavenge scrap and extract safely!`
    );
    sound.playRealityKlaxon();
  }

  /**
   * Returns player from Dungeon back to the Overworld Sanctuary at Player Home at Center.
   */
  public returnToOverworld(extracted: boolean): void {
    if (extracted) {
      this.bankedScrap += this.scrapCollectedInRaid;
      this.addLog(
        'extract',
        `[EXTRACTION CONFIRMED] Anchored safely to Player Home! Banked +${this.scrapCollectedInRaid} scrap (Total: ${this.bankedScrap}).`
      );
      sound.playUpgradeSuccess();
    } else {
      this.addLog(
        'alert',
        `[EMERGENCY TRANSLOCATION] Operative suit compromised! Emergency beacon retrieved you to Player Home. Unbanked raid scrap dropped.`
      );
      sound.playRealityKlaxon();
    }

    this.scrapCollectedInRaid = 0;
    this.isExtracted = false;
    this.extractionTimer = 0;
    this.raidElapsedSeconds = 0;
    this.dimensionalStability = 100;
    this.realityCollapseActive = false;
    this.collapseRingDepth = 0;
    this.apexBossSpawned = false;
    this.apexEntityId = null;
    this.activeHazards.clear();
    this.particles = [];
    this.nearbyDungeonGate = null;

    // Restore Static Overworld Sanctuary Map
    const overworldData = createOverworldMap(this.world);
    this.tiles = overworldData.tiles;
    this.playerEntityId = overworldData.playerEntityId;
    this.currentMapType = 'overworld';
    this.activeDungeonId = null;
    this.biomeProfile = overworldData.biomeProfile;
    this.sectorId = 'sector_01';
    this.isInsideSanctuary = true;
    this.isRaidActive = true;
    this.currentZoneType = 'sanctuary';
    this.currentZoneName = 'Operative Home // Sanctuary Core [SECURE]';
    this.initPlayerWeapon(this.equippedWeaponId);

    // Restore health
    const hp = this.world.healths.get(this.playerEntityId);
    if (hp) hp.current = hp.max;

    this.spawnParticles(100.5, 103.5, 35, 'blast', '#38bdf8');
  }

  /**
   * Manual extraction trigger from HUD or extraction pad.
   */
  public extractNow(): void {
    if (this.currentMapType === 'dungeon') {
      this.returnToOverworld(true);
    }
  }

  // ========================================================
  // ADR 011: CONSTRUCTION & BLUEPRINT METHODS
  // ========================================================
  public unlockBlueprint(id: string): void {
    this.unlockedBlueprints.add(id);
  }

  public toggleBuildMode(force?: boolean): void {
    this.isBuildMode = force !== undefined ? force : !this.isBuildMode;
    if (this.isBuildMode) {
      sound.playClick();
      this.addLog('info', '[BUILD MATRIX] Construction holographic projector enabled. Left-click inside Sanctuary to place.');
    } else {
      this.addLog('info', '[BUILD MATRIX] Holographic projector disabled.');
    }
  }

  public selectBlueprint(id: string): void {
    this.selectedBlueprintId = id;
    sound.playClick();
  }

  public tryBuildAt(originX: number, originY: number): boolean {
    return BuildSystem.placeStructure(
      this.selectedBlueprintId,
      originX,
      originY,
      this.world,
      this.tiles,
      this
    );
  }

  // ========================================================
  // SYSTEM INTERACTION HELPERS
  // ========================================================
  public igniteTile(x: number, y: number, duration: number = 12.0) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return;
    const tile = this.tiles[ty]?.[tx];
    if (!tile) return;

    // If tile already has volatile gas, trigger chain reaction immediately!
    if (tile.hazard === HazardState.PoisonGas) {
      const hazardSystem = new HazardSpreadSystem();
      (hazardSystem as any).triggerGasCombustion(tx, ty, this.world, this.tiles, this);
      return;
    }

    tile.hazard = HazardState.Fire;
    tile.hazardTimer = duration;
    tile.hazardIntensity = 1.0;
    this.activeHazards.add(ty * MAP_WIDTH + tx);

    if (tile.wallEntityId !== null) {
      const flam = this.world.flammables.get(tile.wallEntityId);
      if (flam) flam.is_burning = true;
    }

    this.spawnParticles(tx + 0.5, ty + 0.5, 6, 'flame', '#f97316');
  }

  public deployGas(x: number, y: number, duration: number = 10.0) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return;
    const tile = this.tiles[ty]?.[tx];
    if (!tile || tile.isExtraction) return;

    // If tile is on fire, instant explosion!
    if (tile.hazard === HazardState.Fire) {
      const hazardSystem = new HazardSpreadSystem();
      (hazardSystem as any).triggerGasCombustion(tx, ty, this.world, this.tiles, this);
      return;
    }

    tile.hazard = HazardState.PoisonGas;
    tile.hazardTimer = Math.max(tile.hazardTimer, duration);
    tile.hazardIntensity = 1.0;
    this.activeHazards.add(ty * MAP_WIDTH + tx);

    if (Math.random() < 0.25) {
      this.spawnParticles(tx + 0.5, ty + 0.5, 3, 'smoke', '#84cc16'); // Lime chartreuse vapor
    }
  }

  public igniteFlare(targetX?: number, targetY?: number): boolean {
    const playerPos = this.world.gridPositions.get(this.playerEntityId);
    if (!playerPos) return false;

    let tx = targetX !== undefined ? Math.floor(targetX) : Math.floor(playerPos.x);
    let ty = targetY !== undefined ? Math.floor(targetY) : Math.floor(playerPos.y);

    if (Math.abs(tx - playerPos.x) > 2 || Math.abs(ty - playerPos.y) > 2) {
      tx = Math.floor(playerPos.x);
      ty = Math.floor(playerPos.y);
    }

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.igniteTile(tx + dx, ty + dy, 12.0);
      }
    }

    this.addLog('fire', `Thermal Incineration Flare deployed at [${tx}, ${ty}]! 3x3 firestorm unleashed.`);
    return true;
  }

  public deployGasCanister(targetX?: number, targetY?: number): boolean {
    const playerPos = this.world.gridPositions.get(this.playerEntityId);
    if (!playerPos) return false;

    let tx = targetX !== undefined ? Math.floor(targetX) : Math.floor(playerPos.x);
    let ty = targetY !== undefined ? Math.floor(targetY) : Math.floor(playerPos.y);

    if (Math.abs(tx - playerPos.x) > 2 || Math.abs(ty - playerPos.y) > 2) {
      tx = Math.floor(playerPos.x);
      ty = Math.floor(playerPos.y);
    }

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        this.deployGas(tx + dx, ty + dy, 12.0);
      }
    }

    this.addLog('fire', `Volatile Gas Vial shattered at [${tx}, ${ty}]! Highly flammable aerosol cloud released.`);
    return true;
  }

  public plantBreachingCharge(targetX?: number, targetY?: number): boolean {
    const playerPos = this.world.gridPositions.get(this.playerEntityId);
    if (!playerPos) return false;

    const px = Math.floor(playerPos.x);
    const py = Math.floor(playerPos.y);

    if (targetX === undefined || targetY === undefined) {
      const candidates = [
        { x: px + 1, y: py },
        { x: px - 1, y: py },
        { x: px, y: py + 1 },
        { x: px, y: py - 1 },
      ];
      for (const c of candidates) {
        if (c.x >= 0 && c.x < MAP_WIDTH && c.y >= 0 && c.y < MAP_HEIGHT) {
          if (this.tiles[c.y]?.[c.x]?.wallEntityId !== null) {
            targetX = c.x;
            targetY = c.y;
            break;
          }
        }
      }
    }

    if (targetX === undefined || targetY === undefined) {
      targetX = px;
      targetY = py;
    } else {
      targetX = Math.floor(targetX);
      targetY = Math.floor(targetY);
    }

    if (Math.abs(targetX - playerPos.x) > 2 || Math.abs(targetY - playerPos.y) > 2) {
      return false;
    }

    const chargeId = this.world.spawn('BreachingCharge');
    this.world.gridPositions.set(chargeId, { x: targetX, y: targetY });
    this.world.explosives.set(chargeId, {
      fuseTime: 2.5,
      blastRadius: 2,
      damage: 50,
      isArmed: true,
      sourcePlayer: true,
    });
    this.world.visuals.set(chargeId, {
      renderX: targetX,
      renderY: targetY,
      facingAngle: 0,
      flashTime: 0,
      colorOverride: '#ef4444',
    });

    this.chargesUsed++;
    this.addLog('breach', `Spacial Disruptor planted at [${targetX}, ${targetY}]! Resonance fuse: 2.5s.`);
    return true;
  }

  public demolishWall(
    x: number,
    y: number,
    wallEntityId: EntityId,
    reason: 'burned' | 'breached' | 'gas' | 'collapse'
  ) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    this.world.despawn(wallEntityId);
    if (this.tiles[ty]?.[tx]) {
      this.tiles[ty][tx].wallEntityId = null;
      this.tiles[ty][tx].isFlammable = false;
    }
    this.wallsDestroyed++;
    this.spawnParticles(tx + 0.5, ty + 0.5, 15, 'rubble', '#92400e');
    const reasonText =
      reason === 'burned'
        ? 'incinerated by thermal fire'
        : reason === 'gas' || reason === 'collapse'
        ? 'dissolved in Reality Collapse cascade'
        : 'erased by Spacial Disruptor';
    this.addLog('breach', `Biomass Partition at [${tx}, ${ty}] ${reasonText}!`);
  }

  public eliminateGuard(guardId: EntityId, x: number, y: number) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    this.world.despawn(guardId);
    this.guardsEliminated++;
    this.spawnParticles(tx + 0.5, ty + 0.5, 16, 'spark', '#38bdf8');
    this.addLog('damage', `Echo patrol desynchronized at [${tx}, ${ty}]. Dropped Ontological Salvage.`);

    // Drop 2 Resonance Sparks
    this.spawnResonanceSpark(tx, ty);
    if (tx + 1 < MAP_WIDTH) this.spawnResonanceSpark(tx + 1, ty);

    const dropId = this.world.spawn('LootCrate');
    this.world.gridPositions.set(dropId, { x: tx, y: ty });
    this.world.loots.set(dropId, {
      itemId: 'biometric_terminal',
      itemName: 'Apex Sub-Space Terminal',
      collected: false,
    });
    this.world.visuals.set(dropId, {
      renderX: tx,
      renderY: ty,
      facingAngle: 0,
      flashTime: 0,
      colorOverride: '#a855f7',
    });
    if (this.tiles[ty]?.[tx]) {
      this.tiles[ty][tx].lootEntityId = dropId;
    }
  }

  public spawnCrawler(x: number, y: number): EntityId {
    const crawlerId = this.world.spawn('Crawler');
    this.world.gridPositions.set(crawlerId, { x, y });
    this.world.transforms.set(crawlerId, {
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 0.26,
    });
    this.world.healths.set(crawlerId, { current: 15, max: 15 });
    this.world.factions.set(crawlerId, Faction.Security);
    this.world.flammables.set(crawlerId, {
      ignition_threshold: 0.5,
      burn_rate: 15.0,
      is_burning: false,
      fire_timer: 0,
    });
    this.world.aiComponents.set(crawlerId, {
      state: 'chase',
      patrolRoute: [],
      currentRouteIndex: 0,
      attackCooldown: 0,
      visionRange: 18,
      lastKnownPlayerPos: null,
      alertTimer: 10.0,
    });
    this.world.visuals.set(crawlerId, {
      renderX: x,
      renderY: y,
      facingAngle: 0,
      flashTime: 0,
      colorOverride: '#ec4899', // Biocrawler neon magenta
    });
    // ADR 007: Bio-organic vulnerability (Kinetic weak, Plasma resistant)
    this.world.resistances.set(crawlerId, {
      kineticMult: 1.6,
      plasmaMult: 0.5,
      armor: 0,
    });
    return crawlerId;
  }

  public eliminateCrawler(crawlerId: EntityId, x: number, y: number) {
    this.world.despawn(crawlerId);
    this.guardsEliminated++;
    sound.playCrawlerHit();
    this.spawnParticles(x + 0.5, y + 0.5, 12, 'spark', '#ec4899');
    this.spawnResonanceSpark(x, y);
    this.addLog('damage', `Resonance Crawler crushed at [${x}, ${y}]! Released Resonance Spark.`);
  }

  public eliminateHiveBlob(hiveId: EntityId, x: number, y: number) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    this.world.despawn(hiveId);
    this.guardsEliminated++;
    sound.playExplosion();
    this.spawnParticles(tx + 0.5, ty + 0.5, 25, 'rubble', '#f43f5e');
    this.spawnParticles(tx + 0.5, ty + 0.5, 15, 'smoke', '#ec4899');

    // Spawn 3 Resonance Sparks
    this.spawnResonanceSpark(tx, ty);
    if (tx + 1 < MAP_WIDTH) this.spawnResonanceSpark(tx + 1, ty);
    if (ty + 1 < MAP_HEIGHT) this.spawnResonanceSpark(tx, ty + 1);

    // Drop Biomass Cluster item
    const dropId = this.world.spawn('LootCrate');
    this.world.gridPositions.set(dropId, { x: tx, y: ty });
    this.world.loots.set(dropId, {
      itemId: 'biomass_cluster',
      itemName: 'Anomalous Biomass Cluster',
      collected: false,
    });
    this.world.visuals.set(dropId, {
      renderX: tx,
      renderY: ty,
      facingAngle: 0,
      flashTime: 0,
      colorOverride: '#f43f5e',
    });
    if (this.tiles[ty]?.[tx]) {
      this.tiles[ty][tx].lootEntityId = dropId;
    }

    this.addLog('breach', `HIVE NODE ERADICATED at [${tx}, ${ty}]! Harvested [Anomalous Biomass Cluster] & Sparks for Hideout!`);
  }

  public spawnApexBoss(x: number, y: number): EntityId {
    this.apexBossSpawned = true;
    const apexId = this.world.spawn('ApexEcho');
    this.world.gridPositions.set(apexId, { x, y });
    this.world.transforms.set(apexId, {
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 0.65,
    });
    this.world.healths.set(apexId, { current: 1500, max: 1500 });
    this.world.factions.set(apexId, Faction.Security);
    this.world.flammables.set(apexId, {
      ignition_threshold: 0.9,
      burn_rate: 6.0,
      is_burning: false,
      fire_timer: 0,
    });
    this.world.aiComponents.set(apexId, {
      state: 'chase',
      patrolRoute: [],
      currentRouteIndex: 0,
      attackCooldown: 0,
      visionRange: 35,
      lastKnownPlayerPos: null,
      alertTimer: 999,
    });
    this.world.visuals.set(apexId, {
      renderX: x,
      renderY: y,
      facingAngle: 0,
      flashTime: 0.5,
      colorOverride: '#a855f7',
    });
    // ADR 007: Heavy sub-space armor (Plasma vulnerable, Kinetic resistant)
    this.world.resistances.set(apexId, {
      kineticMult: 0.4,
      plasmaMult: 2.0,
      armor: 6,
    });
    // ADR 008: Boss Apex Sub-Space Cannon (Heavy Piercing High-Damage Plasma Beam)
    this.world.weapons.set(apexId, {
      weaponId: 'apex_subspace_cannon',
      name: 'Sub-Space Cannon',
      element: 'plasma',
      damage: 26,
      fireRate: 1.0,
      range: 11.0,
      projectileSpeed: 10.5,
      cooldownTimer: 1.5,
      piercing: true,
      knockback: 1.2,
    });
    this.apexEntityId = apexId;

    this.spawnParticles(x + 0.5, y + 0.5, 30, 'blast', '#a855f7');
    this.spawnParticles(x + 0.5, y + 0.5, 20, 'smoke', '#84cc16');
    this.deployGas(x, y, 15.0);

    this.addLog(
      'alert',
      'APEX ANOMALY DETECTED: The Apex Echo has materialized in Sector Center! 1500 HP anomalous titan anchoring the Reality Collapse!'
    );
    this.addLog(
      'fire',
      'HARVEST DIRECTIVE: Eliminate Apex Echo to extract the Ontological Core Relic, or reach Tether Point before gas asphyxiation!'
    );
    return apexId;
  }

  public eliminateApex(apexId: EntityId, x: number, y: number) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    this.world.despawn(apexId);
    this.guardsEliminated += 5;
    this.apexEntityId = null;
    sound.playExplosion();
    sound.playOverclockSpark();
    this.spawnParticles(tx + 0.5, ty + 0.5, 50, 'blast', '#a855f7');
    this.spawnParticles(tx + 0.5, ty + 0.5, 30, 'smoke', '#f43f5e');

    // Spawn burst of 8 Resonance Sparks
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const sx = Math.max(0, Math.min(MAP_WIDTH - 1, tx + dx));
        const sy = Math.max(0, Math.min(MAP_HEIGHT - 1, ty + dy));
        this.spawnResonanceSpark(sx, sy);
      }
    }

    // Drop Relic Ontological Core
    const dropId = this.world.spawn('LootCrate');
    this.world.gridPositions.set(dropId, { x: tx, y: ty });
    this.world.loots.set(dropId, {
      itemId: 'relic_ontological_core',
      itemName: 'Apex Ontological Core',
      collected: false,
    });
    this.world.visuals.set(dropId, {
      renderX: tx,
      renderY: ty,
      facingAngle: 0,
      flashTime: 0,
      colorOverride: '#a855f7',
    });
    if (this.tiles[ty]?.[tx]) {
      this.tiles[ty][tx].lootEntityId = dropId;
    }

    this.addLog(
      'extract',
      'APEX TITAN ANNIHILATED! The legendary [Apex Ontological Core] has dropped! Recover the relic and extract!'
    );
  }

  public spawnResonanceSpark(x: number, y: number): EntityId {
    const sparkId = this.world.spawn('ResonanceSpark');
    this.world.gridPositions.set(sparkId, { x, y });
    this.world.visuals.set(sparkId, {
      renderX: x,
      renderY: y,
      facingAngle: 0,
      flashTime: 0,
      colorOverride: '#06b6d4', // Radiant cyan sub-space energy
    });
    this.spawnParticles(x + 0.5, y + 0.5, 6, 'spark', '#06b6d4');
    return sparkId;
  }

  public collectResonanceSpark(sparkId: EntityId, x: number, y: number) {
    this.world.despawn(sparkId);
    this.overclockStacks = Math.min(10, this.overclockStacks + 1);
    this.overclockTimer = 12.0; // 12 seconds per refresh
    sound.playOverclockSpark();
    this.spawnParticles(x + 0.5, y + 0.5, 12, 'spark', '#06b6d4');
    const bonusDmg = this.overclockStacks * 10;
    this.addLog(
      'loot',
      `OVERCLOCK SURGE: Resonance Spark absorbed! Overclock: x${this.overclockStacks}/10 (Kinetic Melee: ${25 + bonusDmg} DMG).`
    );
  }

  public eliminateHostileEntity(id: EntityId, x: number, y: number) {
    const kind = this.world.kinds.get(id);
    if (kind === 'ApexEcho') {
      this.eliminateApex(id, x, y);
    } else if (kind === 'HiveBlob') {
      this.eliminateHiveBlob(id, x, y);
    } else if (kind === 'Crawler') {
      this.eliminateCrawler(id, x, y);
    } else {
      this.eliminateGuard(id, x, y);
    }
  }

  public checkContinuousMelee(px: number, py: number, dt: number) {
    if (this.continuousMeleeCooldown > 0) {
      this.continuousMeleeCooldown = Math.max(0, this.continuousMeleeCooldown - dt);
    }
    if (this.continuousMeleeCooldown > 0) return;

    for (const [entityId, pos] of this.world.gridPositions.entries()) {
      if (entityId === this.playerEntityId) continue;
      const kind = this.world.kinds.get(entityId);
      if (
        kind === 'Security' ||
        kind === 'Crawler' ||
        kind === 'HiveBlob' ||
        kind === 'ApexEcho'
      ) {
        const dist = Math.hypot(px - pos.x, py - pos.y);
        if (dist <= 0.85) {
          this.continuousMeleeCooldown = 0.45;
          const targetHealth = this.world.healths.get(entityId);
          const targetVisual = this.world.visuals.get(entityId);
          const playerVisual = this.world.visuals.get(this.playerEntityId);
          if (targetHealth && targetHealth.current > 0) {
            const meleeDamage = 25 + this.overclockStacks * 10;
            targetHealth.current = Math.max(0, targetHealth.current - meleeDamage);
            if (targetVisual) targetVisual.flashTime = 0.25;
            if (playerVisual) playerVisual.flashTime = 0.15;
            sound.playMeleeHit();

            const sparkColor = this.overclockStacks >= 5 ? '#f43f5e' : '#38bdf8';
            this.spawnParticles(pos.x + 0.5, pos.y + 0.5, 12 + this.overclockStacks * 2, 'spark', sparkColor);

            const targetName =
              kind === 'ApexEcho'
                ? 'The Apex Echo'
                : kind === 'HiveBlob'
                ? 'Hive Node'
                : kind === 'Crawler'
                ? 'Resonance Crawler'
                : 'Echo Guard';

            this.addLog(
              'damage',
              `Operative struck ${targetName} with kinetic melee (${meleeDamage} DMG)! [HP: ${Math.round(targetHealth.current)}/${targetHealth.max}]`
            );

            const ai = this.world.aiComponents.get(entityId);
            if (ai && ai.state !== 'chase') {
              ai.state = 'chase';
              ai.lastKnownPlayerPos = { x: Math.floor(px), y: Math.floor(py) };
              ai.alertTimer = 6.0;
            }

            if (targetHealth.current <= 0) {
              this.eliminateHostileEntity(entityId, pos.x, pos.y);
            }
          }
          break;
        }
      }
    }
  }

  public checkTileInteractions(tileX: number, tileY: number) {
    // 1. Proximity collection for Resonance Sparks
    const playerPos = this.world.gridPositions.get(this.playerEntityId);
    if (playerPos) {
      for (const [entityId, pos] of this.world.gridPositions.entries()) {
        if (this.world.kinds.get(entityId) === 'ResonanceSpark') {
          const dist = Math.hypot(playerPos.x - pos.x, playerPos.y - pos.y);
          if (dist <= 0.95) {
            this.collectResonanceSpark(entityId, pos.x, pos.y);
          }
        }
      }
    }

    // 2. Ontological Salvage Loot Crate on overlapping tiles
    const px = playerPos?.x ?? tileX;
    const py = playerPos?.y ?? tileY;
    const minTx = Math.max(0, Math.floor(px - 0.4 + 0.5));
    const maxTx = Math.min(MAP_WIDTH - 1, Math.floor(px + 0.4 + 0.5));
    const minTy = Math.max(0, Math.floor(py - 0.4 + 0.5));
    const maxTy = Math.min(MAP_HEIGHT - 1, Math.floor(py + 0.4 + 0.5));

    for (let cy = minTy; cy <= maxTy; cy++) {
      for (let cx = minTx; cx <= maxTx; cx++) {
        const tile = this.tiles[cy]?.[cx];
        if (tile && tile.lootEntityId !== null) {
          const loot = this.world.loots.get(tile.lootEntityId);
          if (loot && !loot.collected) {
            loot.collected = true;
            this.world.despawn(tile.lootEntityId);
            tile.lootEntityId = null;

            if (loot.itemId) {
              const existing = this.scavengedItems.find((i) => i.item_id === loot.itemId);
              if (existing) {
                existing.count += 1;
              } else {
                this.scavengedItems.push({
                  item_id: loot.itemId,
                  count: 1,
                  name: loot.itemName,
                });
              }
              this.addLog('loot', `SECURED: [${loot.itemName}] recovered for Faraday deconstruction!`);
            } else {
              const scrapFound = Math.floor(15 + Math.random() * 25);
              this.scrapCollectedInRaid += scrapFound;
              this.addLog('loot', `Scavenged ${scrapFound} Inert Matter from bulkhead cache.`);
            }
            this.spawnParticles(cx + 0.5, cy + 0.5, 10, 'spark', '#10b981');
            sound.playScrapPickup();
          }
        }
      }
    }
  }

  public movePlayer(dx: number, dy: number): boolean {
    return this.tryMovePlayer(dx, dy);
  }

  public tryMovePlayer(dx: number, dy: number): boolean {
    if (!this.isRaidActive) return false;
    const playerPos = this.world.gridPositions.get(this.playerEntityId);
    const playerVisual = this.world.visuals.get(this.playerEntityId);
    if (!playerPos || !playerVisual) return false;

    const currTx = Math.round(playerPos.x);
    const currTy = Math.round(playerPos.y);
    const newX = currTx + dx;
    const newY = currTy + dy;

    if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
      return false;
    }

    const targetTile = this.tiles[newY]?.[newX];
    if (!targetTile || targetTile.wallEntityId !== null) {
      playerVisual.flashTime = 0.1;
      return false;
    }

    // DIVERT: Melee Collision Restitution against all hostiles with Overclock Scaling
    for (const [entityId, pos] of this.world.gridPositions.entries()) {
      if (Math.hypot(pos.x - newX, pos.y - newY) < 0.6) {
        const faction = this.world.factions.get(entityId);
        const kind = this.world.kinds.get(entityId);
        if (
          faction === Faction.Security ||
          kind === 'Security' ||
          kind === 'Crawler' ||
          kind === 'HiveBlob' ||
          kind === 'ApexEcho'
        ) {
          const targetHealth = this.world.healths.get(entityId);
          const targetVisual = this.world.visuals.get(entityId);
          if (targetHealth) {
            const meleeDamage = 25 + this.overclockStacks * 10;
            targetHealth.current = Math.max(0, targetHealth.current - meleeDamage);
            if (targetVisual) targetVisual.flashTime = 0.25;
            playerVisual.flashTime = 0.15;
            sound.playMeleeHit();

            const sparkColor = this.overclockStacks >= 5 ? '#f43f5e' : '#38bdf8';
            this.spawnParticles(newX + 0.5, newY + 0.5, 12 + this.overclockStacks * 2, 'spark', sparkColor);

            const targetName =
              kind === 'ApexEcho'
                ? 'The Apex Echo'
                : kind === 'HiveBlob'
                ? 'Hive Node'
                : kind === 'Crawler'
                ? 'Resonance Crawler'
                : 'Echo Guard';

            this.addLog(
              'damage',
              `Operative struck ${targetName} with kinetic melee (${meleeDamage} DMG)! [HP: ${Math.round(targetHealth.current)}/${targetHealth.max}]`
            );

            // Alert guard if not already chasing
            const ai = this.world.aiComponents.get(entityId);
            if (ai) {
              ai.state = 'chase';
              ai.lastKnownPlayerPos = { x: Math.floor(playerPos.x), y: Math.floor(playerPos.y) };
              ai.alertTimer = 6.0;
            }

            if (targetHealth.current <= 0) {
              this.eliminateHostileEntity(entityId, newX, newY);
            }
          }
          return false; // Prevent player from clipping through hostile
        }
      }
    }

    playerPos.x = newX;
    playerPos.y = newY;
    playerVisual.renderX = newX;
    playerVisual.renderY = newY;

    const transform = this.world.transforms.get(this.playerEntityId);
    if (transform) {
      transform.x = newX;
      transform.y = newY;
      transform.vx = 0;
      transform.vy = 0;
    }

    this.checkTileInteractions(newX, newY);
    return true;
  }

  public playerUseMedkit(): boolean {
    return this.healPlayer(40);
  }

  public healPlayer(amount: number = 40): boolean {
    const health = this.world.healths.get(this.playerEntityId);
    if (!health || health.current >= health.max) return false;

    health.current = Math.min(health.max, health.current + amount);
    this.addLog('loot', `Applied Trauma Patch. Restored ${amount} HP.`);
    const pos = this.world.gridPositions.get(this.playerEntityId);
    if (pos) {
      this.spawnParticles(pos.x + 0.5, pos.y + 0.5, 8, 'spark', '#34d399');
    }
    return true;
  }

  public isTileWalkable(x: number, y: number): boolean {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
    const tile = this.tiles[ty]?.[tx];
    if (!tile || tile.wallEntityId !== null) return false;

    for (const [id, pos] of this.world.gridPositions.entries()) {
      if (Math.floor(pos.x) === tx && Math.floor(pos.y) === ty) {
        const kind = this.world.kinds.get(id);
        if (
          kind === 'Security' ||
          kind === 'Player' ||
          kind === 'HiveBlob' ||
          kind === 'Crawler' ||
          kind === 'ApexEcho'
        ) {
          return false;
        }
      }
    }
    return true;
  }

  public hasLineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
    const ix0 = Math.floor(x0);
    const iy0 = Math.floor(y0);
    const ix1 = Math.floor(x1);
    const iy1 = Math.floor(y1);

    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;

    let cx = ix0;
    let cy = iy0;

    while (cx !== ix1 || cy !== iy1) {
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }

      if (cx === ix1 && cy === iy1) return true;

      if (cx >= 0 && cx < MAP_WIDTH && cy >= 0 && cy < MAP_HEIGHT) {
        if (this.tiles[cy]?.[cx]?.wallEntityId !== null) {
          return false;
        }
      }
    }
    return true;
  }
}
