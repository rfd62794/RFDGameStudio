// new: examples/bpo-sim/src/systems/countrySystem.ts
import type { Agent } from '../types';
import type { CountryAttribute, CountryProfile } from '../data/countries';
import { ATTRIBUTE_RANGES, COUNTRY_ATTRIBUTES } from '../data/countries';

/**
 * Stand-in profile used before a country is chosen: every effect is switched off.
 * It is not listed in countries.yaml and never shown to the player as a choice.
 */
export const NEUTRAL_PROFILE: CountryProfile = {
  id: 'neutral',
  name: 'Standard operation',
  region: 'Anywhere',
  blurb: 'Baseline numbers with no country effects.',
  laborCostIndex: 1,
  talentPoolIndex: 1,
  clientOverlap: 1,
  connectivityRisk: 0.14,
  attritionRate: 0,
  regulatoryOverhead: 0,
};

/** The outage chance the event table was written with. A country at this value sees outages as often as before. */
export const BASELINE_CONNECTIVITY_RISK = 0.14;
/** Candidates the recruiting screen offered before countries existed. */
export const BASE_CANDIDATE_COUNT = 6;
/** The yearly attrition rate is spread over this many working days to get a daily chance. */
export const ATTRITION_DAYS = 30;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Share of calls that still connect when little of the day overlaps with the client: between 0.6 and 1. */
export function contactWindowFactor(clientOverlap: number): number {
  return 0.6 + 0.4 * clamp(clientOverlap, 0, 1);
}

/** Payout per completed call after compliance work takes its share. */
export function netPayout(payout: number, regulatoryOverhead: number): number {
  return payout * (1 - clamp(regulatoryOverhead, 0, 0.5));
}

/** What a candidate asks for in this country (the signing bonus follows, it is a share of the salary). */
export function scaleSalary(baseSalary: number, laborCostIndex: number): number {
  return Math.round(baseSalary * laborCostIndex);
}

/** How many candidates the recruiting screen offers. Baseline is the original six. */
export function candidateCount(talentPoolIndex: number): number {
  return clamp(Math.round(BASE_CANDIDATE_COUNT * talentPoolIndex), 2, 10);
}

/** Weight of a floor event in the random draw: the network outage follows the country's connectivity risk, the rest stay at 1. */
export function eventWeight(eventId: string, connectivityRisk: number): number {
  return eventId === 'fiber_cut' ? connectivityRisk / BASELINE_CONNECTIVITY_RISK : 1;
}

/** Weighted pick. `rng` returns a number in [0, 1). */
export function pickWeighted<T extends { id: string }>(items: ReadonlyArray<T>, weightOf: (id: string) => number, rng: () => number): T {
  const weights = items.map((i) => Math.max(0, weightOf(i.id)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Chance that one agent resigns at the end of a day. */
export function dailyQuitChance(attritionRate: number): number {
  return clamp(attritionRate, 0, 1) / ATTRITION_DAYS;
}

/** Day-end turnover. The floor never empties: at least one agent always stays. */
export function applyAttrition(agents: ReadonlyArray<Agent>, attritionRate: number, rng: () => number): { stayed: Agent[]; left: Agent[] } {
  const chance = dailyQuitChance(attritionRate);
  const stayed: Agent[] = [];
  const left: Agent[] = [];
  for (const a of agents) {
    if (rng() < chance) left.push(a);
    else stayed.push(a);
  }
  if (stayed.length === 0 && left.length > 0) stayed.push(left.shift() as Agent);
  return { stayed, left };
}

export type AttributeLevel = 'Low' | 'Medium' | 'High';

/** Plain-word level for a card: the lower, middle or upper third of the attribute's allowed range. */
export function attributeLevel(key: CountryAttribute, value: number): AttributeLevel {
  const [min, max] = ATTRIBUTE_RANGES[key];
  const t = (value - min) / (max - min);
  return t < 1 / 3 ? 'Low' : t < 2 / 3 ? 'Medium' : 'High';
}

export interface AttributeRow {
  key: CountryAttribute;
  label: string;
  level: AttributeLevel;
}

export const ATTRIBUTE_LABELS: Record<CountryAttribute, string> = {
  laborCostIndex: 'Labor cost',
  talentPoolIndex: 'Talent pool',
  clientOverlap: 'Overlap with client hours',
  connectivityRisk: 'Outage risk',
  attritionRate: 'Staff turnover',
  regulatoryOverhead: 'Compliance overhead',
};

/** The six rows a country card shows, in plain words. */
export function attributeRows(profile: CountryProfile): AttributeRow[] {
  return COUNTRY_ATTRIBUTES.map((key) => ({ key, label: ATTRIBUTE_LABELS[key], level: attributeLevel(key, profile[key]) }));
}
