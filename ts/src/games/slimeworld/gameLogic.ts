import type { PlanetNode, SlimeColor, SlimePattern } from './types';

export const COLOR_SPECS: Record<SlimeColor, { rgb: string; specialty: string }> = {
  Red: { rgb: '#ef4444', specialty: 'Cinder Strain' }, Orange: { rgb: '#f97316', specialty: 'Marsh Strain' }, Yellow: { rgb: '#eab308', specialty: 'Gale Strain' }, Green: { rgb: '#22c55e', specialty: 'Tundra Strain' }, Purple: { rgb: '#a855f7', specialty: 'Crystal Strain' }, Blue: { rgb: '#3b82f6', specialty: 'Tide Strain' }, Gray: { rgb: '#94a3b8', specialty: 'Void Strain' },
};
export const PATTERN_DESCRIPTIONS: Record<SlimePattern, { name: string; bonus: string; description: string }> = {
  Solid: { name: 'Solid', bonus: 'None', description: 'Homogeneous membrane.' }, Stripe: { name: 'Stripe', bonus: 'Patterned', description: 'Striped membrane.' }, Polka: { name: 'Polka', bonus: 'Patterned', description: 'Spotted membrane.' }, Glow: { name: 'Glow', bonus: 'Low contrast', description: 'Faint accent membrane.' }, Crown: { name: 'Crown', bonus: 'Legacy', description: 'Legacy pattern compatibility.' }, Ringed: { name: 'Ringed', bonus: 'Spiral', description: 'Spiral Turing regime.' }, Nebula: { name: 'Nebula', bonus: 'Labyrinthine', description: 'Labyrinthine Turing regime.' }, Obsidian: { name: 'Obsidian', bonus: 'High contrast', description: 'Maximum contrast accent.' },
};
export interface ColorTarget { id: string; name: string; tier: 'guild' | 'rival' | 'arc_triad' | 'skip_triad'; centerHues: number[]; saturationMin: number; saturationMax: number; }
export const COLOR_TARGETS: ColorTarget[] = [];
export function stageFromLevel(level: number): string { return level < 3 ? 'Hatchling' : level < 6 ? 'Juvenile' : level < 10 ? 'Young' : level < 15 ? 'Prime' : level < 20 ? 'Veteran' : 'Elder'; }
export function calculateMarketPrice(): number { return Number.NaN; }
export function getHueDeviation(hue: number): { baseColor: SlimeColor; deviation: number } { const baseColor = (Object.entries({ Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300 }) as Array<[SlimeColor, number]>).sort((a, b) => Math.abs(a[1] - hue) - Math.abs(b[1] - hue))[0]; return { baseColor: baseColor[0], deviation: Math.abs(baseColor[1] - hue) }; }
export function getColorRegentCost(_color: SlimeColor, _discovered: boolean): number { return Number.NaN; }
export function getTargetRegentCost(_targetId: string, _discovered: boolean): number { return Number.NaN; }
export function isCapitolHardened(node: PlanetNode, nodes: PlanetNode[]): boolean { return node.isCapitol && node.ownerColor !== null && node.neighbors.every(id => nodes.some(neighbor => neighbor.id === id && neighbor.ownerColor === node.ownerColor)); }
