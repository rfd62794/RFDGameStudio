import { Ant, Chamber, Colony, Egg, FoodItem, FoodNode, Nest, Queen, SimConfig, Tunnel, WayPoint } from './types';
import { PheromoneGrid } from './pheromones';
import { TunnelNetwork } from './tunnel_network';
import { ColonyLifecycle } from './colony_lifecycle';
import { CombatSystem } from './combat';

export const DEFAULT_CONFIG: SimConfig = {
  width: 900,
  height: 800,
  groundLevelY: 400,
  directSensingRange: 75,
  nestReachRadius: 20,
  foodReachRadius: 15,
  antSpeed: 2.2,
  initialPopulation: 15,
  foodCostPerAntSpawn: 2.0,
  explorationChance: 0.12,
  eggIncubationSeconds: 12.0,
  eggLayChance: 0.6,
  tunnelDigTarget: 40,
  tunnelDigRatePerAnt: 0.5,
  maxConcurrentDiggers: 4,
  workerMaxAge: 20000,
  theftChance: 0.02,
  theftAmount: 5,
  pheromone: {
    width: 900,
    height: 800,
    cellSize: 10,
    emitStrength: 0.05,
    decayRate: 0.015, // 1.5% decay per tick
    followThreshold: 0.08,
    maxCellStrength: 1.0,
  },
};

export const HUNGER_DECAY_PER_TICK = 0.00025;
export const ZERO_ENERGY_DAMAGE_TICKS = 50;
export const ZERO_ENERGY_DAMAGE_PER_TICK = 0.02;

export class Simulation {
  public config: SimConfig;
  public colonies: Colony[] = [];
  public foodNodes: FoodNode[] = [];
  public tickCount: number = 0;
  public taskCommittedWanderViolations: number = 0;
  private nextAntId: number = 1;
  private nextEggId: number = 1;
  private nextFoodItemId: number = 1;

  public tunnelNetwork: TunnelNetwork;
  public colonyLifecycle: ColonyLifecycle;
  public combatSystem: CombatSystem;

  get pheromones(): PheromoneGrid { return this.colonies[0].pheromones; }
  set pheromones(v: PheromoneGrid) { this.colonies[0].pheromones = v; }

  get nest(): Nest { return this.colonies[0].nest; }
  set nest(v: Nest) { this.colonies[0].nest = v; }

  get queen(): Queen { return this.colonies[0].queen; }
  set queen(v: Queen) { this.colonies[0].queen = v; }

  get chambers(): Chamber[] { return this.colonies[0].chambers; }
  set chambers(v: Chamber[]) { this.colonies[0].chambers = v; }

  get tunnels(): Tunnel[] { return this.colonies[0].tunnels; }
  set tunnels(v: Tunnel[]) { this.colonies[0].tunnels = v; }

  get ants(): Ant[] { return this.colonies[0].ants; }
  set ants(v: Ant[]) { this.colonies[0].ants = v; }

  get eggs(): Egg[] { return this.colonies[0].eggs; }
  set eggs(v: Egg[]) { this.colonies[0].eggs = v; }

  constructor(customConfig?: Partial<SimConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      pheromone: {
        ...DEFAULT_CONFIG.pheromone,
        ...(customConfig?.pheromone || {}),
      },
    };

    this.tunnelNetwork = new TunnelNetwork(this.config);
    this.colonyLifecycle = new ColonyLifecycle(this.config);
    this.combatSystem = new CombatSystem(this.config);

    const cx = this.config.width / 2;
    const surfaceY0 = Math.round(this.config.height * 0.75); // 600 for height 800
    const surfaceY1 = Math.round(this.config.height * 0.25); // 200 for height 800

    this.colonies = [
      {
        id: 0,
        surfaceY: surfaceY0,
        direction: 1,
        nest: {
          x: cx,
          y: surfaceY0 - 20,
          radius: 24,
          foodStore: 10,
          population: this.config.initialPopulation,
          spawnProgress: 0,
          tunnelDug: false,
          tunnelDugProgress: 0,
        },
        queen: {
          x: cx + 200,
          y: surfaceY0 + 140,
          radius: 18,
          queenHealth: 1.0,
          isDead: false,
          zeroHealthElapsedSeconds: 0,
        },
        chambers: [],
        tunnels: [],
        ants: [],
        eggs: [],
        foodItems: [],
        pheromones: new PheromoneGrid(this.config.pheromone),
      },
      {
        id: 1,
        surfaceY: surfaceY1,
        direction: -1,
        nest: {
          x: cx,
          y: surfaceY1 + 20,
          radius: 24,
          foodStore: 10,
          population: this.config.initialPopulation,
          spawnProgress: 0,
          tunnelDug: false,
          tunnelDugProgress: 0,
        },
        queen: {
          x: cx + 200,
          y: surfaceY1 - 140,
          radius: 18,
          queenHealth: 1.0,
          isDead: false,
          zeroHealthElapsedSeconds: 0,
        },
        chambers: [],
        tunnels: [],
        ants: [],
        eggs: [],
        foodItems: [],
        pheromones: new PheromoneGrid(this.config.pheromone),
      },
    ];

    // Initialize Underground Chambers & Tunnels
    this.initChambersAndTunnels();

    // Default Surface Food Nodes
    this.initDefaultFoodNodes();

    // Initial Ants
    this.spawnInitialAnts();
  }

  private resolveColony(c?: Colony | number): Colony {
    if (typeof c === 'number') {
      return this.colonies[c] || this.colonies[0];
    }
    return c || this.colonies[0];
  }

  private initChambersAndTunnels(): void {
    for (const colony of this.colonies) {
      this.tunnelNetwork.initChambersAndTunnels(colony);
    }
  }

  public selectFoodReturnChamber(
    queenHealth?: number,
    colonyInput?: Colony | number
  ): number {
    const colony = this.resolveColony(colonyInput);
    return this.tunnelNetwork.selectFoodReturnChamber(queenHealth, colony);
  }

  public getDigFacePosition(progressFraction: number, colonyInput?: Colony | number): WayPoint {
    const colony = this.resolveColony(colonyInput);
    return this.tunnelNetwork.getDigFacePosition(progressFraction, colony);
  }

  public getExcavatedTunnelWaypoints(progressFraction: number, colonyInput?: Colony | number): WayPoint[] {
    const colony = this.resolveColony(colonyInput);
    return this.tunnelNetwork.getExcavatedTunnelWaypoints(progressFraction, colony);
  }

  public getTunnelWaypoints(fromChamberId: number, toChamberId: number, colonyInput?: Colony | number): WayPoint[] {
    const colony = this.resolveColony(colonyInput);
    return this.tunnelNetwork.getTunnelWaypoints(fromChamberId, toChamberId, colony);
  }

  private initDefaultFoodNodes(): void {
    const cx = this.config.width / 2;

    this.foodNodes = [
      {
        id: 1,
        x: cx - 220,
        y: 300,
        quantity: 120,
        maxQuantity: 150,
        respawnRate: 0.02,
      },
      {
        id: 2,
        x: cx + 240,
        y: 360,
        quantity: 120,
        maxQuantity: 150,
        respawnRate: 0.02,
      },
      {
        id: 3,
        x: cx + 180,
        y: 260,
        quantity: 80,
        maxQuantity: 100,
        respawnRate: 0.01,
      },
    ];
  }

  private spawnInitialAnts(): void {
    this.colonyLifecycle.spawnInitialAnts(this.colonies, () => this.nextAntId++, this.tunnelNetwork);
  }

  public setAntWaypointPath(ant: Ant, fromChamberId: number, toChamberId: number, colonyInput?: Colony | number): void {
    const colony = this.resolveColony(colonyInput);
    this.tunnelNetwork.setAntWaypointPath(ant, fromChamberId, toChamberId, colony);
  }

  public spawnAnt(colonyInput?: Colony | number): Ant {
    const colony = this.resolveColony(colonyInput);
    return this.colonyLifecycle.spawnAnt(colony, () => this.nextAntId++, this.tunnelNetwork);
  }

  public damageAnt(ant: Ant, amount: number): void {
    this.colonyLifecycle.damageAnt(ant, amount);
  }

  public processDeadAnts(): void {
    this.colonyLifecycle.processDeadAnts(this.colonies);
  }

  private processFoodNodes(): void {
    for (let i = this.foodNodes.length - 1; i >= 0; i--) {
      const food = this.foodNodes[i];
      if (food.quantity <= 0) {
        this.foodNodes.splice(i, 1);

        const margin = 80;
        const newX = margin + Math.random() * (this.config.width - margin * 2);
        const newY = 240 + Math.random() * 320; // 240 to 560 inside shared 200-600 lane
        this.foodNodes.push({
          id: this.nextAntId++,
          x: newX,
          y: newY,
          quantity: 120,
          maxQuantity: 150,
          respawnRate: 0.02,
        });
      } else if (food.quantity < food.maxQuantity) {
        food.quantity = Math.min(food.maxQuantity, food.quantity + food.respawnRate);
      }
    }
  }

  public tick(): void {
    this.tickCount++;
    this.processDeadAnts();

    for (const colony of this.colonies) {
      colony.pheromones.decay();
      this.colonyLifecycle.processQueenMortality(colony, () => this.nextEggId++);
    }

    this.processFoodNodes();

    for (const colony of this.colonies) {
      this.colonyLifecycle.processEggLifecycle(colony, () => this.nextAntId++, this.tunnelNetwork);
      this.tunnelNetwork.processDigging(colony);
    }

    // Assess encounters for all ants across opposing colonies
    for (let i = 0; i < this.colonies.length; i++) {
      const ownColony = this.colonies[i];
      const enemyColony = this.colonies[(i + 1) % this.colonies.length];
      for (const ant of ownColony.ants) {
        this.combatSystem.assessEncounter(ant, ownColony, enemyColony);
      }
    }

    // Resolve combat between opposing colonies
    if (this.colonies.length >= 2) {
      this.combatSystem.resolveCombat(this.colonies[0], this.colonies[1], this.colonyLifecycle);
    }

    for (const colony of this.colonies) {
      for (const ant of colony.ants) {
        this.updateAnt(ant, colony);
      }
    }

    this.processDeadAnts();
  }

  public isPointInUndergroundFootprint(px: number, py: number, colonyInput?: Colony | number): boolean {
    const colony = this.resolveColony(colonyInput);
    return this.tunnelNetwork.isPointInUndergroundFootprint(px, py, colony);
  }

  public enforceUndergroundBoundary(ant: Ant, colonyInput?: Colony | number, enemyColonyInput?: Colony | number): void {
    const colony = this.resolveColony(colonyInput);
    const enemyColony = enemyColonyInput !== undefined ? this.resolveColony(enemyColonyInput) : this.colonies.find(c => c.id !== colony.id);
    this.tunnelNetwork.enforceUndergroundBoundary(ant, colony, enemyColony);
  }

  private updateAnt(ant: Ant, colonyInput?: Colony | number): void {
    const colony = this.resolveColony(colonyInput);
    const enemyColony = this.colonies.find(c => c.id !== colony.id);

    // Aging & Hunger processing
    this.colonyLifecycle.processAgingAndHunger(ant, colony);
    if (ant.health <= 0) {
      return;
    }

    if (!colony.nest.tunnelDug && !ant.carryingEgg && ant.currentAction !== 'infiltrate' && ant.currentAction !== 'smuggle_home') {
      this.enforceUndergroundBoundary(ant, colony, enemyColony);
      if (colony.direction === 1) {
        ant.y = Math.max(200, ant.y);
      } else {
        ant.y = Math.min(600, ant.y);
      }
      return;
    }

    // Infiltration Action Handling
    if (ant.currentAction === 'infiltrate') {
      if (!enemyColony) {
        ant.currentAction = 'idle';
        return;
      }

      if (!ant.waypointPath || ant.waypointPath.length === 0) {
        const targetX = enemyColony.nest.x;
        const targetY = enemyColony.surfaceY;
        const dx = targetX - ant.x;
        const dy = targetY - ant.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 12) {
          this.setAntWaypointPath(ant, 0, 1, enemyColony);
          ant.targetChamberId = 1;
        } else {
          ant.vx = (dx / dist) * this.config.antSpeed;
          ant.vy = (dy / dist) * this.config.antSpeed;
          ant.x += ant.vx;
          ant.y += ant.vy;
        }
      } else {
        const currentTarget = ant.waypointPath[ant.waypointIndex || 0];
        if (!currentTarget) {
          ant.waypointPath = undefined;
          return;
        }
        const dx = currentTarget.x - ant.x;
        const dy = currentTarget.y - ant.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 12) {
          if (ant.waypointIndex! < ant.waypointPath.length - 1) {
            ant.waypointIndex! += 1;
          } else {
            // Reached enemy Storage chamber (1)
            const theftAmt = this.config.theftAmount !== undefined ? this.config.theftAmount : 5;
            const available = enemyColony.nest.foodStore;
            const stolen = Math.min(theftAmt, available);
            if (stolen > 0) {
              enemyColony.nest.foodStore = Math.max(0, enemyColony.nest.foodStore - stolen);
              ant.carryingFood = true;
              const foodItem: FoodItem = {
                id: this.nextFoodItemId++,
                x: ant.x,
                y: ant.y,
                amount: stolen,
                carrierAntId: ant.id,
                ownerColonyId: colony.id,
              };
              colony.foodItems.push(foodItem);
            }
            ant.currentAction = 'smuggle_home';
            this.setAntWaypointPath(ant, 1, 0, enemyColony);
          }
        } else {
          ant.vx = (dx / dist) * this.config.antSpeed;
          ant.vy = (dy / dist) * this.config.antSpeed;
          ant.x += ant.vx;
          ant.y += ant.vy;
        }
      }

      this.enforceUndergroundBoundary(ant, colony, enemyColony);
      const boundaryColony = enemyColony;
      if (boundaryColony.direction === 1) {
        ant.y = Math.max(200, ant.y);
      } else {
        ant.y = Math.min(600, ant.y);
      }
      return;
    }

    // Smuggle Home Action Handling
    if (ant.currentAction === 'smuggle_home') {
      if (!enemyColony) {
        ant.currentAction = 'return_to_nest';
        return;
      }

      if (ant.waypointPath && ant.waypointPath.length > 0) {
        const currentTarget = ant.waypointPath[ant.waypointIndex || 0];
        if (!currentTarget) {
          ant.waypointPath = undefined;
        } else {
          const dx = currentTarget.x - ant.x;
          const dy = currentTarget.y - ant.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= 12) {
            if (ant.waypointIndex! < ant.waypointPath.length - 1) {
              ant.waypointIndex! += 1;
            } else {
              // Reached enemy entrance (chamber 0)
              ant.waypointPath = undefined;
              ant.waypointIndex = 0;
              ant.targetChamberId = 1;
              this.setAntWaypointPath(ant, 0, ant.targetChamberId, colony);
              ant.currentAction = 'return_to_nest';
            }
          } else {
            ant.vx = (dx / dist) * this.config.antSpeed;
            ant.vy = (dy / dist) * this.config.antSpeed;
            ant.x += ant.vx;
            ant.y += ant.vy;
          }
        }
      } else {
        const dx = colony.nest.x - ant.x;
        const dy = colony.surfaceY - ant.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 12) {
          ant.targetChamberId = this.selectFoodReturnChamber(colony.queen.queenHealth, colony);
          this.setAntWaypointPath(ant, 0, ant.targetChamberId, colony);
        } else {
          ant.vx = (dx / dist) * this.config.antSpeed;
          ant.vy = (dy / dist) * this.config.antSpeed;
          ant.x += ant.vx;
          ant.y += ant.vy;
        }
      }

      this.enforceUndergroundBoundary(ant, colony, enemyColony);
      if (ant.carryingFood) {
        const food = colony.foodItems.find(f => f.carrierAntId === ant.id);
        if (food) {
          food.x = ant.x;
          food.y = ant.y;
        }
      }
      return;
    }

    // Case 1: Ant is carrying an egg -> transport to Nursery Chamber via waypoints
    if (ant.carryingEgg) {
      ant.currentAction = 'transport_egg';

      if (!ant.waypointPath || ant.waypointPath.length === 0) {
        this.setAntWaypointPath(ant, 3, 2, colony);
      }

      const egg = colony.eggs.find(e => e.carrierAntId === ant.id || (e.state === 'carried' && e.carrierAntId === ant.id));
      if (egg) {
        egg.x = ant.x;
        egg.y = ant.y;
      }

      const currentTarget = ant.waypointPath ? ant.waypointPath[ant.waypointIndex || 0] : undefined;
      if (!currentTarget) {
        ant.carryingEgg = false;
        return;
      }
      const dx = currentTarget.x - ant.x;
      const dy = currentTarget.y - ant.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 12) {
        if (ant.waypointIndex! < (ant.waypointPath ? ant.waypointPath.length - 1 : 0)) {
          ant.waypointIndex! += 1;
        } else {
          ant.carryingEgg = false;
          if (egg) {
            egg.state = 'nursery';
            egg.carrierAntId = undefined;
            const nursery = colony.chambers.find(c => c.chamberType === 'nursery');
            egg.x = (nursery ? nursery.x : ant.x) + (Math.random() - 0.5) * 16;
            egg.y = (nursery ? nursery.y : ant.y) + (Math.random() - 0.5) * 16;
          }

          this.setAntWaypointPath(ant, 2, 0, colony);
        }
      } else {
        ant.vx = (dx / dist) * this.config.antSpeed;
        ant.vy = (dy / dist) * this.config.antSpeed;
      }

      ant.x += ant.vx;
      ant.y += ant.vy;
      return;
    }

    // Case 2: Ant is carrying food -> return to target chamber
    if (ant.carryingFood) {
      if (ant.currentAction !== 'smuggle_home') {
        ant.currentAction = 'return_to_nest';
      }

      const ownColony = this.colonies.find(c => c.id === ant.colonyId) ?? colony;

      if (!ant.targetChamberId) {
        ant.targetChamberId = this.selectFoodReturnChamber(ownColony.queen.queenHealth, ownColony);
      }

      if (!ant.waypointPath || ant.waypointPath.length === 0) {
        this.setAntWaypointPath(ant, 0, ant.targetChamberId, ownColony);
      }

      const currentTarget = ant.waypointPath ? ant.waypointPath[ant.waypointIndex || 0] : undefined;
      if (!currentTarget) {
        return;
      }
      const dx = currentTarget.x - ant.x;
      const dy = currentTarget.y - ant.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 12) {
        if (ant.waypointIndex! < (ant.waypointPath ? ant.waypointPath.length - 1 : 0)) {
          ant.waypointIndex! += 1;
        } else {
          if (ant.targetChamberId === 0) {
            this.setAntWaypointPath(ant, 0, 1, ownColony);
            ant.targetChamberId = 1;
          } else if (ant.targetChamberId === 3) {
            if (!ownColony.queen.isDead) {
              if (ownColony.queen.queenHealth >= 0.95 && ownColony.eggs.some(e => e.state === 'queen_chamber')) {
                this.setAntWaypointPath(ant, 3, 1, ownColony);
                ant.targetChamberId = 1;
              } else {
                ownColony.queen.queenHealth = Math.min(1.0, ownColony.queen.queenHealth + 0.25);
                ant.carryingFood = false;
                this.consumeFoodItem(ant, ownColony);

                const layChance = this.config.eggLayChance !== undefined ? this.config.eggLayChance : 0.6;
                let eggToCarry = ownColony.eggs.find(e => e.state === 'queen_chamber');
                if (Math.random() < layChance) {
                  eggToCarry = {
                    id: this.nextEggId++,
                    x: ownColony.queen.x + (Math.random() - 0.5) * 8,
                    y: ownColony.queen.y + (Math.random() - 0.5) * 8,
                    incubationSeconds: 0,
                    state: 'queen_chamber',
                    careLevel: 1.0,
                  };
                  ownColony.eggs.push(eggToCarry);
                }

                if (eggToCarry && eggToCarry.state === 'queen_chamber') {
                  ant.carryingEgg = true;
                  eggToCarry.state = 'carried';
                  eggToCarry.carrierAntId = ant.id;
                  this.setAntWaypointPath(ant, 3, 2, ownColony);
                  ant.targetChamberId = undefined;
                  ant.currentAction = 'transport_egg';
                } else {
                  this.setAntWaypointPath(ant, 3, 0, ownColony);
                  ant.targetChamberId = undefined;
                }
              }
            } else {
              ant.carryingFood = false;
              this.consumeFoodItem(ant, ownColony);
              this.setAntWaypointPath(ant, 3, 0, ownColony);
              ant.targetChamberId = undefined;
            }
          } else if (ant.targetChamberId === 2) {
            const nurseryEggs = ownColony.eggs.filter(e => e.state === 'nursery');
            if (nurseryEggs.length > 0) {
              const royalCandidate = nurseryEggs.find(e => e.isRoyalCandidate);
              if (royalCandidate) {
                royalCandidate.careLevel = Math.min(1.0, (royalCandidate.careLevel ?? 1.0) + 0.70);
              } else {
                nurseryEggs.sort((a, b) => (a.careLevel ?? 1.0) - (b.careLevel ?? 1.0));
                nurseryEggs[0].careLevel = Math.min(1.0, (nurseryEggs[0].careLevel ?? 1.0) + 0.35);
              }
            }
            ant.carryingFood = false;
            this.consumeFoodItem(ant, ownColony);

            this.setAntWaypointPath(ant, 2, 0, ownColony);
            ant.targetChamberId = undefined;
          } else {
            const carriedFood = ownColony.foodItems.find(f => f.carrierAntId === ant.id) || colony.foodItems.find(f => f.carrierAntId === ant.id);
            const amountToDeposit = carriedFood ? carriedFood.amount : 1;
            ownColony.nest.foodStore += amountToDeposit;
            ant.carryingFood = false;
            this.consumeFoodItem(ant, ownColony);

            this.setAntWaypointPath(ant, 1, 0, ownColony);
            ant.targetChamberId = undefined;
          }
        }
      } else {
        ant.vx = (dx / dist) * this.config.antSpeed;
        ant.vy = (dy / dist) * this.config.antSpeed;
      }

      colony.pheromones.deposit(ant.x, ant.y, this.config.pheromone.emitStrength);
    } else if (ant.waypointPath && ant.waypointPath.length > 0) {
      const currentTarget = ant.waypointPath[ant.waypointIndex || 0];
      const dx = currentTarget.x - ant.x;
      const dy = currentTarget.y - ant.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 12) {
        if (ant.waypointIndex! < ant.waypointPath.length - 1) {
          ant.waypointIndex! += 1;
        } else {
          if (ant.targetChamberId === 3 && !ant.carryingFood && !ant.carryingEgg) {
            const pendingEgg = colony.eggs.find(e => e.state === 'queen_chamber');
            if (pendingEgg) {
              ant.carryingEgg = true;
              pendingEgg.state = 'carried';
              pendingEgg.carrierAntId = ant.id;
              this.setAntWaypointPath(ant, 3, 2, colony);
              ant.targetChamberId = undefined;
              ant.currentAction = 'transport_egg';
              return;
            }
          }
          ant.waypointPath = undefined;
          ant.waypointIndex = 0;
          ant.targetChamberId = undefined;
        }
      } else {
        ant.vx = (dx / dist) * this.config.antSpeed;
        ant.vy = (dy / dist) * this.config.antSpeed;
      }
    } else {
      const distToQueen = Math.hypot(ant.x - colony.queen.x, ant.y - colony.queen.y);
      if (!ant.carryingFood && !ant.carryingEgg && distToQueen <= 35) {
        const pendingEgg = colony.eggs.find(e => e.state === 'queen_chamber');
        if (pendingEgg) {
          ant.carryingEgg = true;
          pendingEgg.state = 'carried';
          pendingEgg.carrierAntId = ant.id;
          this.setAntWaypointPath(ant, 3, 2, colony);
          ant.currentAction = 'transport_egg';
          return;
        }
      }

      if (!ant.carryingFood && !ant.carryingEgg && !ant.waypointPath && colony.eggs.some(e => e.state === 'queen_chamber')) {
        if (Math.random() < 0.15) {
          ant.targetChamberId = 3;
          this.setAntWaypointPath(ant, 0, 3, colony);
          return;
        }
      }

      // Step A: DIRECT SENSING CHECK
      let sensedFood: FoodNode | null = null;
      let minDistance = Infinity;

      for (const food of this.foodNodes) {
        if (food.quantity <= 0) continue;
        const dist = Math.hypot(food.x - ant.x, food.y - ant.y);
        if (dist <= this.config.directSensingRange && dist < minDistance) {
          minDistance = dist;
          sensedFood = food;
        }
      }

      if (sensedFood) {
        ant.wanderTicksRemaining = 0;
        ant.currentAction = 'forage_direct';
        const dx = sensedFood.x - ant.x;
        const dy = sensedFood.y - ant.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= this.config.foodReachRadius) {
          sensedFood.quantity = Math.max(0, sensedFood.quantity - 1);
          ant.carryingFood = true;

          const foodItem: FoodItem = {
            id: this.nextFoodItemId++,
            x: ant.x,
            y: ant.y,
            amount: 1,
            carrierAntId: ant.id,
            ownerColonyId: colony.id,
          };
          colony.foodItems.push(foodItem);

          ant.targetChamberId = this.selectFoodReturnChamber(colony.queen.queenHealth, colony);
          this.setAntWaypointPath(ant, 0, ant.targetChamberId, colony);
        } else {
          ant.vx = (dx / dist) * this.config.antSpeed;
          ant.vy = (dy / dist) * this.config.antSpeed;
        }
      } else {
        // Step B: PHEROMONE TRAIL
        const trail = colony.pheromones.findStrongestNeighbor(
          ant.x,
          ant.y,
          ant.vx,
          ant.vy
        );

        if (trail && trail.strength >= this.config.pheromone.followThreshold) {
          ant.wanderTicksRemaining = 0;
          if (Math.random() < this.config.explorationChance) {
            ant.currentAction = 'idle';

            const angleNoise = (Math.random() - 0.5) * 0.4;
            const currentAngle = Math.atan2(ant.vy, ant.vx);
            const newAngle = currentAngle + angleNoise;

            ant.vx = Math.cos(newAngle) * this.config.antSpeed;
            ant.vy = Math.sin(newAngle) * this.config.antSpeed;
          } else {
            ant.currentAction = 'follow_trail';
            const dx = trail.targetX - ant.x;
            const dy = trail.targetY - ant.y;
            const dist = Math.hypot(dx, dy) || 1;

            const targetVx = (dx / dist) * this.config.antSpeed;
            const targetVy = (dy / dist) * this.config.antSpeed;

            ant.vx = ant.vx * 0.4 + targetVx * 0.6;
            ant.vy = ant.vy * 0.4 + targetVy * 0.6;

            const speed = Math.hypot(ant.vx, ant.vy) || 1;
            ant.vx = (ant.vx / speed) * this.config.antSpeed;
            ant.vy = (ant.vy / speed) * this.config.antSpeed;
          }
        } else {
          // Step C: IDLE / WANDER
          const isAtHomeEntrance = Math.hypot(ant.x - colony.nest.x, ant.y - colony.surfaceY) <= 30;
          if (isAtHomeEntrance && !ant.carryingFood && !ant.carryingEgg && !ant.waypointPath && enemyColony && enemyColony.nest.tunnelDug && enemyColony.nest.foodStore > 0) {
            const theftChance = this.config.theftChance !== undefined ? this.config.theftChance : 0.02;
            if (Math.random() < theftChance) {
              ant.currentAction = 'infiltrate';
              ant.targetX = enemyColony.nest.x;
              ant.targetY = enemyColony.surfaceY;
              ant.waypointPath = undefined;
              ant.waypointIndex = 0;
              ant.wanderTicksRemaining = 0;
              return;
            }
          }

          ant.currentAction = 'idle';

          if (!ant.wanderTicksRemaining || ant.wanderTicksRemaining <= 0) {
            const isTaskCommitted = ['infiltrate', 'smuggle_home', 'transport_egg'].includes(ant.currentAction) || ant.targetChamberId !== undefined;
            if (isTaskCommitted) {
              this.taskCommittedWanderViolations++;
            }
            ant.wanderTicksRemaining = 45;
            const angleNoise = (Math.random() - 0.5) * 0.4;
            const currentAngle = Math.atan2(ant.vy, ant.vx);
            const newAngle = currentAngle + angleNoise;

            ant.vx = Math.cos(newAngle) * this.config.antSpeed;
            ant.vy = Math.sin(newAngle) * this.config.antSpeed;
          } else {
            ant.wanderTicksRemaining -= 1;
            const currentAngle = Math.atan2(ant.vy, ant.vx);
            const angleNoise = (Math.random() - 0.5) * 0.05;
            const newAngle = currentAngle + angleNoise;

            ant.vx = Math.cos(newAngle) * this.config.antSpeed;
            ant.vy = Math.sin(newAngle) * this.config.antSpeed;
          }
        }
      }

      // Foreign trail repulsion bias (applied when exploring or following trail, but not during direct food sensing or carrying cargo)
      if (!sensedFood && !ant.carryingFood && !ant.carryingEgg) {
        const otherColony = this.colonies.find(c => c.id !== colony.id);
        if (otherColony) {
          const foreignNeighbor = otherColony.pheromones.findStrongestNeighbor(ant.x, ant.y, 0, 0);
          const foreignSelf = otherColony.pheromones.getStrength(ant.x, ant.y);
          const threshold = this.config.pheromone.followThreshold;

          if (foreignSelf >= threshold || (foreignNeighbor && foreignNeighbor.strength >= threshold)) {
            let targetX = foreignNeighbor ? foreignNeighbor.targetX : ant.x;
            let targetY = foreignNeighbor ? foreignNeighbor.targetY : ant.y;
            if (!foreignNeighbor) {
              const coords = otherColony.pheromones.getCellCoords(ant.x, ant.y);
              targetX = (coords.col + 0.5) * otherColony.pheromones.cellSize;
              targetY = (coords.row + 0.5) * otherColony.pheromones.cellSize;
            }

            let fdx = targetX - ant.x;
            let fdy = targetY - ant.y;
            let fdist = Math.hypot(fdx, fdy);

            let repX = 0;
            let repY = 0;

            if (fdist >= 0.001) {
              repX = -fdx / fdist;
              repY = -fdy / fdist;
            } else {
              const currentSpeed = Math.hypot(ant.vx, ant.vy);
              if (currentSpeed > 0.0001) {
                const sideSign = (ant.id % 2 === 0) ? 1 : -1;
                repX = (-ant.vy / currentSpeed) * sideSign;
                repY = (ant.vx / currentSpeed) * sideSign;
              }
            }

            const repStrength = 0.70;
            ant.vx = ant.vx + repX * repStrength * this.config.antSpeed;
            ant.vy = ant.vy + repY * repStrength * this.config.antSpeed;

            const speed = Math.hypot(ant.vx, ant.vy);
            if (speed > 0.0001) {
              ant.vx = (ant.vx / speed) * this.config.antSpeed;
              ant.vy = (ant.vy / speed) * this.config.antSpeed;
            }
          }
        }
      }
    }

    ant.x += ant.vx;
    ant.y += ant.vy;

    // Underground hard boundary safety
    this.enforceUndergroundBoundary(ant, colony);

    // Absolute lane boundary
    if (colony.direction === 1) {
      ant.y = Math.max(200, ant.y);
    } else {
      ant.y = Math.min(600, ant.y);
    }

    // Keep ant inside bounds
    const margin = 10;
    if (ant.x < margin) {
      ant.x = margin;
      ant.vx = Math.abs(ant.vx);
    } else if (ant.x > this.config.width - margin) {
      ant.x = this.config.width - margin;
      ant.vx = -Math.abs(ant.vx);
    }

    // Constrain foraging surface bounds
    if (!ant.waypointPath) {
      if (colony.direction === 1) {
        if (ant.y < margin) {
          ant.y = margin;
          ant.vy = Math.abs(ant.vy);
        } else if (ant.y > colony.surfaceY - 5) {
          ant.y = colony.surfaceY - 5;
          ant.vy = -Math.abs(ant.vy);
        }
      } else {
        if (ant.y < colony.surfaceY + 5) {
          ant.y = colony.surfaceY + 5;
          ant.vy = Math.abs(ant.vy);
        } else if (ant.y > this.config.height - margin) {
          ant.y = this.config.height - margin;
          ant.vy = -Math.abs(ant.vy);
        }
      }
    } else {
      if (colony.direction === 1) {
        if (ant.y > this.config.height - margin) {
          ant.y = this.config.height - margin;
          ant.vy = -Math.abs(ant.vy);
        }
      } else {
        if (ant.y < margin) {
          ant.y = margin;
          ant.vy = Math.abs(ant.vy);
        }
      }
    }

    if (ant.carryingFood) {
      const food = colony.foodItems.find(f => f.carrierAntId === ant.id);
      if (food) {
        food.x = ant.x;
        food.y = ant.y;
      }
    }
  }

  private consumeFoodItem(ant: Ant, colony: Colony): void {
    const idx = colony.foodItems.findIndex(f => f.carrierAntId === ant.id);
    if (idx !== -1) {
      colony.foodItems.splice(idx, 1);
    }
  }
}
