// new: ts/tests/test_dissonance_origin_link.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

vi.mock('../src/arcade/routing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/arcade/routing')>();
  return { ...actual, navigateTo: vi.fn() };
});

import { navigateTo } from '../src/arcade/routing';
import TitlePhase from '../src/games/dissonance/phases/TitlePhase';
import App from '../src/games/dissonance/App';
import { loadGame } from '../src/engine/runtime';

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('Dissonance "Where Dissonance began" link', () => {
  it('is hidden when no origin handler is given', async () => {
    const { container, root } = await mount(<TitlePhase hasSave={false} onNewRun={() => {}} onContinue={() => {}} />);
    expect(container.querySelector('#dissonance-origin-link')).toBeNull();
    root.unmount();
  });

  it('is shown when a handler is given and calls it on click', async () => {
    const onOpenOrigin = vi.fn();
    const { container, root } = await mount(
      <TitlePhase hasSave={false} onNewRun={() => {}} onContinue={() => {}} onOpenOrigin={onOpenOrigin} />,
    );
    const link = container.querySelector('#dissonance-origin-link') as HTMLElement;
    expect(link.textContent).toContain('Where Dissonance began');
    await act(async () => {
      link.click();
    });
    expect(onOpenOrigin).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it('in the arcade app, the link opens the prototype page', async () => {
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    await act(async () => {
      (container.querySelector('#dissonance-origin-link') as HTMLElement).click();
    });
    expect(navigateTo).toHaveBeenCalledWith('dissonance_prototype');
    root.unmount();
  });
});
