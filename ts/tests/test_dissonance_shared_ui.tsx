import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import TitlePhase from '../src/games/dissonance/phases/TitlePhase';
import RewardPhase from '../src/games/dissonance/phases/RewardPhase';

async function render(element: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

describe('Dissonance shared UI retrofits', () => {
  it('TitlePhase uses shared TitleScreen and renders variable menu', async () => {
    const newRun = vi.fn();
    const cont = vi.fn();
    const { container, root } = await render(
      <TitlePhase hasSave onNewRun={newRun} onContinue={cont} />
    );

    expect(container.querySelector('#viewport-title-phase')).toBeTruthy();
    expect(container.textContent).toContain('Dissonance');

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('New Run');
    expect(buttons[1].textContent).toContain('Continue');

    await act(async () => buttons[0].click());
    expect(newRun).toHaveBeenCalled();

    await act(async () => buttons[1].click());
    expect(cont).toHaveBeenCalled();
    root.unmount();
  });

  it('RewardPhase uses shared Card and Button for rewards', async () => {
    const claim = vi.fn();
    const { container, root } = await render(
      <RewardPhase
        slots={[
          { kind: 'heal', amount: 10 },
          { kind: 'card', cardId: 'c1' },
          { kind: 'benefit', boonId: 'b1' },
          { kind: 'relic', relicId: 'r1' },
        ]}
        onClaimAll={claim}
      />
    );

    expect(container.querySelector('#viewport-reward-phase')).toBeTruthy();
    expect(container.querySelector('#reward-slot-0')).toBeTruthy();
    expect(container.querySelector('#reward-slot-3')).toBeTruthy();

    const claimBtn = container.querySelector('#reward-claim-all-btn') as HTMLElement | null;
    expect(claimBtn?.textContent).toContain('Claim All');
    await act(async () => claimBtn?.click());
    expect(claim).toHaveBeenCalled();
    root.unmount();
  });
});
