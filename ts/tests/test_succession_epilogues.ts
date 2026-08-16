import { describe, it, expect } from 'vitest';
import { getEpilogue } from '../src/games/succession/data/epilogues';
import { VerdictResult } from '../src/games/succession/engine/verdict';

describe('Narrative Epilogues & Origin Autopsies (Phase 14)', () => {
  it('resolves_unanimous_grand_triad_player_victory', () => {
    const verdict: VerdictResult = {
      perFigureWinner: {
        chancellor: 'player',
        archbishop: 'player',
        commander: 'player',
      },
      overallWinner: 'player',
      isMajority: true,
    };

    const epilogue = getEpilogue(verdict, 'bastard_scion');
    expect(epilogue.fateOutcome).toBe('ascension');
    expect(epilogue.chapterTitle).toBe('Book I: The Golden Restoration');
    expect(epilogue.coalitionDescription).toContain('Grand Triad');
    expect(epilogue.originFlavor).toContain('unacknowledged heir');
    expect(epilogue.postMortems.length).toBe(3);
    expect(epilogue.postMortems.every((p) => p.reactionType === 'endorsing')).toBe(true);
  });

  it('resolves_high_sanctum_and_estate_coalition_chancellor_and_archbishop', () => {
    const verdict: VerdictResult = {
      perFigureWinner: {
        chancellor: 'player',
        archbishop: 'player',
        commander: 'aldric',
      },
      overallWinner: 'player',
      isMajority: true,
    };

    const epilogue = getEpilogue(verdict, 'disgraced_knight');
    expect(epilogue.fateOutcome).toBe('ascension');
    expect(epilogue.chapterTitle).toBe('Book I: The Sovereign Concordat');
    expect(epilogue.coalitionDescription).toContain('High Sanctum & Estate');
    expect(epilogue.originFlavor).toContain('Citadel Siege');
    expect(epilogue.postMortems.find((p) => p.figureId === 'commander')?.reactionType).toBe('opposing');
  });

  it('resolves_steel_and_treasury_pact_chancellor_and_commander', () => {
    const verdict: VerdictResult = {
      perFigureWinner: {
        chancellor: 'player',
        archbishop: 'vivienne',
        commander: 'player',
      },
      overallWinner: 'player',
      isMajority: true,
    };

    const epilogue = getEpilogue(verdict, 'merchant_banker');
    expect(epilogue.fateOutcome).toBe('ascension');
    expect(epilogue.chapterTitle).toBe('Book I: The Iron Ledger');
    expect(epilogue.coalitionDescription).toContain('Steel & Treasury Pact');
    expect(epilogue.originFlavor).toContain('counting houses');
  });

  it('resolves_sacred_vanguard_alliance_archbishop_and_commander', () => {
    const verdict: VerdictResult = {
      perFigureWinner: {
        chancellor: 'aldric',
        archbishop: 'player',
        commander: 'player',
      },
      overallWinner: 'player',
      isMajority: true,
    };

    const epilogue = getEpilogue(verdict, 'bastard_scion');
    expect(epilogue.fateOutcome).toBe('ascension');
    expect(epilogue.chapterTitle).toBe('Book I: The Holy Crusade');
    expect(epilogue.coalitionDescription).toContain('Sacred Vanguard Alliance');
  });

  it('resolves_deadlock_tiebreak_ascension_via_cleanest_record', () => {
    const verdict: VerdictResult = {
      perFigureWinner: {
        chancellor: 'aldric',
        archbishop: 'vivienne',
        commander: 'player',
      },
      overallWinner: 'player',
      isMajority: false,
    };

    const epilogue = getEpilogue(verdict, 'disgraced_knight');
    expect(epilogue.fateOutcome).toBe('ascension');
    expect(epilogue.title).toBe('Ascension by Compromise');
    expect(epilogue.subtitle).toContain('Deadlock Tiebreak');
    expect(epilogue.chapterTitle).toBe('Book I: The Fragile Mandate');
  });

  it('resolves_rival_usurpation_by_aldric_and_vivienne', () => {
    const aldricVerdict: VerdictResult = {
      perFigureWinner: {
        chancellor: 'aldric',
        archbishop: 'aldric',
        commander: 'player',
      },
      overallWinner: 'aldric',
      isMajority: true,
    };

    const aldricEpilogue = getEpilogue(aldricVerdict, 'bastard_scion');
    expect(aldricEpilogue.fateOutcome).toBe('usurpation');
    expect(aldricEpilogue.subtitle).toContain('Lord Aldric');
    expect(aldricEpilogue.originFlavor).toContain('unrecognized');

    const vivienneVerdict: VerdictResult = {
      perFigureWinner: {
        chancellor: 'vivienne',
        archbishop: 'vivienne',
        commander: 'player',
      },
      overallWinner: 'vivienne',
      isMajority: true,
    };

    const vivienneEpilogue = getEpilogue(vivienneVerdict, 'merchant_banker');
    expect(vivienneEpilogue.fateOutcome).toBe('usurpation');
    expect(vivienneEpilogue.subtitle).toContain('Lady Vivienne');
    expect(vivienneEpilogue.originFlavor).toContain('banking guild');
  });

  it('resolves_total_interregnum_when_no_overall_winner', () => {
    const deadlockVerdict: VerdictResult = {
      perFigureWinner: {
        chancellor: null,
        archbishop: null,
        commander: null,
      },
      overallWinner: null,
      isMajority: false,
    };

    const epilogue = getEpilogue(deadlockVerdict, 'disgraced_knight');
    expect(epilogue.fateOutcome).toBe('interregnum');
    expect(epilogue.title).toBe('The Fractured Realm');
    expect(epilogue.subtitle).toContain('Regent Interregnum');
  });
});
