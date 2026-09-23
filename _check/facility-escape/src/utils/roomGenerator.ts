import { TileState, GuardEntity, GameObject, Property, Carrier, GameState, FacilityTheme, Material } from '../types';
import { computeSightline, VISION_CONE_CONFIG } from './physicsEngine';
import { solveLevel, testRelevance, verifyDeadZones } from './levelSolver';

// Predefined objects that represent different properties or carry effects with their associated materials
const ENVIRONMENT_TEMPLATES = [
  { name: 'Curtains', properties: ['flammable'] as Property[], isPickable: false, material: 'cloth' as Material },
  { name: 'Paper Stacks', properties: ['flammable'] as Property[], isPickable: false, material: 'cloth' as Material },
  { name: 'Wooden Crates', properties: ['flammable'] as Property[], isPickable: false, material: 'wood' as Material },
  { name: 'Oil Spill', properties: ['flammable'] as Property[], isPickable: false, material: 'plastic' as Material },
  { name: 'Water Pool', properties: ['conductive'] as Property[], isPickable: false, material: 'stone' as Material },
  { name: 'Metal Grate', properties: ['conductive'] as Property[], isPickable: false, material: 'metal' as Material },
  { name: 'Wire Fence Segment', properties: ['conductive'] as Property[], isPickable: false, material: 'metal' as Material },
  { name: 'Glue Trap', properties: ['adhesive'] as Property[], isPickable: false, material: 'plastic' as Material },
  { name: 'Tar Patch', properties: ['adhesive'] as Property[], isPickable: false, material: 'plastic' as Material },
  { name: 'Siren Alarm', properties: ['loud'] as Property[], isPickable: false, material: 'metal' as Material },
  { name: 'Radio Console', properties: ['loud'] as Property[], isPickable: false, material: 'metal' as Material },
  { name: 'Breakable Glass', properties: ['loud'] as Property[], isPickable: false, material: 'glass' as Material },
  { name: 'Fixed Mirror (/)', properties: ['reflective'] as Property[], isPickable: false, mirrorAngle: '/' as const, material: 'glass' as Material },
  { name: 'Fixed Mirror (\\)', properties: ['reflective'] as Property[], isPickable: false, mirrorAngle: '\\' as const, material: 'glass' as Material },
];

const ITEM_TEMPLATES = [
  { name: 'Windproof Lighter', properties: [] as Property[], carriers: ['heat'] as Carrier[], isPickable: true, material: 'metal' as Material },
  { name: 'Thermal Flare', properties: ['flammable'] as Property[], carriers: ['heat'] as Carrier[], isPickable: true, material: 'plastic' as Material },
  { name: 'Spare Battery', properties: ['conductive'] as Property[], carriers: ['electric'] as Carrier[], isPickable: true, material: 'metal' as Material },
  { name: 'Glue Bottle', properties: [] as Property[], isPickable: true, material: 'plastic' as Material },
  { name: 'Hand Mirror (/)', properties: ['reflective'] as Property[], isPickable: true, mirrorAngle: '/' as const, material: 'glass' as Material },
  { name: 'Hand Mirror (\\)', properties: ['reflective'] as Property[], isPickable: true, mirrorAngle: '\\' as const, material: 'glass' as Material },
  { name: 'Firecracker', properties: ['flammable', 'loud'] as Property[], isPickable: true, material: 'wood' as Material },
];

/**
 * Maps a room number to its designated theme, scaling based on maxRooms
 */
export function getThemeForRoom(roomNumber: number, maxRooms: number = 5): FacilityTheme {
  if (maxRooms <= 5) {
    if (roomNumber === 1) return 'block';
    if (roomNumber === 2) return 'processing';
    if (roomNumber === 3) return 'security';
    if (roomNumber === 4) return 'maintenance';
    return 'perimeter';
  } else {
    if (roomNumber === 1) return 'block';
    if (roomNumber <= 3) return 'processing';
    if (roomNumber <= 5) return 'security';
    if (roomNumber <= 7) return 'maintenance';
    return 'perimeter';
  }
}

/**
 * Returns allowed materials and guard types for each FacilityTheme
 */
export function getAllowedContent(theme: FacilityTheme): {
  materials: Material[];
  guardTypes: ('watcher' | 'patrol')[];
} {
  switch (theme) {
    case 'block':
      return {
        materials: ['stone', 'metal'],
        guardTypes: ['watcher'],
      };
    case 'processing':
      return {
        materials: ['stone', 'metal', 'wood', 'cloth'],
        guardTypes: ['watcher', 'patrol'],
      };
    case 'security':
      return {
        materials: ['stone', 'metal', 'wood', 'cloth', 'glass'],
        guardTypes: ['watcher', 'patrol'],
      };
    case 'maintenance':
      return {
        materials: ['stone', 'metal', 'wood', 'cloth', 'glass', 'plastic'],
        guardTypes: ['watcher', 'patrol'],
      };
    case 'perimeter':
    default:
      return {
        materials: ['stone', 'metal', 'wood', 'cloth', 'glass', 'plastic'],
        guardTypes: ['watcher', 'patrol'],
      };
  }
}

export interface RoomPreset {
  id: string;
  theme: FacilityTheme;
  width: number;
  height: number;
  placements: {
    dx: number;
    dy: number;
    type: 'object' | 'item' | 'guard';
    name?: string;
    properties?: Property[];
    carriers?: Carrier[];
    isPickable?: boolean;
    mirrorAngle?: '/' | '\\';
    material?: Material;
    guardType?: 'watcher' | 'patrol';
    facing?: 'U' | 'D' | 'L' | 'R';
  }[];
}

export const ROOM_PRESETS: RoomPreset[] = [
  // Theme 1: block (Stone, Metal, Watcher only)
  {
    id: 'block-corner-post',
    theme: 'block',
    width: 2,
    height: 2,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Metal Grate', properties: ['conductive'], isPickable: false, material: 'metal' },
      { dx: 1, dy: 0, type: 'guard', guardType: 'watcher', facing: 'D' },
      { dx: 0, dy: 1, type: 'item', name: 'Spare Battery', properties: ['conductive'], carriers: ['electric'], isPickable: true, material: 'metal' }
    ]
  },
  {
    id: 'block-watcher-trap',
    theme: 'block',
    width: 2,
    height: 1,
    placements: [
      { dx: 0, dy: 0, type: 'guard', guardType: 'watcher', facing: 'R' },
      { dx: 1, dy: 0, type: 'object', name: 'Water Pool', properties: ['conductive'], isPickable: false, material: 'stone' }
    ]
  },

  // Theme 2: processing (+ Wood, Cloth, + Patrol)
  {
    id: 'processing-curtain-alcove',
    theme: 'processing',
    width: 2,
    height: 2,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Curtains', properties: ['flammable'], isPickable: false, material: 'cloth' },
      { dx: 1, dy: 0, type: 'guard', guardType: 'patrol', facing: 'L' },
      { dx: 0, dy: 1, type: 'item', name: 'Windproof Lighter', properties: [], carriers: ['heat'], isPickable: true, material: 'metal' }
    ]
  },
  {
    id: 'processing-wood-crate-cache',
    theme: 'processing',
    width: 2,
    height: 1,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Wooden Crates', properties: ['flammable'], isPickable: false, material: 'wood' },
      { dx: 1, dy: 0, type: 'item', name: 'Firecracker', properties: ['flammable', 'loud'], isPickable: true, material: 'wood' }
    ]
  },

  // Theme 3: security (+ Glass, Patrol-heavy)
  {
    id: 'security-glass-office',
    theme: 'security',
    width: 2,
    height: 2,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Breakable Glass', properties: ['loud'], isPickable: false, material: 'glass' },
      { dx: 1, dy: 0, type: 'guard', guardType: 'patrol', facing: 'D' },
      { dx: 0, dy: 1, type: 'item', name: 'Hand Mirror (/)', properties: ['reflective'], isPickable: true, mirrorAngle: '/', material: 'glass' },
      { dx: 1, dy: 1, type: 'object', name: 'Breakable Glass', properties: ['loud'], isPickable: false, material: 'glass' }
    ]
  },
  {
    id: 'security-mirror-checkpoint',
    theme: 'security',
    width: 2,
    height: 1,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Fixed Mirror (/)', properties: ['reflective'], isPickable: false, mirrorAngle: '/', material: 'glass' },
      { dx: 1, dy: 0, type: 'guard', guardType: 'patrol', facing: 'L' }
    ]
  },

  // Theme 4: maintenance (+ Plastic)
  {
    id: 'maintenance-glue-zone',
    theme: 'maintenance',
    width: 2,
    height: 2,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Glue Trap', properties: ['adhesive'], isPickable: false, material: 'plastic' },
      { dx: 1, dy: 0, type: 'item', name: 'Glue Bottle', properties: [], isPickable: true, material: 'plastic' },
      { dx: 0, dy: 1, type: 'object', name: 'Tar Patch', properties: ['adhesive'], isPickable: false, material: 'plastic' },
      { dx: 1, dy: 1, type: 'guard', guardType: 'watcher', facing: 'L' }
    ]
  },
  {
    id: 'maintenance-siren-trap',
    theme: 'maintenance',
    width: 2,
    height: 1,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Siren Alarm', properties: ['loud'], isPickable: false, material: 'metal' },
      { dx: 1, dy: 0, type: 'item', name: 'Thermal Flare', properties: ['flammable'], carriers: ['heat'], isPickable: true, material: 'plastic' }
    ]
  },

  // Theme 5: perimeter (All materials / guard types)
  {
    id: 'perimeter-final-post',
    theme: 'perimeter',
    width: 2,
    height: 2,
    placements: [
      { dx: 0, dy: 0, type: 'guard', guardType: 'patrol', facing: 'R' },
      { dx: 1, dy: 0, type: 'object', name: 'Siren Alarm', properties: ['loud'], isPickable: false, material: 'metal' },
      { dx: 0, dy: 1, type: 'object', name: 'Fixed Mirror (\\)', properties: ['reflective'], isPickable: false, mirrorAngle: '\\', material: 'glass' },
      { dx: 1, dy: 1, type: 'item', name: 'Firecracker', properties: ['flammable', 'loud'], isPickable: true, material: 'wood' }
    ]
  },
  {
    id: 'perimeter-hazard-run',
    theme: 'perimeter',
    width: 2,
    height: 1,
    placements: [
      { dx: 0, dy: 0, type: 'object', name: 'Oil Spill', properties: ['flammable'], isPickable: false, material: 'plastic' },
      { dx: 1, dy: 0, type: 'guard', guardType: 'watcher', facing: 'U' }
    ]
  }
];

/**
 * Checks if a path exists from start (0, size-1) to exit (size-1, 0)
 */
function isSolvable(size: number, walls: Set<string>): boolean {
  const startKey = `0,${size - 1}`;
  const exitKey = `${size - 1},0`;
  const queue: { x: number; y: number }[] = [{ x: 0, y: size - 1 }];
  const visited = new Set<string>();
  visited.add(startKey);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.x === size - 1 && curr.y === 0) {
      return true;
    }

    const neighbors = [
      { x: curr.x + 1, y: curr.y },
      { x: curr.x - 1, y: curr.y },
      { x: curr.x, y: curr.y + 1 },
      { x: curr.x, y: curr.y - 1 },
    ];

    for (const nb of neighbors) {
      if (nb.x >= 0 && nb.x < size && nb.y >= 0 && nb.y < size) {
        const key = `${nb.x},${nb.y}`;
        if (!walls.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push(nb);
        }
      }
    }
  }

  return false;
}

/**
 * Generates a looping patrol path of 2-4 tiles for a guard starting at (gx, gy)
 */
function getPatrolPath(gx: number, gy: number, grid: TileState[][], walls: Set<string>): { x: number; y: number }[] {
  const size = grid.length;
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  
  const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
  
  for (const dir of shuffledDirs) {
    const candidatePath = [{ x: gx, y: gy }];
    let cx = gx;
    let cy = gy;
    const length = 2 + Math.floor(Math.random() * 2); // 2 to 3 tiles in a direct line
    
    for (let i = 1; i < length; i++) {
      const nx = cx + dir.dx;
      const ny = cy + dir.dy;
      
      const key = `${nx},${ny}`;
      if (
        nx >= 0 && nx < size && ny >= 0 && ny < size &&
        !walls.has(key) &&
        !(nx === 0 && ny === size - 1) && !(nx === size - 1 && ny === 0)
      ) {
        candidatePath.push({ x: nx, y: ny });
        cx = nx;
        cy = ny;
      } else {
        break;
      }
    }
    
    if (candidatePath.length >= 2) {
      if (candidatePath.length === 3) {
        // Back and forth: [A, B, C, B]
        return [candidatePath[0], candidatePath[1], candidatePath[2], candidatePath[1]];
      }
      return candidatePath;
    }
  }
  
  // Fallback
  for (const dir of shuffledDirs) {
    const nx = gx + dir.dx;
    const ny = gy + dir.dy;
    const key = `${nx},${ny}`;
    if (
      nx >= 0 && nx < size && ny >= 0 && ny < size &&
      !walls.has(key) &&
      !(nx === 0 && ny === size - 1) && !(nx === size - 1 && ny === 0)
    ) {
      return [{ x: gx, y: gy }, { x: nx, y: ny }];
    }
  }
  
  return [{ x: gx, y: gy }];
}

/**
 * Generates a full procedurally styled room state enforcing theme constraints and preset injection.
 */
export function generateProceduralRoom(
  roomNumber: number,
  size: number = 7,
  maxRooms: number = 5
): {
  grid: TileState[][];
  guards: GuardEntity[];
} {
  const startTime = performance.now();
  const startX = 0;
  const startY = size - 1;
  const exitX = size - 1;
  const exitY = 0;

  let attempts = 0;
  let grid: TileState[][] = [];
  let guards: GuardEntity[] = [];

  while (attempts < 100) {
    attempts++;

    const currentTheme = getThemeForRoom(roomNumber, maxRooms);
    const allowed = getAllowedContent(currentTheme);

    let walls = new Set<string>();
    let wallAttempts = 0;

    // Theme 1 ('block') does NOT have gates. Other rooms have gates (80% chance)
    const hasGatedRoute = currentTheme !== 'block' && (roomNumber > 1 || Math.random() < 0.8);
    const gateX = 3;
    const gateY = 3;

    // Pick gateType such that its material is allowed
    let gateType: 'flammable' | 'conductive' = 'conductive';
    if (allowed.materials.includes('wood')) {
      gateType = Math.random() < 0.5 ? 'flammable' : 'conductive';
    }

    // 1. Generate Solvable Walls + Gated Divider
    while (wallAttempts < 150) {
      walls = new Set<string>();
      
      if (hasGatedRoute) {
        // Decide divider orientation: vertical at x=3, or horizontal at y=3
        const isVertical = Math.random() < 0.5;
        if (isVertical) {
          for (let y = 1; y <= 5; y++) {
            if (y === gateY) continue; // This is the gate
            walls.add(`3,${y}`);
          }
        } else {
          for (let x = 1; x <= 5; x++) {
            if (x === gateX) continue; // This is the gate
            walls.add(`${x},3`);
          }
        }
      }

      // Add extra random walls
      const wallCount = 1 + Math.floor(Math.random() * 3) + Math.min(roomNumber, 2);
      for (let i = 0; i < wallCount; i++) {
        const wx = Math.floor(Math.random() * size);
        const wy = Math.floor(Math.random() * size);

        // Do not block start, exit, divider gate, or adjacent starting areas
        const isStartArea = (wx <= 1 && wy >= size - 2);
        const isExitArea = (wx >= size - 2 && wy <= 1);
        const isGateTile = (wx === gateX && wy === gateY);
        
        if (!isStartArea && !isExitArea && !isGateTile) {
          walls.add(`${wx},${wy}`);
        }
      }

      // Crucial requirement: The room must be solvable even if the gate is considered a complete WALL.
      // This guarantees there's always an ungated path that doesn't require any items.
      const testWalls = new Set(walls);
      if (hasGatedRoute) {
        testWalls.add(`${gateX},${gateY}`);
      }

      if (isSolvable(size, testWalls)) {
        break;
      }
      wallAttempts++;
    }

    // 2. Initialize Empty Grid with Gate settings
    grid = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => {
        const isGate = hasGatedRoute && x === gateX && y === gateY;
        return {
          x,
          y,
          isExit: x === exitX && y === exitY,
          isWall: !isGate && walls.has(`${x},${y}`),
          isGated: isGate ? gateType : undefined,
          status: 'normal',
        };
      })
    );

    // Set up the actual gate object
    if (hasGatedRoute) {
      const gateTile = grid[gateY][gateX];
      if (gateType === 'flammable') {
        gateTile.environmentObject = {
          id: `gate-flammable-${roomNumber}`,
          name: 'Wooden Security Gate',
          properties: ['flammable'],
          isPickable: false,
          status: 'normal'
        };
      } else {
        gateTile.environmentObject = {
          id: `gate-conductive-${roomNumber}`,
          name: 'Conductive-Locked Gate',
          properties: ['conductive'],
          isPickable: false,
          status: 'normal'
        };

        // Place a Metal Grate next to the conductive gate for puzzle play
        const neighbors = [
          { x: gateX - 1, y: gateY },
          { x: gateX + 1, y: gateY },
          { x: gateX, y: gateY - 1 },
          { x: gateX, y: gateY + 1 },
        ];
        for (const nb of neighbors) {
          if (nb.x >= 0 && nb.x < size && nb.y >= 0 && nb.y < size) {
            const key = `${nb.x},${nb.y}`;
            if (!walls.has(key) && !(nb.x === startX && nb.y === startY) && !(nb.x === exitX && nb.y === exitY)) {
              grid[nb.y][nb.x].environmentObject = {
                id: `gate-grate-${roomNumber}`,
                name: 'Metal Grate Circuit',
                properties: ['conductive'],
                isPickable: false,
                status: 'normal'
              };
              break;
            }
          }
        }
      }
    }

    // Preset Injection
    let presetPlaced = false;
    let occupiedPresetTiles = new Set<string>();
    let chosenPresetId: string | null = null;
    guards = [];

    // 40% chance of seeding a preset matching current theme
    const shouldTryPreset = Math.random() < 0.4;
    if (shouldTryPreset) {
      const availablePresets = ROOM_PRESETS.filter(p => p.theme === currentTheme);
      if (availablePresets.length > 0) {
        const shuffledPresets = [...availablePresets].sort(() => Math.random() - 0.5);
        for (const preset of shuffledPresets) {
          // Collect all candidate anchors
          const anchorCandidates: { x: number; y: number }[] = [];
          for (let py = 0; py <= size - preset.height; py++) {
            for (let px = 0; px <= size - preset.width; px++) {
              anchorCandidates.push({ x: px, y: py });
            }
          }
          anchorCandidates.sort(() => Math.random() - 0.5);

          let foundAnchor = false;
          for (const cand of anchorCandidates) {
            let valid = true;
            for (let dy = 0; dy < preset.height; dy++) {
              for (let dx = 0; dx < preset.width; dx++) {
                const tx = cand.x + dx;
                const ty = cand.y + dy;

                const isStartArea = (tx <= 1 && ty >= size - 2);
                const isExitArea = (tx >= size - 2 && ty <= 1);
                const isGateTile = hasGatedRoute && (tx === gateX && ty === gateY);
                const isWall = walls.has(`${tx},${ty}`);

                if (isStartArea || isExitArea || isGateTile || isWall) {
                  valid = false;
                  break;
                }
              }
              if (!valid) break;
            }

            if (valid) {
              foundAnchor = true;
              presetPlaced = true;
              chosenPresetId = preset.id;

              for (let dy = 0; dy < preset.height; dy++) {
                for (let dx = 0; dx < preset.width; dx++) {
                  const tx = cand.x + dx;
                  const ty = cand.y + dy;
                  occupiedPresetTiles.add(`${tx},${ty}`);
                }
              }

              // Place objects, items, and guards from preset
              preset.placements.forEach((placement, idx) => {
                const tx = cand.x + placement.dx;
                const ty = cand.y + placement.dy;
                const tile = grid[ty][tx];

                if (placement.type === 'object') {
                  tile.environmentObject = {
                    id: `preset-obj-${roomNumber}-${preset.id}-${idx}-${Date.now()}`,
                    name: placement.name || 'Fixed Asset',
                    properties: placement.properties || [],
                    isPickable: false,
                    status: 'normal',
                    mirrorAngle: placement.mirrorAngle
                  };
                } else if (placement.type === 'item') {
                  tile.item = {
                    id: `preset-item-${roomNumber}-${preset.id}-${idx}-${Date.now()}`,
                    name: placement.name || 'Utility Asset',
                    properties: placement.properties || [],
                    carriers: placement.carriers,
                    isPickable: true,
                    status: 'normal',
                    mirrorAngle: placement.mirrorAngle
                  };
                } else if (placement.type === 'guard') {
                  const gFacing = placement.facing || 'D';
                  const gType = placement.guardType || 'watcher';

                  if (gType === 'patrol') {
                    const pPath = getPatrolPath(tx, ty, grid, walls);
                    guards.push({
                      id: `preset-guard-${roomNumber}-${preset.id}-${idx}`,
                      type: 'guard',
                      guardType: 'patrol',
                      x: tx,
                      y: ty,
                      facing: gFacing,
                      immobilizedTurns: 0,
                      patrolPath: pPath,
                      patrolIndex: 0,
                      intent: {
                        actionType: 'move',
                        targetTiles: [pPath[Math.min(1, pPath.length - 1)]],
                        description: `Moving to patrol tile next turn.`,
                        nextPos: pPath[Math.min(1, pPath.length - 1)]
                      }
                    });
                  } else {
                    guards.push({
                      id: `preset-guard-${roomNumber}-${preset.id}-${idx}`,
                      type: 'guard',
                      guardType: 'watcher',
                      x: tx,
                      y: ty,
                      facing: gFacing,
                      immobilizedTurns: 0,
                      intent: {
                        actionType: 'watch',
                        targetTiles: [],
                        description: 'Watching sightline'
                      }
                    });
                  }
                }
              });

              break; // Anchored successfully
            }
          }
          if (foundAnchor) break;
        }
      }
    }

    // Helper to find empty locations (no wall, no start, no exit, no gate, no preset tiles)
    const getEmptyLocations = (): { x: number; y: number }[] => {
      const list: { x: number; y: number }[] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const isGate = hasGatedRoute && x === gateX && y === gateY;
          if (
            grid[y][x].isWall ||
            isGate ||
            (x === startX && y === startY) ||
            (x === exitX && y === exitY) ||
            occupiedPresetTiles.has(`${x},${y}`)
          ) {
            continue;
          }
          list.push({ x, y });
        }
      }
      return list.sort(() => Math.random() - 0.5);
    };

    const emptyLocations = getEmptyLocations();

    // Explicitly spawn key item for the gate if present, ensuring player can solve the shortcut
    if (hasGatedRoute && emptyLocations.length > 0) {
      const loc = emptyLocations.pop()!;
      const tile = grid[loc.y][loc.x];
      if (gateType === 'flammable') {
        const canUseFlare = allowed.materials.includes('plastic');
        const useFlare = canUseFlare && Math.random() < 0.5;
        tile.item = useFlare ? {
          id: `item-flare-${roomNumber}-${Date.now()}`,
          name: 'Thermal Flare',
          properties: ['flammable'],
          carriers: ['heat'],
          isPickable: true,
          status: 'normal'
        } : {
          id: `item-lighter-${roomNumber}-${Date.now()}`,
          name: 'Windproof Lighter',
          properties: [],
          carriers: ['heat'],
          isPickable: true,
          status: 'normal'
        };
      } else {
        tile.item = {
          id: `item-battery-${roomNumber}-${Date.now()}`,
          name: 'Spare Battery',
          properties: ['conductive'],
          carriers: ['electric'],
          isPickable: true,
          status: 'normal'
        };
      }
    }

    // 3. Place Guards (Mix of Watcher & Patrol)
    const guardCount = Math.min(3, 1 + Math.floor((roomNumber - 1) / 2));
    const remainingGuardsToSpawn = Math.max(0, guardCount - guards.length);

    for (let i = 0; i < remainingGuardsToSpawn; i++) {
      if (emptyLocations.length === 0) break;
      
      let index = 0;
      for (let j = 0; j < emptyLocations.length; j++) {
        const dist = Math.abs(emptyLocations[j].x - startX) + Math.abs(emptyLocations[j].y - startY);
        if (dist >= 3) {
          index = j;
          break;
        }
      }
      const loc = emptyLocations.splice(index, 1)[0];
      const facings: ('U' | 'D' | 'L' | 'R')[] = ['U', 'D', 'L', 'R'];
      const randomFacing = facings[Math.floor(Math.random() * facings.length)];

      const availableGuardTypes = allowed.guardTypes;
      let guardType: 'watcher' | 'patrol' = 'watcher';
      if (availableGuardTypes.includes('patrol')) {
        if (currentTheme === 'security') {
          guardType = Math.random() < 0.8 ? 'patrol' : 'watcher';
        } else {
          guardType = Math.random() < 0.5 ? 'patrol' : 'watcher';
        }
      } else {
        guardType = 'watcher';
      }

      if (guardType === 'patrol') {
        const pPath = getPatrolPath(loc.x, loc.y, grid, walls);
        guards.push({
          id: `guard-${roomNumber}-${guards.length}`,
          type: 'guard',
          guardType: 'patrol',
          x: loc.x,
          y: loc.y,
          facing: randomFacing,
          immobilizedTurns: 0,
          patrolPath: pPath,
          patrolIndex: 0,
          intent: {
            actionType: 'move',
            targetTiles: [pPath[Math.min(1, pPath.length - 1)]],
            description: `Moving to patrol tile next turn.`,
            nextPos: pPath[Math.min(1, pPath.length - 1)]
          }
        });
      } else {
        guards.push({
          id: `guard-${roomNumber}-${guards.length}`,
          type: 'guard',
          guardType: 'watcher',
          x: loc.x,
          y: loc.y,
          facing: randomFacing,
          immobilizedTurns: 0,
          intent: {
            actionType: 'watch',
            targetTiles: [],
            description: 'Watching sightline'
          }
        });
      }
    }

    // 4. Place Found Objects (2-4 objects per room, filtered by allowed materials)
    const objectCount = 2 + Math.floor(Math.random() * 3);
    const allowedEnvTemplates = ENVIRONMENT_TEMPLATES.filter(t => allowed.materials.includes(t.material));
    const allowedItemTemplates = ITEM_TEMPLATES.filter(t => allowed.materials.includes(t.material));

    for (let i = 0; i < objectCount; i++) {
      if (emptyLocations.length === 0) break;
      const loc = emptyLocations.pop()!;
      const tile = grid[loc.y][loc.x];

      const isItem = Math.random() > 0.4;
      if (isItem && allowedItemTemplates.length > 0) {
        const template = allowedItemTemplates[Math.floor(Math.random() * allowedItemTemplates.length)];
        tile.item = {
          id: `obj-${roomNumber}-${i}-${Date.now()}`,
          name: template.name,
          properties: template.properties,
          carriers: 'carriers' in template ? template.carriers : undefined,
          isPickable: template.isPickable,
          status: 'normal',
          mirrorAngle: 'mirrorAngle' in template ? template.mirrorAngle : undefined,
        };
      } else if (allowedEnvTemplates.length > 0) {
        const template = allowedEnvTemplates[Math.floor(Math.random() * allowedEnvTemplates.length)];
        tile.environmentObject = {
          id: `obj-${roomNumber}-${i}-${Date.now()}`,
          name: template.name,
          properties: template.properties,
          isPickable: template.isPickable,
          status: 'normal',
          mirrorAngle: 'mirrorAngle' in template ? template.mirrorAngle : undefined,
        };
      }
    }

    // 5. Place Heart Container (40% chance of spawning per room)
    const spawnHeart = Math.random() < 0.4;
    if (spawnHeart && emptyLocations.length > 0) {
      const loc = emptyLocations.pop()!;
      const tile = grid[loc.y][loc.x];
      
      tile.item = {
        id: `heart-${roomNumber}-${Date.now()}`,
        name: 'Heart Container',
        properties: [],
        isPickable: true,
        status: 'normal'
      };
    }

    // 6. Precompute initial guard sightline and telecasted intent
    guards.forEach(guard => {
      if (guard.guardType === 'patrol') {
        const nextIdx = ((guard.patrolIndex ?? 0) + 1) % (guard.patrolPath?.length ?? 1);
        const nextPos = guard.patrolPath?.[nextIdx] ?? { x: guard.x, y: guard.y };
        guard.intent = {
          actionType: 'move',
          targetTiles: [nextPos],
          description: `Patrolling to (${nextPos.x}, ${nextPos.y}) next turn.`,
          nextPos
        };
      } else {
        const path = computeSightline(guard.x, guard.y, guard.facing, grid, false, guard.guardType);
        const isPlayerInSight = path.some(t => t.x === startX && t.y === startY);

        if (isPlayerInSight) {
          guard.intent = {
            actionType: 'shoot',
            targetTiles: path,
            description: `Alerted! Will SHOOT along sightline next turn.`
          };
        } else {
          guard.intent = {
            actionType: 'watch',
            targetTiles: path,
            description: 'Watching sightline'
          };
        }
      }
    });

    // 7. Call the REAL level solver to validate solvability and reject degenerate layouts
    const tempState: GameState = {
      roomNumber,
      maxRooms: 10,
      grid: grid.map(row => row.map(t => ({ ...t }))),
      player: {
        x: startX,
        y: startY,
        hearts: 3,
        maxHearts: 3,
        inventory: []
      },
      guards: guards.map(g => ({ ...g })),
      gameState: 'playing',
      selectedItemIndex: null,
      activeCarrierAction: null,
      logs: [],
      turnCount: 0
    };

    let solverResult = solveLevel(tempState);

    if (!solverResult.solvable && solverResult.maxStatesReached) {
      console.log(`[Solver] Room ${roomNumber} hit state limit. Retrying same layout with double state budget...`);
      solverResult = solveLevel(tempState, 4000); // Double default MAX_STATES
    }

    if (!solverResult.solvable) {
      if (solverResult.maxStatesReached) {
        console.log(`[Solver] Generation attempt ${attempts} for Room ${roomNumber} rejected: STATE BUDGET EXHAUSTED`);
      } else {
        console.log(`[Solver] Generation attempt ${attempts} for Room ${roomNumber} rejected: UNSOLVABLE`);
      }
      continue;
    }

    // Degenerate Rejection check (§4): Reject if cheapest solution has 0 risk and 0 tool usage
    const isDegenerate = solverResult.totalRiskPenalty === 0 && solverResult.totalToolCost === 0;
    if (isDegenerate) {
      console.log(`[Solver] Generation attempt ${attempts} for Room ${roomNumber} rejected: DEGENERATE (zero risk/tool path)`);
      continue;
    }

    // Dead-Zone verification: Must have at least one verified reachable, useful dead-zone tile
    const deadZones = verifyDeadZones(tempState, solverResult.solutionPath || []);
    if (deadZones.length === 0) {
      console.log(`[Solver] Generation attempt ${attempts} for Room ${roomNumber} rejected: NO REACHABLE DEAD ZONE`);
      continue;
    }

    // Level passes validation! Now run relevance testing (§5) to flag redundant placements
    const relevanceResult = testRelevance(tempState, solverResult);

    // Flag irrelevant items
    grid.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile.item && tile.item.id) {
          const isItemRelevant = relevanceResult.itemRelevance[tile.item.id];
          if (isItemRelevant === false) {
            tile.item.isIrrelevant = true;
          }
        }
      });
    });

    // Flag irrelevant guards
    guards.forEach(guard => {
      const isGuardRelevant = relevanceResult.guardRelevance[guard.id];
      if (isGuardRelevant === false) {
        guard.isIrrelevant = true;
      }
    });

    const endTime = performance.now();
    console.log(`[Solver] Room ${roomNumber} successfully generated!
      Attempts: ${attempts}
      Generation Time: ${(endTime - startTime).toFixed(2)}ms
      Difficulty Profile:
        Depth: ${solverResult.depth}
        Tool Diversity: ${solverResult.toolDiversity}
        Avg Branch Width: ${solverResult.avgBranchWidth.toFixed(2)}
        Max Branch Width: ${solverResult.maxBranchWidth}
      Relevance:
        Items: ${JSON.stringify(relevanceResult.itemRelevance)}
        Guards: ${JSON.stringify(relevanceResult.guardRelevance)}
    `);

    return {
      grid,
      guards
    };
  }

  // Fallback room if 100 attempts fail (returns whatever we produced last, ensuring no infinite loop block)
  console.warn(`[Solver] Failed to generate a fully non-degenerate Room ${roomNumber} in 100 attempts; returning fallback.`);
  return {
    grid,
    guards
  };
}

/**
 * Runs a test to explicitly construct a room with zero dead zones
 * and confirms that the verification logic rejects it.
 */
export function runExplicitDeadZoneRejectionTest() {
  console.log("=== RUNNING EXPLICIT DEAD ZONE REJECTION TEST ===");
  const size = 7;
  const grid: TileState[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      x,
      y,
      isExit: x === size - 1 && y === 0,
      isWall: false,
      status: 'normal' as const,
    }))
  );

  const guards: GuardEntity[] = [
    {
      id: "test-guard-1",
      type: "guard",
      guardType: "watcher",
      x: 3,
      y: 3,
      facing: "U",
      immobilizedTurns: 0,
      intent: {
        actionType: "watch",
        targetTiles: [],
        description: "Watching entire board"
      }
    }
  ];

  // Override config temporarily to cover the entire board
  const originalConfig = { ...VISION_CONE_CONFIG.watcher };
  VISION_CONE_CONFIG.watcher.range = 99;
  VISION_CONE_CONFIG.watcher.angle = 360;

  // Compute sights for the guard
  guards[0].intent.targetTiles = computeSightline(3, 3, "U", grid, false, "watcher");

  const testState: GameState = {
    roomNumber: 1,
    maxRooms: 5,
    grid,
    player: { x: 0, y: size - 1, hearts: 3, maxHearts: 3, inventory: [] },
    guards,
    gameState: "playing",
    selectedItemIndex: null,
    activeCarrierAction: null,
    logs: [],
    turnCount: 0
  };

  const solverResult = solveLevel(testState);
  console.log(`[Test Solver] Solvable: ${solverResult.solvable}`);

  const deadZones = verifyDeadZones(testState, solverResult.solutionPath || []);

  // Restore the original config AFTER we computed dead zones!
  VISION_CONE_CONFIG.watcher.range = originalConfig.range;
  VISION_CONE_CONFIG.watcher.angle = originalConfig.angle;
  console.log(`[Test Dead-Zones] Found ${deadZones.length} useful dead zones.`);
  if (deadZones.length === 0) {
    console.log(`[Test Rejection] SUCCESS: Room with no dead zone correctly rejected! (Rejection fired successfully)`);
  } else {
    console.log(`[Test Rejection] FAILURE: Room with no dead zone was NOT rejected.`);
  }
  console.log("================================================");
}

// Execute test on module load to confirm integration
runExplicitDeadZoneRejectionTest();

