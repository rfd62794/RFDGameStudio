import type { GameConfig } from '../../engine/types';

export const filipinoBpoSimulatorConfig: GameConfig = {
  gameId: 'filipino_bpo_simulator',
  label: 'Call Center Tycoon',
  description: 'Run a Filipino BPO floor: manage lead lists, dialer pacing, agent quotas, and day-end planning.',
  shortDescription: 'BPO management sim with list health, dialer pacing, and daily quotas.',
  longDescription: 'A management sim set in a Philippine call center. Hire and seat agents, manage lead-list purity and freshness, tune the dialer pace, hit daily quotas, then spend the after-hours upgrading equipment and refreshing lists.',
  color: '#38bdf8',
  status: 'dev',
  genre: 'management-sim',
  tags: ['call-center', 'bpo', 'management', 'sim'],
  embedUrl: 'http://localhost:5174/arcade/filipino_bpo_simulator/',
};
