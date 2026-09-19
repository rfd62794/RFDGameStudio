import React, { useState, useEffect, useRef, useCallback } from 'react';
import { World } from '../game/ecs';
import { Simulation } from '../game/simulation';
import { CanvasRenderer } from '../game/canvas-renderer';
import { createStaticMap } from '../game/map';
import { hideoutBackend } from '../backend/hideout-service';
import { SectorId, WeaponId, CombatEvent, ActiveBuffs, MapType, DungeonZoneId } from '../types';
import { sound } from '../game/audio';

export interface UseRaidSimulationProps {
  initialCharges?: number;
  initialMedkits?: number;
  initialFlares?: number;
  initialLures?: number;
  sectorId?: SectorId;
  hasHazmatSuit?: boolean;
  equippedWeapon?: WeaponId;
  unlockedWeapons?: WeaponId[];
  onEndRaid: () => void;
}

export function useRaidSimulation({
  initialCharges = 1,
  initialMedkits = 1,
  initialFlares = 2,
  initialLures = 0,
  sectorId = 'sector_01' as SectorId,
  hasHazmatSuit = false,
  equippedWeapon = 'kinetic_scattergun' as WeaponId,
  unlockedWeapons = ['kinetic_scattergun'] as WeaponId[],
  onEndRaid,
}: UseRaidSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Tactical Loadout state in raid
  const [chargesLeft, setChargesLeft] = useState(initialCharges);
  const [medkitsLeft, setMedkitsLeft] = useState(initialMedkits);
  const [flaresLeft, setFlaresLeft] = useState(initialFlares);
  const [luresLeft, setLuresLeft] = useState(initialLures);
  const [gasVialsLeft, setGasVialsLeft] = useState(2);
  const [activeWeapon, setActiveWeapon] = useState<'kinetic_scattergun' | 'plasma_pulse_array'>(
    equippedWeapon
  );

  // HUD State
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [scrapCollected, setScrapCollected] = useState(0);
  const [extractionTimer, setExtractionTimer] = useState(0);
  const [combatLogs, setCombatLogs] = useState<CombatEvent[]>([]);
  const [selectedTool, setSelectedTool] = useState<'move' | 'breach' | 'flare' | 'gas'>('move');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showHelp, setShowHelp] = useState(false);

  // ADR 004: Escalation Matrix & Reality Collapse HUD
  const [dimensionalStability, setDimensionalStability] = useState(100);
  const [realityCollapseActive, setRealityCollapseActive] = useState(false);
  const [collapseRingDepth, setCollapseRingDepth] = useState(0);
  const [raidDuration, setRaidDuration] = useState(0);
  const alarmTriggeredRef = useRef<boolean>(false);

  // ADR 005: Overclock & Apex Boss HUD State
  const [overclockStacks, setOverclockStacks] = useState(0);
  const [overclockTimer, setOverclockTimer] = useState(0);
  const [apexBossActive, setApexBossActive] = useState(false);
  const [apexHp, setApexHp] = useState<{ current: number; max: number } | null>(null);

  // ADR 011: Contiguous Megamap & Construction State
  const [bankedScrap, setBankedScrap] = useState(25);
  const [isInsideSanctuary, setIsInsideSanctuary] = useState(true);
  const [currentZoneName, setCurrentZoneName] = useState('Operative Home // Faraday Sanctuary [SECURE]');
  const [currentMapType, setCurrentMapType] = useState<MapType>('overworld');
  const [activeDungeonId, setActiveDungeonId] = useState<DungeonZoneId | null>(null);
  const [nearbyDungeonGate, setNearbyDungeonGate] = useState<{
    dungeonId: DungeonZoneId;
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState('munitions_forge');
  const [unlockedBlueprints, setUnlockedBlueprints] = useState<string[]>(['munitions_forge']);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuffs>({
    damageBonus: 0,
    regenRate: 0,
    armorRating: 0,
    speedMultiplier: 1.0,
  });

  // End state modal
  const [raidFinished, setRaidFinished] = useState<'extracted' | 'kia' | null>(null);
  const [extractSummary, setExtractSummary] = useState<{
    scrap: number;
    chargesRemaining: number;
    guards: number;
    walls: number;
    duration: number;
    scavenged: { item_id: string; name: string; count: number }[];
  } | null>(null);

  // 1. Initialize Simulation & ECS World
  useEffect(() => {
    const world = new World();
    const mapData = createStaticMap(world, initialCharges, initialMedkits, sectorId);
    const sim = new Simulation(
      world,
      mapData.tiles,
      mapData.playerEntityId,
      mapData.biomeProfile,
      hasHazmatSuit,
      initialLures,
      activeWeapon
    );
    simRef.current = sim;

    if (canvasRef.current) {
      const renderer = new CanvasRenderer(canvasRef.current, sim);
      rendererRef.current = renderer;
    }

    setPlayerHp(100);
    setPlayerMaxHp(100);
    setScrapCollected(0);
    setChargesLeft(initialCharges);
    setMedkitsLeft(initialMedkits);
    setFlaresLeft(initialFlares);
    setLuresLeft(initialLures);

    const secName = mapData.biomeProfile.name.toUpperCase();
    sim.addLog('alert', `OPERATIVE INSERTION // ${secName}: Retrieve sector components, manage stability, extract.`);
    if (mapData.biomeProfile.hazardProfile.ambientHazardType === 'toxic_atmosphere') {
      if (hasHazmatSuit) {
        sim.addLog('alert', 'ATMOSPHERIC HAZARD: Corrosive radiation detected. Lead-Shielded Rig active: IMMUNE.');
      } else {
        sim.addLog('damage', 'ATMOSPHERIC HAZARD WARNING: Corrosive radiation will deplete suit integrity (-3 HP/2s)!');
      }
    }

    // Resize observer for fluid responsive canvas
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    handleResize();

    // Game loop
    let running = true;
    const loop = (time: number) => {
      if (!running) return;
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      if (simRef.current && rendererRef.current) {
        simRef.current.update(dt);
        rendererRef.current.render();

        // Update HUD sync periodically
        const hp = simRef.current.world.healths.get(simRef.current.playerEntityId);
        if (hp) {
          setPlayerHp(Math.max(0, Math.round(hp.current)));
        }
        setScrapCollected(simRef.current.scrapCollectedInRaid);
        setExtractionTimer(simRef.current.extractionTimer);
        setCombatLogs([...simRef.current.combatLog.slice(0, 6)]);

        // ADR 004: Escalation Matrix HUD sync & audio warning
        setDimensionalStability(simRef.current.dimensionalStability);
        setRealityCollapseActive(simRef.current.realityCollapseActive);
        setCollapseRingDepth(simRef.current.collapseRingDepth);
        setRaidDuration(Math.round(simRef.current.raidElapsedSeconds));

        // ADR 005: Overclock & Apex Boss Sync
        setOverclockStacks(simRef.current.overclockStacks);
        setOverclockTimer(simRef.current.overclockTimer);
        const hasApex = simRef.current.apexBossSpawned && simRef.current.apexEntityId !== null;
        setApexBossActive(hasApex);
        if (hasApex && simRef.current.apexEntityId) {
          const aHp = simRef.current.world.healths.get(simRef.current.apexEntityId);
          if (aHp && aHp.current > 0) {
            setApexHp({ current: Math.round(aHp.current), max: aHp.max });
          } else {
            setApexHp(null);
          }
        } else {
          setApexHp(null);
        }

        // ADR 011: Contiguous Megamap & Construction State Sync
        setBankedScrap(simRef.current.bankedScrap);
        setIsInsideSanctuary(simRef.current.isInsideSanctuary);
        setCurrentZoneName(simRef.current.currentZoneName);
        setCurrentMapType(simRef.current.currentMapType);
        setActiveDungeonId(simRef.current.activeDungeonId);
        setNearbyDungeonGate(simRef.current.nearbyDungeonGate);
        setIsBuildMode(simRef.current.isBuildMode);
        setSelectedBlueprintId(simRef.current.selectedBlueprintId);
        setUnlockedBlueprints(Array.from(simRef.current.unlockedBlueprints));
        setActiveBuffs({ ...simRef.current.activeBuffs });

        if (simRef.current.realityCollapseActive && !alarmTriggeredRef.current) {
          alarmTriggeredRef.current = true;
          sound.playRealityCollapseAlarm();
        } else if (!simRef.current.realityCollapseActive) {
          alarmTriggeredRef.current = false;
        }

        // Check completion condition
        if (!simRef.current.isRaidActive) {
          if (simRef.current.isExtracted && !raidFinished) {
            sound.playExtractSuccess();
            setRaidFinished('extracted');
            setExtractSummary({
              scrap: simRef.current.scrapCollectedInRaid,
              chargesRemaining: chargesLeft,
              guards: simRef.current.guardsEliminated,
              walls: simRef.current.wallsDestroyed,
              duration: Math.round(simRef.current.raidElapsedSeconds),
              scavenged: [...simRef.current.scavengedItems],
            });
            running = false;
          } else if (simRef.current.isPlayerDead && !raidFinished) {
            sound.playExplosion();
            setRaidFinished('kia');
            setExtractSummary({
              scrap: 0,
              chargesRemaining: 0,
              guards: simRef.current.guardsEliminated,
              walls: simRef.current.wallsDestroyed,
              duration: Math.round(simRef.current.raidElapsedSeconds),
              scavenged: [],
            });
            running = false;
          }
        }
      }

      if (running) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [initialCharges, initialMedkits, initialFlares, initialLures, sectorId, hasHazmatSuit]);

  // 2. Action Handlers
  const handleMove = useCallback((dx: number, dy: number) => {
    if (!simRef.current || !simRef.current.isRaidActive) return;
    const moved = simRef.current.tryMovePlayer(dx, dy);
    if (moved) {
      sound.playBeep();
    }
  }, []);

  const handlePlantCharge = useCallback((targetX?: number, targetY?: number) => {
    if (!simRef.current || !simRef.current.isRaidActive) return;
    if (chargesLeft <= 0) {
      simRef.current.addLog('alert', 'No Breaching Charges remaining! Craft more in Hideout.');
      return;
    }

    const playerPos = simRef.current.world.gridPositions.get(simRef.current.playerEntityId);
    if (!playerPos) return;

    const tx = targetX !== undefined ? targetX : playerPos.x;
    const ty = targetY !== undefined ? targetY : playerPos.y;

    const success = simRef.current.plantBreachingCharge(tx, ty);
    if (success) {
      sound.playBeep();
      setChargesLeft((prev) => prev - 1);
    }
  }, [chargesLeft]);

  const handleIgniteFlare = useCallback((targetX?: number, targetY?: number) => {
    if (!simRef.current || !simRef.current.isRaidActive) return;
    if (flaresLeft <= 0) {
      simRef.current.addLog('alert', 'No Fire Flares available.');
      return;
    }

    const playerPos = simRef.current.world.gridPositions.get(simRef.current.playerEntityId);
    if (!playerPos) return;

    const tx = targetX !== undefined ? targetX : playerPos.x;
    const ty = targetY !== undefined ? targetY : playerPos.y;

    simRef.current.igniteTile(tx, ty);
    sound.playFireIgnite();
    setFlaresLeft((prev) => prev - 1);
  }, [flaresLeft]);

  const handleDeployGas = useCallback((targetX?: number, targetY?: number) => {
    if (!simRef.current || !simRef.current.isRaidActive) return;
    if (gasVialsLeft <= 0) {
      simRef.current.addLog('alert', 'No Volatile Gas Vials remaining!');
      return;
    }

    const playerPos = simRef.current.world.gridPositions.get(simRef.current.playerEntityId);
    if (!playerPos) return;

    const tx = targetX !== undefined ? targetX : playerPos.x;
    const ty = targetY !== undefined ? targetY : playerPos.y;

    const deployed = simRef.current.deployGasCanister(tx, ty);
    if (deployed) {
      sound.playBeep();
      setGasVialsLeft((prev) => prev - 1);
    }
  }, [gasVialsLeft]);

  const handleUseMedkit = useCallback(() => {
    if (!simRef.current || !simRef.current.isRaidActive) return;
    if (medkitsLeft <= 0) {
      simRef.current.addLog('alert', 'No Field Medkits left.');
      return;
    }
    const healed = simRef.current.playerUseMedkit();
    if (healed) {
      sound.playScrapPickup();
      setMedkitsLeft((prev) => prev - 1);
    }
  }, [medkitsLeft]);

  // ADR 006: Dimensional Lure In-Raid Trigger
  const handleDeployLure = useCallback(() => {
    if (!simRef.current || !simRef.current.isRaidActive) return;
    const ok = simRef.current.activateDimensionalLure();
    if (ok) {
      setLuresLeft((prev) => Math.max(0, prev - 1));
    }
  }, []);

  // ADR 007: Toggle Weapon Hardpoint in-raid
  const handleToggleWeapon = useCallback(() => {
    if (!simRef.current || !simRef.current.isRaidActive) return;
    const nextWeapon: 'kinetic_scattergun' | 'plasma_pulse_array' =
      activeWeapon === 'kinetic_scattergun' ? 'plasma_pulse_array' : 'kinetic_scattergun';

    if (unlockedWeapons.includes(nextWeapon)) {
      setActiveWeapon(nextWeapon);
      simRef.current.switchWeapon(nextWeapon);
      sound.playBeep();
    } else {
      simRef.current.addLog(
        'alert',
        `HARDPOINT LOCKED: Craft [${
          nextWeapon === 'plasma_pulse_array' ? 'Plasma Pulse Array' : 'Kinetic Scattergun'
        }] at Hideout Workbench to unlock!`
      );
      sound.playAlert();
    }
  }, [activeWeapon, unlockedWeapons]);

  // ADR 011: Toggle & Select Build Mode
  const handleToggleBuildMode = useCallback((force?: boolean) => {
    if (!simRef.current) return;
    simRef.current.toggleBuildMode(force);
    setIsBuildMode(simRef.current.isBuildMode);
  }, []);

  const handleSelectBlueprint = useCallback((bpId: string) => {
    if (!simRef.current) return;
    simRef.current.selectBlueprint(bpId);
    setSelectedBlueprintId(bpId);
  }, []);

  // Deploy into one of the 4 Dungeon Zones
  const handleDeployToDungeon = useCallback((dungeonId: DungeonZoneId) => {
    if (!simRef.current) return;
    simRef.current.deployToDungeon(dungeonId);
  }, []);

  // Return back to Sanctuary Overworld
  const handleReturnToOverworld = useCallback((extracted: boolean) => {
    if (!simRef.current) return;
    simRef.current.returnToOverworld(extracted);
  }, []);

  // Trigger manual extraction when in Dungeon
  const handleExtractNow = useCallback(() => {
    if (!simRef.current) return;
    simRef.current.extractNow();
  }, []);

  // ADR 009: Continuous Kinematics Input Tracking
  const keysHeldRef = useRef<Set<string>>(new Set());

  const updateContinuousInputVector = useCallback(() => {
    if (!simRef.current) return;
    let vx = 0;
    let vy = 0;
    const keys = keysHeldRef.current;
    if (keys.has('w') || keys.has('arrowup')) vy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) vy += 1;
    if (keys.has('a') || keys.has('arrowleft')) vx -= 1;
    if (keys.has('d') || keys.has('arrowright')) vx += 1;

    simRef.current.setInputVector(vx, vy);
  }, []);

  // 3. Keyboard Input Listener (Continuous Kinematics + Action Triggers)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if modal open
      if (raidFinished) return;

      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        if (!keysHeldRef.current.has(key)) {
          keysHeldRef.current.add(key);
          updateContinuousInputVector();
        }
        return;
      }

      switch (key) {
        case ' ':
          e.preventDefault();
          handlePlantCharge();
          break;
        case 'f':
          e.preventDefault();
          handleIgniteFlare();
          break;
        case 'g':
          e.preventDefault();
          handleDeployGas();
          break;
        case 'e':
          e.preventDefault();
          // If standing near a Cardinal Gate in Overworld, deploy!
          if (simRef.current?.nearbyDungeonGate) {
            simRef.current.deployToDungeon(simRef.current.nearbyDungeonGate.dungeonId);
          } else {
            handleUseMedkit();
          }
          break;
        case 't':
          e.preventDefault();
          handleDeployLure();
          break;
        case 'x':
          e.preventDefault();
          handleToggleWeapon();
          break;
        case 'b':
          e.preventDefault();
          handleToggleBuildMode();
          break;
        case 'h':
          setShowHelp((prev) => !prev);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keysHeldRef.current.has(key)) {
        keysHeldRef.current.delete(key);
        updateContinuousInputVector();
      }
    };

    const handleWindowBlur = () => {
      keysHeldRef.current.clear();
      updateContinuousInputVector();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      keysHeldRef.current.clear();
    };
  }, [
    updateContinuousInputVector,
    handlePlantCharge,
    handleIgniteFlare,
    handleDeployGas,
    handleUseMedkit,
    handleDeployLure,
    handleToggleWeapon,
    handleToggleBuildMode,
    raidFinished,
  ]);

  // 4. Mouse / Click Targeting on Canvas
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const grid = rendererRef.current.screenToGrid(screenX, screenY);
    rendererRef.current.hoverTile = grid;
  }, []);

  const handleCanvasWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleToggleBuildMode();
  }, [handleToggleBuildMode]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !simRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const grid = rendererRef.current.screenToGrid(screenX, screenY);

    if (simRef.current.isBuildMode) {
      const placed = simRef.current.tryBuildAt(grid.x - 1, grid.y - 1);
      if (placed) {
        setBankedScrap(simRef.current.bankedScrap);
        setActiveBuffs({ ...simRef.current.activeBuffs });
      }
      return;
    }

    if (selectedTool === 'breach') {
      handlePlantCharge(grid.x, grid.y);
    } else if (selectedTool === 'flare') {
      handleIgniteFlare(grid.x, grid.y);
    } else if (selectedTool === 'gas') {
      handleDeployGas(grid.x, grid.y);
    } else {
      // Default: Move towards or plant if clicked adjacent wall
      const playerPos = simRef.current.world.gridPositions.get(simRef.current.playerEntityId);
      if (playerPos) {
        const dx = Math.sign(grid.x - playerPos.x);
        const dy = Math.sign(grid.y - playerPos.y);
        if (Math.abs(grid.x - playerPos.x) <= 1 && Math.abs(grid.y - playerPos.y) <= 1) {
          handleMove(dx, dy);
        }
      }
    }
  }, [selectedTool, handlePlantCharge, handleIgniteFlare, handleDeployGas, handleMove]);

  // 5. Submit Extraction / Death via Backend Service
  const handleConfirmEndRaid = useCallback(async () => {
    if (!extractSummary) return;

    await hideoutBackend.postRaidExtract({
      extracted: raidFinished === 'extracted',
      scrapCollected: extractSummary.scrap,
      chargesRemaining: chargesLeft,
      luresRemaining: luresLeft,
      guardsEliminated: extractSummary.guards,
      wallsDestroyed: extractSummary.walls,
      durationSeconds: extractSummary.duration,
      scavengedItems: extractSummary.scavenged || [],
    });

    onEndRaid();
  }, [extractSummary, raidFinished, chargesLeft, luresLeft, onEndRaid]);

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  return {
    containerRef,
    canvasRef,
    simRef,
    rendererRef,
    chargesLeft,
    medkitsLeft,
    flaresLeft,
    luresLeft,
    gasVialsLeft,
    activeWeapon,
    playerHp,
    playerMaxHp,
    scrapCollected,
    bankedScrap,
    isInsideSanctuary,
    currentZoneName,
    currentMapType,
    activeDungeonId,
    nearbyDungeonGate,
    isBuildMode,
    selectedBlueprintId,
    unlockedBlueprints,
    activeBuffs,
    extractionTimer,
    combatLogs,
    selectedTool,
    setSelectedTool,
    isMuted,
    toggleMute,
    showHelp,
    setShowHelp,
    dimensionalStability,
    realityCollapseActive,
    collapseRingDepth,
    raidDuration,
    overclockStacks,
    overclockTimer,
    apexBossActive,
    apexHp,
    raidFinished,
    extractSummary,
    handleDeployToDungeon,
    handleReturnToOverworld,
    handleExtractNow,
    handleMove,
    handlePlantCharge,
    handleIgniteFlare,
    handleDeployGas,
    handleUseMedkit,
    handleDeployLure,
    handleToggleWeapon,
    handleToggleBuildMode,
    handleSelectBlueprint,
    handleCanvasMouseMove,
    handleCanvasWheel,
    handleCanvasClick,
    handleConfirmEndRaid,
  };
}
