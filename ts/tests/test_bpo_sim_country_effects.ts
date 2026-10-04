// @vitest-environment node
// new: ts/tests/test_bpo_sim_country_effects.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadCountries, COUNTRY_ATTRIBUTES } from '../../examples/bpo-sim/src/data/countries';
import {
  NEUTRAL_PROFILE, BASE_CANDIDATE_COUNT, contactWindowFactor, netPayout, scaleSalary, candidateCount, eventWeight,
  pickWeighted, dailyQuitChance, applyAttrition, attributeLevel, attributeRows, ATTRIBUTE_LABELS,
} from '../../examples/bpo-sim/src/systems/countrySystem';
import { computeCallGenerationRate } from '../../examples/bpo-sim/src/systems/dialerSystem';
import { createList } from '../../examples/bpo-sim/src/systems/listSystem';
import type { Agent } from '../../examples/bpo-sim/src/types';

const read = (rel: string) => readFileSync(new URL(`../../examples/bpo-sim/src/${rel}`, import.meta.url), 'utf8');
const countries = loadCountries(read('data/countries.yaml'));

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const agent = (id: string): Agent => ({ id, name: `Agent ${id}` } as unknown as Agent);

describe('test_bpo_sim_country_effects', () => {
  it('the neutral profile switches every effect off', () => {
    const p = NEUTRAL_PROFILE;
    expect(contactWindowFactor(p.clientOverlap)).toBe(1);
    expect(netPayout(145, p.regulatoryOverhead)).toBe(145);
    expect(scaleSalary(22000, p.laborCostIndex)).toBe(22000);
    expect(candidateCount(p.talentPoolIndex)).toBe(BASE_CANDIDATE_COUNT);
    expect(eventWeight('fiber_cut', p.connectivityRisk)).toBe(1);
    expect(dailyQuitChance(p.attritionRate)).toBe(0);
  });

  it('each effect moves the way its attribute says', () => {
    expect(contactWindowFactor(0)).toBeCloseTo(0.6, 5);
    expect(contactWindowFactor(1)).toBe(1);
    expect(contactWindowFactor(0.5)).toBeGreaterThan(contactWindowFactor(0.2));
    expect(netPayout(100, 0.1)).toBeCloseTo(90, 5);
    expect(netPayout(100, 0.2)).toBeLessThan(netPayout(100, 0.05));
    expect(scaleSalary(20000, 1.5)).toBe(30000);
    expect(scaleSalary(20000, 0.5)).toBe(10000);
    expect(candidateCount(0.3)).toBe(2);
    expect(candidateCount(1.8)).toBe(10);
    expect(candidateCount(1)).toBe(6);
    expect(eventWeight('fiber_cut', 0.28)).toBeCloseTo(2, 5);
    expect(eventWeight('storm', 0.28)).toBe(1);
    expect(dailyQuitChance(0.3)).toBeCloseTo(0.01, 5);
  });

  it('a larger share of the day shared with the client generates more calls, and the default changes nothing', () => {
    const list = createList('l', 'ACBS', 100, 100, 500);
    const dialer = { pace: 6, tier: 1 };
    const none = computeCallGenerationRate(dialer, list, 5);
    expect(computeCallGenerationRate(dialer, list, 5, 1)).toBe(none);
    expect(computeCallGenerationRate(dialer, list, 5, contactWindowFactor(0))).toBeLessThan(none);
    expect(computeCallGenerationRate(dialer, list, 5, contactWindowFactor(0.9))).toBeGreaterThan(computeCallGenerationRate(dialer, list, 5, contactWindowFactor(0.1)));
  });

  it('the weighted pick favours the outage more when connectivity risk is higher, and is repeatable', () => {
    const events = [{ id: 'storm' }, { id: 'fiber_cut' }, { id: 'client_bonus' }, { id: 'lunch' }];
    const count = (risk: number) => {
      const rng = seeded(5);
      let outages = 0;
      for (let i = 0; i < 4000; i++) {
        if (pickWeighted(events, (id) => eventWeight(id, risk), rng).id === 'fiber_cut') outages++;
      }
      return outages;
    };
    expect(count(0.35)).toBeGreaterThan(count(0.07));
    expect(count(0.2)).toBe(count(0.2));
  });

  it('attrition: nobody leaves at rate 0, someone leaves at high rates, and one agent always stays', () => {
    const agents = Array.from({ length: 10 }, (_, i) => agent(String(i)));
    expect(applyAttrition(agents, 0, () => 0).left.length).toBe(0);
    const everyone = applyAttrition(agents, 0.6, () => 0);
    expect(everyone.stayed.length).toBe(1);
    expect(everyone.left.length).toBe(9);
    const rng = seeded(9);
    let leaving = 0;
    for (let day = 0; day < 300; day++) leaving += applyAttrition(agents, 0.3, rng).left.length;
    expect(leaving / 300).toBeGreaterThan(0.05);
    expect(leaving / 300).toBeLessThan(0.2);
  });

  it('every real country gives sane effects', () => {
    for (const c of countries) {
      expect(contactWindowFactor(c.clientOverlap), c.id).toBeGreaterThanOrEqual(0.6);
      expect(contactWindowFactor(c.clientOverlap), c.id).toBeLessThanOrEqual(1);
      expect(netPayout(100, c.regulatoryOverhead), c.id).toBeGreaterThan(79);
      expect(candidateCount(c.talentPoolIndex), c.id).toBeGreaterThanOrEqual(2);
      expect(candidateCount(c.talentPoolIndex), c.id).toBeLessThanOrEqual(10);
      expect(dailyQuitChance(c.attritionRate), c.id).toBeGreaterThan(0);
      expect(eventWeight('fiber_cut', c.connectivityRisk), c.id).toBeGreaterThan(0.3);
    }
  });

  it('each country card has all six attributes in plain words', () => {
    for (const c of countries) {
      const rows = attributeRows(c);
      expect(rows.map((r) => r.key)).toEqual([...COUNTRY_ATTRIBUTES]);
      for (const r of rows) {
        expect(r.label).toBe(ATTRIBUTE_LABELS[r.key]);
        expect(['Low', 'Medium', 'High']).toContain(r.level);
      }
    }
    expect(attributeLevel('laborCostIndex', 0.6)).toBe('Low');
    expect(attributeLevel('laborCostIndex', 1.5)).toBe('High');
    const levels = new Set(countries.map((c) => attributeLevel('clientOverlap', c.clientOverlap)));
    expect(levels.size).toBe(3);
  });

  it('the selector screen lists every country from the data and offers each as a choice', () => {
    const screen = read('components/CountrySelectScreen.tsx');
    expect(screen).toContain('countries.map((c) =>');
    expect(screen).toContain('onClick={() => onChoose(c.id)}');
    expect(screen).toContain('attributeRows(c)');
    expect(screen).toContain('CHOOSE WHERE YOUR OPERATION RUNS');
    expect(screen).toContain('data-testid="country-select"');
  });

  it('the app waits for a country, applies each effect, and a reset asks again', () => {
    const app = read('App.tsx');
    expect(app).toContain('countryId === null');
    expect(app).toContain('contactWindowFactor(profile.clientOverlap)');
    expect(app).toContain('netPayout(activeCamp.payoutPerCall, profile.regulatoryOverhead)');
    expect(app).toContain('pickWeighted(eventPool');
    expect(app).toContain('applyAttrition(agentsRef.current, profile.attritionRate, Math.random)');
    expect(app).toContain("localStorage.removeItem('bpo_country')");
    expect(app).toContain('laborCostIndex={profile.laborCostIndex}');
    expect(app).toContain('talentPoolIndex={profile.talentPoolIndex}');
    const recruiting = read('components/RecruitingModal.tsx');
    expect(recruiting).toContain('candidateCount(talentPoolIndex)');
    expect(recruiting).toContain('scaleSalary(baseSal + exp * 1500, laborCostIndex)');
  });
});
