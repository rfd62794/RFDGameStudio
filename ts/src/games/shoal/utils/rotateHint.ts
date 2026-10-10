// new: ts/src/games/shoal/utils/rotateHint.ts
/** Decides whether the "turn your phone sideways" card shows. Pure: no DOM access. */
export interface Viewport {
  width: number;
  height: number;
}

/** Portrait viewports narrower than this need the hint (the reef canvas wants width). */
export const ROTATE_HINT_MAX_WIDTH = 600;

export function shouldShowRotateHint(viewport: Viewport, dismissed: boolean): boolean {
  if (dismissed) return false;
  return viewport.height > viewport.width && viewport.width < ROTATE_HINT_MAX_WIDTH;
}
