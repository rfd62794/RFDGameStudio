// Shared Fuzzy Match Engine — generalized from Early Learning Buddy
//
// Real, working Levenshtein-based fuzzy matching for spoken answers.
// Speech recognition is inherently noisy — users pronounce things
// differently, the browser may mishear, and exact matching on spoken
// input produces false negatives. This module provides:
//
// 1. Levenshtein edit distance — the core algorithm
// 2. fuzzyMatch — a configurable matcher that handles:
//    - Direct equality / substring match
//    - Per-word matching (for multi-word transcripts)
//    - Edit-distance tolerance (configurable threshold)
//    - Phonetic alias maps (optional, caller-supplied)
//
// Source: Early Learning Buddy (src/components/PracticeCard.tsx)
// Generalized: stripped ELB-specific PHONETIC_MAP (letter/number
// pronunciations). The phonetic alias system is preserved as a
// caller-supplied parameter so any project can provide its own
// domain-specific phonetic mappings.

/**
 * Standard Levenshtein edit distance between two strings.
 * Returns the number of single-character edits (insertions, deletions,
 * substitutions) needed to transform `a` into `b`.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export interface FuzzyMatchOptions {
  /** Maximum edit distance for fuzzy matching (default: 2) */
  maxDistance?: number;
  /** Minimum target string length to apply fuzzy matching (default: 3) */
  minFuzzyLength?: number;
  /** Edit distance threshold for short targets (default: 1) */
  shortMaxDistance?: number;
  /** Length threshold for "short" targets (default: 2) */
  shortLengthCutoff?: number;
  /** Optional phonetic alias map: target -> array of accepted spoken forms */
  phoneticMap?: Record<string, string[]>;
}

/**
 * Check if a spoken/typed input matches a target string using fuzzy matching.
 *
 * Matching strategy (in order):
 * 1. Direct equality or substring match
 * 2. Phonetic alias match (if phoneticMap provided and target has aliases)
 * 3. Per-word edit distance (for multi-word transcripts)
 * 4. Full-phrase edit distance
 *
 * @param input The user's spoken or typed input
 * @param target The expected answer
 * @param options Configuration for matching thresholds and phonetic aliases
 * @returns true if the input is considered a match for the target
 */
export function fuzzyMatch(input: string, target: string, options: FuzzyMatchOptions = {}): boolean {
  const {
    maxDistance = 2,
    minFuzzyLength = 3,
    shortMaxDistance = 1,
    shortLengthCutoff = 2,
    phoneticMap = {},
  } = options;

  const cleanInput = input.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const cleanTarget = target.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!cleanInput || !cleanTarget) return false;

  // Exact match (typed input path)
  if (cleanInput === cleanTarget) return true;
  if (cleanInput.includes(cleanTarget) || cleanTarget.includes(cleanInput)) return true;

  // Per-word matching (for multi-word spoken transcripts)
  const words = cleanInput.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);

  // 1. Direct word match
  if (words.some((w) => w === cleanTarget)) return true;

  // 2. Phonetic alias match
  const phonetics = phoneticMap[cleanTarget] || [];
  if (phonetics.length > 0) {
    if (words.some((w) => phonetics.includes(w))) return true;
    if (phonetics.some((p) => cleanInput.includes(p))) return true;
  }

  // 3. Edit distance fuzzy match
  if (cleanTarget.length >= minFuzzyLength) {
    const distFull = levenshteinDistance(cleanInput, cleanTarget);
    if (distFull <= maxDistance) return true;

    const minWordDist = words.length > 0
      ? Math.min(...words.map((w) => levenshteinDistance(w, cleanTarget)))
      : 999;
    if (minWordDist <= maxDistance) return true;

    // Partial match: input is a substring of target (e.g. "drag" -> "dragon")
    if (cleanTarget.includes(cleanInput) && cleanInput.length >= minFuzzyLength) return true;
  } else if (cleanTarget.length === shortLengthCutoff) {
    const minWordDist = words.length > 0
      ? Math.min(...words.map((w) => levenshteinDistance(w, cleanTarget)))
      : 999;
    if (minWordDist <= shortMaxDistance) return true;
  }

  return false;
}
