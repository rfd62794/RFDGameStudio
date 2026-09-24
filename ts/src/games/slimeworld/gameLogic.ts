import { hashStringToSeed } from '../../engine/shared/seededRandom';
import type { PlanetNode, Slime, SlimeColor, SlimePattern } from './types';

export const COLOR_SPECS: Record<SlimeColor, { rgb: string; specialty: string }> = {
  Red: { rgb: '#ef4444', specialty: 'Cinder Strain' }, Orange: { rgb: '#f97316', specialty: 'Marsh Strain' }, Yellow: { rgb: '#eab308', specialty: 'Gale Strain' }, Green: { rgb: '#22c55e', specialty: 'Tundra Strain' }, Purple: { rgb: '#a855f7', specialty: 'Crystal Strain' }, Blue: { rgb: '#3b82f6', specialty: 'Tide Strain' }, Gray: { rgb: '#94a3b8', specialty: 'Void Strain' },
};
export const PATTERN_DESCRIPTIONS: Record<SlimePattern, { name: string; bonus: string; description: string }> = {
  Solid: { name: 'Solid', bonus: 'None', description: 'Homogeneous membrane.' }, Stripe: { name: 'Stripe', bonus: 'Patterned', description: 'Striped membrane.' }, Polka: { name: 'Polka', bonus: 'Patterned', description: 'Spotted membrane.' }, Glow: { name: 'Glow', bonus: 'Low contrast', description: 'Faint accent membrane.' }, Crown: { name: 'Crown', bonus: 'Legacy', description: 'Legacy pattern compatibility.' }, Ringed: { name: 'Ringed', bonus: 'Spiral', description: 'Spiral Turing regime.' }, Nebula: { name: 'Nebula', bonus: 'Labyrinthine', description: 'Labyrinthine Turing regime.' }, Obsidian: { name: 'Obsidian', bonus: 'High contrast', description: 'Maximum contrast accent.' },
};
export interface RawColorTarget { id: string; tier: string; name: string; center_hues: number[]; tolerance: number; saturation_min: number; saturation_max: number; }
export interface RawShapeTarget { id: string; tier: number; name: string; vertex_count: number; vertex_tolerance: number; irregularity_min?: number; irregularity_max: number; step?: number; }
export function stageFromLevel(level: number): string { return level < 3 ? 'Hatchling' : level < 6 ? 'Juvenile' : level < 10 ? 'Young' : level < 15 ? 'Prime' : level < 20 ? 'Veteran' : 'Elder'; }
// Market sale pricing (SlimeBreeder absorption step 2.3) — mirrors the Lua
// implementation in games/slimeworld/economy.lua. Tuning numbers live in
// games/slimeworld/data.yaml `market:`; MARKET_DEFAULTS mirrors it and
// applies when no market config is supplied.
export interface MarketConfig { level_value_step?: number; value_variance_range?: number; flood_decay_per_sale?: number; flood_multiplier_floor?: number; flood_window_cycles?: number; }
export const MARKET_DEFAULTS: Required<MarketConfig> = { level_value_step: 0.125, value_variance_range: 0.10, flood_decay_per_sale: 0.12, flood_multiplier_floor: 0.3, flood_window_cycles: 5 };
const MARKET_COLOR_TIERS: Record<string, number> = { Red: 1, Yellow: 1, Blue: 1, Orange: 2, Green: 2, Purple: 2, Gray: 1 };
const MARKET_SHAPE_TIERS: Record<string, number> = { Triangle: 1, Square: 1, Circle: 1, Star: 2, Diamond: 2, Teardrop: 2, Pentagon: 3, Crescent: 3, Hexa: 3, Crown: 4 };
const MARKET_TIER_VALUE: Record<number, number> = { 1: 5, 2: 22, 3: 95, 4: 300 };
const MARKET_SHAPE_ANCHORS: Array<{ shape: string; vertex: number; irregularity: number }> = [
  { shape: 'Triangle', vertex: 3, irregularity: 5 }, { shape: 'Square', vertex: 4, irregularity: 5 }, { shape: 'Circle', vertex: 12, irregularity: 0 }, { shape: 'Star', vertex: 5, irregularity: 60 }, { shape: 'Diamond', vertex: 4, irregularity: 40 }, { shape: 'Teardrop', vertex: 6, irregularity: 50 }, { shape: 'Pentagon', vertex: 5, irregularity: 10 }, { shape: 'Crescent', vertex: 7, irregularity: 70 }, { shape: 'Hexa', vertex: 6, irregularity: 15 }, { shape: 'Crown', vertex: 8, irregularity: 85 },
];
export function getColorTier(color: string): number { return MARKET_COLOR_TIERS[color] ?? 1; }
export function getShapeTier(shape: string): number { return MARKET_SHAPE_TIERS[shape] ?? 1; }
export function snapToShapeName(vertexCount: number, irregularity: number): string { let closest = MARKET_SHAPE_ANCHORS[0].shape; let minDistance = Infinity; for (const anchor of MARKET_SHAPE_ANCHORS) { const distance = (vertexCount - anchor.vertex) ** 2 + (irregularity - anchor.irregularity) ** 2; if (distance < minDistance) { closest = anchor.shape; minDistance = distance; } } return closest; }
export function calculateTierValue(color: string, shape: string, variance = 0): number { const colorValue = MARKET_TIER_VALUE[getColorTier(color)] ?? 5; const shapeValue = MARKET_TIER_VALUE[getShapeTier(shape)] ?? 5; return Math.max(1, Math.floor((colorValue + shapeValue) * (1 + variance) + 0.5)); }
// Deterministic per-slime sale variance seeded from the slime id: the
// archive's 21 discrete outcomes spanning +/-range (0.01 steps at the
// default 0.10 range, matching slimeGenerator.ts's toFixed(2) roll).
export function slimeValueVariance(slimeId: string, varianceRange = MARKET_DEFAULTS.value_variance_range): number { return ((hashStringToSeed(slimeId ?? '') % 21) - 10) * (varianceRange / 10); }
export function calculateMarketPrice(slime: Slime, recentSalesForColor: number, market?: MarketConfig): number { const config = { ...MARKET_DEFAULTS }; if (market) { for (const key of Object.keys(config) as Array<keyof MarketConfig>) { const value = market[key]; if (typeof value === 'number') config[key] = value; } } const variance = slime.variance ?? slimeValueVariance(slime.id, config.value_variance_range); const tierValue = calculateTierValue(slime.color ?? 'Gray', snapToShapeName(slime.vertexCount ?? 4, slime.irregularity ?? 10), variance); const levelScale = 1 + (slime.level - 1) * config.level_value_step; const floodMultiplier = Math.max(config.flood_multiplier_floor, 1 - recentSalesForColor * config.flood_decay_per_sale); return Math.floor(tierValue * levelScale * floodMultiplier); }
export function getHueDeviation(hue: number): { baseColor: SlimeColor; deviation: number } { const baseColor = (Object.entries({ Red: 0, Orange: 60, Yellow: 120, Green: 180, Purple: 240, Blue: 300 }) as Array<[SlimeColor, number]>).sort((a, b) => Math.abs(a[1] - hue) - Math.abs(b[1] - hue))[0]; return { baseColor: baseColor[0], deviation: Math.abs(baseColor[1] - hue) }; }
export function getColorRegentCost(color: SlimeColor, discovered: boolean): number { const tierMap: Partial<Record<SlimeColor, number>> = { Purple: 1, Orange: 1, Green: 1, Gray: 3 }; const baseCost = (tierMap[color] ?? 0) * 80; return discovered ? baseCost : Math.round(baseCost * 2); }
export function getTargetRegentCost(targetId: string, discovered: boolean): number { const isRival = targetId.startsWith('rival_'); const baseCost = isRival ? 200 : 120; return discovered ? baseCost : Math.round(baseCost * 2); }
export function isCapitolHardened(node: PlanetNode, nodes: PlanetNode[]): boolean { return node.isCapitol && node.ownerColor !== null && node.neighbors.every(id => nodes.some(neighbor => neighbor.id === id && neighbor.ownerColor === node.ownerColor)); }
