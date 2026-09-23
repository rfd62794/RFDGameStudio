import { PheromoneGridConfig } from './types';

export class PheromoneGrid {
  public cols: number;
  public rows: number;
  public cellSize: number;
  public grid: Float32Array; // 1D array representing 2D grid strength
  public config: PheromoneGridConfig;

  constructor(config: PheromoneGridConfig) {
    this.config = config;
    this.cellSize = config.cellSize;
    this.cols = Math.ceil(config.width / config.cellSize);
    this.rows = Math.ceil(config.height / config.cellSize);
    this.grid = new Float32Array(this.cols * this.rows);
  }

  public getIndex(col: number, row: number): number {
    return row * this.cols + col;
  }

  public getCellCoords(x: number, y: number): { col: number; row: number } {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return {
      col: Math.max(0, Math.min(this.cols - 1, col)),
      row: Math.max(0, Math.min(this.rows - 1, row)),
    };
  }

  public deposit(x: number, y: number, amount: number = this.config.emitStrength): void {
    const { col, row } = this.getCellCoords(x, y);
    const idx = this.getIndex(col, row);
    // Add pheromone with a strict upper cap to prevent runaway stacking
    const current = this.grid[idx];
    this.grid[idx] = Math.min(this.config.maxCellStrength, current + amount);
  }

  public decay(): void {
    const decayFactor = 1.0 - this.config.decayRate;
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] > 0.0001) {
        this.grid[i] *= decayFactor;
        if (this.grid[i] < 0.0001) {
          this.grid[i] = 0;
        }
      } else {
        this.grid[i] = 0;
      }
    }
  }

  public getStrength(x: number, y: number): number {
    const { col, row } = this.getCellCoords(x, y);
    return this.grid[this.getIndex(col, row)];
  }

  /**
   * Find the neighbor cell with highest weighted pheromone concentration above threshold.
   * Widened to 5x5 search grid with velocity directional alignment weighting.
   * Returns a target position (x, y) or null if none found above threshold.
   */
  public findStrongestNeighbor(
    x: number,
    y: number,
    currentVx: number,
    currentVy: number
  ): { targetX: number; targetY: number; strength: number } | null {
    const { col, row } = this.getCellCoords(x, y);
    const speed = Math.hypot(currentVx, currentVy);
    const hasVelocity = speed > 0.001;
    const headingX = hasVelocity ? currentVx / speed : 0;
    const headingY = hasVelocity ? currentVy / speed : 0;

    let bestScore = -1;
    let bestRawStrength = 0;
    let bestCol = -1;
    let bestRow = -1;

    // Search 5x5 neighborhood (radius 2 cells)
    for (let dRow = -2; dRow <= 2; dRow++) {
      for (let dCol = -2; dCol <= 2; dCol++) {
        if (dRow === 0 && dCol === 0) continue;
        const nc = col + dCol;
        const nr = row + dRow;

        if (nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows) {
          const rawVal = this.grid[this.getIndex(nc, nr)];

          // Must meet minimum threshold first
          if (rawVal >= this.config.followThreshold) {
            let score = rawVal;

            if (hasVelocity) {
              const targetX = (nc + 0.5) * this.cellSize;
              const targetY = (nr + 0.5) * this.cellSize;
              const dx = targetX - x;
              const dy = targetY - y;
              const dist = Math.hypot(dx, dy);

              if (dist > 0.0001) {
                const dirX = dx / dist;
                const dirY = dy / dist;
                const cosAngle = dirX * headingX + dirY * headingY;
                // Alignment factor ranges from 0.3 (directly behind) to 1.0 (straight ahead)
                const alignmentFactor = 0.3 + 0.7 * ((cosAngle + 1.0) / 2.0);
                score = rawVal * alignmentFactor;
              }
            }

            if (score > bestScore) {
              bestScore = score;
              bestRawStrength = rawVal;
              bestCol = nc;
              bestRow = nr;
            }
          }
        }
      }
    }

    if (bestCol !== -1 && bestRow !== -1) {
      // Center of candidate cell
      const targetX = (bestCol + 0.5) * this.cellSize;
      const targetY = (bestRow + 0.5) * this.cellSize;
      return { targetX, targetY, strength: bestRawStrength };
    }

    return null;
  }

  public clear(): void {
    this.grid.fill(0);
  }
}
