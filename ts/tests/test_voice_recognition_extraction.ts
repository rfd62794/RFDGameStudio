import { describe, it, expect } from 'vitest';
import { levenshteinDistance, fuzzyMatch } from '../src/engine/shared/voiceRecognition/fuzzyMatch';

describe('Voice Recognition Extraction — fuzzyMatch (generalized from ELB)', () => {
  describe('levenshteinDistance', () => {
    it('returns 0 for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    it('returns string length for empty vs non-empty', () => {
      expect(levenshteinDistance('', 'abc')).toBe(3);
      expect(levenshteinDistance('abc', '')).toBe(3);
    });

    it('computes single-character substitution', () => {
      expect(levenshteinDistance('cat', 'kat')).toBe(1);
    });

    it('computes insertion', () => {
      expect(levenshteinDistance('drag', 'dragon')).toBe(2);
    });
  });

  describe('fuzzyMatch — tested with non-ELB content (genuinely generalized)', () => {
    it('matches exact input to target', () => {
      expect(fuzzyMatch('dragon', 'dragon')).toBe(true);
    });

    it('matches substring', () => {
      expect(fuzzyMatch('the dragon flies', 'dragon')).toBe(true);
    });

    it('matches with edit distance tolerance for speech', () => {
      // "kat" -> "cat" (1 edit) — typical speech misrecognition
      expect(fuzzyMatch('kat', 'cat')).toBe(true);
    });

    it('matches multi-word transcript against target word', () => {
      expect(fuzzyMatch('I see a draggon', 'dragon')).toBe(true);
    });

    it('does NOT match completely different strings', () => {
      expect(fuzzyMatch('elephant', 'dragon')).toBe(false);
    });

    it('does NOT match empty input', () => {
      expect(fuzzyMatch('', 'dragon')).toBe(false);
    });

    it('matches with caller-supplied phonetic map', () => {
      // Non-ELB phonetic example: military ranks
      const phoneticMap = {
        lieutenant: ['leftenant', 'lootenant', 'lieu'],
      };
      expect(fuzzyMatch('leftenant', 'lieutenant', { phoneticMap })).toBe(true);
      expect(fuzzyMatch('lootenant', 'lieutenant', { phoneticMap })).toBe(true);
    });

    it('respects configurable distance threshold', () => {
      // "draggon" -> "dragon" is 1 edit, within default threshold of 2
      expect(fuzzyMatch('draggon', 'dragon')).toBe(true);
      // "draggonnn" -> "dragon" is 3 edits, outside default threshold of 2
      expect(fuzzyMatch('draggonnn', 'dragon')).toBe(false);
    });

    it('handles case-insensitive matching', () => {
      expect(fuzzyMatch('DRAGON', 'dragon')).toBe(true);
      expect(fuzzyMatch('Dragon', 'dragon')).toBe(true);
    });

    it('handles punctuation in input', () => {
      expect(fuzzyMatch('dragon!', 'dragon')).toBe(true);
      expect(fuzzyMatch('it is a dragon.', 'dragon')).toBe(true);
    });
  });
});
