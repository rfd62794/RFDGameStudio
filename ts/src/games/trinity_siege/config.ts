import type { GameConfig } from '../../engine/types';

const config: GameConfig = {
  gameId: 'trinity_siege',
  source: { kind: 'example', slug: 'trinity-siege' },
  label: 'Trinity Siege',
  description: 'A tactical wave-defense game on a hex ring: match shape counters to incoming waves and build lasting fortifications to survive five waves.',
  color: '#ef4444',
  status: 'external',
  genre: 'combat-arena',
  tags: ['siege', 'three-faction'],
  embedUrl: '/arcade/trinity_siege/',
};

export default config;
