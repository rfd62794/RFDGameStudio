import { describe, it, expect } from 'vitest';
import {
  validateIndictmentForFigure,
  getDiscoveredCluesFromEvidence,
  getDiscoveredTriadOptions,
  COUNCIL_CASE_SOLUTIONS,
} from '../src/games/succession/engine/deduction';
import {
  createInitialGameState,
  deliverIndictmentTo,
} from '../src/games/succession/utils/gameOrchestration';
import { SCOUTABLE_EVIDENCE } from '../src/games/succession/data/evidence';
import { INDICTMENT_FAVOR_GAIN, RIVAL_SLANDER_PENALTY } from '../src/games/succession/data/gameConstants';
import type { IndictmentTriad } from '../src/games/succession/engine/types';

describe('Regicide Triad & Indictment Engine (ADR-014)', () => {
  describe('Pure Evaluation Logic', () => {
    it('accurately validates the true solution for Chancellor Hector', () => {
      const chancellorSolution = COUNCIL_CASE_SOLUTIONS.chancellor;
      const result = validateIndictmentForFigure('chancellor', chancellorSolution);

      expect(result.isCorrect).toBe(true);
      expect(result.details.suspectMatch).toBe(true);
      expect(result.details.methodMatch).toBe(true);
      expect(result.details.motiveMatch).toBe(true);
    });

    it('accurately validates the true solution for Archbishop Valerius', () => {
      const archbishopSolution = COUNCIL_CASE_SOLUTIONS.archbishop;
      const result = validateIndictmentForFigure('archbishop', archbishopSolution);

      expect(result.isCorrect).toBe(true);
      expect(result.details.suspectMatch).toBe(true);
      expect(result.details.methodMatch).toBe(true);
      expect(result.details.motiveMatch).toBe(true);
    });

    it('accurately validates the true solution for Commander Brand', () => {
      const commanderSolution = COUNCIL_CASE_SOLUTIONS.commander;
      const result = validateIndictmentForFigure('commander', commanderSolution);

      expect(result.isCorrect).toBe(true);
      expect(result.details.suspectMatch).toBe(true);
      expect(result.details.methodMatch).toBe(true);
      expect(result.details.motiveMatch).toBe(true);
    });

    it('rejects an indictment with even a single incorrect variable', () => {
      // Correct suspect & method for Chancellor, but wrong motive
      const flawedTriad: IndictmentTriad = {
        suspect: COUNCIL_CASE_SOLUTIONS.chancellor.suspect,
        method: COUNCIL_CASE_SOLUTIONS.chancellor.method,
        motive: 'bloodline_purity' as unknown as IndictmentTriad['motive'],
      };

      const result = validateIndictmentForFigure('chancellor', flawedTriad);
      expect(result.isCorrect).toBe(false);
      expect(result.details.suspectMatch).toBe(true);
      expect(result.details.methodMatch).toBe(true);
      expect(result.details.motiveMatch).toBe(false);
    });

    it('correctly maps discovered clues from held evidence items', () => {
      const sampleEvidence = [
        SCOUTABLE_EVIDENCE.find((e) => e.id === 'signet_proof')!,
        SCOUTABLE_EVIDENCE.find((e) => e.id === 'service_record')!,
      ];

      const discoveredClues = getDiscoveredCluesFromEvidence(sampleEvidence);
      expect(discoveredClues.length).toBe(6); // 3 clues per evidence item

      const discoveredOptions = getDiscoveredTriadOptions(sampleEvidence);
      expect(discoveredOptions.suspects.has('chancellor')).toBe(true);
      expect(discoveredOptions.methods.has('forged_seal')).toBe(true);
      expect(discoveredOptions.motives.has('treasury_embezzlement')).toBe(true);
    });
  });

  describe('Game Orchestration Integration', () => {
    it('awards +40 favor when player delivers a correct indictment triad', () => {
      const initial = createInitialGameState();
      const chancellorSolution = COUNCIL_CASE_SOLUTIONS.chancellor;

      const next = deliverIndictmentTo(initial, 'chancellor', chancellorSolution);

      // Verify ticker recorded the +40 proven indictment
      const playerEntry = next.ticker.find((t) => t.claimantId === 'player' && t.segment === 1);
      expect(playerEntry?.moveType).toBe('indictment');
      expect(playerEntry?.favorGain).toBe(INDICTMENT_FAVOR_GAIN);
      expect(playerEntry?.exposed).toBe(false);
      expect(playerEntry?.indictment?.isCorrect).toBe(true);

      // Chancellor favor after reactive rival slander (40 - 10 = 30)
      const chancellorFigure = next.figures.find((f) => f.id === 'chancellor')!;
      expect(chancellorFigure.favor.player).toBe(INDICTMENT_FAVOR_GAIN - RIVAL_SLANDER_PENALTY);
      expect(chancellorFigure.exposedAgainst.includes('player')).toBe(false);
    });

    it('triggers perjury exposure and awards 0 favor when player delivers a false indictment', () => {
      const initial = createInitialGameState();
      const falseTriad = {
        suspect: 'commander' as const,
        method: 'occult_curse' as const,
        motive: 'throne_usurpation' as const,
      };

      const next = deliverIndictmentTo(initial, 'chancellor', falseTriad);

      const chancellorFigure = next.figures.find((f) => f.id === 'chancellor')!;
      // 0 favor awarded
      expect(chancellorFigure.favor.player).toBe(0);
      // Perjury exposure triggered
      expect(chancellorFigure.exposedAgainst.includes('player')).toBe(true);

      // Verify ticker entry
      const playerEntry = next.ticker.find((t) => t.claimantId === 'player' && t.segment === 1);
      expect(playerEntry?.moveType).toBe('indictment');
      expect(playerEntry?.favorGain).toBe(0);
      expect(playerEntry?.exposed).toBe(true);
      expect(playerEntry?.indictment?.isCorrect).toBe(false);
    });

    it('delivering a correct indictment clears any prior exposure for that figure', () => {
      const initial = createInitialGameState();
      // Force prior exposure on Chancellor
      const exposedInitial: typeof initial = {
        ...initial,
        figures: initial.figures.map((f) =>
          f.id === 'chancellor' ? { ...f, exposedAgainst: ['player'] } : f
        ),
      };

      const chancellorSolution = COUNCIL_CASE_SOLUTIONS.chancellor;
      const next = deliverIndictmentTo(exposedInitial, 'chancellor', chancellorSolution);

      const chancellorFigure = next.figures.find((f) => f.id === 'chancellor')!;
      expect(chancellorFigure.exposedAgainst.includes('player')).toBe(false);
      expect(chancellorFigure.favor.player).toBe(INDICTMENT_FAVOR_GAIN - RIVAL_SLANDER_PENALTY);
    });
  });
});

