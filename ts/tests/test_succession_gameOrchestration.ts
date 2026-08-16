import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
  presentEvidenceTo,
  scoutForEvidence,
} from '../src/games/succession/utils/gameOrchestration';
import {
  WHISPER_FAVOR_GAIN,
  APPEAL_FAVOR_GAIN,
  EVIDENCE_FAVOR_GAIN,
  RIVAL_WHISPER_FAVOR_GAIN,
} from '../src/games/succession/data/gameConstants';
import { SCOUTABLE_EVIDENCE } from '../src/games/succession/data/evidence';
import { GameState } from '../src/games/succession/types/gameState';

describe('gameOrchestration', () => {
  it('createInitialGameState_three_figures_zero_favor', () => {
    const state = createInitialGameState();
    expect(state.figures.length).toBe(3);

    const figureIds = state.figures.map((f) => f.id);
    expect(figureIds).toContain('chancellor');
    expect(figureIds).toContain('archbishop');
    expect(figureIds).toContain('commander');

    state.figures.forEach((figure) => {
      expect(figure.favor.player).toBe(0);
      expect(figure.favor.aldric).toBe(0);
      expect(figure.favor.vivienne).toBe(0);
      expect(figure.mostRecentClaim).toBeNull();
      expect(figure.exposedAgainst).toEqual([]);
    });
  });

  it('createInitialGameState_starts_segment_1_empty_evidence', () => {
    const state = createInitialGameState();
    expect(state.segment).toBe(1);
    expect(state.phase).toBe('segment');
    expect(state.playerEvidence).toEqual([]);
    expect(state.scoutedCount).toBe(0);
    expect(state.ticker).toEqual([]);
    expect(state.verdict).toBeNull();
  });

  it('whisperTo_applies_favor_and_logs_player_ticker_entry', () => {
    const initial = createInitialGameState();
    const next = whisperTo(initial, 'chancellor', 'noble_pedigree');

    const chancellor = next.figures.find((f) => f.id === 'chancellor')!;
    // Player gained WHISPER_FAVOR_GAIN (20), then Vivienne slandered (-10) due to lead >= 16
    expect(chancellor.favor.player).toBe(WHISPER_FAVOR_GAIN - 10);

    const playerEntry = next.ticker.find(
      (t) => t.claimantId === 'player' && t.segment === 1
    );
    expect(playerEntry).toBeDefined();
    expect(playerEntry?.moveType).toBe('whisper');
    expect(playerEntry?.figureId).toBe('chancellor');
    expect(playerEntry?.favorGain).toBe(WHISPER_FAVOR_GAIN);
    expect(playerEntry?.exposed).toBe(false);
  });

  it('whisperTo_triggers_rival_counter_play_including_slander_on_decisive_lead', () => {
    const initial = createInitialGameState();
    const next = whisperTo(initial, 'chancellor', 'noble_pedigree');

    expect(next.ticker.length).toBe(3);
    const aldricEntry = next.ticker.find((t) => t.claimantId === 'aldric');
    const vivienneEntry = next.ticker.find((t) => t.claimantId === 'vivienne');

    expect(aldricEntry).toBeDefined();
    expect(aldricEntry?.moveType).toBe('whisper');
    expect(aldricEntry?.favorGain).toBe(RIVAL_WHISPER_FAVOR_GAIN);

    // Vivienne counters the decisive player lead on chancellor with slander
    expect(vivienneEntry).toBeDefined();
    expect(vivienneEntry?.moveType).toBe('slander');
    expect(vivienneEntry?.figureId).toBe('chancellor');
    expect(vivienneEntry?.favorGain).toBe(-10);
  });

  it('whisperTo_advances_segment_by_exactly_one', () => {
    const initial = createInitialGameState();
    const next = whisperTo(initial, 'chancellor', 'noble_pedigree');
    expect(next.segment).toBe(2);
  });

  it('whisperTo_no_op_after_verdict_phase_begun', () => {
    const state: GameState = {
      ...createInitialGameState(),
      segment: 8,
      phase: 'verdict',
      verdict: {
        perFigureWinner: { chancellor: 'player', archbishop: 'player', commander: 'aldric' },
        overallWinner: 'player',
        isMajority: true,
      },
    };

    const next = whisperTo(state, 'chancellor', 'noble_pedigree');
    expect(next).toEqual(state);
  });

  it('whisperTo_exposed_case_grants_no_player_favor', () => {
    const initial = createInitialGameState();
    // Move 1: whisper noble_pedigree to chancellor
    const afterFirst = whisperTo(initial, 'chancellor', 'noble_pedigree');
    // Initial 20 favor minus 10 slander from Vivienne = 10
    expect(afterFirst.figures.find((f) => f.id === 'chancellor')?.favor.player).toBe(WHISPER_FAVOR_GAIN - 10);

    // Move 2: whisper common_origins (opposes noble_pedigree) to chancellor
    const afterContradiction = whisperTo(afterFirst, 'chancellor', 'common_origins');
    const chancellor = afterContradiction.figures.find((f) => f.id === 'chancellor')!;

    // Player favor did not increase on contradiction (stays at 10)
    expect(chancellor.favor.player).toBe(WHISPER_FAVOR_GAIN - 10);
    expect(chancellor.exposedAgainst).toContain('player');

    const contradictionEntry = afterContradiction.ticker.find(
      (t) => t.claimantId === 'player' && t.segment === 2
    );
    expect(contradictionEntry?.exposed).toBe(true);
    expect(contradictionEntry?.favorGain).toBe(0);
  });

  it('appealTo_applies_smaller_guaranteed_favor', () => {
    const initial = createInitialGameState();
    const next = appealTo(initial, 'archbishop');

    const archbishop = next.figures.find((f) => f.id === 'archbishop')!;
    expect(archbishop.favor.player).toBe(APPEAL_FAVOR_GAIN);

    const playerEntry = next.ticker.find((t) => t.claimantId === 'player');
    expect(playerEntry?.moveType).toBe('appeal');
    expect(playerEntry?.figureId).toBe('archbishop');
    expect(playerEntry?.favorGain).toBe(APPEAL_FAVOR_GAIN);
    expect(playerEntry?.exposed).toBeUndefined();
  });

  it('scoutForEvidence_adds_evidence_moves_no_figure_favor', () => {
    const initial = createInitialGameState();
    const next = scoutForEvidence(initial);

    expect(next.playerEvidence.length).toBe(1);
    expect(next.playerEvidence[0]).toEqual(SCOUTABLE_EVIDENCE[0]);

    // Player favor across all figures must be unchanged (0)
    next.figures.forEach((f) => {
      expect(f.favor.player).toBe(0);
    });

    const playerEntry = next.ticker.find((t) => t.claimantId === 'player');
    expect(playerEntry?.moveType).toBe('scout');
    expect(playerEntry?.figureId).toBeNull();
  });

  it('scoutForEvidence_draws_fixed_rotating_order', () => {
    const s0 = createInitialGameState();
    const s1 = scoutForEvidence(s0);
    const s2 = scoutForEvidence(s1);
    const s3 = scoutForEvidence(s2);

    expect(s1.playerEvidence[0]).toEqual(SCOUTABLE_EVIDENCE[0]);
    expect(s2.playerEvidence[1]).toEqual(SCOUTABLE_EVIDENCE[1]);
    expect(s3.playerEvidence[2]).toEqual(SCOUTABLE_EVIDENCE[2]);
    expect(s3.scoutedCount).toBe(3);
  });

  it('presentEvidenceTo_applies_large_favor_consumes_evidence', () => {
    const initial = createInitialGameState();
    // Scout gives us SCOUTABLE_EVIDENCE[0] (signet_proof, relevant to chancellor)
    const afterScout = scoutForEvidence(initial);
    expect(afterScout.playerEvidence.length).toBe(1);

    const afterPresent = presentEvidenceTo(afterScout, 'chancellor', 'signet_proof');
    const chancellor = afterPresent.figures.find((f) => f.id === 'chancellor')!;

    expect(chancellor.favor.player).toBe(EVIDENCE_FAVOR_GAIN);
    expect(afterPresent.playerEvidence.length).toBe(0);

    const playerEntry = afterPresent.ticker.find(
      (t) => t.claimantId === 'player' && t.segment === 2
    );
    expect(playerEntry?.moveType).toBe('evidence');
    expect(playerEntry?.favorGain).toBe(EVIDENCE_FAVOR_GAIN);
  });

  it('presentEvidenceTo_no_op_when_figure_mismatch', () => {
    const initial = createInitialGameState();
    const afterScout = scoutForEvidence(initial); // has signet_proof (chancellor)

    // Attempt presenting signet_proof to archbishop
    const afterMismatch = presentEvidenceTo(afterScout, 'archbishop', 'signet_proof');

    expect(afterMismatch).toEqual(afterScout);
    expect(afterMismatch.playerEvidence.length).toBe(1);
  });

  it('presentEvidenceTo_no_op_when_not_held', () => {
    const initial = createInitialGameState(); // empty evidence
    const next = presentEvidenceTo(initial, 'chancellor', 'non_existent_item');

    expect(next).toEqual(initial);
  });

  it('segment_8_completion_transitions_to_verdict_phase', () => {
    let state = createInitialGameState();

    // 8 real player moves in sequence
    state = whisperTo(state, 'chancellor', 'noble_pedigree'); // seg 1 -> 2
    state = whisperTo(state, 'archbishop', 'divine_favor');   // seg 2 -> 3
    state = scoutForEvidence(state);                          // seg 3 -> 4
    state = appealTo(state, 'commander');                     // seg 4 -> 5
    state = presentEvidenceTo(state, 'chancellor', 'signet_proof'); // seg 5 -> 6 (scout gave signet_proof)
    state = whisperTo(state, 'commander', 'battle_tested');   // seg 6 -> 7
    state = appealTo(state, 'archbishop');                    // seg 7 -> 8
    state = appealTo(state, 'chancellor');                    // seg 8 -> completes 8

    expect(state.segment).toBe(8);
    expect(state.phase).toBe('verdict');
    expect(state.verdict).not.toBeNull();
    expect(state.verdict?.perFigureWinner).toBeDefined();
  });

  it('rival_moves_cover_distinct_figures_when_contested', () => {
    // Construct initial state where player already has different favor across figures
    const initial = createInitialGameState();
    const customState: GameState = {
      ...initial,
      figures: [
        { id: 'chancellor', favor: { player: 40, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'archbishop', favor: { player: 30, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
        { id: 'commander', favor: { player: 20, aldric: 10, vivienne: 10 }, mostRecentClaim: null, exposedAgainst: [] },
      ],
    };

    const next = appealTo(customState, 'commander');

    const aldricEntry = next.ticker.find((t) => t.claimantId === 'aldric');
    const vivienneEntry = next.ticker.find((t) => t.claimantId === 'vivienne');

    expect(aldricEntry).toBeDefined();
    expect(vivienneEntry).toBeDefined();
    // Aldric (Opportunist) targets archbishop (neglected figure with lower player favor than chancellor)
    expect(aldricEntry?.figureId).toBe('archbishop');
    // Vivienne (Disruptor) deconflicts and targets chancellor / commander
    expect(aldricEntry?.figureId).not.toBe(vivienneEntry?.figureId);
  });

  it('whisperTo_catches_cross_figure_contradiction', () => {
    const initial = createInitialGameState();
    // Segment 1: Whisper noble_pedigree to chancellor -> +20 favor, records claim (minus 10 slander)
    const afterFirst = whisperTo(initial, 'chancellor', 'noble_pedigree');
    expect(afterFirst.figures.find((f) => f.id === 'chancellor')?.favor.player).toBe(WHISPER_FAVOR_GAIN - 10);
    expect(afterFirst.figures.find((f) => f.id === 'chancellor')?.exposedAgainst).toEqual([]);

    // Segment 2: Whisper common_origins (opposing theme) to archbishop -> cross-figure contradiction
    const afterSecond = whisperTo(afterFirst, 'archbishop', 'common_origins');
    const archbishop = afterSecond.figures.find((f) => f.id === 'archbishop')!;

    expect(archbishop.favor.player).toBe(0); // retracted to pre-whisper 0
    expect(archbishop.exposedAgainst).toContain('player');

    const playerEntry = afterSecond.ticker.find(
      (t) => t.claimantId === 'player' && t.segment === 2
    );
    expect(playerEntry?.exposed).toBe(true);
    expect(playerEntry?.favorGain).toBe(0);
  });

  it('whisperTo_same_figure_contradiction_still_works', () => {
    const initial = createInitialGameState();
    const afterFirst = whisperTo(initial, 'chancellor', 'noble_pedigree');
    const afterSecond = whisperTo(afterFirst, 'chancellor', 'common_origins');
    const chancellor = afterSecond.figures.find((f) => f.id === 'chancellor')!;

    expect(chancellor.favor.player).toBe(WHISPER_FAVOR_GAIN - 10); // stays at first whisper favor (net 10), gain rejected
    expect(chancellor.exposedAgainst).toContain('player');
  });

  it('whisperTo_records_every_whisper_in_allClaims', () => {
    let state = createInitialGameState();
    expect(state.allClaims.length).toBe(0);

    state = whisperTo(state, 'chancellor', 'noble_pedigree');
    expect(state.allClaims.length).toBe(1);
    expect(state.allClaims[0]).toEqual({
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
    });

    state = whisperTo(state, 'archbishop', 'divine_favor');
    expect(state.allClaims.length).toBe(2);
    expect(state.allClaims[1]).toEqual({
      figureId: 'archbishop',
      themeId: 'divine_favor',
      segment: 2,
    });

    // Even if exposed on 3rd whisper, claim is still recorded in history
    state = whisperTo(state, 'commander', 'common_origins');
    expect(state.allClaims.length).toBe(3);
  });

  describe('Phase 10: Rival Counter-Play & Active Slander Orchestration', () => {
    it('slander reduces player favor by exactly RIVAL_SLANDER_PENALTY (10) and logs negative favorGain', () => {
      const initial = createInitialGameState();
      const next = whisperTo(initial, 'chancellor', 'noble_pedigree');

      const slanderEntry = next.ticker.find((t) => t.moveType === 'slander');
      expect(slanderEntry).toBeDefined();
      expect(slanderEntry?.claimantId).toBe('vivienne');
      expect(slanderEntry?.figureId).toBe('chancellor');
      expect(slanderEntry?.favorGain).toBe(-10);

      const chancellor = next.figures.find((f) => f.id === 'chancellor')!;
      expect(chancellor.favor.player).toBe(10); // 20 - 10
    });

    it('formal appeal (+8) does not cross the slander threshold (16), rivals whisper instead', () => {
      const initial = createInitialGameState();
      const next = appealTo(initial, 'chancellor');

      const slanderEntry = next.ticker.find((t) => t.moveType === 'slander');
      expect(slanderEntry).toBeUndefined();

      const vivienneEntry = next.ticker.find((t) => t.claimantId === 'vivienne');
      expect(vivienneEntry?.moveType).toBe('whisper');
      expect(vivienneEntry?.favorGain).toBe(RIVAL_WHISPER_FAVOR_GAIN);

      const chancellor = next.figures.find((f) => f.id === 'chancellor')!;
      expect(chancellor.favor.player).toBe(APPEAL_FAVOR_GAIN); // 8 intact
    });
  });
});
