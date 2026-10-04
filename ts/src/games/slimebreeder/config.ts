import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// SlimeBreeder merged with SlimeGarden to become the current, live
// SlimeWorld (ts/src/games/slimeworld/). Presented here as real origin
// history, not as a new game competing with the one it led to.
const config: GameConfig = {
  gameId: 'slimebreeder',
  order: 340,
  source: { kind: 'sibling', repo: 'SlimeBreeder' },
  label: 'SlimeBreeder',
  supersededBy: 'slimeworld',
  description: 'Frozen origin exhibit: the standalone slime-breeding prototype that was merged with SlimeGarden to become SlimeWorld. It is kept for history and is no longer developed. Progress saves in your browser. For the current game, play SlimeWorld.',
  color: '#ec4899',
  status: 'external',
  genre: 'creature-collector',
  tags: ['origin-project'],
  embedUrl: '/arcade/slimebreeder/',
};

export default config;
