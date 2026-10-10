import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'factory_idle',
  source: { kind: 'example', slug: 'factory-idle-precision-armory-phase2' },
  order: 210,
  label: 'Factory Idle: Precision Workshop',
  description: 'Early build, published as-is (Phase 2 of 5): a tile-based factory sim with conveyors, power, research and an armory storefront. It has no goal and no saving yet, so progress is lost on reload.',
  color: '#b87333',
  status: 'external',
  genre: 'idle-incremental',
  tags: ['manufacturing-automation', 'logistics'],
  embedUrl: '/arcade/factory_idle/',
};

export default config;
