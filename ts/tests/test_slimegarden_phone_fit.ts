import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../../examples/slimegarden/src/App.tsx'),
  'utf8'
);

describe('slimegarden phone fit', () => {
  it('clips the decorative background blobs so the page cannot scroll sideways', () => {
    const rootIdx = appSource.indexOf('min-h-screen bg-[#090d16]');
    expect(rootIdx).toBeGreaterThan(-1);
    const rootLine = appSource.slice(rootIdx, appSource.indexOf('>', rootIdx));
    expect(rootLine).toContain('overflow-x-clip');
  });

  it('keeps the two decorative blobs and the sticky header', () => {
    expect(appSource).toContain('top-24 left-1/4 w-96 h-96');
    expect(appSource).toContain('bottom-24 right-1/4 w-[500px] h-[500px]');
    expect(appSource).toContain('sticky top-0 z-30');
  });
});
