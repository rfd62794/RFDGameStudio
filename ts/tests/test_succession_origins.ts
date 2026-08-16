import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
} from '../src/games/succession/utils/gameOrchestration';
import {
  BASTARD_CHANCELLOR_STARTING_FAVOR,
  KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN,
  APPEAL_FAVOR_GAIN,
  MERCHANT_SLANDER_PENALTY,
  RIVAL_SLANDER_PENALTY,
  MERCHANT_RIVAL_FIRST_WHISPER_BONUS,
  RIVAL_WHISPER_FAVOR_GAIN,
} from '../src/games/succession/data/gameConstants';

describe('Player Lineage Origins & Run Modifiers (Phase 11)', () => {
  describe('Origin 1: Bastard Scion', () => {
    it('initializes with +1 Scouted Evidence and -5 Chancellor starting penalty', () => {
      const state = createInitialGameState('bastard_scion');
      expect(state.playerOrigin).toBe('bastard_scion');
      expect(state.playerEvidence.length).toBe(1);
      expect(state.playerEvidence[0].id).toBe('signet_proof');
      expect(state.scoutedCount).toBe(1);

      const chancellor = state.figures.find((f) => f.id === 'chancellor')!;
      expect(chancellor.favor.player).toBe(BASTARD_CHANCELLOR_STARTING_FAVOR); // -5

      const archbishop = state.figures.find((f) => f.id === 'archbishop')!;
      expect(archbishop.favor.player).toBe(0);

      const commander = state.figures.find((f) => f.id === 'commander')!;
      expect(commander.favor.player).toBe(0);
    });
  });

  describe('Origin 2: Disgraced Iron Knight', () => {
    it('initializes with clean 0 favor and 0 evidence', () => {
      const state = createInitialGameState('disgraced_knight');
      expect(state.playerOrigin).toBe('disgraced_knight');
      expect(state.playerEvidence.length).toBe(0);
      expect(state.scoutedCount).toBe(0);
      state.figures.forEach((f) => {
        expect(f.favor.player).toBe(0);
      });
    });

    it('Commander Appeals grant +50% favor gain (+12 instead of +8)', () => {
      const state = createInitialGameState('disgraced_knight');
      const next = appealTo(state, 'commander');

      const commander = next.figures.find((f) => f.id === 'commander')!;
      expect(commander.favor.player).toBe(KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN); // 12

      const playerEntry = next.ticker.find((t) => t.claimantId === 'player' && t.figureId === 'commander');
      expect(playerEntry?.favorGain).toBe(KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN);
    });

    it('Chancellor or Archbishop Appeals grant standard +8 favor gain', () => {
      const state = createInitialGameState('disgraced_knight');
      const next = appealTo(state, 'chancellor');

      const chancellor = next.figures.find((f) => f.id === 'chancellor')!;
      expect(chancellor.favor.player).toBe(APPEAL_FAVOR_GAIN); // 8
    });

    it('Archbishop requires 1 formal Appeal before Whispers unlock (Whisper is rejected if unappealed)', () => {
      const state = createInitialGameState('disgraced_knight');
      // Attempt to whisper to archbishop before any appeal
      const rejected = whisperTo(state, 'archbishop', 'pious_devotion');
      // State does not advance or record
      expect(rejected.segment).toBe(1);
      expect(rejected.ticker.length).toBe(0);

      // Deliver 1 formal appeal to Archbishop
      const appealed = appealTo(state, 'archbishop');
      expect(appealed.segment).toBe(2);
      expect(appealed.figures.find((f) => f.id === 'archbishop')?.favor.player).toBe(APPEAL_FAVOR_GAIN);

      // Now whispering to Archbishop succeeds
      const whispered = whisperTo(appealed, 'archbishop', 'pious_devotion');
      expect(whispered.segment).toBe(3);
      expect(whispered.allClaims.length).toBe(1);
    });
  });

  describe('Origin 3: Merchant Banker', () => {
    it('initializes with clean 0 favor and 0 evidence', () => {
      const state = createInitialGameState('merchant_banker');
      expect(state.playerOrigin).toBe('merchant_banker');
      expect(state.playerEvidence.length).toBe(0);
      expect(state.scoutedCount).toBe(0);
    });

    it('Rivals gain +5 bonus favor on their very first Whisper move (+20 instead of +15)', () => {
      const state = createInitialGameState('merchant_banker');
      // Player makes an appeal to commander
      const next = appealTo(state, 'commander');

      const rivalWhispers = next.ticker.filter((t) => t.claimantId !== 'player');
      expect(rivalWhispers.length).toBe(2);
      rivalWhispers.forEach((entry) => {
        expect(entry.moveType).toBe('whisper');
        expect(entry.favorGain).toBe(RIVAL_WHISPER_FAVOR_GAIN + MERCHANT_RIVAL_FIRST_WHISPER_BONUS); // 20
      });
    });

    it('Slander against Merchant Banker has its penalty halved (-5 instead of -10)', () => {
      const state = createInitialGameState('merchant_banker');
      // Player whispers to Chancellor (+20). Player lead on Chancellor is 20, triggering Vivienne slander
      const next = whisperTo(state, 'chancellor', 'noble_pedigree');

      const slanderEntry = next.ticker.find((t) => t.moveType === 'slander');
      expect(slanderEntry).toBeDefined();
      expect(slanderEntry?.favorGain).toBe(-MERCHANT_SLANDER_PENALTY); // -5

      const chancellor = next.figures.find((f) => f.id === 'chancellor')!;
      // 20 favor gained minus 5 slander penalty = 15 favor
      expect(chancellor.favor.player).toBe(15);
    });

    it('Standard non-merchant origin suffers full -10 slander penalty', () => {
      const state = createInitialGameState('disgraced_knight');
      const next = whisperTo(state, 'chancellor', 'noble_pedigree');

      const slanderEntry = next.ticker.find((t) => t.moveType === 'slander');
      expect(slanderEntry).toBeDefined();
      expect(slanderEntry?.favorGain).toBe(-RIVAL_SLANDER_PENALTY); // -10

      const chancellor = next.figures.find((f) => f.id === 'chancellor')!;
      // 20 favor gained minus 10 slander penalty = 10 favor
      expect(chancellor.favor.player).toBe(10);
    });
  });
});
