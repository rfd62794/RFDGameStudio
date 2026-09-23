import {
  Asteroid,
  ConversionProcess,
  DispatchLog,
  Drone,
  Fragment,
  ResourceType,
  Scout,
  SimulationConfig,
  SimulationStats,
  Vector2D,
} from '../types';

export const DEFAULT_CONFIG: SimulationConfig = {
  scoutCount: 1,
  miningDroneCount: 3,
  haulerCount: 2,
  scoutScanRadius: 180,
  scoutSpeed: 0.35, // orbit speed rad/s
  miningSpeed: 160, // pixels per sec
  haulerSpeed: 180, // pixels per sec
  miningCapacity: 50,
  miningDurationSec: 3.0,
  tugDurationSec: 4.0,
  ring1InnerRadius: 140,
  ring1OuterRadius: 280,
  ring2InnerRadius: 360,
  ring2OuterRadius: 480,
  ring1AsteroidCount: 16,
  ring2AsteroidCount: 5,
  autoDispatch: false,
  showRadarBeams: true,
  showBoundaryRadii: true,
  showStateLabels: true,
  showTrails: true,
};

export class VoidDriftEngine {
  config: SimulationConfig;
  center: Vector2D = { x: 0, y: 0 };
  scouts: Scout[] = [];
  miningDrones: Drone[] = [];
  haulers: Drone[] = [];
  asteroids: Asteroid[] = [];
  fragments: Fragment[] = [];
  logs: DispatchLog[] = [];
  stats: SimulationStats;

  private cycleTimeHistory: number[] = [];

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = {
      resources: {
        Metal: 0,
        RawAluminum: 0,
        Aluminum: 0,
        H3Gas: 0,
      },
      conversions: [],
      closedLoopsCompleted: 0,
      successfulTugsCompleted: 0,
      activeDispatches: 0,
      detectedQueueLength: 0,
      ring2QueueLength: 0,
      avgCycleTimeSec: 0,
      miningRatePerMin: 0,
      boundaryTelemetry: {
        totalAsteroids: 0,
        ring1AsteroidsCount: 0,
        ring2AsteroidsCount: 0,
        gasAsteroidsCount: 0,
        fragmentsCount: 0,
        asteroidsInScanRange: 0,
        asteroidsOutsideScanRange: 0,
        correctlyDetectedCount: 0,
        correctlyIgnoredCount: 0,
        detectionAccuracyPct: 100,
        spawnCeilingRadius: DEFAULT_CONFIG.ring2OuterRadius,
        scoutCeilingRadius: 210 + DEFAULT_CONFIG.scoutScanRadius,
        isBoundaryValid: true,
        ring2GatedMiningValid: true,
        totalSuccessfulTugs: 0,
      },
      isRunning: true,
      simSpeed: 1,
    };

    this.initWorld();
  }

  public initWorld(): void {
    this.scouts = [];
    this.miningDrones = [];
    this.haulers = [];
    this.asteroids = [];
    this.fragments = [];
    this.logs = [];
    this.cycleTimeHistory = [];

    // Reset stats
    this.stats.resources = {
      Metal: 0,
      RawAluminum: 0,
      Aluminum: 0,
      H3Gas: 0,
    };
    this.stats.conversions = [];
    this.stats.closedLoopsCompleted = 0;
    this.stats.successfulTugsCompleted = 0;
    this.stats.activeDispatches = 0;
    this.stats.detectedQueueLength = 0;
    this.stats.ring2QueueLength = 0;
    this.stats.avgCycleTimeSec = 0;

    // 1. Create Scout
    for (let i = 0; i < this.config.scoutCount; i++) {
      const orbitRadius = (this.config.ring1InnerRadius + this.config.ring1OuterRadius) / 2;
      this.scouts.push({
        id: `scout-${i + 1}`,
        name: `Scout Alpha-${i + 1}`,
        x: orbitRadius * Math.cos(0),
        y: orbitRadius * Math.sin(0),
        orbitRadius,
        orbitAngle: (i * Math.PI * 2) / this.config.scoutCount,
        orbitSpeed: this.config.scoutSpeed,
        scanRadius: this.config.scoutScanRadius,
        scanAngle: 0,
        targetsInProximityCount: 0,
        color: '#00F0FF',
      });
    }

    // 2. Create Mining Drones (Phase 1 Mining Role & Phase 4 Mk II Breaker Tier)
    const miningColors = ['#F59E0B', '#EC4899', '#10B981', '#3B82F6'];
    for (let i = 0; i < this.config.miningDroneCount; i++) {
      const isBreakerTier = i === 1; // Drone M-102 starts as Tier 2 Breaker
      this.miningDrones.push({
        id: `miner-${i + 1}`,
        name: isBreakerTier ? `Breaker Mk II M-${101 + i}` : `Mining Drone M-${101 + i}`,
        role: 'Mining',
        tier: isBreakerTier ? 2 : 1,
        state: 'Holding',
        x: 0,
        y: 0,
        targetAsteroidId: null,
        targetPos: null,
        cargo: 0,
        maxCargo: this.config.miningCapacity,
        miningProgress: 0,
        miningDuration: this.config.miningDurationSec,
        miningTimeElapsed: 0,
        speed: this.config.miningSpeed,
        color: miningColors[i % miningColors.length],
        completedMissions: 0,
        totalMetalCollected: 0,
        trail: [],
      });
    }

    // 3. Create Real Hauler Drones (Tug Role for Ring 2)
    const haulerColors = ['#8B5CF6', '#D97706'];
    for (let i = 0; i < this.config.haulerCount; i++) {
      this.haulers.push({
        id: `hauler-${i + 1}`,
        name: `Tug Hauler H-${201 + i}`,
        role: 'Hauler',
        state: 'Docked',
        x: 0,
        y: 0,
        targetAsteroidId: null,
        targetPos: null,
        cargo: 0,
        maxCargo: 0,
        miningProgress: 0,
        miningDuration: 0,
        miningTimeElapsed: 0,
        tugProgress: 0,
        speed: this.config.haulerSpeed,
        color: haulerColors[i % haulerColors.length],
        completedMissions: 0,
        totalAsteroidsTugged: 0,
        trail: [],
      });
    }

    // 4. Populate Asteroid Rings
    this.populateAsteroids();
    this.addLog(
      'SYSTEM',
      'ALL',
      'INITIALIZE',
      'VoidDrift Engine online. Scout active, Mining fleet docked, Real Tug Haulers standing by at Hub.'
    );
  }

  public populateAsteroids(): void {
    // Ring 1 Asteroids
    const currentR1 = this.asteroids.filter((a) => a.ring === 1 && !a.isDepleted).length;
    const neededR1 = this.config.ring1AsteroidCount - currentR1;
    for (let i = 0; i < neededR1; i++) {
      this.spawnSingleAsteroid(1);
    }

    // Ring 2 Medium Asteroids
    const currentR2 = this.asteroids.filter((a) => a.ring === 2 && !a.isDepleted).length;
    const neededR2 = this.config.ring2AsteroidCount - currentR2;
    for (let i = 0; i < neededR2; i++) {
      this.spawnSingleAsteroid(2);
    }
  }

  private spawnSingleAsteroid(ring: 1 | 2): void {
    const minR = ring === 1 ? this.config.ring1InnerRadius : this.config.ring2InnerRadius;
    const maxR = ring === 1 ? this.config.ring1OuterRadius : this.config.ring2OuterRadius;
    const radius = minR + Math.random() * (maxR - minR);
    const angle = Math.random() * Math.PI * 2;
    const speed = (ring === 1 ? 0.06 : 0.03) * (Math.random() > 0.5 ? 1 : -1);

    const isMedium = ring === 2;
    const hasGas = isMedium && Math.random() < 0.5;
    const gasAmount = hasGas ? 100 + Math.floor(Math.random() * 80) : 0;
    const size = isMedium ? 18 + Math.random() * 8 : 10 + Math.random() * 8;
    const metal = isMedium ? 180 + Math.floor(Math.random() * 120) : 50 + Math.floor(Math.random() * 80);
    const resourceType: ResourceType = isMedium ? 'RawAluminum' : 'Metal';

    this.asteroids.push({
      id: `${isMedium ? 'med' : 'ast'}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      ring,
      isMedium,
      gasAmount,
      orbitRadius: radius,
      orbitAngle: angle,
      orbitSpeed: speed,
      metalAmount: metal,
      maxMetal: metal,
      resourceType,
      isDetected: false,
      isTargeted: false,
      isTuggedByHaulerId: null,
      isDepleted: false,
      size,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 1.2,
      spawnTime: Date.now(),
    });
  }

  public update(dt: number): void {
    if (!this.stats.isRunning) return;

    const scaledDt = dt * this.stats.simSpeed;

    // 1. Update Asteroids Orbiting
    for (const asteroid of this.asteroids) {
      if (asteroid.isDepleted) continue;

      // If being tugged, its orbit angle updates slowly, but orbitRadius is controlled by Hauler
      asteroid.orbitAngle += asteroid.orbitSpeed * scaledDt;
      asteroid.x = asteroid.orbitRadius * Math.cos(asteroid.orbitAngle);
      asteroid.y = asteroid.orbitRadius * Math.sin(asteroid.orbitAngle);
      asteroid.rotation += asteroid.rotationSpeed * scaledDt;
    }

    // 1.5 Update Scattered Fragments Motion in Ring 2 (Gravitational Decay for Untargeted Fragments)
    const FRAGMENT_DRIFT_RATE = 18; // px/sec gravitational pull rate toward central origin
    for (const frag of [...this.fragments]) {
      if (!frag.isTargeted) {
        frag.orbitAngle += frag.orbitSpeed * scaledDt;
        frag.orbitRadius = Math.max(0, frag.orbitRadius - FRAGMENT_DRIFT_RATE * scaledDt);
        frag.x = frag.orbitRadius * Math.cos(frag.orbitAngle) + frag.vx * 0.05 * scaledDt;
        frag.y = frag.orbitRadius * Math.sin(frag.orbitAngle) + frag.vy * 0.05 * scaledDt;

        if (frag.orbitRadius <= this.config.ring1OuterRadius) {
          this.convertFragmentToRing1Asteroid(frag, frag.x, frag.y, 'GRAVITY');
        }
      }
    }

    // Maintain asteroid counts
    const activeR1 = this.asteroids.filter((a) => a.ring === 1 && !a.isDepleted);
    if (activeR1.length < Math.floor(this.config.ring1AsteroidCount * 0.6)) {
      this.spawnSingleAsteroid(1);
    }
    const activeR2 = this.asteroids.filter((a) => a.ring === 2 && !a.isDepleted);
    if (activeR2.length < Math.floor(this.config.ring2AsteroidCount * 0.5)) {
      this.spawnSingleAsteroid(2);
    }

    // 2. Scout Proximity Detection across both rings
    this.updateScouts(scaledDt);

    // 3. Mining Drones FSM (Ring 1 Only)
    this.updateMiningDrones(scaledDt);

    // 4. Real Haulers FSM (Ring 2 Tug into Ring 1)
    this.updateHaulerTugFSM(scaledDt);

    // 5. Generic Conversion Engine Tick
    this.updateConversions(scaledDt);

    // 6. Telemetry & Verification
    this.updateTelemetry();
  }

  private updateScouts(dt: number): void {
    for (const scout of this.scouts) {
      scout.orbitAngle += scout.orbitSpeed * dt;
      scout.x = scout.orbitRadius * Math.cos(scout.orbitAngle);
      scout.y = scout.orbitRadius * Math.sin(scout.orbitAngle);
      scout.scanAngle = (scout.scanAngle + 2.5 * dt) % (Math.PI * 2);

      let detectedCount = 0;

      for (const asteroid of this.asteroids) {
        if (asteroid.isDepleted) continue;

        const dist = Math.hypot(asteroid.x - scout.x, asteroid.y - scout.y);
        if (dist <= scout.scanRadius) {
          detectedCount++;
          if (!asteroid.isDetected) {
            asteroid.isDetected = true;
            asteroid.detectedByScoutId = scout.id;
            this.addLog(
              scout.name,
              asteroid.id,
              'DETECTED',
              `Target detected in ${asteroid.ring === 2 ? 'Ring 2 (Medium)' : 'Ring 1'} (Metal: ${asteroid.metalAmount})`
            );
          }
        }
      }

      scout.targetsInProximityCount = detectedCount;
    }
  }

  private updateMiningDrones(dt: number): void {
    // CRITICAL BOUNDARY RULE: Mining drones CAN ONLY target Ring 1 asteroids UNLESS they are Tier 2 Breakers targeting Ring 2 Gas Asteroids!
    const validRing1Targets = this.asteroids.filter(
      (a) => a.isDetected && !a.isTargeted && !a.isDepleted && a.orbitRadius <= this.config.ring1OuterRadius
    );

    const validRing2GasTargets = this.asteroids.filter(
      (a) => a.ring === 2 && a.gasAmount > 0 && a.isDetected && !a.isTargeted && !a.isDepleted
    );

    this.stats.detectedQueueLength = validRing1Targets.length;

    for (const drone of this.miningDrones) {
      if (this.config.showTrails) {
        drone.trail.unshift({ x: drone.x, y: drone.y });
        if (drone.trail.length > 20) drone.trail.pop();
      } else {
        drone.trail = [];
      }

      switch (drone.state) {
        case 'Holding': {
          if (this.config.autoDispatch) {
            // Tier 2 Mk II Breakers PREFER Ring 2 Gas Asteroids over Ring 1
            let selectedTarget: Asteroid | null = null;

            if (drone.tier === 2 && validRing2GasTargets.length > 0) {
              validRing2GasTargets.sort((a, b) => {
                const distA = Math.hypot(a.x - drone.x, a.y - drone.y);
                const distB = Math.hypot(b.x - drone.x, b.y - drone.y);
                return distA - distB;
              });
              selectedTarget = validRing2GasTargets.shift()!;
            } else if (validRing1Targets.length > 0) {
              validRing1Targets.sort((a, b) => {
                const distA = Math.hypot(a.x - drone.x, a.y - drone.y);
                const distB = Math.hypot(b.x - drone.x, b.y - drone.y);
                return distA - distB;
              });
              selectedTarget = validRing1Targets.shift()!;
            }

            if (selectedTarget) {
              selectedTarget.isTargeted = true;
              selectedTarget.targetedByDroneId = drone.id;

              drone.targetAsteroidId = selectedTarget.id;
              drone.targetPos = { x: selectedTarget.x, y: selectedTarget.y };
              drone.state = 'Dispatched';
              drone.dispatchTime = Date.now();

              const isRing2Gas = selectedTarget.ring === 2 && selectedTarget.gasAmount > 0;
              this.addLog(
                drone.name,
                selectedTarget.id,
                'DISPATCHED',
                isRing2Gas
                  ? `GAS CORE TARGETED. BREAKER DISPATCHED.`
                  : `RING 1 TARGET ACQUIRED. MINER DISPATCHED.`
              );
            }
          }
          break;
        }

        case 'Dispatched': {
          drone.state = 'Traveling';
          break;
        }

        case 'Traveling': {
          const target = this.asteroids.find((a) => a.id === drone.targetAsteroidId);

          // Verify target is valid
          if (!target || target.isDepleted) {
            drone.state = 'Returning';
            drone.targetAsteroidId = null;
            this.addLog(drone.name, 'HUB', 'ARRIVED', 'TARGET LOST. RETURNING TO HUB.');
            break;
          }

          // Tier 1 drone cannot drill Ring 2
          if (target.ring === 2 && drone.tier !== 2) {
            drone.state = 'Returning';
            drone.targetAsteroidId = null;
            this.addLog(drone.name, 'HUB', 'ARRIVED', 'RING 2 ACCESS DENIED. INSUFFICIENT PROTOCOL TIER.');
            break;
          }

          drone.targetPos = { x: target.x, y: target.y };
          const dx = drone.targetPos.x - drone.x;
          const dy = drone.targetPos.y - drone.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 14) {
            drone.x = drone.targetPos.x;
            drone.y = drone.targetPos.y;
            drone.state = 'Mining';
            drone.miningProgress = 0;
            drone.miningTimeElapsed = 0;
            if (target.ring === 2 && target.gasAmount > 0) {
              this.addLog(drone.name, target.id, 'DRILLING', 'GAS CORE DETECTED. DRILLING COMMENCED.');
            } else {
              this.addLog(drone.name, target.id, 'ARRIVED', 'TARGET REACHED. MINING LASER ENGAGED.');
            }
          } else {
            const step = Math.min(distance, drone.speed * dt);
            drone.x += (dx / distance) * step;
            drone.y += (dy / distance) * step;
          }
          break;
        }

        case 'Mining': {
          const target = this.asteroids.find((a) => a.id === drone.targetAsteroidId);

          if (!target || target.isDepleted) {
            drone.state = 'Returning';
            this.addLog(drone.name, 'HUB', 'MINING_COMPLETE', 'TARGET DEPLETED. RETURNING TO HUB.');
            break;
          }

          drone.x = target.x;
          drone.y = target.y;

          drone.miningTimeElapsed += dt;
          const duration = target.ring === 2 ? 8.0 : drone.miningDuration;
          drone.miningProgress = Math.min(1, drone.miningTimeElapsed / duration);

          if (drone.miningProgress >= 1) {
            if (target.ring === 2 && target.gasAmount > 0) {
              // Gas-Bearing In-Place Drilling Complete -> Credit H3Gas & Burst into Fragments
              const extractedGas = target.gasAmount;
              this.stats.resources.H3Gas = (this.stats.resources.H3Gas || 0) + extractedGas;
              target.gasAmount = 0;
              target.isDepleted = true;
              target.isDetected = false;
              target.isTargeted = false;

              // BURST into 3-5 scattered ore fragments in Ring 2
              const fragmentCount = 3 + Math.floor(Math.random() * 3);
              for (let i = 0; i < fragmentCount; i++) {
                const scatterAngle = Math.random() * Math.PI * 2;
                const scatterDist = 18 + Math.random() * 35;
                const fragX = target.x + scatterDist * Math.cos(scatterAngle);
                const fragY = target.y + scatterDist * Math.sin(scatterAngle);
                const fragRadius = Math.hypot(fragX, fragY);
                const fragAngle = Math.atan2(fragY, fragX);
                this.fragments.push({
                  id: `frag-${Date.now().toString(36)}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                  x: fragX,
                  y: fragY,
                  ring: 2,
                  resourceType: 'RawAluminum',
                  amount: Math.floor(target.maxMetal / fragmentCount),
                  orbitRadius: fragRadius,
                  orbitAngle: fragAngle,
                  orbitSpeed: 0.03 * (Math.random() > 0.5 ? 1 : -1),
                  vx: (Math.random() - 0.5) * 16,
                  vy: (Math.random() - 0.5) * 16,
                  isTargeted: false,
                  size: 7 + Math.random() * 3,
                });
              }

              this.addLog(
                drone.name,
                target.id,
                'BURST',
                `GAS EXTRACTED. +${extractedGas} MT H3 GAS SECURED. FRAGMENTS SCATTERED.`
              );

              drone.state = 'Returning';
              drone.cargo = 0;
              drone.targetAsteroidId = null;
            } else {
              // Standard Ring 1 Mining Loop
              const extract = Math.min(drone.maxCargo, target.metalAmount);
              target.metalAmount -= extract;
              drone.cargo = extract;
              drone.cargoType = target.resourceType || (target.isMedium ? 'RawAluminum' : 'Metal');

              if (target.metalAmount <= 0) {
                target.isDepleted = true;
                target.isDetected = false;
                target.isTargeted = false;
              } else {
                target.isTargeted = false;
              }

              drone.state = 'Returning';
              this.addLog(
                drone.name,
                target.id,
                'MINING_COMPLETE',
                `MINING COMPLETE. +${extract} MT ${drone.cargoType ? drone.cargoType.toUpperCase() : 'ORE'} EXTRACTED.`
              );
            }
          }
          break;
        }

        case 'Returning': {
          const dx = 0 - drone.x;
          const dy = 0 - drone.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 14) {
            drone.x = 0;
            drone.y = 0;

            const deposited = drone.cargo;
            if (deposited > 0) {
              const resType = drone.cargoType || 'Metal';
              this.stats.resources[resType] = (this.stats.resources[resType] || 0) + deposited;
              drone.totalResourcesCollected = (drone.totalResourcesCollected || 0) + deposited;
              drone.totalMetalCollected = drone.totalResourcesCollected;
              drone.completedMissions += 1;
              this.stats.closedLoopsCompleted += 1;

              this.addLog(
                drone.name,
                'HUB',
                'DEPOSITED',
                `CARGO SECURED. +${deposited} MT ${resType.toUpperCase()} DEPOSITED.`
              );
            }

            if (drone.dispatchTime) {
              const cycleTime = (Date.now() - drone.dispatchTime) / 1000;
              this.cycleTimeHistory.push(cycleTime);
              if (this.cycleTimeHistory.length > 20) this.cycleTimeHistory.shift();
              drone.lastCycleDurationSec = cycleTime;
            }

            drone.cargo = 0;
            drone.cargoType = undefined;
            drone.targetAsteroidId = null;
            drone.targetPos = null;
            drone.state = 'Holding';
          } else {
            const step = Math.min(distance, drone.speed * dt);
            drone.x += (dx / distance) * step;
            drone.y += (dy / distance) * step;
          }
          break;
        }
      }
    }
  }

  private updateHaulerTugFSM(dt: number): void {
    // Targets for Hauler: Ring 2 medium non-gas asteroids OR loose scattered fragments in Ring 2
    const nonGasRing2Targets = this.asteroids.filter(
      (a) =>
        a.ring === 2 &&
        (a.gasAmount === 0 || !a.gasAmount) &&
        a.isDetected &&
        !a.isTargeted &&
        !a.isDepleted &&
        a.orbitRadius > this.config.ring1OuterRadius
    );

    const unassignedFragments = this.fragments.filter((f) => !f.isTargeted);

    this.stats.ring2QueueLength = nonGasRing2Targets.length + unassignedFragments.length;

    for (const hauler of this.haulers) {
      if (this.config.showTrails) {
        hauler.trail.unshift({ x: hauler.x, y: hauler.y });
        if (hauler.trail.length > 20) hauler.trail.pop();
      } else {
        hauler.trail = [];
      }

      switch (hauler.state) {
        case 'Docked': {
          if (this.config.autoDispatch) {
            // Prefer retrieving loose fragments first, then intact non-gas asteroids
            if (unassignedFragments.length > 0) {
              const frag = unassignedFragments.shift()!;
              frag.isTargeted = true;
              frag.targetedByDroneId = hauler.id;

              hauler.targetFragmentId = frag.id;
              hauler.targetAsteroidId = null;
              hauler.targetPos = { x: frag.x, y: frag.y };
              hauler.state = 'Dispatched';
              hauler.dispatchTime = Date.now();

              this.addLog(
                hauler.name,
                frag.id,
                'DISPATCHED',
                `FRAGMENT ACQUIRED. HAULER DISPATCHED.`
              );
            } else if (nonGasRing2Targets.length > 0) {
              const target = nonGasRing2Targets.shift()!;
              target.isTargeted = true;
              target.targetedByDroneId = hauler.id;

              hauler.targetAsteroidId = target.id;
              hauler.targetFragmentId = null;
              hauler.targetPos = { x: target.x, y: target.y };
              hauler.state = 'Dispatched';
              hauler.dispatchTime = Date.now();

              this.addLog(
                hauler.name,
                target.id,
                'DISPATCHED',
                `RING 2 TARGET ACQUIRED. HAULER DISPATCHED.`
              );
            }
          }
          break;
        }

        case 'Dispatched': {
          hauler.state = 'Traveling';
          break;
        }

        case 'Traveling': {
          if (hauler.targetFragmentId) {
            const frag = this.fragments.find((f) => f.id === hauler.targetFragmentId);
            if (!frag) {
              hauler.state = 'Returning';
              hauler.targetFragmentId = null;
              break;
            }

            hauler.targetPos = { x: frag.x, y: frag.y };
            const dx = hauler.targetPos.x - hauler.x;
            const dy = hauler.targetPos.y - hauler.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 16) {
              hauler.x = hauler.targetPos.x;
              hauler.y = hauler.targetPos.y;
              hauler.state = 'Latched';
              hauler.tugProgress = 0;

              this.addLog(
                hauler.name,
                frag.id,
                'LATCHED',
                'GRAPPLE CABLE LATCHED. FRAGMENT RETRIEVAL COMMENCED.'
              );
            } else {
              const step = Math.min(distance, hauler.speed * dt);
              hauler.x += (dx / distance) * step;
              hauler.y += (dy / distance) * step;
            }
          } else if (hauler.targetAsteroidId) {
            const target = this.asteroids.find((a) => a.id === hauler.targetAsteroidId);

            if (!target || target.isDepleted) {
              hauler.state = 'Returning';
              hauler.targetAsteroidId = null;
              this.addLog(hauler.name, 'HUB', 'ARRIVED', 'TARGET LOST. ABORTING TUG.');
              break;
            }

            hauler.targetPos = { x: target.x, y: target.y };
            const dx = hauler.targetPos.x - hauler.x;
            const dy = hauler.targetPos.y - hauler.y;
            const distance = Math.hypot(dx, dy);

            if (distance < 16) {
              hauler.x = hauler.targetPos.x;
              hauler.y = hauler.targetPos.y;
              hauler.state = 'Latched';
              hauler.tugProgress = 0;
              target.isTuggedByHaulerId = hauler.id;

              this.addLog(
                hauler.name,
                target.id,
                'LATCHED',
                'TOW GRAPPLE LATCHED. INWARD TUG COMMENCED.'
              );
            } else {
              const step = Math.min(distance, hauler.speed * dt);
              hauler.x += (dx / distance) * step;
              hauler.y += (dy / distance) * step;
            }
          }
          break;
        }

        case 'Latched': {
          hauler.state = 'Tugging';
          break;
        }

        case 'Tugging': {
          const targetRing1Radius = (this.config.ring1InnerRadius + this.config.ring1OuterRadius) / 2;

          if (hauler.targetFragmentId) {
            const frag = this.fragments.find((f) => f.id === hauler.targetFragmentId);
            if (!frag) {
              hauler.state = 'Returning';
              hauler.targetFragmentId = null;
              break;
            }

            const targetAngle = frag.orbitAngle;
            const destinationX = targetRing1Radius * Math.cos(targetAngle);
            const destinationY = targetRing1Radius * Math.sin(targetAngle);

            const dx = destinationX - hauler.x;
            const dy = destinationY - hauler.y;
            const distance = Math.hypot(dx, dy);

            const towSpeed = hauler.speed * 0.75;
            const step = Math.min(distance, towSpeed * dt);

            if (distance > 5) {
              hauler.x += (dx / distance) * step;
              hauler.y += (dy / distance) * step;
            }

            frag.x = hauler.x;
            frag.y = hauler.y;
            frag.orbitRadius = Math.hypot(frag.x, frag.y);

            if (frag.orbitRadius <= this.config.ring1OuterRadius) {
              this.convertFragmentToRing1Asteroid(frag, hauler.x, hauler.y, hauler.name);
              this.stats.successfulTugsCompleted += 1;
              hauler.completedMissions += 1;
              hauler.state = 'Released';
            }
          } else if (hauler.targetAsteroidId) {
            const target = this.asteroids.find((a) => a.id === hauler.targetAsteroidId);

            if (!target || target.isDepleted) {
              hauler.state = 'Returning';
              break;
            }

            const targetAngle = target.orbitAngle;
            const destinationX = targetRing1Radius * Math.cos(targetAngle);
            const destinationY = targetRing1Radius * Math.sin(targetAngle);

            const dx = destinationX - hauler.x;
            const dy = destinationY - hauler.y;
            const distance = Math.hypot(dx, dy);

            const towSpeed = hauler.speed * 0.65;
            const step = Math.min(distance, towSpeed * dt);

            if (distance > 5) {
              hauler.x += (dx / distance) * step;
              hauler.y += (dy / distance) * step;
            }

            const newRadius = Math.hypot(hauler.x, hauler.y) + 12;
            target.orbitRadius = newRadius;
            target.x = target.orbitRadius * Math.cos(target.orbitAngle);
            target.y = target.orbitRadius * Math.sin(target.orbitAngle);

            if (target.orbitRadius <= this.config.ring1OuterRadius) {
              target.ring = 1;
              target.isTuggedByHaulerId = null;
              target.isTargeted = false;

              hauler.state = 'Released';
              hauler.totalAsteroidsTugged = (hauler.totalAsteroidsTugged || 0) + 1;
              this.stats.successfulTugsCompleted += 1;

              this.addLog(
                hauler.name,
                target.id,
                'RELEASED',
                `MEDIUM ASTEROID SECURED. TRANSFERRED TO RING 1.`
              );
            }
          }
          break;
        }

        case 'Released': {
          hauler.targetAsteroidId = null;
          hauler.targetFragmentId = null;
          hauler.state = 'Returning';
          break;
        }

        case 'Returning': {
          const dx = 0 - hauler.x;
          const dy = 0 - hauler.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 14) {
            hauler.x = 0;
            hauler.y = 0;
            hauler.completedMissions += 1;
            hauler.state = 'Docked';

            this.addLog(hauler.name, 'HUB', 'DOCKED', 'TOW HAULER DOCKED. STANDBY.');
          } else {
            const step = Math.min(distance, hauler.speed * dt);
            hauler.x += (dx / distance) * step;
            hauler.y += (dy / distance) * step;
          }
          break;
        }
      }
    }
  }

  private updateTelemetry(): void {
    const scout = this.scouts[0];
    const activeAsteroids = this.asteroids.filter((a) => !a.isDepleted);

    let inRangeCount = 0;
    let outRangeCount = 0;
    let correctlyDetected = 0;
    let correctlyIgnored = 0;

    if (scout) {
      for (const asteroid of activeAsteroids) {
        const dist = Math.hypot(asteroid.x - scout.x, asteroid.y - scout.y);
        const inside = dist <= scout.scanRadius;

        if (inside) {
          inRangeCount++;
          if (asteroid.isDetected) correctlyDetected++;
        } else {
          outRangeCount++;
          if (!asteroid.isDetected) correctlyIgnored++;
        }
      }
    }

    const totalCheck = activeAsteroids.length;
    const accuracy =
      totalCheck > 0 ? ((correctlyDetected + correctlyIgnored) / totalCheck) * 100 : 100;

    const spawnCeiling = this.config.ring2OuterRadius;
    const scoutCeiling = scout ? scout.orbitRadius + scout.scanRadius : spawnCeiling;

    // Verify Tier 1 Mining Drones NEVER target or access Ring 2 asteroids (only Tier 2 Breakers targeting Ring 2 gas)
    const ring2Violation = this.miningDrones.some((d) => {
      if (!d.targetAsteroidId) return false;
      const target = this.asteroids.find((a) => a.id === d.targetAsteroidId);
      if (!target) return false;
      if (target.ring === 2) {
        return !(d.tier === 2 && target.gasAmount > 0);
      }
      return target.orbitRadius > this.config.ring1OuterRadius;
    });

    this.stats.boundaryTelemetry = {
      totalAsteroids: totalCheck,
      ring1AsteroidsCount: activeAsteroids.filter((a) => a.ring === 1).length,
      ring2AsteroidsCount: activeAsteroids.filter((a) => a.ring === 2).length,
      gasAsteroidsCount: activeAsteroids.filter((a) => a.ring === 2 && a.gasAmount > 0).length,
      fragmentsCount: this.fragments.length,
      asteroidsInScanRange: inRangeCount,
      asteroidsOutsideScanRange: outRangeCount,
      correctlyDetectedCount: correctlyDetected,
      correctlyIgnoredCount: correctlyIgnored,
      detectionAccuracyPct: Math.round(accuracy),
      spawnCeilingRadius: Math.round(spawnCeiling),
      scoutCeilingRadius: Math.round(scoutCeiling),
      isBoundaryValid: scoutCeiling >= spawnCeiling * 0.85,
      ring2GatedMiningValid: !ring2Violation,
      totalSuccessfulTugs: this.stats.successfulTugsCompleted,
    };

    if (this.cycleTimeHistory.length > 0) {
      const sum = this.cycleTimeHistory.reduce((a, b) => a + b, 0);
      this.stats.avgCycleTimeSec = parseFloat((sum / this.cycleTimeHistory.length).toFixed(1));
    }

    this.stats.activeDispatches =
      this.miningDrones.filter((d) => d.state !== 'Holding').length +
      this.haulers.filter((h) => h.state !== 'Docked').length;
  }

  public addLog(droneName: string, targetId: string, action: DispatchLog['action'], details: string): void {
    const log: DispatchLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
      droneName,
      targetId,
      action,
      details,
    };
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
  }

  private convertFragmentToRing1Asteroid(frag: Fragment, x: number, y: number, sourceName: string): void {
    const orbitRadius = Math.hypot(x, y);
    this.asteroids.push({
      id: `ast-frag-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      x,
      y,
      ring: 1,
      isMedium: false,
      gasAmount: 0,
      orbitRadius,
      orbitAngle: Math.atan2(y, x),
      orbitSpeed: 0.06 * (Math.random() > 0.5 ? 1 : -1),
      metalAmount: frag.amount,
      maxMetal: frag.amount,
      resourceType: frag.resourceType,
      isDetected: true,
      isTargeted: false,
      isDepleted: false,
      size: 11,
      rotation: 0,
      rotationSpeed: 0.5,
      spawnTime: Date.now(),
    });

    this.fragments = this.fragments.filter((f) => f.id !== frag.id);

    this.addLog(
      sourceName,
      frag.id,
      'FRAGMENT_RETRIEVED',
      `FRAGMENT SECURED. +${frag.amount} MT ${frag.resourceType.toUpperCase()} TRANSFERRED TO RING 1.`
    );
  }

  public triggerManualDispatch(targetAsteroidId: string): boolean {
    const target = this.asteroids.find((a) => a.id === targetAsteroidId);
    if (!target || target.isDepleted) return false;

    if (target.isTargeted) {
      this.addLog('SYSTEM', target.id, 'DISPATCHED', 'TARGET ALREADY ENGAGED.');
      return false;
    }

    const isGasBearing = target.ring === 2 && (target.gasAmount || 0) > 0;
    const isRing1 = target.ring === 1 || target.orbitRadius <= this.config.ring1OuterRadius;

    if (isGasBearing) {
      // Needs Tier 2 Mk II Breaker drone
      const breaker = this.miningDrones.find((d) => d.state === 'Holding' && d.tier === 2);
      if (breaker) {
        target.isDetected = true;
        target.isTargeted = true;
        target.targetedByDroneId = breaker.id;

        breaker.targetAsteroidId = target.id;
        breaker.targetPos = { x: target.x, y: target.y };
        breaker.state = 'Dispatched';
        breaker.dispatchTime = Date.now();

        this.addLog(breaker.name, target.id, 'DISPATCHED', 'GAS CORE TARGETED. BREAKER DEPLOYED.');
        return true;
      } else {
        this.addLog('FLEET', target.id, 'DISPATCHED', 'RING 2 ACCESS DENIED. TIER 2 BREAKER REQUIRED.');
        return false;
      }
    } else if (isRing1) {
      // Needs any idle Mining Drone (prefer Mk I over Mk II if both exist so Mk II is saved for gas)
      const miner =
        this.miningDrones.find((d) => d.state === 'Holding' && (d.tier || 1) === 1) ||
        this.miningDrones.find((d) => d.state === 'Holding');

      if (miner) {
        target.isDetected = true;
        target.isTargeted = true;
        target.targetedByDroneId = miner.id;

        miner.targetAsteroidId = target.id;
        miner.targetPos = { x: target.x, y: target.y };
        miner.state = 'Dispatched';
        miner.dispatchTime = Date.now();

        this.addLog(miner.name, target.id, 'DISPATCHED', 'RING 1 TARGET ACQUIRED. MINER DEPLOYED.');
        return true;
      } else {
        this.addLog('FLEET', target.id, 'DISPATCHED', 'NO DRONES AVAILABLE.');
        return false;
      }
    } else if (target.ring === 2) {
      // Medium Ring 2 asteroid (Non-gas), needs Tow Hauler
      const hauler = this.haulers.find((h) => h.state === 'Docked');
      if (hauler) {
        target.isDetected = true;
        target.isTargeted = true;
        target.targetedByDroneId = hauler.id;

        hauler.targetAsteroidId = target.id;
        hauler.targetPos = { x: target.x, y: target.y };
        hauler.state = 'Dispatched';
        hauler.dispatchTime = Date.now();

        this.addLog(hauler.name, target.id, 'DISPATCHED', 'RING 2 TARGET ACQUIRED. HAULER DEPLOYED.');
        return true;
      } else {
        this.addLog('FLEET', target.id, 'DISPATCHED', 'NO HAULERS AVAILABLE.');
        return false;
      }
    }

    return false;
  }

  public triggerManualMiningDispatch(droneId: string, targetAsteroidId: string): boolean {
    const drone = this.miningDrones.find((d) => d.id === droneId);
    const target = this.asteroids.find((a) => a.id === targetAsteroidId);

    if (
      drone &&
      target &&
      drone.state === 'Holding' &&
      !target.isTargeted &&
      !target.isDepleted &&
      target.orbitRadius <= this.config.ring1OuterRadius
    ) {
      target.isDetected = true;
      target.isTargeted = true;
      target.targetedByDroneId = drone.id;

      drone.targetAsteroidId = target.id;
      drone.targetPos = { x: target.x, y: target.y };
      drone.state = 'Dispatched';
      drone.dispatchTime = Date.now();

      this.addLog(drone.name, target.id, 'DISPATCHED', `MANUAL DISPATCH OVERRIDE. MINER DEPLOYED.`);
      return true;
    }
    return false;
  }

  public triggerManualHaulerTug(haulerId: string, targetAsteroidId: string): boolean {
    const hauler = this.haulers.find((h) => h.id === haulerId);
    const target = this.asteroids.find((a) => a.id === targetAsteroidId);

    if (
      hauler &&
      target &&
      hauler.state === 'Docked' &&
      !target.isTargeted &&
      !target.isDepleted &&
      target.ring === 2
    ) {
      target.isDetected = true;
      target.isTargeted = true;
      target.targetedByDroneId = hauler.id;

      hauler.targetAsteroidId = target.id;
      hauler.targetPos = { x: target.x, y: target.y };
      hauler.state = 'Dispatched';
      hauler.dispatchTime = Date.now();

      this.addLog(hauler.name, target.id, 'DISPATCHED', `MANUAL TUG OVERRIDE. HAULER DEPLOYED.`);
      return true;
    }
    return false;
  }

  public toggleMiningDroneTier(droneId: string): boolean {
    const drone = this.miningDrones.find((d) => d.id === droneId);
    if (!drone) return false;
    const newTier = drone.tier === 2 ? 1 : 2;
    drone.tier = newTier;
    const num = drone.id.replace('miner-', '');
    drone.name = newTier === 2 ? `Breaker Mk II M-10${num}` : `Mining Drone M-10${num}`;
    drone.color = newTier === 2 ? '#EC4899' : '#F59E0B';
    this.addLog(
      drone.name,
      'FLEET',
      'CONVERSION_START',
      newTier === 2
        ? 'UNIT UPGRADED. BREAKER MK II PROTOCOLS ACTIVE.'
        : 'UNIT RECONFIGURED. MK I MINER ACTIVE.'
    );
    return true;
  }

  public setConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    for (const scout of this.scouts) {
      scout.scanRadius = this.config.scoutScanRadius;
      scout.orbitSpeed = this.config.scoutSpeed;
    }
    for (const drone of this.miningDrones) {
      drone.speed = this.config.miningSpeed;
      drone.miningDuration = this.config.miningDurationSec;
      drone.maxCargo = this.config.miningCapacity;
    }
    for (const hauler of this.haulers) {
      hauler.speed = this.config.haulerSpeed;
    }
  }

  public startConversion(
    inputResource: ResourceType,
    inputAmount: number,
    outputResource: ResourceType,
    outputAmount: number,
    durationSec: number
  ): boolean {
    const currentAmount = this.stats.resources[inputResource] || 0;
    if (currentAmount < inputAmount) {
      return false;
    }

    // Deduct input resource upon starting process
    this.stats.resources[inputResource] -= inputAmount;

    const process: ConversionProcess = {
      id: `conv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      inputResource,
      inputAmount,
      outputResource,
      outputAmount,
      durationSec,
      elapsedSec: 0,
      status: 'processing',
    };

    this.stats.conversions.unshift(process);
    if (this.stats.conversions.length > 15) {
      this.stats.conversions.pop();
    }

    this.addLog(
      'SMELTER',
      'STATION',
      'INITIALIZE',
      `SMELTER COMMENCED. ${inputAmount} ${inputResource.toUpperCase()} -> ${outputAmount} ${outputResource.toUpperCase()}.`
    );

    return true;
  }

  public startSmeltAluminum(inputBatch: number = 10): boolean {
    // Proof case recipe: 10 RawAluminum -> 5 Refined Aluminum over 8.0s
    const ratio = Math.max(1, Math.floor(inputBatch / 10));
    const inputAmount = ratio * 10;
    const outputAmount = ratio * 5;
    const durationSec = 8.0 * ratio;
    return this.startConversion('RawAluminum', inputAmount, 'Aluminum', outputAmount, durationSec);
  }

  private updateConversions(dt: number): void {
    for (const proc of this.stats.conversions) {
      if (proc.status === 'processing') {
        proc.elapsedSec += dt;
        if (proc.elapsedSec >= proc.durationSec) {
          proc.elapsedSec = proc.durationSec;
          proc.status = 'complete';
          this.stats.resources[proc.outputResource] =
            (this.stats.resources[proc.outputResource] || 0) + proc.outputAmount;

          this.addLog(
            'SMELTER',
            'STATION',
            'DEPOSITED',
            `SMELTING COMPLETE. +${proc.outputAmount} MT ${proc.outputResource.toUpperCase()} REFINED.`
          );
        }
      }
    }
  }

  public updateFleetSizes(scouts: number, miners: number, haulers: number): void {
    if (
      scouts !== this.config.scoutCount ||
      miners !== this.config.miningDroneCount ||
      haulers !== this.config.haulerCount
    ) {
      this.config.scoutCount = scouts;
      this.config.miningDroneCount = miners;
      this.config.haulerCount = haulers;
      this.initWorld();
    }
  }
}
