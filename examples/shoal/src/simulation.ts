/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cell, Fish, Shark, FleshChunk, AlgaeHub, TerrainType, Occupant } from './types';

// Constants for simulation
export const GRID_COLS = 50;
export const GRID_ROWS = 35;
export const FISH_BREED_AGE = 5;
export const SHARK_BREED_AGE = 15;
export const SHARK_STARVE_LIMIT = 8;
export const DECAY_TICKS = 10;
export const REGROW_COOLDOWN = 4; // Ticks before a hub tries to regrow

// Beautiful lineage colors for Light Sand background
export const FISH_LINEAGES = [
  { id: 'f-coral', color: '#f97316', name: 'Coral Amber' },     // Orange
  { id: 'f-teal', color: '#0d9488', name: 'Deep Teal' },       // Teal
  { id: 'f-orchid', color: '#a855f7', name: 'Orchid Purple' }, // Violet
  { id: 'f-rose', color: '#ec4899', name: 'Rose Petal' },      // Pink
  { id: 'f-azure', color: '#2563eb', name: 'Royal Azure' },    // Blue
];

export const SHARK_LINEAGES = [
  { id: 's-obsidian', color: '#1e293b', name: 'Slate Obsidian' }, // Dark charcoal
  { id: 's-crimson', color: '#dc2626', name: 'Deep Crimson' },    // Red
  { id: 's-emerald', color: '#059669', name: 'Abyssal Emerald' }, // Dark green
  { id: 's-indigo', color: '#4f46e5', name: 'Deep Indigo' },     // Indigo
];

// Helper to wrap coordinate toroidally
export function wrap(val: number, max: number): number {
  return (val % max + max) % max;
}

// Generates an empty grid
export function createEmptyGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let x = 0; x < GRID_COLS; x++) {
    const col: Cell[] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      col.push({
        x,
        y,
        terrain: 'water',
        occupant: null,
      });
    }
    grid.push(col);
  }
  return grid;
}

// Generate all cells belonging to a hub
export function getHubCells(cx: number, cy: number) {
  const cells: { x: number; y: number; dist: number; dir: number }[] = [];
  // Center (dist 0)
  cells.push({ x: cx, y: cy, dist: 0, dir: -1 });

  // Cardinal offsets
  const dirs = [
    { dx: 0, dy: -1 }, // Up (0)
    { dx: 0, dy: 1 },  // Down (1)
    { dx: -1, dy: 0 }, // Left (2)
    { dx: 1, dy: 0 },  // Right (3)
  ];

  for (let d = 0; d < 4; d++) {
    const dir = dirs[d];
    for (let dist = 1; dist <= 2; dist++) {
      cells.push({
        x: wrap(cx + dir.dx * dist, GRID_COLS),
        y: wrap(cy + dir.dy * dist, GRID_ROWS),
        dist,
        dir: d,
      });
    }
  }
  return cells;
}

// BFS search in toroidal grid to find shortest path to nearest Flesh Chunk
export function findPathToNearestChunk(
  startX: number,
  startY: number,
  grid: Cell[][],
  maxSearchRadius: number = 8
): { x: number; y: number } | null {
  interface QueueNode {
    x: number;
    y: number;
    firstStepX: number;
    firstStepY: number;
    dist: number;
  }

  const queue: QueueNode[] = [];
  const visited = new Set<string>();

  const directions = [
    { dx: 0, dy: -1 }, // Up
    { dx: 0, dy: 1 },  // Down
    { dx: -1, dy: 0 }, // Left
    { dx: 1, dy: 0 },  // Right
  ];

  visited.add(`${startX},${startY}`);

  // Push immediate neighbors
  for (const dir of directions) {
    const nx = wrap(startX + dir.dx, GRID_COLS);
    const ny = wrap(startY + dir.dy, GRID_ROWS);
    const neighborCell = grid[nx][ny];

    if (neighborCell.occupant === null) {
      queue.push({
        x: nx,
        y: ny,
        firstStepX: nx,
        firstStepY: ny,
        dist: 1,
      });
      visited.add(`${nx},${ny}`);
    } else if (neighborCell.occupant.type === 'flesh_chunk') {
      // Flesh chunk is adjacent! Move straight there
      return { x: nx, y: ny };
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;

    if (curr.dist > maxSearchRadius) continue;

    for (const dir of directions) {
      const nx = wrap(curr.x + dir.dx, GRID_COLS);
      const ny = wrap(curr.y + dir.dy, GRID_ROWS);
      const key = `${nx},${ny}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const cell = grid[nx][ny];
      if (cell.occupant?.type === 'flesh_chunk') {
        // Path found!
        return { x: curr.firstStepX, y: curr.firstStepY };
      }

      if (cell.occupant === null) {
        queue.push({
          x: nx,
          y: ny,
          firstStepX: curr.firstStepX,
          firstStepY: curr.firstStepY,
          dist: curr.dist + 1,
        });
      }
    }
  }

  return null;
}

// Disperse 3 Flesh Chunks upon death
export function burstFleshChunks(x: number, y: number, grid: Cell[][]) {
  const neighbors: { x: number; y: number }[] = [];
  // Look at 8-neighborhood
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = wrap(x + dx, GRID_COLS);
      const ny = wrap(y + dy, GRID_ROWS);
      if (grid[nx][ny].occupant === null) {
        neighbors.push({ x: nx, y: ny });
      }
    }
  }

  // Shuffle neighbors
  const shuffled = [...neighbors].sort(() => Math.random() - 0.5);
  const places = shuffled.slice(0, 3);

  places.forEach((p) => {
    grid[p.x][p.y].occupant = {
      id: `chunk-${Math.random().toString(36).substr(2, 9)}`,
      type: 'flesh_chunk',
      ticksRemaining: DECAY_TICKS,
      maxTicks: DECAY_TICKS,
    };
  });
}

// Generate starting sandbox world
export function generateBalancedWorld(): { grid: Cell[][]; algaeHubs: AlgaeHub[] } {
  const grid = createEmptyGrid();
  const algaeHubs: AlgaeHub[] = [];

  // 1. Place Algae Hubs (12 hubs)
  let attempts = 0;
  while (algaeHubs.length < 12 && attempts < 100) {
    attempts++;
    const cx = Math.floor(Math.random() * GRID_COLS);
    const cy = Math.floor(Math.random() * GRID_ROWS);

    // Ensure it's not too close to other centers
    const tooClose = algaeHubs.some((hub) => {
      const dx = Math.abs(hub.cx - cx);
      const dy = Math.abs(hub.cy - cy);
      return Math.min(dx, GRID_COLS - dx) + Math.min(dy, GRID_ROWS - dy) < 6;
    });

    if (!tooClose) {
      const hubId = `hub-${Math.random().toString(36).substr(2, 9)}`;
      algaeHubs.push({
        id: hubId,
        cx,
        cy,
        growthCooldown: 0,
      });

      // Apply initial terrain
      const cells = getHubCells(cx, cy);
      cells.forEach((c) => {
        grid[c.x][c.y].terrain = 'kelp';
      });
    }
  }

  // Helper to find random empty cell
  const getEmptyCell = (): { x: number; y: number } | null => {
    let tries = 0;
    while (tries < 1000) {
      const x = Math.floor(Math.random() * GRID_COLS);
      const y = Math.floor(Math.random() * GRID_ROWS);
      if (grid[x][y].occupant === null) {
        return { x, y };
      }
      tries++;
    }
    return null;
  };

  // 2. Place Fish (120 initial fish)
  for (let i = 0; i < 120; i++) {
    const cell = getEmptyCell();
    if (cell) {
      // Distribute among lineages or default
      const linIndex = Math.floor(Math.random() * (FISH_LINEAGES.length + 2));
      const hasLineage = linIndex < FISH_LINEAGES.length;
      const lineageId = hasLineage ? FISH_LINEAGES[linIndex].id : 'default-fish';
      const lineageColor = hasLineage ? FISH_LINEAGES[linIndex].color : '#64748b'; // Soft slate default

      grid[cell.x][cell.y].occupant = {
        id: `fish-${Math.random().toString(36).substr(2, 9)}`,
        type: 'fish',
        age: Math.floor(Math.random() * 5), // Random age 0-4
        fed: Math.random() > 0.5,
        lineageId,
        lineageColor,
      };
    }
  }

  // 3. Place Sharks (25 initial sharks)
  for (let i = 0; i < 25; i++) {
    const cell = getEmptyCell();
    if (cell) {
      const linIndex = Math.floor(Math.random() * (SHARK_LINEAGES.length + 2));
      const hasLineage = linIndex < SHARK_LINEAGES.length;
      const lineageId = hasLineage ? SHARK_LINEAGES[linIndex].id : 'default-shark';
      const lineageColor = hasLineage ? SHARK_LINEAGES[linIndex].color : '#334155'; // Dark slate default

      grid[cell.x][cell.y].occupant = {
        id: `shark-${Math.random().toString(36).substr(2, 9)}`,
        type: 'shark',
        age: Math.floor(Math.random() * 15), // Random age 0-14
        fed: Math.random() > 0.3,
        ticksSinceLastMeal: Math.floor(Math.random() * 4), // 0-3 ticks since last eat
        lineageId,
        lineageColor,
      };
    }
  }

  return { grid, algaeHubs };
}

// Master tick resolution function
export function resolveTick(
  currentGrid: Cell[][],
  currentHubs: AlgaeHub[]
): { grid: Cell[][]; algaeHubs: AlgaeHub[] } {
  // Create deep copy of the grid
  const nextGrid = createEmptyGrid();
  // Copy terrain first
  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      nextGrid[x][y].terrain = currentGrid[x][y].terrain;
    }
  }

  // Keep track of which original occupants have already acted (processed)
  const processedIds = new Set<string>();

  // Helper to get cardinal neighbors of a cell
  const getCardinalNeighbors = (x: number, y: number) => {
    return [
      { x: wrap(x, GRID_COLS), y: wrap(y - 1, GRID_ROWS), dir: 'up' },
      { x: wrap(x, GRID_COLS), y: wrap(y + 1, GRID_ROWS), dir: 'down' },
      { x: wrap(x - 1, GRID_COLS), y: wrap(y, GRID_ROWS), dir: 'left' },
      { x: wrap(x + 1, GRID_COLS), y: wrap(y, GRID_ROWS), dir: 'right' },
    ];
  };

  // 1. PHASE 1: Decay Flesh Chunks
  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      const occupant = currentGrid[x][y].occupant;
      if (occupant?.type === 'flesh_chunk') {
        const nextTicks = occupant.ticksRemaining - 1;
        if (nextTicks > 0) {
          nextGrid[x][y].occupant = {
            ...occupant,
            ticksRemaining: nextTicks,
          };
        } else {
          // Chunk decays and disappears
          nextGrid[x][y].occupant = null;
        }
        processedIds.add(occupant.id);
      }
    }
  }

  // 2. PHASE 2: Fish (Prey) Turn
  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      const occ = currentGrid[x][y].occupant;
      if (occ?.type === 'fish' && !processedIds.has(occ.id)) {
        processedIds.add(occ.id);

        let fish = { ...occ };
        fish.age += 1;

        // Check for adjacent live Kelp
        const neighbors = getCardinalNeighbors(x, y);
        const kelpNeighbors = neighbors.filter((n) => nextGrid[n.x][n.y].terrain === 'kelp');

        let hasGrazed = false;
        let finalX = x;
        let finalY = y;

        if (kelpNeighbors.length > 0) {
          // Pick a random kelp neighbor to graze
          const targetKelp = kelpNeighbors[Math.floor(Math.random() * kelpNeighbors.length)];
          
          // Graze it! Turn kelp terrain to water
          nextGrid[targetKelp.x][targetKelp.y].terrain = 'water';
          fish.fed = true;
          hasGrazed = true;

          // Stay in place when grazing
          finalX = x;
          finalY = y;
        } else {
          // Move towards open adjacent water (unoccupied cell in next grid)
          const emptyNeighbors = neighbors.filter(
            (n) => nextGrid[n.x][n.y].occupant === null && currentGrid[n.x][n.y].occupant === null
          );

          if (emptyNeighbors.length > 0) {
            const targetEmpty = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
            finalX = targetEmpty.x;
            finalY = targetEmpty.y;
          } else {
            // Nowhere to move, stay in place
            finalX = x;
            finalY = y;
          }
        }

        // Place fish in its final cell (unless overridden, e.g., if we breed)
        nextGrid[finalX][finalY].occupant = fish;

        // Check if fish can breed
        if (fish.age >= FISH_BREED_AGE && fish.fed) {
          // Breeding requires adjacent live kelp (on the next grid)
          const currentNeighbors = getCardinalNeighbors(finalX, finalY);
          const hasKelpAdjacent = currentNeighbors.some((n) => nextGrid[n.x][n.y].terrain === 'kelp');

          if (hasKelpAdjacent) {
            // Find an unoccupied adjacent cell to place baby fish
            const babyBirthplaces = currentNeighbors.filter(
              (n) => nextGrid[n.x][n.y].occupant === null && currentGrid[n.x][n.y].occupant === null
            );

            if (babyBirthplaces.length > 0) {
              const babyCell = babyBirthplaces[Math.floor(Math.random() * babyBirthplaces.length)];
              
              // Spawn baby fish
              nextGrid[babyCell.x][babyCell.y].occupant = {
                id: `fish-${Math.random().toString(36).substr(2, 9)}`,
                type: 'fish',
                age: 0,
                fed: false,
                lineageId: fish.lineageId,
                lineageColor: fish.lineageColor,
              };

              // Parent resets age and food
              fish.age = 0;
              fish.fed = false;
              nextGrid[finalX][finalY].occupant = fish; // Re-save updated parent
            }
          }
        }
      }
    }
  }

  // 3. PHASE 3: Shark (Predator) Turn
  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      const occ = currentGrid[x][y].occupant;
      if (occ?.type === 'shark' && !processedIds.has(occ.id)) {
        processedIds.add(occ.id);

        let shark = { ...occ };
        shark.age += 1;
        shark.ticksSinceLastMeal += 1;

        // Check if shark starves
        if (shark.ticksSinceLastMeal >= SHARK_STARVE_LIMIT) {
          // Shark dies of starvation! Spawns 3 Flesh Chunks in surrounding empty cells
          burstFleshChunks(x, y, nextGrid);
          continue; // Shark is gone, do not put in next grid
        }

        const neighbors = getCardinalNeighbors(x, y);

        // A. Hunt adjacent fish (prey) first
        // Check fish in the next grid so we eat fish that moved here, or check current grid?
        // Checking next grid is excellent because it represents active locations of fish this tick
        const adjacentFish = neighbors.filter((n) => nextGrid[n.x][n.y].occupant?.type === 'fish');

        let finalX = x;
        let finalY = y;
        let hasEaten = false;

        if (adjacentFish.length > 0) {
          // Eat random adjacent fish
          const targetFishCell = adjacentFish[Math.floor(Math.random() * adjacentFish.length)];
          const eatenFish = nextGrid[targetFishCell.x][targetFishCell.y].occupant as Fish;

          // Eat and move into its cell
          nextGrid[targetFishCell.x][targetFishCell.y].occupant = null;
          finalX = targetFishCell.x;
          finalY = targetFishCell.y;
          shark.ticksSinceLastMeal = 0;
          shark.fed = true;
          hasEaten = true;
        } else {
          // B. If no adjacent fish, hunt nearby Flesh Chunk
          const nextStep = findPathToNearestChunk(x, y, nextGrid);
          if (nextStep) {
            // Move to the step
            finalX = nextStep.x;
            finalY = nextStep.y;

            // If the cell contains a Flesh Chunk, consume it!
            if (nextGrid[finalX][finalY].occupant?.type === 'flesh_chunk') {
              nextGrid[finalX][finalY].occupant = null;
              shark.ticksSinceLastMeal = 0;
              shark.fed = true;
              hasEaten = true;
            }
          } else {
            // C. Move randomly to adjacent unoccupied water
            const emptyNeighbors = neighbors.filter(
              (n) => nextGrid[n.x][n.y].occupant === null && currentGrid[n.x][n.y].occupant === null
            );

            if (emptyNeighbors.length > 0) {
              const targetEmpty = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
              finalX = targetEmpty.x;
              finalY = targetEmpty.y;
            } else {
              // Nowhere to move, stay
              finalX = x;
              finalY = y;
            }
          }
        }

        // Place shark in final position
        nextGrid[finalX][finalY].occupant = shark;

        // Check if shark breeds
        if (shark.age >= SHARK_BREED_AGE && shark.fed) {
          const currentNeighbors = getCardinalNeighbors(finalX, finalY);
          const babyBirthplaces = currentNeighbors.filter(
            (n) => nextGrid[n.x][n.y].occupant === null && currentGrid[n.x][n.y].occupant === null
          );

          if (babyBirthplaces.length > 0) {
            const babyCell = babyBirthplaces[Math.floor(Math.random() * babyBirthplaces.length)];
            
            // Spawn baby shark
            nextGrid[babyCell.x][babyCell.y].occupant = {
              id: `shark-${Math.random().toString(36).substr(2, 9)}`,
              type: 'shark',
              age: 0,
              fed: false,
              ticksSinceLastMeal: 0,
              lineageId: shark.lineageId,
              lineageColor: shark.lineageColor,
            };

            // Parent resets age and food
            shark.age = 0;
            shark.fed = false;
            nextGrid[finalX][finalY].occupant = shark; // Save updated parent
          }
        }
      }
    }
  }

  // 4. PHASE 4: Algae Hubs Regrow
  const nextHubs: AlgaeHub[] = [];

  for (const hub of currentHubs) {
    let updatedHub = { ...hub };
    updatedHub.growthCooldown += 1;

    // Get all cells of this hub
    const hubCells = getHubCells(hub.cx, hub.cy);
    const centerCell = nextGrid[hub.cx][hub.cy];

    // Check if the hub is completely extinct (all cells water)
    const allWater = hubCells.every((hc) => nextGrid[hc.x][hc.y].terrain === 'water');

    if (allWater) {
      // Hub is dead! Do not copy to nextHubs
      continue;
    }

    nextHubs.push(updatedHub);

    // Try regrowth if cooldown met
    if (updatedHub.growthCooldown >= REGROW_COOLDOWN) {
      updatedHub.growthCooldown = 0;

      // Case 1: Center is grazed (water). Regrow center if at least one spoke cell is alive.
      if (centerCell.terrain === 'water') {
        const spokesAlive = hubCells.filter((hc) => hc.dist > 0 && nextGrid[hc.x][hc.y].terrain === 'kelp');
        if (spokesAlive.length > 0) {
          nextGrid[hub.cx][hub.cy].terrain = 'kelp';
        }
      } else {
        // Case 2: Center is alive. Grow out spoke tips.
        // We find one grazed spoke cell that is eligible.
        // For each direction, we check dist 1 first. If dist 1 is grazed, it's eligible.
        // If dist 1 is alive but dist 2 is grazed, dist 2 is eligible.
        const eligibleSpokes: { x: number; y: number }[] = [];

        for (let d = 0; d < 4; d++) {
          const spoke1 = hubCells.find((hc) => hc.dir === d && hc.dist === 1)!;
          const spoke2 = hubCells.find((hc) => hc.dir === d && hc.dist === 2)!;

          if (nextGrid[spoke1.x][spoke1.y].terrain === 'water') {
            eligibleSpokes.push(spoke1);
          } else if (nextGrid[spoke2.x][spoke2.y].terrain === 'water') {
            eligibleSpokes.push(spoke2);
          }
        }

        if (eligibleSpokes.length > 0) {
          // Grow one spoke cell
          const targetSpoke = eligibleSpokes[Math.floor(Math.random() * eligibleSpokes.length)];
          nextGrid[targetSpoke.x][targetSpoke.y].terrain = 'kelp';
        }
      }
    }
  }

  // Ensure any unused flesh chunk occupant is carried over if not processed yet (shouldn't happen, but safe fallback)
  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      const originalOcc = currentGrid[x][y].occupant;
      if (originalOcc && !processedIds.has(originalOcc.id)) {
        // Just copy over if cell is still empty in nextGrid
        if (nextGrid[x][y].occupant === null) {
          nextGrid[x][y].occupant = originalOcc;
        }
      }
    }
  }

  return { grid: nextGrid, algaeHubs: nextHubs };
}
