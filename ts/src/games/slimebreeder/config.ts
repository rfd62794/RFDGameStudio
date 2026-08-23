import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// SlimeBreeder merged with SlimeGarden to become the current, live
// SlimeWorld (ts/src/games/slimeworld/). Presented here as real origin
// history, not as a new game competing with the one it led to.
const config: GameConfig = {
  gameId: 'slimebreeder',
  label: 'SlimeBreeder (Origin)',
  description: 'Origin project — a standalone TypeScript reimagining of the SlimeGarden core loop. Merged with SlimeGarden to become the current, live SlimeWorld (ts/src/games/slimeworld/).',
  color: '#ec4899',
  status: 'external',
  embedUrl: '/arcade/slimebreeder/',
};

export default config;
