import { MaterialType, MATERIAL_REACTIONS } from '../types';

export const GRID_WIDTH = 320;
export const GRID_HEIGHT = 200;
export const TOTAL_CELLS = GRID_WIDTH * GRID_HEIGHT;
export const ASTEROID_ZONE_HEIGHT = 40; // Top 20% (0..39)

export class CellularGrid {
  // Physical material array
  public materials: Uint8Array;

  // Cell structural flags (0: normal particle, 1: natural bedrock solid, 2: player structural solid, 3: building structure)
  public structureFlags: Uint8Array;

  // Lifespan array for short-lived materials (Plasma, Reactive Vapor)
  public lifespan: Uint16Array;

  // Tracks if cell has already moved in current simulation tick
  public hasUpdated: Uint8Array;

  // Dirty flag array for renderer optimization
  public dirty: Uint8Array;

  // Per-cell visual noise/grain variation for DUST texture (0.9 to 1.1)
  public grainNoise: Float32Array;

  // Total material stats across the entire grid
  public counts: Int32Array;

  private xIndices: Int32Array;

  constructor() {
    this.materials = new Uint8Array(TOTAL_CELLS);
    this.structureFlags = new Uint8Array(TOTAL_CELLS);
    this.lifespan = new Uint16Array(TOTAL_CELLS);
    this.hasUpdated = new Uint8Array(TOTAL_CELLS);
    this.dirty = new Uint8Array(TOTAL_CELLS);
    this.grainNoise = new Float32Array(TOTAL_CELLS);
    this.counts = new Int32Array(16);

    this.xIndices = new Int32Array(GRID_WIDTH);
    for (let x = 0; x < GRID_WIDTH; x++) {
      this.xIndices[x] = x;
    }

    this.initPerCellNoise();
    this.generateInitialTerrain();
  }

  private initPerCellNoise() {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      this.grainNoise[i] = 0.9 + Math.random() * 0.2;
    }
  }

  public getIndex(x: number, y: number): number {
    return y * GRID_WIDTH + x;
  }

  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
  }

  public getMaterial(x: number, y: number): MaterialType {
    if (!this.isInBounds(x, y)) return MaterialType.SOLID;
    return this.materials[this.getIndex(x, y)];
  }

  public setCell(
    x: number,
    y: number,
    material: MaterialType,
    structFlag = 0,
    customLife = 0
  ): boolean {
    if (!this.isInBounds(x, y)) return false;
    const idx = this.getIndex(x, y);

    const oldMat = this.materials[idx];
    this.counts[oldMat] = Math.max(0, this.counts[oldMat] - 1);
    this.counts[material]++;

    this.materials[idx] = material;
    this.structureFlags[idx] = structFlag;
    this.dirty[idx] = 1;

    if (material === MaterialType.PLASMA) {
      this.lifespan[idx] = customLife > 0 ? customLife : 200;
    } else if (material === MaterialType.REACTIVE_VAPOR) {
      this.lifespan[idx] = customLife > 0 ? customLife : 260;
    } else {
      this.lifespan[idx] = 0;
    }

    return true;
  }

  public clearAll() {
    this.materials.fill(MaterialType.VACUUM);
    this.structureFlags.fill(0);
    this.lifespan.fill(0);
    this.dirty.fill(1);
    this.counts.fill(0);
    this.generateInitialTerrain();
  }

  public generateInitialTerrain() {
    // Generate initial natural bedrock formations on the bottom and some asteroid crags
    for (let x = 0; x < GRID_WIDTH; x++) {
      // Bottom floor bedrock
      this.setCell(x, GRID_HEIGHT - 1, MaterialType.SOLID, 1);
      this.setCell(x, GRID_HEIGHT - 2, MaterialType.SOLID, 1);

      // Procedural floating asteroid crags
      const cragHeight = Math.sin(x * 0.08) * 6 + Math.cos(x * 0.03) * 4;
      if (x > 30 && x < 90 && cragHeight > 2) {
        this.setCell(x, 140 + Math.floor(cragHeight), MaterialType.SOLID, 1);
      }
      if (x > 210 && x < 280 && cragHeight > 3) {
        this.setCell(x, 130 + Math.floor(cragHeight), MaterialType.SOLID, 1);
      }
    }
  }

  public step() {
    this.hasUpdated.fill(0);

    // Shuffle row X indices periodically or alternate scanning direction
    const forwardX = Math.random() > 0.5;

    // Simulation tick bottom-to-top (y = GRID_HEIGHT - 1 down to 0)
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      for (let i = 0; i < GRID_WIDTH; i++) {
        const x = forwardX ? i : GRID_WIDTH - 1 - i;
        const idx = y * GRID_WIDTH + x;

        if (this.hasUpdated[idx] === 1) continue;

        const mat = this.materials[idx];
        if (mat === MaterialType.VACUUM) continue;

        // Bedrock and structural solids or building frames don't move
        const structFlag = this.structureFlags[idx];
        if (structFlag === 1 || structFlag === 2 || structFlag === 3) {
          continue;
        }

        // Handle reactions with neighbors
        this.checkReactions(x, y, idx, mat);

        // Update physics according to material type
        switch (mat) {
          case MaterialType.DUST:
            this.updateDust(x, y, idx);
            break;
          case MaterialType.GAS:
            this.updateGas(x, y, idx);
            break;
          case MaterialType.LIQUID:
            this.updateLiquid(x, y, idx, 1); // standard liquid
            break;
          case MaterialType.PLASMA:
            this.updatePlasma(x, y, idx);
            break;
          case MaterialType.VOID_CRYSTAL:
            this.updateVoidCrystal(x, y, idx);
            break;
          case MaterialType.MINERAL_SLURRY:
            this.updateMineralSlurry(x, y, idx);
            break;
          case MaterialType.REACTIVE_VAPOR:
            this.updateReactiveVapor(x, y, idx);
            break;
          case MaterialType.CONDENSATE:
            this.updateCondensate(x, y, idx);
            break;
          case MaterialType.LUMINITE:
            this.updateLuminite(x, y, idx);
            break;
        }
      }
    }
  }

  private swapCells(idx1: number, idx2: number) {
    const mat1 = this.materials[idx1];
    const flag1 = this.structureFlags[idx1];
    const life1 = this.lifespan[idx1];

    this.materials[idx1] = this.materials[idx2];
    this.structureFlags[idx1] = this.structureFlags[idx2];
    this.lifespan[idx1] = this.lifespan[idx2];
    this.hasUpdated[idx1] = 1;
    this.dirty[idx1] = 1;

    this.materials[idx2] = mat1;
    this.structureFlags[idx2] = flag1;
    this.lifespan[idx2] = life1;
    this.hasUpdated[idx2] = 1;
    this.dirty[idx2] = 1;
  }

  private moveCell(fromIdx: number, toIdx: number) {
    const mat = this.materials[fromIdx];
    const flag = this.structureFlags[fromIdx];
    const life = this.lifespan[fromIdx];

    const targetOld = this.materials[toIdx];
    if (targetOld !== MaterialType.VACUUM) {
      this.counts[targetOld] = Math.max(0, this.counts[targetOld] - 1);
    }

    this.materials[toIdx] = mat;
    this.structureFlags[toIdx] = flag;
    this.lifespan[toIdx] = life;
    this.hasUpdated[toIdx] = 1;
    this.dirty[toIdx] = 1;

    this.materials[fromIdx] = MaterialType.VACUUM;
    this.structureFlags[fromIdx] = 0;
    this.lifespan[fromIdx] = 0;
    this.hasUpdated[fromIdx] = 1;
    this.dirty[fromIdx] = 1;
  }

  private isEmpty(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    const idx = this.getIndex(x, y);
    return this.materials[idx] === MaterialType.VACUUM && this.structureFlags[idx] === 0;
  }

  private isLiquid(mat: MaterialType): boolean {
    return (
      mat === MaterialType.LIQUID ||
      mat === MaterialType.MINERAL_SLURRY ||
      mat === MaterialType.CONDENSATE
    );
  }

  private isGas(mat: MaterialType): boolean {
    return (
      mat === MaterialType.GAS ||
      mat === MaterialType.PLASMA ||
      mat === MaterialType.REACTIVE_VAPOR
    );
  }

  // --- REACTION ENGINE ---
  private checkReactions(x: number, y: number, idx: number, mat: MaterialType) {
    const neighbors = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (const { dx, dy } of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (!this.isInBounds(nx, ny)) continue;

      const nIdx = this.getIndex(nx, ny);
      const nMat = this.materials[nIdx];
      if (nMat === MaterialType.VACUUM) continue;

      for (const reaction of MATERIAL_REACTIONS) {
        if (
          (mat === reaction.inputA && nMat === reaction.inputB) ||
          (mat === reaction.inputB && nMat === reaction.inputA)
        ) {
          if (Math.random() < reaction.probability) {
            // Apply reaction output
            this.setCell(x, y, reaction.output);
            this.setCell(nx, ny, reaction.output);
            this.hasUpdated[idx] = 1;
            this.hasUpdated[nIdx] = 1;
            return;
          }
        }
      }
    }
  }

  // --- DUST PHYSICS ---
  private updateDust(x: number, y: number, idx: number) {
    if (y >= GRID_HEIGHT - 1) return;

    // Falls downward
    const belowIdx = this.getIndex(x, y + 1);
    if (this.isEmpty(x, y + 1)) {
      this.moveCell(idx, belowIdx);
      return;
    }

    // Sinks through liquids
    const belowMat = this.materials[belowIdx];
    if (this.isLiquid(belowMat) && this.structureFlags[belowIdx] === 0) {
      if (Math.random() < 0.4) {
        this.swapCells(idx, belowIdx);
        return;
      }
    }

    // If blocked below, slides diagonally down-left or down-right
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (this.isEmpty(x + dir, y + 1)) {
      this.moveCell(idx, this.getIndex(x + dir, y + 1));
      return;
    }
    if (this.isEmpty(x - dir, y + 1)) {
      this.moveCell(idx, this.getIndex(x - dir, y + 1));
      return;
    }
  }

  // --- GAS PHYSICS ---
  private updateGas(x: number, y: number, idx: number) {
    // 10% chance per tick to slowly dissipate if surrounded by vacuum
    if (Math.random() < 0.003) {
      let vacuumCount = 0;
      if (this.isEmpty(x, y - 1)) vacuumCount++;
      if (this.isEmpty(x, y + 1)) vacuumCount++;
      if (this.isEmpty(x - 1, y)) vacuumCount++;
      if (this.isEmpty(x + 1, y)) vacuumCount++;
      if (vacuumCount >= 3) {
        this.setCell(x, y, MaterialType.VACUUM);
        return;
      }
    }

    if (y <= 0) {
      // Escape through top border
      this.setCell(x, y, MaterialType.VACUUM);
      return;
    }

    // Rises straight up
    if (this.isEmpty(x, y - 1)) {
      this.moveCell(idx, this.getIndex(x, y - 1));
      return;
    }

    // Disperses diagonally up-left / up-right
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (this.isEmpty(x + dir, y - 1)) {
      this.moveCell(idx, this.getIndex(x + dir, y - 1));
      return;
    }
    if (this.isEmpty(x - dir, y - 1)) {
      this.moveCell(idx, this.getIndex(x - dir, y - 1));
      return;
    }

    // Sideways drift
    if (Math.random() < 0.4) {
      if (this.isEmpty(x + dir, y)) {
        this.moveCell(idx, this.getIndex(x + dir, y));
        return;
      }
      if (this.isEmpty(x - dir, y)) {
        this.moveCell(idx, this.getIndex(x - dir, y));
        return;
      }
    }
  }

  // --- LIQUID PHYSICS ---
  private updateLiquid(x: number, y: number, idx: number, spreadDistance = 2) {
    if (y >= GRID_HEIGHT - 1) return;

    // Falls downward
    if (this.isEmpty(x, y + 1)) {
      this.moveCell(idx, this.getIndex(x, y + 1));
      return;
    }

    // Falls diagonally
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (this.isEmpty(x + dir, y + 1)) {
      this.moveCell(idx, this.getIndex(x + dir, y + 1));
      return;
    }
    if (this.isEmpty(x - dir, y + 1)) {
      this.moveCell(idx, this.getIndex(x - dir, y + 1));
      return;
    }

    // Spreads sideways to equalize
    for (let dist = 1; dist <= spreadDistance; dist++) {
      if (this.isEmpty(x + dir * dist, y)) {
        this.moveCell(idx, this.getIndex(x + dir * dist, y));
        return;
      }
      if (this.isEmpty(x - dir * dist, y)) {
        this.moveCell(idx, this.getIndex(x - dir * dist, y));
        return;
      }
    }
  }

  // --- PLASMA PHYSICS ---
  private updatePlasma(x: number, y: number, idx: number) {
    // Lifespan decrement
    if (this.lifespan[idx] > 0) {
      this.lifespan[idx]--;
      if (this.lifespan[idx] === 0) {
        // Turns into GAS upon expiration
        this.setCell(x, y, MaterialType.GAS);
        return;
      }
    }

    // Rises fast (up to 3 cells per tick)
    let currentY = y;
    for (let step = 0; step < 3; step++) {
      if (currentY <= 0) {
        this.setCell(x, currentY, MaterialType.VACUUM);
        return;
      }

      const targetY = currentY - 1;
      const targetIdx = this.getIndex(x, targetY);

      if (this.isEmpty(x, targetY)) {
        this.moveCell(this.getIndex(x, currentY), targetIdx);
        currentY = targetY;
      } else {
        // Sideways drift
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.isEmpty(x + dir, targetY)) {
          this.moveCell(this.getIndex(x, currentY), this.getIndex(x + dir, targetY));
          currentY = targetY;
        } else if (this.isEmpty(x - dir, targetY)) {
          this.moveCell(this.getIndex(x, currentY), this.getIndex(x - dir, targetY));
          currentY = targetY;
        }
        break;
      }
    }
  }

  // --- VOID CRYSTAL PHYSICS ---
  private updateVoidCrystal(x: number, y: number, idx: number) {
    if (y >= GRID_HEIGHT - 1) return;

    // Heavy solid, settles downward if suspended in air
    if (this.isEmpty(x, y + 1)) {
      this.moveCell(idx, this.getIndex(x, y + 1));
    }
  }

  // --- MINERAL SLURRY PHYSICS ---
  private updateMineralSlurry(x: number, y: number, idx: number) {
    if (y >= GRID_HEIGHT - 1) return;

    // Falls downward
    if (this.isEmpty(x, y + 1)) {
      this.moveCell(idx, this.getIndex(x, y + 1));
      return;
    }

    // Sinks below normal LIQUID
    const belowIdx = this.getIndex(x, y + 1);
    if (this.materials[belowIdx] === MaterialType.LIQUID && this.structureFlags[belowIdx] === 0) {
      this.swapCells(idx, belowIdx);
      return;
    }

    // Sluggish diagonal slide
    if (Math.random() < 0.6) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (this.isEmpty(x + dir, y + 1)) {
        this.moveCell(idx, this.getIndex(x + dir, y + 1));
        return;
      }
      if (this.isEmpty(x - dir, y + 1)) {
        this.moveCell(idx, this.getIndex(x - dir, y + 1));
        return;
      }

      // Slow horizontal spread
      if (this.isEmpty(x + dir, y)) {
        this.moveCell(idx, this.getIndex(x + dir, y));
        return;
      }
      if (this.isEmpty(x - dir, y)) {
        this.moveCell(idx, this.getIndex(x - dir, y));
        return;
      }
    }
  }

  // --- REACTIVE VAPOR PHYSICS ---
  private updateReactiveVapor(x: number, y: number, idx: number) {
    if (this.lifespan[idx] > 0) {
      this.lifespan[idx]--;
      if (this.lifespan[idx] === 0) {
        this.setCell(x, y, MaterialType.GAS);
        return;
      }
    }

    // Rises 2x faster than normal GAS
    for (let step = 0; step < 2; step++) {
      if (y <= 0) {
        this.setCell(x, y, MaterialType.VACUUM);
        return;
      }

      if (this.isEmpty(x, y - 1)) {
        this.moveCell(idx, this.getIndex(x, y - 1));
        idx = this.getIndex(x, y - 1);
        y = y - 1;
      } else {
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (this.isEmpty(x + dir, y - 1)) {
          this.moveCell(idx, this.getIndex(x + dir, y - 1));
          idx = this.getIndex(x + dir, y - 1);
          y = y - 1;
        } else if (this.isEmpty(x - dir, y - 1)) {
          this.moveCell(idx, this.getIndex(x - dir, y - 1));
          idx = this.getIndex(x - dir, y - 1);
          y = y - 1;
        } else {
          break;
        }
      }
    }
  }

  // --- CONDENSATE PHYSICS ---
  private updateCondensate(x: number, y: number, idx: number) {
    if (y >= GRID_HEIGHT - 1) return;

    if (this.isEmpty(x, y + 1)) {
      this.moveCell(idx, this.getIndex(x, y + 1));
      return;
    }

    // Dense liquid: sinks below normal liquid
    const belowIdx = this.getIndex(x, y + 1);
    if (this.materials[belowIdx] === MaterialType.LIQUID && this.structureFlags[belowIdx] === 0) {
      this.swapCells(idx, belowIdx);
      return;
    }

    // Slower horizontal spread than normal liquid
    if (Math.random() < 0.7) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (this.isEmpty(x + dir, y + 1)) {
        this.moveCell(idx, this.getIndex(x + dir, y + 1));
        return;
      }
      if (this.isEmpty(x - dir, y + 1)) {
        this.moveCell(idx, this.getIndex(x - dir, y + 1));
        return;
      }

      if (this.isEmpty(x + dir, y)) {
        this.moveCell(idx, this.getIndex(x + dir, y));
        return;
      }
      if (this.isEmpty(x - dir, y)) {
        this.moveCell(idx, this.getIndex(x - dir, y));
        return;
      }
    }
  }

  // --- LUMINITE PHYSICS ---
  private updateLuminite(x: number, y: number, idx: number) {
    if (y >= GRID_HEIGHT - 1) return;

    // Heavy radiant solid
    if (this.isEmpty(x, y + 1)) {
      this.moveCell(idx, this.getIndex(x, y + 1));
    }
  }
}
