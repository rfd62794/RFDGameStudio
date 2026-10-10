import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { H3_GOAL_TARGET, h3GoalProgress } from '../src/games/voiddrift_redux/simulation/goal';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/voiddrift_redux/App.tsx'),
  'utf8'
);

describe('VoidDrift Core Loop soft goal', () => {
  it('targets 100 H3 Gas', () => {
    expect(H3_GOAL_TARGET).toBe(100);
  });

  it('reports progress, capped at the target', () => {
    expect(h3GoalProgress(0)).toEqual({ current: 0, target: 100, percent: 0, reached: false });
    expect(h3GoalProgress(37)).toEqual({ current: 37, target: 100, percent: 37, reached: false });
    expect(h3GoalProgress(100)).toEqual({ current: 100, target: 100, percent: 100, reached: true });
    expect(h3GoalProgress(250)).toEqual({ current: 100, target: 100, percent: 100, reached: true });
  });

  it('treats negative and non-finite input as zero', () => {
    expect(h3GoalProgress(-5).current).toBe(0);
    expect(h3GoalProgress(Number.NaN).current).toBe(0);
  });
});

describe('VoidDrift Core Loop details toggle', () => {
  it('hides the FSM inspector and diagnostics behind a Details toggle that starts closed', () => {
    expect(appSource).toContain('const [showDetails, setShowDetails] = useState<boolean>(false);');
    expect(appSource).toContain('id="voiddrift-details-btn"');
    expect(appSource).toMatch(/\{showDetails && \(\s*<FSMInspector/);
    expect(appSource).toMatch(/\{showDetails && \(\s*<button\s+id="open-diagnostics-btn"/);
    expect(appSource).toContain('isOpen={isModalOpen && showDetails}');
  });

  it('shows the goal strip in the default view', () => {
    expect(appSource).toContain('<GoalStrip h3Gas={stats.resources?.H3Gas || 0} />');
  });
});
