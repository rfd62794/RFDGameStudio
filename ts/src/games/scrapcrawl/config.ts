import React from 'react';
import type { GameConfig } from '../../engine/types';

export const scrapcrawlConfig: GameConfig = {
  gameId: 'scrapcrawl',
  label: 'ScrapCrawl',
  description: 'Room navigation, scrap economy, craft, and D20 combat with win-only proficiency.',
  color: '#f59e0b',
  status: 'dev',
  genre: 'roguelike',
  tags: ['crafting', 'dungeon-crawl'],
  component: React.lazy(() => import('./App')),
};
