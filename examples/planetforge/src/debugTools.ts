// new: examples/planetforge/src/debugTools.ts

/** Developer tools (the in-app Test Runner) show only when the page address carries `?debug=1`. */
export function debugToolsEnabled(search: string): boolean {
  return new URLSearchParams(search).get('debug') === '1';
}
