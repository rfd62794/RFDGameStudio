import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// SlimeGarden merged with SlimeBreeder to become the current, live
// SlimeWorld (ts/src/games/slimeworld/). Presented here as real origin
// history, not as a new game competing with the one it led to.
const config: GameConfig = {
  gameId: 'slimegarden',
  label: 'Slimegarden (Origin)',
  description: 'Origin project — the original multi-tank slime breeding and genetics sandbox. Merged with SlimeBreeder to become the current, live SlimeWorld (ts/src/games/slimeworld/). Real specimen dispatch, territory claims, and garrison risk across planet nodes.',
  color: '#6c8ef7',
  status: 'external',
  embedUrl: '/arcade/slimegarden/',
};

export default config;
