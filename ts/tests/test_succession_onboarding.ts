import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
  scoutForEvidence,
  discreditFigure,
} from '../src/games/succession/utils/gameOrchestration';
import { determineTip } from '../src/games/succession/utils/onboardingTriggers';
import { GameState } from '../src/games/succession/types/gameState';

// Each tip gets exactly 3 tests, matching the exact shape of proof that
// would have caught both real Time Served Phase 11 bugs (ADR-005):
//   Test A — fires on the genuine first real occurrence of its trigger
//   Test B — does not fire on a second, real, later occurrence of the
//            same action (the "re-fires on every revisit" bug)
//   Test C — does not fire due to unrelated ticker/game activity alone
//            — i.e., correctly discriminates on the real, specific
//            condition rather than firing regardless of it (the "fired
//            on every screen load regardless of actual game state" bug)
//
// All game states are built via the REAL gameOrchestration.ts functions
// (never a hand-typed mock ticker), and determineTip is the exact same
// function App.tsx calls from its real move handlers — not a
// reimplementation that could silently diverge from production wiring.

describe('Onboarding Tip Triggers (ADR-005)', () => {
  describe('Tip 1: Whisper', () => {
    it('fires on the genuine first real Whisper attempt', () => {
      const state = createInitialGameState('merchant_banker');
      const tip = determineTip(state, 'whisper', 'whisper');
      expect(tip).toBe('whisper');
    });

    it('does not fire on a second real Whisper attempt', () => {
      let state = createInitialGameState('merchant_banker');
      state = whisperTo(state, 'chancellor', 'noble_pedigree'); // real first whisper
      const tip = determineTip(state, 'whisper', 'whisper');
      expect(tip).toBeNull();
    });

    it('does not fire due to unrelated activity — only a real prior Whisper suppresses it', () => {
      let state = createInitialGameState('merchant_banker');
      state = appealTo(state, 'chancellor'); // unrelated real action
      state = scoutForEvidence(state); // unrelated real action
      const tip = determineTip(state, 'whisper', 'whisper');
      expect(tip).toBe('whisper'); // still fires — no real Whisper has occurred yet
    });
  });

  describe('Tip 2: Appeal', () => {
    it('fires on the genuine first real Appeal attempt', () => {
      const state = createInitialGameState('merchant_banker');
      const tip = determineTip(state, 'appeal', 'appeal');
      expect(tip).toBe('appeal');
    });

    it('does not fire on a second real Appeal attempt', () => {
      let state = createInitialGameState('merchant_banker');
      state = appealTo(state, 'chancellor'); // real first appeal
      const tip = determineTip(state, 'appeal', 'appeal');
      expect(tip).toBeNull();
    });

    it('does not fire due to unrelated activity — only a real prior Appeal suppresses it', () => {
      let state = createInitialGameState('merchant_banker');
      state = whisperTo(state, 'chancellor', 'noble_pedigree'); // unrelated real action
      state = scoutForEvidence(state); // unrelated real action
      const tip = determineTip(state, 'appeal', 'appeal');
      expect(tip).toBe('appeal'); // still fires — no real Appeal has occurred yet
    });
  });

  describe('Tip 3: Evidence Scout', () => {
    it('fires on the genuine first real Scout attempt', () => {
      const state = createInitialGameState('merchant_banker');
      const tip = determineTip(state, 'scout', 'evidenceScout');
      expect(tip).toBe('evidenceScout');
    });

    it('does not fire on a second real Scout attempt', () => {
      let state = createInitialGameState('merchant_banker');
      state = scoutForEvidence(state); // real first scout
      const tip = determineTip(state, 'scout', 'evidenceScout');
      expect(tip).toBeNull();
    });

    it('does not fire merely from starting evidence (bastard_scion) — only a real Scout action counts', () => {
      // bastard_scion starts with 1 pre-scouted item WITHOUT ever calling
      // scoutForEvidence — proves the trigger checks the real ticker for
      // a genuine 'scout' moveType, not scoutedCount/playerEvidence.length,
      // which would misfire here.
      const state = createInitialGameState('bastard_scion');
      expect(state.scoutedCount).toBe(1); // starting evidence present
      expect(state.ticker.length).toBe(0); // but no real scout action taken
      const tip = determineTip(state, 'scout', 'evidenceScout');
      expect(tip).toBe('evidenceScout'); // still fires — no real Scout has occurred yet
    });
  });

  describe('Tip 4: Discredit', () => {
    it('fires on the genuine first real Discredit attempt', () => {
      const state = createInitialGameState('merchant_banker');
      const tip = determineTip(state, 'discredit', 'discredit');
      expect(tip).toBe('discredit');
    });

    it('does not fire on a second real Discredit attempt', () => {
      let state = createInitialGameState('merchant_banker');
      state = discreditFigure(state, 'chancellor', 'aldric'); // real first discredit
      const tip = determineTip(state, 'discredit', 'discredit');
      expect(tip).toBeNull();
    });

    it('does not fire due to unrelated activity — only a real prior Discredit suppresses it', () => {
      let state = createInitialGameState('merchant_banker');
      state = whisperTo(state, 'chancellor', 'noble_pedigree'); // unrelated real action
      state = appealTo(state, 'archbishop'); // unrelated real action
      const tip = determineTip(state, 'discredit', 'discredit');
      expect(tip).toBe('discredit'); // still fires — no real Discredit has occurred yet
    });
  });

  describe('Tip 5: Verdict Approach', () => {
    it('fires once the real segment counter reaches the final segment, regardless of moveType', () => {
      const state: GameState = { ...createInitialGameState('merchant_banker'), segment: 8 };
      expect(determineTip(state, 'whisper', 'whisper')).toBe('verdictApproach');
      expect(determineTip(state, 'discredit', 'discredit')).toBe('verdictApproach');
    });

    it('does not fire before the real segment counter reaches the final segment', () => {
      let state = createInitialGameState('merchant_banker');
      // Advance through several real segments without ever reaching 8.
      state = whisperTo(state, 'chancellor', 'noble_pedigree');
      state = appealTo(state, 'archbishop');
      state = scoutForEvidence(state);
      expect(state.segment).toBeLessThan(8);
      const tip = determineTip(state, 'whisper', 'whisper');
      expect(tip).not.toBe('verdictApproach');
    });

    it('takes priority over a move-specific tip when both real conditions coincide on the same action', () => {
      // Player has never Discredited, AND this is genuinely their final
      // segment — both real conditions are true simultaneously. The
      // verdict-approach tip must win, not silently return null or the
      // wrong tip.
      const state: GameState = { ...createInitialGameState('merchant_banker'), segment: 8 };
      const tip = determineTip(state, 'discredit', 'discredit');
      expect(tip).toBe('verdictApproach');
      expect(tip).not.toBe('discredit');
    });
  });
});
