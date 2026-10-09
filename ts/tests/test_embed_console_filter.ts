import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  isThirdPartyFrameError,
  splitConsoleErrors,
} from '../src/arcade/embedConsoleFilter';

const AUTOFOCUS =
  'Blocked autofocusing on a <input> element in a cross-origin subframe.';

describe('embed console filter', () => {
  it('recognises the itch.io autofocus message', () => {
    expect(isThirdPartyFrameError(AUTOFOCUS)).toBe(true);
    expect(isThirdPartyFrameError('blocked autofocusing on a <input> element in a cross-origin subframe')).toBe(true);
  });

  it('does not hide a real error', () => {
    expect(isThirdPartyFrameError('Uncaught TypeError: x is not a function')).toBe(false);
    expect(isThirdPartyFrameError('Failed to load resource: the server responded with a status of 404')).toBe(false);
  });

  it('for an embed, splits third-party noise from our own errors', () => {
    const out = splitConsoleErrors([AUTOFOCUS, 'Uncaught TypeError: boom'], true);
    expect(out.thirdParty).toEqual([AUTOFOCUS]);
    expect(out.ours).toEqual(['Uncaught TypeError: boom']);
  });

  it('for a non-embed, keeps every error as ours', () => {
    const out = splitConsoleErrors([AUTOFOCUS], false);
    expect(out.ours).toEqual([AUTOFOCUS]);
    expect(out.thirdParty).toEqual([]);
  });

  it('an embed with only the third-party message has zero errors of ours (A1 passes)', () => {
    expect(splitConsoleErrors([AUTOFOCUS], true).ours).toHaveLength(0);
  });
});

describe('polish standard A1 states the embed rule', () => {
  it('mentions embedConsoleFilter next to A1', () => {
    const spec = readFileSync(
      resolve(import.meta.dirname, '../../docs/superpowers/specs/2026-10-03-demo-polish-standard.md'),
      'utf8'
    );
    const a1 = spec.split('\n').find((l) => l.startsWith('- A1.')) ?? '';
    expect(a1).toContain('ts/src/arcade/embedConsoleFilter.ts');
  });
});
