// new: ts/tests/test_dissonance_sound.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/dissonance/App';
import { loadGame } from '../src/engine/runtime';
import { sfx } from '../src/engine/shared/sfx';
import { playSfx } from '../src/games/dissonance/utils/playSfx';
import { SOUND_MUTED_KEY, isSoundMuted, setSoundMuted } from '../src/games/dissonance/utils/soundPrefs';

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('sound preference', () => {
  it('defaults to sound on and remembers a mute', () => {
    expect(isSoundMuted()).toBe(false);
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe('true');
    setSoundMuted(false);
    expect(isSoundMuted()).toBe(false);
  });

  it('playSfx plays through the shared engine when sound is on and stays silent when muted', () => {
    const play = vi.spyOn(sfx, 'play').mockImplementation(() => {});
    playSfx('click');
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith('click');
    setSoundMuted(true);
    playSfx('click');
    expect(play).toHaveBeenCalledTimes(1);
  });
});

describe('sound toggle in the header', () => {
  it('is on the title screen, mutes with one click and is still muted after a reload', async () => {
    const session = loadGame('dissonance', 1);
    let { container, root } = await mount(<App session={session} />);
    const toggle = () => container.querySelector('#dissonance-sound-toggle') as HTMLElement | null;
    expect(toggle()).not.toBeNull();
    expect(toggle()?.getAttribute('title')).toBe('Mute sound');

    await act(async () => {
      toggle()?.click();
    });
    expect(toggle()?.getAttribute('title')).toBe('Unmute sound');
    expect(isSoundMuted()).toBe(true);

    // "Reload": new App on the same storage.
    root.unmount();
    document.body.innerHTML = '';
    ({ container, root } = await mount(<App session={session} />));
    expect(container.querySelector('#dissonance-sound-toggle')?.getAttribute('title')).toBe('Unmute sound');
    root.unmount();
  });

  it('a muted player hears nothing when starting a new run', async () => {
    setSoundMuted(true);
    const play = vi.spyOn(sfx, 'play').mockImplementation(() => {});
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    const newRun = container.querySelector('#new-run') as HTMLElement;
    await act(async () => {
      newRun.click();
    });
    expect(play).not.toHaveBeenCalled();
    root.unmount();
  });

  it('an unmuted player hears a click when starting a new run', async () => {
    const play = vi.spyOn(sfx, 'play').mockImplementation(() => {});
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    const newRun = container.querySelector('#new-run') as HTMLElement;
    await act(async () => {
      newRun.click();
    });
    expect(play).toHaveBeenCalledWith('click');
    root.unmount();
  });
});
