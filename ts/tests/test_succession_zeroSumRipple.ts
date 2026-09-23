import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  whisperTo,
  appealTo,
  presentEvidenceTo,
} from '../src/games/succession/utils/gameOrchestration';
import { DOMAIN_RIPPLE_PENALTY } from '../src/games/succession/data/gameConstants';
import { getTelegraphedRivalRumors, getRivalThreatForFigure } from '../src/games/succession/utils/telegraphedRumors';

describe('Zero-Sum Domain Ripple Friction (ADR-013)', () => {
  it('whisperTo_applies_domain_ripple_friction_to_opposing_councilor_with_positive_favor', () => {
    const initial = createInitialGameState();

    // Step 1: Player Appeals to General Brand (Commander) -> Gains +8 favor on Commander
    const afterAppeal = appealTo(initial, 'commander');
    const commanderFavorBefore = afterAppeal.figures.find((f) => f.id === 'commander')!.favor.player;
    expect(commanderFavorBefore).toBe(8);

    // Step 2: Player Whispers to Chancellor Hector -> Conflict with Commander (-4)
    const afterWhisper = whisperTo(afterAppeal, 'chancellor', 'noble_pedigree');
    const commanderFavorAfter = afterWhisper.figures.find((f) => f.id === 'commander')!.favor.player;

    // Commander favor was reduced from 8 to 4 due to the zero-sum ripple friction
    expect(commanderFavorAfter).toBe(commanderFavorBefore - DOMAIN_RIPPLE_PENALTY);

    // Verify ticker entry records ripple metadata
    const playerWhisperEntry = afterWhisper.ticker.find(
      (t) => t.claimantId === 'player' && t.segment === 2
    );
    expect(playerWhisperEntry?.ripple).toBeDefined();
    expect(playerWhisperEntry?.ripple?.targetFigureId).toBe('commander');
    expect(playerWhisperEntry?.ripple?.penalty).toBe(DOMAIN_RIPPLE_PENALTY);
  });

  it('domain_ripple_friction_floors_at_zero_and_does_not_create_negative_favor', () => {
    const initial = createInitialGameState();
    // Commander starts at 0 favor
    expect(initial.figures.find((f) => f.id === 'commander')!.favor.player).toBe(0);

    // Player whispers to Chancellor
    const next = whisperTo(initial, 'chancellor', 'noble_pedigree');
    const commanderFavor = next.figures.find((f) => f.id === 'commander')!.favor.player;

    // Favor remains 0, not -4
    expect(commanderFavor).toBe(0);
  });

  it('formal_appeals_produce_zero_domain_ripple_friction', () => {
    const initial = createInitialGameState();

    // Set positive favor on Archbishop
    const stateWithArchbishop = appealTo(initial, 'archbishop');
    const archbishopFavorBefore = stateWithArchbishop.figures.find((f) => f.id === 'archbishop')!.favor.player;
    expect(archbishopFavorBefore).toBe(8);

    // Deliver appeal to Commander (which would normally conflict with Archbishop if whispered)
    const stateAfterCommanderAppeal = appealTo(stateWithArchbishop, 'commander');
    const archbishopFavorAfter = stateAfterCommanderAppeal.figures.find((f) => f.id === 'archbishop')!.favor.player;

    // Archbishop favor is completely untouched
    expect(archbishopFavorAfter).toBe(archbishopFavorBefore);

    const playerAppealEntry = stateAfterCommanderAppeal.ticker.find(
      (t) => t.claimantId === 'player' && t.segment === 2
    );
    expect(playerAppealEntry?.ripple).toBeUndefined();
  });

  it('presentEvidenceTo_applies_domain_ripple_friction_to_opposing_councilor', () => {
    // Start state with an Archbishop evidence item and positive Chancellor favor
    let state = createInitialGameState();
    state = appealTo(state, 'chancellor'); // Chancellor favor = 8

    // Add unspent Archbishop evidence
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

    const chancellorFavorBefore = state.figures.find((f) => f.id === 'chancellor')!.favor.player;
    expect(chancellorFavorBefore).toBe(8);

    // Present evidence to Archbishop -> conflicts with Chancellor (-4)
    const next = presentEvidenceTo(state, 'archbishop', 'secret_baptismal_record');
    const chancellorFavorAfter = next.figures.find((f) => f.id === 'chancellor')!.favor.player;

    expect(chancellorFavorAfter).toBe(chancellorFavorBefore - DOMAIN_RIPPLE_PENALTY);
    const evidenceEntry = next.ticker.find((t) => t.claimantId === 'player' && t.moveType === 'evidence');
    expect(evidenceEntry?.ripple?.targetFigureId).toBe('chancellor');
  });

  it('telegraphed_rival_rumors_computes_correct_threats_and_targets', () => {
    const state = createInitialGameState();
    const rumors = getTelegraphedRivalRumors(state.figures, state.ticker);

    expect(rumors.length).toBe(2);
    expect(rumors.some((r) => r.rivalId === 'aldric')).toBe(true);
    expect(rumors.some((r) => r.rivalId === 'vivienne')).toBe(true);

    // Check single figure threat lookup
    const threat = getRivalThreatForFigure('chancellor', state.figures, state.ticker);
    // Either defined or undefined based on AI target
    if (threat) {
      expect(threat.targetFigureId).toBe('chancellor');
      expect(threat.flavor).toBeDefined();
    }
  });
});
