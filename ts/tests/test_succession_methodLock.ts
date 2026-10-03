import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
  presentEvidenceTo,
} from '../src/games/succession/utils/gameOrchestration';
import {
  lockedMethodFor,
  isLockedMethod,
  persuasionMethodGain,
  NON_LOCKED_METHOD_RATIO,
  LOCKED_METHOD_BONUS_RATIO,
  MIN_NON_LOCKED_METHOD_GAIN,
} from '../src/games/succession/engine/methodLock';
import { COURT_FIGURES } from '../src/games/succession/data/courtFigures';
import {
  WHISPER_FAVOR_GAIN,
  APPEAL_FAVOR_GAIN,
  EVIDENCE_FAVOR_GAIN,
  KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN,
  KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN,
} from '../src/games/succession/data/gameConstants';
import { FigureId, PersuasionMethod } from '../src/games/succession/engine/types';

/**
 * ADR-007 — figure-locked persuasion methods. Each councilor values one
 * approach at a 2× premium; the other two still function at a quarter
 * of base value — never zero, never disabled (the design doc's "No
 * Mathematical Dead End" rule).
 */

const FIGURES: FigureId[] = ['chancellor', 'archbishop', 'commander'];
const METHODS: PersuasionMethod[] = ['whisper', 'appeal', 'evidence'];

describe('Figure-Locked Persuasion Methods (ADR-007)', () => {
  it('assigns each councilor a distinct locked method (thematic bijection)', () => {
    expect(lockedMethodFor('chancellor')).toBe('evidence');
    expect(lockedMethodFor('archbishop')).toBe('whisper');
    expect(lockedMethodFor('commander')).toBe('appeal');

    const locks = FIGURES.map((f) => COURT_FIGURES[f].lockedMethod);
    expect(new Set(locks).size).toBe(3); // one unique lock per figure
    FIGURES.forEach((f) => {
      expect(COURT_FIGURES[f].methodAffinity.length).toBeGreaterThan(0);
    });
  });

  it('locked methods pay the 2× premium; non-locked pay a quarter, floored at 1', () => {
    // Locked: floor(base × 2)
    expect(persuasionMethodGain('archbishop', 'whisper', WHISPER_FAVOR_GAIN)).toBe(40);
    expect(persuasionMethodGain('commander', 'appeal', APPEAL_FAVOR_GAIN)).toBe(16);
    expect(persuasionMethodGain('chancellor', 'evidence', EVIDENCE_FAVOR_GAIN)).toBe(60);

    // Non-locked: floor(base × 0.25), never below 1
    expect(persuasionMethodGain('chancellor', 'whisper', WHISPER_FAVOR_GAIN)).toBe(5);
    expect(persuasionMethodGain('commander', 'whisper', WHISPER_FAVOR_GAIN)).toBe(5);
    expect(persuasionMethodGain('chancellor', 'appeal', APPEAL_FAVOR_GAIN)).toBe(2);
    expect(persuasionMethodGain('archbishop', 'appeal', APPEAL_FAVOR_GAIN)).toBe(2);
    expect(persuasionMethodGain('archbishop', 'evidence', EVIDENCE_FAVOR_GAIN)).toBe(7);
    expect(persuasionMethodGain('commander', 'evidence', EVIDENCE_FAVOR_GAIN)).toBe(7);

    // Tiny bases still yield ≥1 — never zero, never disabled
    expect(persuasionMethodGain('archbishop', 'appeal', 1)).toBe(MIN_NON_LOCKED_METHOD_GAIN);
    expect(persuasionMethodGain('chancellor', 'whisper', 3)).toBe(MIN_NON_LOCKED_METHOD_GAIN);
  });

  it('the locked method is strictly the most effective at every figure', () => {
    const bases: Record<PersuasionMethod, number> = {
      whisper: WHISPER_FAVOR_GAIN,
      appeal: APPEAL_FAVOR_GAIN,
      evidence: EVIDENCE_FAVOR_GAIN,
    };
    for (const f of FIGURES) {
      const locked = lockedMethodFor(f);
      const lockedGain = persuasionMethodGain(f, locked, bases[locked]);
      for (const m of METHODS) {
        const gain = persuasionMethodGain(f, m, bases[m]);
        if (m === locked) continue;
        expect(gain, `${m} at ${f} must undercut ${locked}`).toBeLessThan(lockedGain);
      }
    }
  });

  it('locked premium and non-locked ratio constants hold their design values', () => {
    expect(LOCKED_METHOD_BONUS_RATIO).toBe(2);
    expect(NON_LOCKED_METHOD_RATIO).toBe(0.25);
    expect(MIN_NON_LOCKED_METHOD_GAIN).toBe(1);
  });

  it('isLockedMethod agrees with the figure dossier data', () => {
    for (const f of FIGURES) {
      for (const m of METHODS) {
        expect(isLockedMethod(f, m)).toBe(COURT_FIGURES[f].lockedMethod === m);
      }
    }
  });

  it('orchestration applies the lock through every persuasion move', () => {
    // Locked lanes pay the premium
    const s1 = whisperTo(createInitialGameState(), 'archbishop', 'divine_favor');
    expect(s1.figures.find((f) => f.id === 'archbishop')!.favor.player).toBe(40);

    const s2 = appealTo(createInitialGameState(), 'commander');
    expect(s2.figures.find((f) => f.id === 'commander')!.favor.player).toBe(16);

    // Non-locked lanes pay the reduced rate
    const s3 = whisperTo(createInitialGameState(), 'commander', 'battle_tested');
    expect(s3.figures.find((f) => f.id === 'commander')!.favor.player).toBe(5);

    const s4 = appealTo(createInitialGameState(), 'archbishop');
    expect(s4.figures.find((f) => f.id === 'archbishop')!.favor.player).toBe(2);
  });

  it('evidence at a non-favored figure pays the reduced rate', () => {
    let state = createInitialGameState();
    state = {
      ...state,
      playerEvidence: [
        {
          id: 'secret_baptismal_record',
          name: 'Secret Baptismal Record',
          relevantFigureId: 'archbishop',
          flavor: 'Parchment bearing the unacknowledged heir’s name and baptismal oil.',
          inquiryResolved: 'Proves the existence and legitimacy of the unacknowledged royal infant.',
          blackmailLeverage: 'Threatens the Church with heresy charges if the secret baptism is leaked.',
        },
      ],
    };
    const next = presentEvidenceTo(state, 'archbishop', 'secret_baptismal_record');
    expect(next.figures.find((f) => f.id === 'archbishop')!.favor.player).toBe(7);
  });

  it('origin appeal overrides compound with the lock in both directions', () => {
    // Knight commander appeal: 10 base × 2 locked = 20
    const knight = appealTo(createInitialGameState('disgraced_knight'), 'commander');
    expect(knight.figures.find((f) => f.id === 'commander')!.favor.player).toBe(
      Math.floor(KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN * LOCKED_METHOD_BONUS_RATIO)
    );

    // Knight archbishop appeal: 4 base × 0.25 non-locked = 1 — the
    // recurring friction lane stays open (never zero).
    const knightBishop = appealTo(createInitialGameState('disgraced_knight'), 'archbishop');
    expect(knightBishop.figures.find((f) => f.id === 'archbishop')!.favor.player).toBe(
      Math.max(
        MIN_NON_LOCKED_METHOD_GAIN,
        Math.floor(KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN * NON_LOCKED_METHOD_RATIO)
      )
    );
    expect(knightBishop.figures.find((f) => f.id === 'archbishop')!.favor.player).toBe(1);
  });

  it('repeat decay applies on top of the locked value', () => {
    let state = createInitialGameState();
    // Same theme twice — consecutive-repeat decay (ADR-002) halves the
    // locked whisper gain on the second use; no contradiction since the
    // claim repeats, not opposes.
    state = whisperTo(state, 'archbishop', 'divine_favor');
    state = whisperTo(state, 'archbishop', 'divine_favor');
    const bishop = state.figures.find((f) => f.id === 'archbishop')!;
    // 40 full + 20 halved (repeat), then Vivienne slanders (−10) on
    // segment 2 since the 40-lead crossed the 16 threshold.
    expect(bishop.favor.player).toBe(40 + 20 - 10);
  });

  it('rival whispers are unaffected by the player-facing method lock', () => {
    const next = whisperTo(createInitialGameState(), 'chancellor', 'noble_pedigree');
    const aldricEntry = next.ticker.find((t) => t.claimantId === 'aldric');
    expect(aldricEntry?.favorGain).toBe(15); // RIVAL_WHISPER_FAVOR_GAIN, unchanged
  });
});
