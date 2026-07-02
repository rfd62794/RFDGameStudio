import { describe, it, expect, beforeEach } from 'vitest';
import { navigateHome } from '../src/main';

describe('navigateHome', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/arcade/rfdgamestudio/?game=horse_racing');
  });

  it('navigates to the current pathname, not domain root', () => {
    navigateHome();
    expect(window.location.href).toContain('/arcade/rfdgamestudio/');
    expect(window.location.href).not.toBe('http://localhost:3000/');
  });

  it('does not hardcode a root-relative path', () => {
    window.history.pushState({}, '', '/some/other/base/');
    navigateHome();
    expect(window.location.pathname).toBe('/some/other/base/');
  });
});
