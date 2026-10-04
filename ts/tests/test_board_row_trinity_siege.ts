// new: ts/tests/test_board_row_trinity_siege.ts
import { describe, it, expect } from 'vitest';
import { STATUS_BOARD } from '../src/status/board.data';

describe('status board row: trinity_siege', () => {
  const row = STATUS_BOARD.find(e => e.id === 'trinity_siege')!;

  it('describes the game that exists (the hex-ring embed), not the unbuilt Rust chassis', () => {
    expect(row.status).toBe('active');
    expect(row.currentState).toContain('Hex-ring');
    expect(row.currentState).not.toMatch(/Bevy vs\. egui/);
  });
  it('still says the Rust three-faction chassis is Far Future', () => {
    expect(row.currentState).toContain('Far Future');
  });
});
