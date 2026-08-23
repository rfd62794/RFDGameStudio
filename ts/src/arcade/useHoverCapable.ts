import { useEffect, useState } from 'react';

// Real, standard hover-capability check — `(hover: hover)` reflects the
// primary input mechanism's real ability to hover (mouse/trackpad), not
// a fragile user-agent sniff. Touch-only devices report `(hover: none)`
// even if a mouse is later attached, at which point the media query
// listener re-evaluates and this hook updates — real, live detection,
// not a one-time guess at mount.
function queryHoverCapable(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    // No real way to check (e.g. non-browser test environment) — default
    // to the more accessible assumption (treat as touch/no-hover) so the
    // real tap-to-reveal fallback is exercised rather than silently
    // skipped.
    return false;
  }
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Real, live hover-capability detection for the arcade hover-preview
 * feature. Returns true when the primary input can genuinely hover
 * (desktop mouse/trackpad), false on touch-only devices — used to
 * decide between the CSS-hover preview path and the real tap-to-reveal
 * fallback required for touch accessibility.
 */
export function useHoverCapable(): boolean {
  const [hoverCapable, setHoverCapable] = useState(queryHoverCapable);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(hover: hover)');
    const handler = () => setHoverCapable(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return hoverCapable;
}
