import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// This is "Dissonance Loop Prototype" (tmp/dissonance-src/), the original
// AI Studio (Gemini API) source that became the live Dissonance Depths
// (ts/src/games/dissonance/). Presented here as real origin history, not
// as a new game competing with the one it led to.
const config: GameConfig = {
  gameId: 'dissonance_prototype',
  label: 'Dissonance Loop Prototype (Origin)',
  description: 'Origin project — the original AI Studio (Gemini API) core-loop prototype that became the live Dissonance Depths (ts/src/games/dissonance/). Tested turn-based combat, relation-based combination mechanics, and Locked/Hinted/Discovered stabilization.',
  color: '#78716c',
  status: 'external',
  embedUrl: '/arcade/dissonance_prototype/',
};

export default config;
