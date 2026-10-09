import { MaterialType } from '../types';
import { CellularGrid, GRID_WIDTH } from './grid';

export interface AsteroidConfig {
  enabled: boolean;
  spawnRate: number; // spawns per second
  tier: number;
}

export class AsteroidManager {
  public config: AsteroidConfig = {
    enabled: true,
    spawnRate: 40,
    tier: 1,
  };

  private spawnAccumulator = 0;

  public setTier(tier: number) {
    this.config.tier = tier;
    if (tier === 1) {
      this.config.spawnRate = 40;
    } else if (tier === 2) {
      this.config.spawnRate = 60;
    } else if (tier === 3) {
      this.config.spawnRate = 80;
    } else if (tier === 4) {
      this.config.spawnRate = 100;
    }
  }

  public step(grid: CellularGrid, dtSeconds: number) {
    if (!this.config.enabled) return;

    this.spawnAccumulator += this.config.spawnRate * dtSeconds;
    const count = Math.floor(this.spawnAccumulator);
    this.spawnAccumulator -= count;

    for (let i = 0; i < count; i++) {
      this.spawnSingleDrop(grid);
    }

    // Occasional meteor cluster (rock containing liquid or dust or plasma)
    if (Math.random() < 0.015 * (dtSeconds * 60)) {
      this.spawnMeteorCluster(grid);
    }
  }

  public spawnSingleDrop(grid: CellularGrid) {
    const x = Math.floor(Math.random() * GRID_WIDTH);
    const y = Math.floor(Math.random() * 4); // Top 4 rows

    if (!grid.isInBounds(x, y) || grid.materials[grid.getIndex(x, y)] !== MaterialType.VACUUM) {
      return;
    }

    const mat = this.pickMaterialForTier();
    grid.setCell(x, y, mat);
  }

  public spawnMeteorShower(grid: CellularGrid, intensity = 40) {
    for (let i = 0; i < intensity; i++) {
      this.spawnSingleDrop(grid);
    }
    this.spawnMeteorCluster(grid);
  }

  public spawnMeteorCluster(grid: CellularGrid) {
    const cx = Math.floor(10 + Math.random() * (GRID_WIDTH - 20));
    const cy = 2;

    const coreMat = this.pickMaterialForTier();
    const radius = 2 + Math.floor(Math.random() * 2);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distSq = dx * dx + dy * dy;
        const tx = cx + dx;
        const ty = cy + dy;
        if (!grid.isInBounds(tx, ty)) continue;

        if (distSq <= (radius - 1) * (radius - 1)) {
          // Inner core
          grid.setCell(tx, ty, coreMat);
        } else if (distSq <= radius * radius) {
          // Crust: natural solid bedrock or dust
          if (Math.random() < 0.4) {
            grid.setCell(tx, ty, MaterialType.SOLID, 1);
          } else {
            grid.setCell(tx, ty, MaterialType.DUST);
          }
        }
      }
    }
  }

  private pickMaterialForTier(): MaterialType {
    const tier = this.config.tier;
    const roll = Math.random();

    if (tier === 1) {
      // DUST, GAS, LIQUID continuous, PLASMA 5%
      if (roll < 0.05) return MaterialType.PLASMA;
      if (roll < 0.45) return MaterialType.DUST;
      if (roll < 0.75) return MaterialType.LIQUID;
      return MaterialType.GAS;
    }

    if (tier === 2) {
      // PLASMA 15%, DUST 35%, LIQUID 30%, GAS 20%
      if (roll < 0.15) return MaterialType.PLASMA;
      if (roll < 0.50) return MaterialType.DUST;
      if (roll < 0.78) return MaterialType.LIQUID;
      return MaterialType.GAS;
    }

    // Tier 3 and 4: Higher plasma and occasional reactive materials
    if (roll < 0.22) return MaterialType.PLASMA;
    if (roll < 0.50) return MaterialType.DUST;
    if (roll < 0.75) return MaterialType.LIQUID;
    return MaterialType.GAS;
  }
}
