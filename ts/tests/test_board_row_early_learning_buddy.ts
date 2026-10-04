// new: ts/tests/test_board_row_early_learning_buddy.ts
import { describe, it, expect } from 'vitest';
import { STATUS_BOARD } from '../src/status/board.data';
import { generateMarkdown } from '../src/status/generateMarkdown';

describe('status board row: early_learning_buddy', () => {
  const row = STATUS_BOARD.find(e => e.id === 'early_learning_buddy')!;

  it('is parked, says it is unlisted, and names the next step', () => {
    expect(row.status).toBe('parked');
    expect(row.currentState).toContain('unlisted');
    expect(row.nextAction).toBeTruthy();
  });
  it('the markdown generator labels a parked row "Parked"', () => {
    expect(generateMarkdown(STATUS_BOARD)).toContain('Parked');
  });
});
