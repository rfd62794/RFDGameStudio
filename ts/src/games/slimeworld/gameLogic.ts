import type { PlanetNode, Slime, SlimeColor, SlimePattern } from './types';

export const COLOR_SPECS: Record<SlimeColor, { rgb: string; specialty: string }> = {
  Red: { rgb: '#ef4444', specialty: 'Cinder Strain' }, Orange: { rgb: '#f97316', specialty: 'Marsh Strain' }, Yellow: { rgb: '#eab308', specialty: 'Gale Strain' }, Green: { rgb: '#22c55e', specialty: 'Tundra Strain' }, Purple: { rgb: '#a855f7', specialty: 'Crystal Strain' }, Blue: { rgb: '#3b82f6', specialty: 'Tide Strain' }, Gray: { rgb: '#94a3b8', specialty: 'Void Strain' },
};
export const PATTERN_DESCRIPTIONS: Record<SlimePattern, { name: string; bonus: string; description: string }> = {
  Solid: { name: 'Solid', bonus: 'None', description: 'Homogeneous membrane.' }, Stripe: { name: 'Stripe', bonus: 'Patterned', description: 'Striped membrane.' }, Polka: { name: 'Polka', bonus: 'Patterned', description: 'Spotted membrane.' }, Glow: { name: 'Glow', bonus: 'Low contrast', description: 'Faint accent membrane.' }, Crown: { name: 'Crown', bonus: 'Legacy', description: 'Legacy pattern compatibility.' }, Ringed: { name: 'Ringed', bonus: 'Spiral', description: 'Spiral Turing regime.' }, Nebula: { name: 'Nebula', bonus: 'Labyrinthine', description: 'Labyrinthine Turing regime.' }, Obsidian: { name: 'Obsidian', bonus: 'High contrast', description: 'Maximum contrast accent.' },
};
export interface ColorTarget { id: string; name: string; tier: 'guild' | 'rival' | 'arc_triad' | 'skip_triad'; centerHues: number[]; tolerance: number; saturationMin: number; saturationMax: number; }
export const COLOR_TARGETS: ColorTarget[] = [
  { id: 'guild_ember_marsh', tier: 'guild', name: 'Thornward', centerHues: [30], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: 'guild_marsh_gale', tier: 'guild', name: 'Guild: Amberglow', centerHues: [90], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: 'guild_gale_tundra', tier: 'guild', name: 'Frostwind', centerHues: [150], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: 'guild_tundra_crystal', tier: 'guild', name: 'Guild: Mossy Crystal', centerHues: [210], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: 'guild_crystal_tide', tier: 'guild', name: 'Tidereign', centerHues: [270], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: 'guild_tide_ember', tier: 'guild', name: 'Guild: Abyssal Ember', centerHues: [330], tolerance: 15, saturationMin: 65, saturationMax: 100 },
  { id: 'rival_ember_tundra', tier: 'rival', name: 'The Fault Line', centerHues: [90, 270], tolerance: 10, saturationMin: 35, saturationMax: 65 },
  { id: 'rival_marsh_crystal', tier: 'rival', name: 'Rival: Eclipse Void', centerHues: [150, 330], tolerance: 10, saturationMin: 35, saturationMax: 65 },
  { id: 'rival_gale_tide', tier: 'rival', name: 'Rival: Stormsurge', centerHues: [210, 30], tolerance: 10, saturationMin: 35, saturationMax: 65 },
  { id: 'arc_ember_marsh_gale', tier: 'arc_triad', name: 'Arc: Ember-Marsh-Gale', centerHues: [60], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: 'arc_marsh_gale_tundra', tier: 'arc_triad', name: 'Arc: Marsh-Gale-Tundra', centerHues: [120], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: 'arc_gale_tundra_crystal', tier: 'arc_triad', name: 'Arc: Gale-Tundra-Crystal', centerHues: [180], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: 'arc_tundra_crystal_tide', tier: 'arc_triad', name: 'Arc: Tundra-Crystal-Tide', centerHues: [240], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: 'arc_crystal_tide_ember', tier: 'arc_triad', name: 'Arc: Crystal-Tide-Ember', centerHues: [300], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: 'arc_tide_ember_marsh', tier: 'arc_triad', name: 'Arc: Tide-Ember-Marsh', centerHues: [0], tolerance: 15, saturationMin: 20, saturationMax: 35 },
  { id: 'skip_ember_gale_crystal', tier: 'skip_triad', name: 'Skip: Ember-Gale-Crystal', centerHues: [0, 120, 240], tolerance: 10, saturationMin: 15, saturationMax: 20 },
  { id: 'skip_marsh_tundra_tide', tier: 'skip_triad', name: 'Skip: Marsh-Tundra-Tide', centerHues: [60, 180, 300], tolerance: 10, saturationMin: 15, saturationMax: 20 },
];
export function stageFromLevel(level: number): string { return level < 3 ? 'Hatchling' : level < 6 ? 'Juvenile' : level < 10 ? 'Young' : level < 15 ? 'Prime' : level < 20 ? 'Veteran' : 'Elder'; }
export function calculateMarketPrice(slime: Slime, recentSalesForColor: number): number { const baseValue = 40 + (slime.level - 1) * 5; const floodMultiplier = Math.max(0.3, 1 - recentSalesForColor * 0.12); return Math.floor(baseValue * floodMultiplier); }
export function getHueDeviation(hue: number): { baseColor: SlimeColor; deviation: number } { const baseColor = (Object.entries({ Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300 }) as Array<[SlimeColor, number]>).sort((a, b) => Math.abs(a[1] - hue) - Math.abs(b[1] - hue))[0]; return { baseColor: baseColor[0], deviation: Math.abs(baseColor[1] - hue) }; }
export function getColorRegentCost(color: SlimeColor, discovered: boolean): number { const tierMap: Partial<Record<SlimeColor, number>> = { Purple: 1, Orange: 1, Green: 1, Gray: 3 }; const baseCost = (tierMap[color] ?? 0) * 80; return discovered ? baseCost : Math.round(baseCost * 2); }
export function getTargetRegentCost(targetId: string, discovered: boolean): number { const isRival = targetId.startsWith('rival_'); const baseCost = isRival ? 200 : 120; return discovered ? baseCost : Math.round(baseCost * 2); }
export function isCapitolHardened(node: PlanetNode, nodes: PlanetNode[]): boolean { return node.isCapitol && node.ownerColor !== null && node.neighbors.every(id => nodes.some(neighbor => neighbor.id === id && neighbor.ownerColor === node.ownerColor)); }
