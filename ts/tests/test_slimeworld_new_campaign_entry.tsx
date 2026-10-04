import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

describe('SlimeWorld New Campaign entry in the header', () => {
  it('shows a visible New Campaign button beside the Options gear', () => {
    expect(appSource).toContain('aria-label="New Campaign">New Campaign</button>');
    expect(appSource.indexOf('aria-label="New Campaign"')).toBeLessThan(appSource.indexOf('aria-label="Options"'));
  });

  it('opens the existing two-step confirm instead of resetting directly', () => {
    expect(appSource).toContain('setPendingHardReset(true); setShowOptionsMenu(true);');
    const handlerIdx = appSource.indexOf('aria-label="New Campaign"');
    const clickStart = appSource.lastIndexOf('<button', handlerIdx);
    expect(appSource.slice(clickStart, handlerIdx)).not.toContain('handleHardReset');
  });
});
