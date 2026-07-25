import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { TitleScreen, EndStateScreen, ProgressIndicator } from '../src/ui/components';

async function render(element: React.ReactElement) {
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

describe('TitleScreen', () => {
  it('renders title, pitch, quote and variable menu items', async () => {
    const clickFn = vi.fn();
    const { container, root } = await render(
      <TitleScreen
        id="my-title"
        title="Test Title"
        tagline="Test Tagline"
        pitch="This is the pitch."
        quote="A memorable quote."
        menuItems={[
          { id: 'start', label: 'Start', onClick: clickFn, variant: 'primary' },
          { id: 'settings', label: 'Settings', onClick: () => {}, variant: 'secondary' },
        ]}
      />
    );

    expect(container.querySelector('#my-title')).toBeTruthy();
    expect(container.textContent).toContain('Test Title');
    expect(container.textContent).toContain('Test Tagline');
    expect(container.textContent).toContain('This is the pitch.');
    expect(container.textContent).toContain('A memorable quote.');

    const buttons = Array.from(container.querySelectorAll('button')) as HTMLElement[];
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Start');

    await act(async () => {
      buttons[0].click();
    });
    expect(clickFn).toHaveBeenCalled();
    root.unmount();
  });
});

describe('EndStateScreen', () => {
  it('renders win and loss states', async () => {
    const win = await render(
      <EndStateScreen
        won
        headline="Victory"
        flavorLine="You won."
        stats={[{ label: 'Score', value: 123 }]}
        onRestart={() => {}}
      />
    );
    expect(win.container.textContent).toContain('Victory');
    expect(win.container.textContent).toContain('You won.');
    expect(win.container.textContent).toContain('Score');
    expect(win.container.textContent).toContain('123');
    win.root.unmount();

    const loss = await render(
      <EndStateScreen
        won={false}
        headline="Defeat"
        flavorLine="You lost."
        stats={[{ label: 'Score', value: 0 }]}
        onRestart={() => {}}
      />
    );
    expect(loss.container.textContent).toContain('Defeat');
    expect(loss.container.textContent).toContain('You lost.');
    loss.root.unmount();
  });

  it('calls onRestart when restart button clicked', async () => {
    const restart = vi.fn();
    const { container, root } = await render(
      <EndStateScreen
        won={false}
        headline="Defeat"
        flavorLine="Try again."
        stats={[]}
        onRestart={restart}
        restartLabel="Retry"
      />
    );
    const button = container.querySelector('button') as HTMLElement | null;
    expect(button?.textContent).toContain('Retry');
    await act(async () => button?.click());
    expect(restart).toHaveBeenCalled();
    root.unmount();
  });
});

describe('ProgressIndicator', () => {
  it('renders a generic node graph with connections', async () => {
    const selectFn = vi.fn();
    const { container, root } = await render(
      <ProgressIndicator
        layout="graph"
        nodes={[
          { id: 'a', type: 'start', state: 'completed', x: 20, y: 50 },
          { id: 'b', type: 'fight', state: 'active', x: 50, y: 50 },
          { id: 'c', type: 'boss', state: 'pending', x: 80, y: 50 },
        ]}
        connections={[{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }]}
        onSelectNode={selectFn}
      />
    );

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2);
    expect(container.textContent).toContain('start');
    expect(container.textContent).toContain('fight');
    expect(container.textContent).toContain('boss');
    root.unmount();
  });

  it('renders a linear progress row and allows selecting active/pending nodes', async () => {
    const selectFn = vi.fn();
    const { container, root } = await render(
      <ProgressIndicator
        layout="linear"
        nodes={[
          { id: 1, type: 'a', state: 'completed' },
          { id: 2, type: 'b', state: 'active' },
          { id: 3, type: 'c', state: 'pending' },
        ]}
        onSelectNode={selectFn}
      />
    );

    expect(container.querySelectorAll('button').length).toBe(3);
    // Completed node is disabled; active should be clickable.
    const buttons = Array.from(container.querySelectorAll('button'));
    await act(async () => buttons[1].click());
    expect(selectFn).toHaveBeenCalledWith(2);
    root.unmount();
  });
});
