import { describe, it, expect } from 'vitest';
import {
  chooseRivalMoves,
  rankFiguresByPlayerNeglect,
  rankFiguresByDisruption,
} from '../src/games/succession/engine/rivalAI';
import { FigureState } from '../src/games/succession/engine/types';

describe('rivalAI - Behavioral Archetypes', () => {
  it('Aldric (The Opportunist) targets the figure neglected longest by the player', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 30, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'archbishop', favor: { player: 20, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'commander', favor: { player: 0, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
    ];

    // Player worked chancellor on segment 1, archbishop on segment 2; commander never targeted
    const history = [
      { figureId: 'chancellor' as const, segment: 1, claimantId: 'player' },
      { figureId: 'archbishop' as const, segment: 2, claimantId: 'player' },
    ];

    const neglected = rankFiguresByPlayerNeglect(figures, history);
    expect(neglected[0].id).toBe('commander');

    const assignments = chooseRivalMoves(figures, ['aldric'], history);
    expect(assignments[0].targetFigureId).toBe('commander');
  });

  it('Vivienne (The Disruptor) targets the figure where the player holds the narrowest positive lead', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 50, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: +40
      { id: 'archbishop', favor: { player: 25, aldric: 10, vivienne: 20 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: +5 (narrowest)
      { id: 'commander', favor: { player: 30, aldric: 10, vivienne: 15 }, mostRecentClaim: null, exposedAgainst: [] },  // lead: +15
    ];

    const { contested } = rankFiguresByDisruption(figures, 'vivienne');
    expect(contested[0].id).toBe('archbishop');

    const assignments = chooseRivalMoves(figures, ['vivienne']);
    expect(assignments[0].targetFigureId).toBe('archbishop');
  });

  it('Vivienne falls back to consolidation on her highest standing figure when player has no lead', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 10, aldric: 10, vivienne: 20 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: -10, V: 20
      { id: 'archbishop', favor: { player: 10, aldric: 10, vivienne: 35 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: -25, V: 35 (highest standing)
      { id: 'commander', favor: { player: 10, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },  // lead: 0, V: 10
    ];

    const { contested, uncontested } = rankFiguresByDisruption(figures, 'vivienne');
    expect(contested.length).toBe(0);
    expect(uncontested[0].id).toBe('archbishop');

    const assignments = chooseRivalMoves(figures, ['vivienne']);
    expect(assignments[0].targetFigureId).toBe('archbishop');
  });

  it('tactical deconfliction: Vivienne avoids Aldric target when alternative contested figure exists', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 20, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: +10 (narrowest for Vivienne, but neglected for Aldric)
      { id: 'archbishop', favor: { player: 30, aldric: 10, vivienne: 15 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: +15 (second narrowest)
      { id: 'commander', favor: { player: 40, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },  // lead: +30
    ];

    // Player targeted commander in segment 1
    const history = [
      { figureId: 'commander' as const, segment: 1, claimantId: 'player' },
    ];

    const assignments = chooseRivalMoves(figures, ['aldric', 'vivienne'], history);
    expect(assignments.length).toBe(2);

    const aldricMove = assignments.find((a) => a.rivalId === 'aldric');
    const vivienneMove = assignments.find((a) => a.rivalId === 'vivienne');

    // Aldric picks chancellor (neglected, ID sorted)
    expect(aldricMove?.targetFigureId).toBe('chancellor');
    // Vivienne deconflicts from chancellor and targets archbishop (+15 lead alternative)
    expect(vivienneMove?.targetFigureId).toBe('archbishop');
    expect(aldricMove?.targetFigureId).not.toBe(vivienneMove?.targetFigureId);
  });

  it('allows overlap when only one figure is contested and no viable alternative exists', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 50, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: +40
      { id: 'archbishop', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'commander', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
    ];

    // Player only ever touched chancellor
    const history = [
      { figureId: 'chancellor' as const, segment: 1, claimantId: 'player' },
    ];

    const assignments = chooseRivalMoves(figures, ['aldric', 'vivienne'], history);
    expect(assignments.find((a) => a.rivalId === 'aldric')?.targetFigureId).toBe('archbishop');
    expect(assignments.find((a) => a.rivalId === 'vivienne')?.targetFigureId).toBe('chancellor');
  });

  it('chooseRivalMoves is pure and deterministic', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 20, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'archbishop', favor: { player: 15, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'commander', favor: { player: 5, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
    ];

    const run1 = chooseRivalMoves(figures, ['aldric', 'vivienne']);
    const run2 = chooseRivalMoves(figures, ['aldric', 'vivienne']);

    expect(run1).toEqual(run2);
  });

  it('chooseRivalMoves returns empty array when rivalIds is empty', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 20, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
    ];
    expect(chooseRivalMoves(figures, [])).toEqual([]);
  });

  it('rankFiguresByPlayerNeglect handles history with scout moves lacking figureId', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 10, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'archbishop', favor: { player: 0, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'commander', favor: { player: 0, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
    ];

    const history = [
      { figureId: null, segment: 1, claimantId: 'player' },
      { figureId: 'chancellor' as const, segment: 2, claimantId: 'player' },
    ];

    const ranked = rankFiguresByPlayerNeglect(figures, history);
    // Archbishop and commander were never targeted (segment 0), chancellor was targeted in seg 2
    expect(ranked[ranked.length - 1].id).toBe('chancellor');
    expect(['archbishop', 'commander']).toContain(ranked[0].id);
  });

  it('rankFiguresByDisruption breaks ties for narrowest lead by higher stakes', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 40, aldric: 10, vivienne: 30 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: +10, player favor: 40
      { id: 'archbishop', favor: { player: 20, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] }, // lead: +10, player favor: 20
      { id: 'commander', favor: { player: 50, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },  // lead: +40
    ];

    const { contested } = rankFiguresByDisruption(figures, 'vivienne');
    // Both chancellor and archbishop have lead +10; chancellor has higher player favor (40 vs 20) -> higher stakes
    expect(contested[0].id).toBe('chancellor');
    expect(contested[1].id).toBe('archbishop');
  });

  it('adapts dynamically over multiple segments', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 20, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'archbishop', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'commander', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
    ];

    // Segment 1: Player whispers chancellor
    const historySeg1 = [{ figureId: 'chancellor' as const, segment: 1, claimantId: 'player' }];
    const movesSeg1 = chooseRivalMoves(figures, ['aldric', 'vivienne'], historySeg1);
    expect(movesSeg1.find((m) => m.rivalId === 'aldric')?.targetFigureId).toBe('archbishop'); // neglected
    expect(movesSeg1.find((m) => m.rivalId === 'vivienne')?.targetFigureId).toBe('chancellor'); // narrowest lead (+20)

    // Segment 2: Player shifts to archbishop
    figures[0].favor.vivienne = 10;
    figures[1].favor.aldric = 10;
    figures[1].favor.player = 20; // Player now leads archbishop (+10) and chancellor (+10)

    const historySeg2 = [
      ...historySeg1,
      { figureId: 'archbishop' as const, segment: 2, claimantId: 'player' },
    ];

    const movesSeg2 = chooseRivalMoves(figures, ['aldric', 'vivienne'], historySeg2);
    // Commander is now the only figure never targeted -> Aldric moves on commander!
    expect(movesSeg2.find((m) => m.rivalId === 'aldric')?.targetFigureId).toBe('commander');
    // Vivienne targets narrowest lead (archbishop: 20 - 0 = 20 vs chancellor: 20 - 10 = 10 -> chancellor)
    expect(movesSeg2.find((m) => m.rivalId === 'vivienne')?.targetFigureId).toBe('chancellor');
  });

  it('generic fallback handles custom rivals without crashing', () => {
    const figures: FigureState[] = [
      { id: 'chancellor', favor: { player: 20, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'archbishop', favor: { player: 30, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      { id: 'commander', favor: { player: 10, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
    ];

    const assignments = chooseRivalMoves(figures, ['player']);
    expect(assignments.length).toBe(1);
    expect(assignments[0].rivalId).toBe('player');
  });

  describe('Rival Counter-Play & Slander Thresholds (Phase 10)', () => {
    it('deploys slander when player lead is >= 16 points (Decisive Favor)', () => {
      const figures: FigureState[] = [
        { id: 'chancellor', favor: { player: 30, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] }, // player lead: 20 (>= 16)
        { id: 'archbishop', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'commander', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
      ];

      const assignments = chooseRivalMoves(figures, ['vivienne']);
      expect(assignments[0].targetFigureId).toBe('chancellor');
      expect(assignments[0].moveType).toBe('slander');
    });

    it('deploys whisper when player lead is < 16 points', () => {
      const figures: FigureState[] = [
        { id: 'chancellor', favor: { player: 25, aldric: 10, vivienne: 12 }, mostRecentClaim: null, exposedAgainst: [] }, // player lead: 13 (< 16)
        { id: 'archbishop', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'commander', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
      ];

      const assignments = chooseRivalMoves(figures, ['vivienne']);
      expect(assignments[0].targetFigureId).toBe('chancellor');
      expect(assignments[0].moveType).toBe('whisper');
    });

    it('Aldric deploys slander if his chosen neglected target happens to have player lead >= 16', () => {
      const figures: FigureState[] = [
        { id: 'chancellor', favor: { player: 20, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'archbishop', favor: { player: 20, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'commander', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
      ];

      // Player targeted chancellor in seg 1, commander in seg 2; archbishop is neglected
      const history = [
        { figureId: 'chancellor' as const, segment: 1, claimantId: 'player' },
        { figureId: 'commander' as const, segment: 2, claimantId: 'player' },
      ];

      const assignments = chooseRivalMoves(figures, ['aldric'], history);
      expect(assignments[0].targetFigureId).toBe('archbishop');
      // On archbishop, player has 20, aldric has 0 (lead = 20 >= 16) -> slander!
      expect(assignments[0].moveType).toBe('slander');
    });

    it('Aldric deploys whisper when his chosen neglected target has player lead < 16', () => {
      const figures: FigureState[] = [
        { id: 'chancellor', favor: { player: 30, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'archbishop', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'commander', favor: { player: 0, aldric: 0, vivienne: 0 }, mostRecentClaim: null, exposedAgainst: [] },
      ];

      // Commander is neglected and player has 0 favor on commander (lead = 0 < 16)
      const history = [
        { figureId: 'chancellor' as const, segment: 1, claimantId: 'player' },
      ];

      const assignments = chooseRivalMoves(figures, ['aldric'], history);
      expect(assignments[0].targetFigureId).toBe('archbishop'); // tie-broken by ID
      expect(assignments[0].moveType).toBe('whisper');
    });
  });
});
