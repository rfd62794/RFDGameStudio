import type { GameConfig } from '../../engine/types';

// Legacy/Origin Project — see docs/adr/ADR-023-legacy-origin-projects-type.md.
// This is "Dissonance Loop Prototype" (source in examples/dissonance-prototype/),
// the original AI Studio source that became the live Dissonance Depths
// (ts/src/games/dissonance/). Presented here as real origin history, not
// as a new game competing with the one it led to.
const config: GameConfig = {
  gameId: 'dissonance_prototype',
  order: 320,
  label: 'Dissonance Loop Prototype',
  supersededBy: 'dissonance',
  description: 'Where Dissonance Depths began: the first version of its turn-based card duels, where cards combine by how their elements relate. Kept as it was built, so you can see how the game grew.',
  color: '#78716c',
  status: 'external',
  genre: 'roguelike',
  tags: ['origin-project', 'ai-studio-source'],
  embedUrl: '/arcade/dissonance_prototype/',
};

export default config;
