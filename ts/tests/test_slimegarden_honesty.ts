import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/slimegarden/config';

const root = resolve(import.meta.dirname, '../../examples/slimegarden');
const appSource = readFileSync(resolve(root, 'src/App.tsx'), 'utf8');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');

describe('slimegarden honesty', () => {
  it('links to the successor game, SlimeWorld', () => {
    expect(appSource).toContain('href="../slimeworld/"');
    expect(appSource).toContain('Play the successor: SlimeWorld');
  });

  it('README no longer asks for an API key or links the AI Studio banner', () => {
    expect(readme).not.toContain('GEMINI_API_KEY');
    expect(readme).not.toContain('GHBanner');
    expect(readme).not.toContain('Run and deploy your AI Studio app');
  });

  it('README says what the game is and that SlimeWorld replaced it', () => {
    expect(readme).toContain('# SlimeGarden');
    expect(readme).toContain('SlimeWorld');
    expect(readme.split('\n').length).toBeLessThanOrEqual(20);
  });

  it('registry blurb is short, welcoming and free of repo paths', () => {
    const description = config.description ?? '';
    expect(description.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    expect(description).not.toContain('ts/src');
    expect(description).toContain('SlimeWorld');
    expect(description).toContain('Frozen origin exhibit');
    expect(config.supersededBy).toBe('slimeworld');
  });
});
