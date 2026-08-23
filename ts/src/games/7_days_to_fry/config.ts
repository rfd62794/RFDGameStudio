import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: '7_days_to_fry',
  label: '7 Days To Fry',
  description: '7 Days to Fry - a cooking survival game',
  color: '#6c8ef7',
  status: 'external',
  // No `genre` — genuinely doesn't fit the curated 11-value taxonomy.
  // "Cooking survival" has no honest match among the existing values.
  // Reported as a real taxonomy gap.
  tags: ['cooking', 'survival'],
  embedUrl: '/arcade/7_days_to_fry/',
};

export default config;
