// new: ts/tests/test_shoal_rotate_hint.tsx
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { shouldShowRotateHint } from '../src/games/shoal/utils/rotateHint';
import RotateHint from '../src/games/shoal/components/RotateHint';

describe('shouldShowRotateHint', () => {
  it('shows on a portrait phone', () => {
    expect(shouldShowRotateHint({ width: 390, height: 844 }, false)).toBe(true);
  });
  it('hides on a landscape phone', () => {
    expect(shouldShowRotateHint({ width: 844, height: 390 }, false)).toBe(false);
  });
  it('hides on a wide portrait screen such as a tablet', () => {
    expect(shouldShowRotateHint({ width: 820, height: 1180 }, false)).toBe(false);
  });
  it('hides once dismissed', () => {
    expect(shouldShowRotateHint({ width: 390, height: 844 }, true)).toBe(false);
  });
});

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

describe('RotateHint component', () => {
  it('renders in portrait, dismisses on click, and follows rotation', async () => {
    setViewport(390, 844);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<RotateHint />);
    });
    expect(container.querySelector('[data-testid="shoal-rotate-hint"]')).not.toBeNull();

    await act(async () => {
      setViewport(844, 390);
      window.dispatchEvent(new Event('resize'));
    });
    expect(container.querySelector('[data-testid="shoal-rotate-hint"]')).toBeNull();

    await act(async () => {
      setViewport(390, 844);
      window.dispatchEvent(new Event('resize'));
    });
    const button = container.querySelector('button');
    expect(button?.textContent).toContain('Got it');
    await act(async () => {
      button?.click();
    });
    expect(container.querySelector('[data-testid="shoal-rotate-hint"]')).toBeNull();
    root.unmount();
  });
});
