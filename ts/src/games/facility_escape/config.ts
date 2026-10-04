import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'facility_escape',
  source: { kind: 'example', slug: 'facility-escape' },
  label: 'Facility Escape',
  description: 'Sneak through 8 generated rooms in a turn-based stealth puzzle. Guards telegraph their next move before you act: read their sightlines, use items and hazards, and reach the exit.',
  color: '#6c8ef7',
  status: 'external',
  genre: 'puzzle-stealth',
  tags: ['guard-sightlines', 'turn-based'],
  embedUrl: '/arcade/facility_escape/',
};

export default config;
