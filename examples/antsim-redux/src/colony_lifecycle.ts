import { Ant, Colony, Egg, SimConfig } from './types';
import { TunnelNetwork } from './tunnel_network';
import { HUNGER_DECAY_PER_TICK, ZERO_ENERGY_DAMAGE_PER_TICK, ZERO_ENERGY_DAMAGE_TICKS } from './simulation';

export class ColonyLifecycle {
  constructor(public config: SimConfig) {}

  public spawnAnt(colony: Colony, getNextAntId: () => number, tunnelNetwork: TunnelNetwork): Ant {
    const nursery = colony.chambers.find(c => c.chamberType === 'nursery');
    const startX = nursery ? nursery.x : colony.nest.x;
    const startY = nursery ? nursery.y : colony.nest.y;

    const angle = Math.random() * Math.PI * 2;
    const speed = this.config.antSpeed;
    const ant: Ant = {
      id: getNextAntId(),
      x: startX + (Math.random() - 0.5) * 8,
      y: startY + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      energy: 1.0,
      health: 1.0,
      age: 0,
      carryingFood: false,
      currentAction: 'idle',
    };

    if (nursery) {
      tunnelNetwork.setAntWaypointPath(ant, 2, 0, colony);
    }

    colony.ants.push(ant);
    return ant;
  }

  public spawnInitialAnts(colonies: Colony[], getNextAntId: () => number, tunnelNetwork: TunnelNetwork): void {
    for (const colony of colonies) {
      for (let i = 0; i < this.config.initialPopulation; i++) {
        this.spawnAnt(colony, getNextAntId, tunnelNetwork);
      }
    }
  }

  public damageAnt(ant: Ant, amount: number): void {
    ant.health = Math.max(0, ant.health - amount);
  }

  public processDeadAnts(colonies: Colony[]): void {
    for (const colony of colonies) {
      for (let i = colony.ants.length - 1; i >= 0; i--) {
        const ant = colony.ants[i];
        if (ant.health <= 0) {
          if (ant.carryingFood) {
            const foodIdx = colony.foodItems.findIndex(f => f.carrierAntId === ant.id);
            if (foodIdx !== -1) {
              colony.foodItems.splice(foodIdx, 1);
            }
          }
          if (ant.carryingEgg) {
            const egg = colony.eggs.find(e => e.carrierAntId === ant.id);
            if (egg) {
              if (ant.lastDamageSource === 'combat') {
                const eggIndex = colony.eggs.indexOf(egg);
                if (eggIndex !== -1) {
                  colony.eggs.splice(eggIndex, 1);
                }
              } else {
                egg.state = 'nursery';
                egg.x = ant.x;
                egg.y = ant.y;
                egg.carrierAntId = undefined;
              }
            }
          }
          colony.ants.splice(i, 1);
          colony.nest.population = Math.max(0, colony.nest.population - 1);
        }
      }
    }
  }

  public processQueenMortality(colony: Colony, getNextEggId: () => number): void {
    if (!colony.queen.isDead) {
      colony.queen.queenHealth = Math.max(0, colony.queen.queenHealth - 0.0001);
      if (colony.queen.queenHealth === 0) {
        colony.queen.zeroHealthElapsedSeconds = (colony.queen.zeroHealthElapsedSeconds || 0) + 0.016;
        if (colony.queen.zeroHealthElapsedSeconds >= 10.0) {
          colony.queen.isDead = true;
          const pendingNurseryEggs = colony.eggs.filter(e => e.state === 'nursery');
          if (pendingNurseryEggs.length > 0) {
            pendingNurseryEggs.sort((a, b) => (b.careLevel ?? 1.0) - (a.careLevel ?? 1.0));
            const promoted = pendingNurseryEggs[0];
            promoted.isRoyalCandidate = true;
            promoted.incubationSeconds = 0;
            promoted.careLevel = Math.max(promoted.careLevel ?? 1.0, 0.5);
          } else {
            const queenChamber = colony.chambers.find(c => c.chamberType === 'queen');
            const emergencyEgg: Egg = {
              id: getNextEggId(),
              x: queenChamber ? queenChamber.x : colony.queen.x,
              y: queenChamber ? queenChamber.y : colony.queen.y,
              incubationSeconds: 0,
              state: 'nursery',
              careLevel: 0.5,
              isRoyalCandidate: true,
            };
            colony.eggs.push(emergencyEgg);
          }
        }
      } else {
        colony.queen.zeroHealthElapsedSeconds = 0;
      }
    }
  }

  public processEggLifecycle(colony: Colony, getNextAntId: () => number, tunnelNetwork: TunnelNetwork): void {
    const incubationLimit = this.config.eggIncubationSeconds || 12.0;
    for (let i = colony.eggs.length - 1; i >= 0; i--) {
      const egg = colony.eggs[i];
      if (egg.state === 'nursery') {
        egg.careLevel = Math.max(0, (egg.careLevel ?? 1.0) - 0.002);

        const speedMultiplier = 0.25 + 0.75 * Math.min(1.0, Math.max(0, egg.careLevel));
        egg.incubationSeconds += 0.016 * speedMultiplier;

        if (egg.incubationSeconds >= incubationLimit) {
          const isCandidate = egg.isRoyalCandidate;
          const candidateCare = egg.careLevel;
          colony.eggs.splice(i, 1);

          if (isCandidate) {
            if (candidateCare >= 0.5) {
              colony.queen.isDead = false;
              colony.queen.queenHealth = 1.0;
              colony.queen.zeroHealthElapsedSeconds = 0;
              colony.nest.isQueenless = false;
              const queenChamber = colony.chambers.find(c => c.chamberType === 'queen');
              if (queenChamber) {
                colony.queen.x = queenChamber.x;
                colony.queen.y = queenChamber.y;
              }
            } else {
              colony.nest.isQueenless = true;
              this.spawnAnt(colony, getNextAntId, tunnelNetwork);
              colony.nest.population += 1;
            }
          } else {
            this.spawnAnt(colony, getNextAntId, tunnelNetwork);
            colony.nest.population += 1;
          }
        }
      }
    }
  }

  public processAgingAndHunger(ant: Ant, colony: Colony): void {
    // 1. Age increment & Max Age check
    ant.age = (ant.age || 0) + 1;
    if (ant.age >= (this.config.workerMaxAge ?? 20000)) {
      ant.lastDamageSource = 'other';
      ant.health = 0;
      return;
    }

    // 2. Hunger decay
    ant.energy = Math.max(0, (ant.energy ?? 1.0) - HUNGER_DECAY_PER_TICK);

    // 3. Storage chamber energy refueling
    if (colony.nest.tunnelDug) {
      const storageChamber = colony.chambers.find(c => c.chamberType === 'storage');
      if (storageChamber) {
        const distToStorage = Math.hypot(ant.x - storageChamber.x, ant.y - storageChamber.y);
        if (distToStorage <= (storageChamber.width / 2 + 15) || ant.targetChamberId === 1) {
          if (ant.energy < 1.0 && colony.nest.foodStore > 0) {
            const needed = 1.0 - ant.energy;
            const restored = Math.min(needed, colony.nest.foodStore);
            ant.energy += restored;
            colony.nest.foodStore = Math.max(0, colony.nest.foodStore - restored);
          }
        }
      }
    }

    // 4. Sustained zero energy damage
    if (ant.energy <= 0) {
      ant.zeroEnergyTicks = (ant.zeroEnergyTicks || 0) + 1;
      if (ant.zeroEnergyTicks > ZERO_ENERGY_DAMAGE_TICKS) {
        ant.lastDamageSource = 'other';
        this.damageAnt(ant, ZERO_ENERGY_DAMAGE_PER_TICK);
      }
    } else {
      ant.zeroEnergyTicks = 0;
    }
  }
}
