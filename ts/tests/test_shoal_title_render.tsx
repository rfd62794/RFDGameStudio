// new: ts/tests/test_shoal_title_render.tsx
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

vi.mock('../src/games/shoal/components/ReefPreview', () => ({
  default: () => null,
}));

import TitleScreen from '../src/games/shoal/components/TitleScreen';

async function renderTitle(onStart: (c: unknown) => void, onHowToPlay: () => void) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <TitleScreen session={undefined as never} onStart={onStart} onHowToPlay={onHowToPlay} />,
    );
  });
  return { container, root };
}

function buttonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(text),
  );
  if (!found) throw new Error(`no button containing "${text}"`);
  return found as HTMLButtonElement;
}

describe('Shoal title screen (rendered)', () => {
  it('Start Reef starts the Balanced scenario with a null seed', async () => {
    const onStart = vi.fn();
    const { container, root } = await renderTitle(onStart, () => {});
    await act(async () => {
      buttonByText(container, 'Start Reef').click();
    });
    expect(onStart).toHaveBeenCalledWith({
      initial_fish: 60,
      initial_sharks: 8,
      initial_algae_hubs: 6,
      seed: null,
    });
    root.unmount();
  });

  it('picking Feeding Frenzy changes what Start Reef starts', async () => {
    const onStart = vi.fn();
    const { container, root } = await renderTitle(onStart, () => {});
    await act(async () => {
      buttonByText(container, 'Feeding Frenzy').click();
    });
    await act(async () => {
      buttonByText(container, 'Start Reef').click();
    });
    expect(onStart).toHaveBeenCalledWith({
      initial_fish: 50,
      initial_sharks: 16,
      initial_algae_hubs: 5,
      seed: null,
    });
    root.unmount();
  });

  it("Today's Reef passes the daily seed and How to Play opens the primer", async () => {
    const onStart = vi.fn();
    const onHowToPlay = vi.fn();
    const { container, root } = await renderTitle(onStart, onHowToPlay);
    await act(async () => {
      buttonByText(container, "Today's Reef").click();
    });
    expect(onStart.mock.calls[0][0]).toMatchObject({ seed: 'daily' });
    await act(async () => {
      buttonByText(container, 'How to Play').click();
    });
    expect(onHowToPlay).toHaveBeenCalledTimes(1);
    root.unmount();
  });
});
