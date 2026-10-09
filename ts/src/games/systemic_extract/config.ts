import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'systemic_extract',
  order: 190,
  source: { kind: 'example', slug: 'systemic-extract' },
  label: 'Systemic Extract',
  description: 'Deploy from a sanctuary into four dungeon sectors, survive spreading hazards and escalating hives, and extract with salvage. An early build: the hideout where salvage gets spent is not open yet.',
  color: '#22d3ee',
  status: 'external',
  genre: 'roguelike',
  tags: ['extraction', 'ecs-sandbox'],
  embedUrl: '/arcade/systemic_extract/',
};

export default config;
