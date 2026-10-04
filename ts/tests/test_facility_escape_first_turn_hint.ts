// new: ts/tests/test_facility_escape_first_turn_hint.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FIRST_TURN_HINT, shouldShowFirstTurnHint } from '../../examples/facility-escape/src/utils/firstTurnHint';

describe('facility_escape first-turn hint', () => {
  it('shows only in Room 1 before the first move', () => {
    expect(shouldShowFirstTurnHint(1, 0)).toBe(true);
    expect(shouldShowFirstTurnHint(1, 1)).toBe(false);
    expect(shouldShowFirstTurnHint(2, 0)).toBe(false);
  });
  it('is exactly three plain lines', () => {
    expect(FIRST_TURN_HINT).toHaveLength(3);
    expect(FIRST_TURN_HINT.join(' ').toLowerCase()).toContain('guards show their next move');
  });
  it('is wired into App.tsx', () => {
    const app = readFileSync(resolve(import.meta.dirname, '../../examples/facility-escape/src/App.tsx'), 'utf8');
    expect(app).toContain("from './utils/firstTurnHint'");
    expect(app).toContain('shouldShowFirstTurnHint(gameState.roomNumber, gameState.turnCount)');
  });
});
