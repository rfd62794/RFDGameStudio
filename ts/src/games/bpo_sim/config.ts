import type { GameConfig } from '../../engine/types';

export const bpoSimConfig: GameConfig = {
  gameId: 'bpo_sim',
  order: 130,
  source: { kind: 'example', slug: 'bpo-sim' },
  label: 'BPO Sim',
  description: 'Run the data side of an outsourced call center: pick a lead list, set the dialer pace, hit the daily quota, then spend your earnings after hours. Early build.',
  shortDescription: 'Call center management sim: lead lists, dialer pacing and daily quotas.',
  longDescription: 'A management sim set in an outsourced call center. Keep your lead lists healthy, tune the dialer pace, hit the daily quota, then spend the after-hours phase upgrading equipment and refreshing lists.',
  color: '#38bdf8',
  status: 'dev',
  genre: 'management-sim',
  tags: ['call-center', 'bpo', 'management', 'sim'],
  embedUrl: '/arcade/bpo_sim/',
};

export default bpoSimConfig;
