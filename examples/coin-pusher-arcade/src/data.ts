/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoinType, WheelReward, PocketCoinType, LevelSettings, BoardTheme } from './types';

export const COIN_TYPES: CoinType[] = [
  {
    id: 'gold',
    name: 'Standard Gold',
    color: '#fbbf24', // Amber 400
    borderColor: '#b45309', // Amber 700
    textColor: '#78350f',
    radius: 14,
    mass: 1.0,
    value: 1,
    description: 'The classic shiny golden coin.',
    unlockRequirement: 'Available at start',
    unlockedAtPushed: 0,
  },
  {
    id: 'steel',
    name: 'Heavy Steel',
    color: '#94a3b8', // Slate 400
    borderColor: '#475569', // Slate 600
    textColor: '#1e293b',
    radius: 16,
    mass: 2.2,
    value: 3,
    description: 'Twice as heavy. Pushes other coins with high impact.',
    unlockRequirement: 'Available at start',
    unlockedAtPushed: 0,
  },
  {
    id: 'emerald',
    name: 'Lucky Emerald',
    color: '#10b981', // Emerald 500
    borderColor: '#047857', // Emerald 700
    textColor: '#064e3b',
    radius: 13,
    mass: 0.8,
    value: 5,
    description: 'Lightweight emerald that boosts combo rates.',
    unlockRequirement: 'Available at start',
    unlockedAtPushed: 0,
  },
  {
    id: 'ruby',
    name: 'Royal Ruby',
    color: '#ef4444', // Red 500
    borderColor: '#b91c1c', // Red 700
    textColor: '#7f1d1d',
    radius: 15,
    mass: 1.5,
    value: 10,
    description: 'High value ruby token.',
    unlockRequirement: 'Push 100 total coins',
    unlockedAtPushed: 100,
    glow: true,
  },
  {
    id: 'obsidian',
    name: 'Dark Obsidian',
    color: '#334155', // Slate 700
    borderColor: '#0f172a', // Slate 900
    textColor: '#f8fafc',
    radius: 18,
    mass: 3.5,
    value: 15,
    description: 'Incredibly dense volcanic glass token.',
    unlockRequirement: 'Push 300 total coins',
    unlockedAtPushed: 300,
  },
  {
    id: 'cosmic',
    name: 'Cosmic Stellar',
    color: '#a855f7', // Purple 500
    borderColor: '#6b21a8', // Purple 800
    textColor: '#faf5ff',
    radius: 17,
    mass: 1.8,
    value: 25,
    description: 'Glows with celestial energy. Massive payout.',
    unlockRequirement: 'Push 600 total coins',
    unlockedAtPushed: 600,
    glow: true,
  },
];

export const WHEEL_REWARDS: WheelReward[] = [
  {
    id: 'coin_bird',
    name: 'Coin Bird',
    description: 'An arcade bird flies across the screen, dropping 5-8 random coins.',
    color: '#0ea5e9', // Sky 500
    textColor: '#ffffff',
    unlockedAtRounds: 0,
    unlockRequirement: 'Available at start',
  },
  {
    id: 'coin_tower',
    name: 'Coin Tower',
    description: 'Spawns a high-density vertical stack of 12 coins that collapses upon push.',
    color: '#f97316', // Orange 500
    textColor: '#ffffff',
    unlockedAtRounds: 0,
    unlockRequirement: 'Available at start',
  },
  {
    id: 'bumper',
    name: 'Bumper Obstacle',
    description: 'Places a bouncy peg that propels coins with high velocity.',
    color: '#ec4899', // Pink 500
    textColor: '#ffffff',
    unlockedAtRounds: 1,
    unlockRequirement: 'Clear 1 round',
  },
  {
    id: 'multiplier_pad',
    name: 'Multiplier Pad',
    description: 'Places a static multiplier pad that doubles the score of any coin passing over it.',
    color: '#eab308', // Yellow 500
    textColor: '#ffffff',
    unlockedAtRounds: 2,
    unlockRequirement: 'Clear 2 rounds',
  },
  {
    id: 'gutter_shield',
    name: 'Gutter Shield',
    description: 'Creates temporary side guards that prevent coins from sliding into gutters.',
    color: '#22c55e', // Green 500
    textColor: '#ffffff',
    unlockedAtRounds: 3,
    unlockRequirement: 'Clear 3 rounds',
  },
];

export const POCKET_COIN_TYPES: PocketCoinType[] = [
  {
    id: 'tnt',
    name: 'TNT Coin',
    description: 'Spawns an explosive charge. Upon being pushed off or triggered, detonate to clear coins!',
    color: '#dc2626', // Red 600
    borderColor: '#7f1d1d',
    textColor: '#ffffff',
    unlockedAtPushed: 0,
    unlockRequirement: 'Available at start',
  },
  {
    id: 'magnet',
    name: 'Magnet Coin',
    description: 'Activates an electromagnetic pulse, drawing all coins directly toward the winning front edge.',
    color: '#4f46e5', // Indigo 600
    borderColor: '#312e81',
    textColor: '#ffffff',
    unlockedAtPushed: 0,
    unlockRequirement: 'Available at start',
  },
  {
    id: 'double_drop',
    name: 'Double Drop Coin',
    description: 'Places a golden multiplier token. When pushed, adds +5 free drops directly to your queue.',
    color: '#14b8a6', // Teal 500
    borderColor: '#115e59',
    textColor: '#ffffff',
    unlockedAtPushed: 200,
    unlockRequirement: 'Push 200 total coins',
  },
  {
    id: 'giga_gold',
    name: 'Giga Golden Coin',
    description: 'Spawns a gigantic, high-mass golden coin (3x standard size) to steamroll everything in its path.',
    color: '#fbbf24', // Amber 400
    borderColor: '#78350f',
    textColor: '#78350f',
    unlockedAtPushed: 500,
    unlockRequirement: 'Push 500 total coins',
  },
];

export const LEVEL_SETTINGS: LevelSettings[] = [
  {
    level: 1,
    name: 'Neon Entryway',
    pushTarget: 100,
    boardWidth: 440,
    startingCoinsCount: 20,
    comboWindowMs: 2000,
    gutterWidth: 35,
    pusherSpeed: 1.5,
  },
  {
    level: 2,
    name: 'Slate Boulevard',
    pushTarget: 300,
    boardWidth: 480,
    startingCoinsCount: 35,
    comboWindowMs: 1800,
    gutterWidth: 40,
    pusherSpeed: 1.8,
  },
  {
    level: 3,
    name: 'Pharaoh’s Tomb',
    pushTarget: 600,
    boardWidth: 520,
    startingCoinsCount: 50,
    comboWindowMs: 1500,
    gutterWidth: 45,
    pusherSpeed: 2.2,
  },
  {
    level: 4,
    name: 'Cosmic Edge',
    pushTarget: 1000,
    boardWidth: 560,
    startingCoinsCount: 65,
    comboWindowMs: 1200,
    gutterWidth: 50,
    pusherSpeed: 2.6,
  },
];

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'neon',
    name: 'Neon Cyberpunk',
    bgColor: '#090d16',
    boardColor: '#111827',
    pusherColor: '#1f2937',
    wallColor: '#374151',
    accentColor: '#3b82f6',
    unlockedAtCoins: 0,
    description: 'A glowing cyberpunk grid with electric-blue neon lines.',
  },
  {
    id: 'pharaoh',
    name: 'Pharaoh’s Gold',
    bgColor: '#1c150c',
    boardColor: '#2d2212',
    pusherColor: '#45351c',
    wallColor: '#fbbf24',
    accentColor: '#fbbf24',
    unlockedAtCoins: 100,
    description: 'A luxurious royal Egyptian gold and deep sand-sandstone style.',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Galaxy',
    bgColor: '#0d0720',
    boardColor: '#170f33',
    pusherColor: '#2b1c5c',
    wallColor: '#8b5cf6',
    accentColor: '#d946ef',
    unlockedAtCoins: 300,
    description: 'Immersive deep cosmos with nebula highlights and purple starfields.',
  },
  {
    id: 'retro',
    name: 'Classic Vintage',
    bgColor: '#1a0f0f',
    boardColor: '#3b1c1c',
    pusherColor: '#5c1d1d',
    wallColor: '#dc2626',
    accentColor: '#f97316',
    unlockedAtCoins: 500,
    description: 'Arcade cabinet style with red velvet walls and glowing lights.',
  },
];
