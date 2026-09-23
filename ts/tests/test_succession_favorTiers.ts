import { describe, it, expect } from 'vitest';
import { getFigureQualitativeStanding } from '../src/games/succession/utils/favorTiers';
import { FigureState } from '../src/games/succession/engine/types';

describe('favorTiers - Qualitative Standing Tiers (Fog-of-War)', () => {
  it('maps 0 favor to Uncommitted / Even', () => {
    const figure: FigureState = {
      id: 'chancellor',
      favor: { player: 0, aldric: 0, vivienne: 0 },
      mostRecentClaim: null,
      exposedAgainst: [],
    };

    const standing = getFigureQualitativeStanding(figure);
    expect(standing.tier).toBe('Uncommitted / Even');
    expect(standing.leaderId).toBeNull();
    expect(standing.label).toBe('Uncommitted');
    expect(standing.claimantStandings[0].description).toBe('Uncommitted');
  });

  it('maps ties and margins <= 3 points to Uncommitted / Even (Evenly Contested)', () => {
    const figure: FigureState = {
      id: 'chancellor',
      favor: { player: 20, aldric: 18, vivienne: 17 }, // lead is 2 points (<= 3)
      mostRecentClaim: null,
      exposedAgainst: [],
    };

    const standing = getFigureQualitativeStanding(figure);
    expect(standing.tier).toBe('Uncommitted / Even');
    expect(standing.leaderId).toBeNull();
    expect(standing.label).toBe('Evenly Contested');
  });

  it('maps lead of 4–15 points to Slight Lean', () => {
    // 4 points lead (lower boundary)
    const fig1: FigureState = {
      id: 'archbishop',
      favor: { player: 24, aldric: 20, vivienne: 10 },
      mostRecentClaim: null,
      exposedAgainst: [],
    };
    const s1 = getFigureQualitativeStanding(fig1);
    expect(s1.tier).toBe('Slight Lean');
    expect(s1.leaderId).toBe('player');
    expect(s1.label).toBe('Slight Lean toward You');

    // 15 points lead (upper boundary)
    const fig2: FigureState = {
      id: 'commander',
      favor: { player: 10, aldric: 25, vivienne: 5 }, // Aldric leads by 15
      mostRecentClaim: null,
      exposedAgainst: [],
    };
    const s2 = getFigureQualitativeStanding(fig2);
    expect(s2.tier).toBe('Slight Lean');
    expect(s2.leaderId).toBe('aldric');
    expect(s2.label).toBe('Slight Lean toward Lord Aldric');
  });

  it('maps lead of 16–30 points to Decisive Favor', () => {
    // 16 points lead (lower boundary)
    const fig1: FigureState = {
      id: 'chancellor',
      favor: { player: 36, aldric: 20, vivienne: 10 },
      mostRecentClaim: null,
      exposedAgainst: [],
    };
    const s1 = getFigureQualitativeStanding(fig1);
    expect(s1.tier).toBe('Decisive Favor');
    expect(s1.leaderId).toBe('player');
    expect(s1.label).toBe('Decisive Favor for You');

    // 30 points lead (upper boundary)
    const fig2: FigureState = {
      id: 'archbishop',
      favor: { player: 10, aldric: 10, vivienne: 40 }, // Vivienne leads by 30
      mostRecentClaim: null,
      exposedAgainst: [],
    };
    const s2 = getFigureQualitativeStanding(fig2);
    expect(s2.tier).toBe('Decisive Favor');
    expect(s2.leaderId).toBe('vivienne');
    expect(s2.label).toBe('Decisive Favor for Lady Vivienne');
  });

  it('maps lead of 31+ points to Unyielding Backing', () => {
    // 31 points lead (boundary)
    const fig1: FigureState = {
      id: 'commander',
      favor: { player: 51, aldric: 20, vivienne: 10 },
      mostRecentClaim: null,
      exposedAgainst: [],
    };
    const s1 = getFigureQualitativeStanding(fig1);
    expect(s1.tier).toBe('Unyielding Backing');
    expect(s1.leaderId).toBe('player');
    expect(s1.label).toBe('Unyielding Backing for You');

    // Rival 35 points lead
    const fig2: FigureState = {
      id: 'commander',
      favor: { player: 10, aldric: 45, vivienne: 5 },
      mostRecentClaim: null,
      exposedAgainst: [],
    };
    const s2 = getFigureQualitativeStanding(fig2);
    expect(s2.tier).toBe('Unyielding Backing');
    expect(s2.leaderId).toBe('aldric');
    expect(s2.label).toBe('Unyielding Backing for Lord Aldric');
  });

  it('generates accurate relative qualitative descriptions for trailing claimants', () => {
    const figure: FigureState = {
      id: 'chancellor',
      favor: { player: 45, aldric: 25, vivienne: 8 }, // top: player (45), Aldric: 25 (lead: 20 -> Decisive Favor, def 20 -> Substantial Deficit), Vivienne: 8 (def 37 -> Severely Outpaced)
      mostRecentClaim: null,
      exposedAgainst: [],
    };

    const standing = getFigureQualitativeStanding(figure);
    const playerStanding = standing.claimantStandings.find((c) => c.claimantId === 'player');
    const aldricStanding = standing.claimantStandings.find((c) => c.claimantId === 'aldric');
    const vivienneStanding = standing.claimantStandings.find((c) => c.claimantId === 'vivienne');

    expect(playerStanding?.description).toBe('Decisive Favor');
    expect(aldricStanding?.description).toBe('Substantial Deficit');
    expect(vivienneStanding?.description).toBe('Severely Outpaced');
  });
});
