import type { PlanetNode, SlimeColor, SlimePattern } from './types';

export const COLOR_SPECS: Record<SlimeColor, { rgb: string; specialty: string }> = {
  Red: { rgb: '#ef4444', specialty: 'Cinder Strain' }, Orange: { rgb: '#f97316', specialty: 'Marsh Strain' }, Yellow: { rgb: '#eab308', specialty: 'Gale Strain' }, Green: { rgb: '#22c55e', specialty: 'Tundra Strain' }, Purple: { rgb: '#a855f7', specialty: 'Crystal Strain' }, Blue: { rgb: '#3b82f6', specialty: 'Tide Strain' }, Gray: { rgb: '#94a3b8', specialty: 'Void Strain' },
};
export const PATTERN_DESCRIPTIONS: Record<SlimePattern, string> = { Solid: 'Homogeneous', Stripe: 'Striped', Polka: 'Spotted', Glow: 'Faint contrast', Crown: 'Legacy form', Ringed: 'Spiral regime', Nebula: 'Labyrinthine', Obsidian: 'Maximum contrast' };
export const COLOR_TARGETS: Array<{ id: string; name: string; tier: number }> = [];
export function stageFromLevel(level: number): string { return level < 3 ? 'Hatchling' : level < 6 ? 'Juvenile' : level < 10 ? 'Young' : level < 15 ? 'Prime' : level < 20 ? 'Veteran' : 'Elder'; }
export function calculateMarketPrice(): number { return 0; }
export function getHueDeviation(): number { return 0; }
export function getColorRegentCost(): number { return 0; }
export function getTargetRegentCost(): number { return 0; }
export function isCapitolHardened(node: PlanetNode, nodes: PlanetNode[]): boolean { return node.isCapitol && node.ownerColor !== null && node.neighbors.every(id => nodes.some(neighbor => neighbor.id === id && neighbor.ownerColor === node.ownerColor)); }
