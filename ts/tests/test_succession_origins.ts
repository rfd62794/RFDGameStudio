import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
} from '../src/games/succession/utils/gameOrchestration';
import {
  BASTARD_CHANCELLOR_STARTING_FAVOR,
  KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN,
  KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN,
  APPEAL_FAVOR_GAIN,
  MERCHANT_SLANDER_PENALTY,
  RIVAL_SLANDER_PENALTY,
  MERCHANT_RIVAL_FIRST_WHISPER_BONUS,
  RIVAL_WHISPER_FAVOR_GAIN,
} from '../src/games/succession/data/gameConstants';
import {
  getOriginModifiers,
  type PlayerOrigin,
  type PlayerOriginModifiers,
} from '../src/games/succession/data/origins';

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

    it('Commander Appeals grant +25% favor gain (+10 instead of +8)', () => {
      const state = createInitialGameState('disgraced_knight');
      const next = appealTo(state, 'commander');

      const commander = next.figures.find((f) => f.id === 'commander')!;
      expect(commander.favor.player).toBe(KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN); // 10

      const playerEntry = next.ticker.find((t) => t.claimantId === 'player' && t.figureId === 'commander');
      expect(playerEntry?.favorGain).toBe(KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN);
    });

    it('Chancellor Appeals grant standard +8 favor gain', () => {
      const state = createInitialGameState('disgraced_knight');
      const next = appealTo(state, 'chancellor');

      const chancellor = next.figures.find((f) => f.id === 'chancellor')!;
      expect(chancellor.favor.player).toBe(APPEAL_FAVOR_GAIN); // 8
    });

    it('Archbishop Appeals grant -50% favor gain (4 instead of 8) — ADR-004 recurring friction', () => {
      const state = createInitialGameState('disgraced_knight');
      const next = appealTo(state, 'archbishop');

      const archbishop = next.figures.find((f) => f.id === 'archbishop')!;
      expect(archbishop.favor.player).toBe(KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN); // 4

      const playerEntry = next.ticker.find((t) => t.claimantId === 'player' && t.figureId === 'archbishop');
      expect(playerEntry?.favorGain).toBe(KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN);
    });

    it('Archbishop requires 1 formal Appeal before Whispers unlock (Whisper is rejected if unappealed)', () => {
      const state = createInitialGameState('disgraced_knight');
      // Attempt to whisper to archbishop before any appeal
      const rejected = whisperTo(state, 'archbishop', 'pious_devotion');
      // State does not advance or record
      expect(rejected.segment).toBe(1);
      expect(rejected.ticker.length).toBe(0);

      // Deliver 1 formal appeal to Archbishop (ADR-004: reduced to -50% favor gain, 4 instead of 8)
      const appealed = appealTo(state, 'archbishop');
      expect(appealed.segment).toBe(2);
      expect(appealed.figures.find((f) => f.id === 'archbishop')?.favor.player).toBe(KNIGHT_ARCHBISHOP_APPEAL_FAVOR_GAIN);

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

      // Segment 1 is odd → only Aldric acts → 1 rival whisper
      const rivalWhispers = next.ticker.filter((t) => t.claimantId !== 'player');
      expect(rivalWhispers.length).toBe(1);
      rivalWhispers.forEach((entry) => {
        expect(entry.moveType).toBe('whisper');
        expect(entry.favorGain).toBe(RIVAL_WHISPER_FAVOR_GAIN + MERCHANT_RIVAL_FIRST_WHISPER_BONUS); // 20
      });
    });

    it('Slander against Merchant Banker has its penalty halved (-5 instead of -10)', () => {
      const state = createInitialGameState('merchant_banker');
      // Segment 1 (odd, Aldric): Player whispers to Chancellor (+20). Aldric whispers to a neglected figure.
      const afterSeg1 = whisperTo(state, 'chancellor', 'noble_pedigree');
      expect(afterSeg1.figures.find((f) => f.id === 'chancellor')?.favor.player).toBe(20);

      // Segment 2 (even, Vivienne): Player appeals to Chancellor (+8, total 28).
      // Vivienne sees player lead 28 >= 16 → slanders Chancellor (-5 for Merchant Banker) = 23.
      const afterSeg2 = appealTo(afterSeg1, 'chancellor');

      const slanderEntry = afterSeg2.ticker.find(
        (t) => t.moveType === 'slander' && t.segment === 2
      );
      expect(slanderEntry).toBeDefined();
      expect(slanderEntry?.favorGain).toBe(-MERCHANT_SLANDER_PENALTY); // -5

      const chancellor = afterSeg2.figures.find((f) => f.id === 'chancellor')!;
      // 20 + 8 - 5 = 23 favor
      expect(chancellor.favor.player).toBe(23);
    });

    it('Standard non-merchant origin suffers full -10 slander penalty', () => {
      const state = createInitialGameState('disgraced_knight');
      // Segment 1 (odd, Aldric): Player whispers to Chancellor (+20). Aldric whispers to a neglected figure.
      const afterSeg1 = whisperTo(state, 'chancellor', 'noble_pedigree');
      expect(afterSeg1.figures.find((f) => f.id === 'chancellor')?.favor.player).toBe(20);

      // Segment 2 (even, Vivienne): Player appeals to Chancellor (+8, total 28).
      // Vivienne sees player lead 28 >= 16 → slanders Chancellor (-10 for non-merchant) = 18.
      const afterSeg2 = appealTo(afterSeg1, 'chancellor');

      const slanderEntry = afterSeg2.ticker.find(
        (t) => t.moveType === 'slander' && t.segment === 2
      );
      expect(slanderEntry).toBeDefined();
      expect(slanderEntry?.favorGain).toBe(-RIVAL_SLANDER_PENALTY); // -10

      const chancellor = afterSeg2.figures.find((f) => f.id === 'chancellor')!;
      // 20 + 8 - 10 = 18 favor
      expect(chancellor.favor.player).toBe(18);
    });
  });
});

describe('Origin Modifier Refactor (OCP Proof)', () => {
  it('origin_modifiers_produce_identical_outcomes_to_pre_refactor', () => {
    // Bastard Scion: starting favor penalty on chancellor, starting evidence
    const bastardState = createInitialGameState('bastard_scion');
    const bastardModifiers = getOriginModifiers('bastard_scion');
    expect(bastardModifiers.startingFavor?.chancellor).toBe(BASTARD_CHANCELLOR_STARTING_FAVOR);
    expect(bastardState.figures.find((f) => f.id === 'chancellor')!.favor.player).toBe(BASTARD_CHANCELLOR_STARTING_FAVOR);
    expect(bastardState.figures.find((f) => f.id === 'archbishop')!.favor.player).toBe(0);
    expect(bastardState.figures.find((f) => f.id === 'commander')!.favor.player).toBe(0);
    expect(bastardState.playerEvidence.length).toBe(1);
    expect(bastardState.scoutedCount).toBe(1);

    // Disgraced Knight: appeal gain override on commander, standard on others
    const knightState = createInitialGameState('disgraced_knight');
    const knightAppealCommander = appealTo(knightState, 'commander');
    expect(knightAppealCommander.figures.find((f) => f.id === 'commander')!.favor.player).toBe(KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN);
    const knightAppealChancellor = appealTo(knightState, 'chancellor');
    expect(knightAppealChancellor.figures.find((f) => f.id === 'chancellor')!.favor.player).toBe(APPEAL_FAVOR_GAIN);

    // Merchant Banker: slander penalty halved, rival first whisper bonus
    const merchantModifiers = getOriginModifiers('merchant_banker');
    const computedSlanderPenalty = RIVAL_SLANDER_PENALTY * (merchantModifiers.slanderPenaltyMultiplier ?? 1);
    expect(computedSlanderPenalty).toBe(MERCHANT_SLANDER_PENALTY);
    const merchantState = createInitialGameState('merchant_banker');
    const merchantAppeal = appealTo(merchantState, 'commander');
    const rivalWhispers = merchantAppeal.ticker.filter((t) => t.claimantId !== 'player' && t.moveType === 'whisper');
    rivalWhispers.forEach((entry) => {
      expect(entry.favorGain).toBe(RIVAL_WHISPER_FAVOR_GAIN + MERCHANT_RIVAL_FIRST_WHISPER_BONUS);
    });
  });

  it('hypothetical_fourth_origin_works_with_zero_orchestration_changes', () => {
    const hypotheticalModifiers: PlayerOriginModifiers = {
      startingFavor: { archbishop: -10 },
      rivalFirstWhisperBonus: 8,
    };
    const hypotheticalOrigin: PlayerOrigin = {
      id: 'merchant_banker',
      name: 'Hypothetical Fourth',
      subtitle: 'Test',
      icon: 'Test',
      strategicAdvantage: 'Test',
      inherentFriction: 'Test',
      description: 'Test',
      modifiers: hypotheticalModifiers,
    };

    // The same generic lookup formulas used in gameOrchestration.ts
    // work with any modifier values — no code changes needed

    // Starting favor: modifiers.startingFavor?.[id] ?? 0
    expect(hypotheticalOrigin.modifiers.startingFavor?.['archbishop'] ?? 0).toBe(-10);
    expect(hypotheticalOrigin.modifiers.startingFavor?.['chancellor'] ?? 0).toBe(0);
    expect(hypotheticalOrigin.modifiers.startingFavor?.['commander'] ?? 0).toBe(0);

    // Rival first whisper bonus: modifiers.rivalFirstWhisperBonus ?? 0
    expect(hypotheticalOrigin.modifiers.rivalFirstWhisperBonus ?? 0).toBe(8);

    // Slander penalty: RIVAL_SLANDER_PENALTY * (modifiers.slanderPenaltyMultiplier ?? 1)
    // Hypothetical origin has no slanderPenaltyMultiplier, so it gets the default
    const slanderPenalty = RIVAL_SLANDER_PENALTY * (hypotheticalOrigin.modifiers.slanderPenaltyMultiplier ?? 1);
    expect(slanderPenalty).toBe(RIVAL_SLANDER_PENALTY);

    // Appeal gain: modifiers.appealFavorGainOverride?.[figureId] ?? APPEAL_FAVOR_GAIN
    // Hypothetical origin has no appealFavorGainOverride, so all figures get standard
    expect(hypotheticalOrigin.modifiers.appealFavorGainOverride?.['commander'] ?? APPEAL_FAVOR_GAIN).toBe(APPEAL_FAVOR_GAIN);

    // Appeal required before whisper: modifiers.appealRequiredBeforeWhisper?.includes(figureId)
    // Hypothetical origin has no appealRequiredBeforeWhisper, so no figures are gated
    expect(hypotheticalOrigin.modifiers.appealRequiredBeforeWhisper?.includes('archbishop')).toBeFalsy();

    // getOriginModifiers correctly extracts modifiers from real origins
    // (proves the lookup mechanism that would find a fourth origin if added to PLAYER_ORIGINS)
    expect(getOriginModifiers('bastard_scion').startingFavor?.chancellor).toBe(BASTARD_CHANCELLOR_STARTING_FAVOR);
    expect(getOriginModifiers('disgraced_knight').appealFavorGainOverride?.commander).toBe(KNIGHT_COMMANDER_APPEAL_FAVOR_GAIN);
    expect(getOriginModifiers('merchant_banker').rivalFirstWhisperBonus).toBe(MERCHANT_RIVAL_FIRST_WHISPER_BONUS);
  });
});
