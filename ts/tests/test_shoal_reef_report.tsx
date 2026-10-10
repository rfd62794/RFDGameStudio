// new: ts/tests/test_shoal_reef_report.tsx
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { buildReefReport } from '../src/games/shoal/utils/reefReport';

vi.mock('../src/games/shoal/components/ReefPreview', () => ({
  default: () => null,
}));

import TitleScreen from '../src/games/shoal/components/TitleScreen';

const base = { seed: 7, ticks: 1200, peakFish: 80, peakSharks: 4, peakAlgae: 60, endAlgae: 25 };

describe('buildReefReport', () => {
  it('lists six stats in a fixed order', () => {
    const r = buildReefReport(base);
    expect(r.stats.map((s) => s.label)).toEqual([
      'Ticks Survived',
      'Peak Fish',
      'Peak Sharks',
      'Peak Algae',
      'Algae Left',
      'Seed',
    ]);
    expect(r.stats.map((s) => s.value)).toEqual([1200, 80, 4, 60, 25, 7]);
  });

  it('no algae left: the nudge is about seeding algae', () => {
    expect(buildReefReport({ ...base, endAlgae: 0 }).nudge).toContain('algae ran out');
  });

  it('many sharks for the school size: the nudge is about the sharks', () => {
    expect(buildReefReport({ ...base, peakFish: 20, peakSharks: 8 }).nudge).toContain('sharks outpaced');
  });

  it('otherwise: the nudge is about dropping fish into open water', () => {
    expect(buildReefReport(base).nudge).toContain('dropping fish');
  });
});

describe('Shoal title screen session note', () => {
  it('tells the player the reef is not saved', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<TitleScreen session={undefined as never} onStart={() => {}} onHowToPlay={() => {}} />);
    });
    const note = container.querySelector('[data-testid="shoal-session-note"]');
    expect(note?.textContent).toContain('is not saved');
    root.unmount();
  });
});
