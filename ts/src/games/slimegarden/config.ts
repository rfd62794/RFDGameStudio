import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// SlimeGarden merged with SlimeBreeder to become the current, live
// SlimeWorld (ts/src/games/slimeworld/). Presented here as real origin
// history, not as a new game competing with the one it led to.
const config: GameConfig = {
  gameId: 'slimegarden',
  order: 330,
  source: { kind: 'example', slug: 'slimegarden' },
  label: 'Slimegarden',
  supersededBy: 'slimeworld',
  description: 'Frozen origin exhibit: the early multi-tank slime breeding sandbox that grew into SlimeWorld. Breed slimes, send them on dispatches and claim planet territory. Kept for history and no longer developed. For the current game, play SlimeWorld.',
  color: '#6c8ef7',
  status: 'external',
  genre: 'creature-collector',
  tags: ['origin-project', 'territory-control'],
  embedUrl: '/arcade/slimegarden/',
};

export default config;
