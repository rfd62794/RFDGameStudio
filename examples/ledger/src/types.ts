/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Category {
  FINE_ART = "Fine Art",
  VINTAGE_WATCHES = "Vintage Watches",
  RARE_BOOKS = "Rare Books",
  ANCIENT_COINS = "Ancient Coins & Jewelry",
  COLLECTIBLES = "Collectibles"
}

export interface Good {
  id: string;
  name: string;
  description: string;
  category: Category;
  baseValue: number;
  authenticity: 'authentic' | 'counterfeit';
  isInspected: boolean;
  quality: 'poor' | 'fair' | 'pristine'; // Multipliers: poor (0.7x), fair (1.0x), pristine (1.4x)
  acquiredPrice: number;
  acquiredDay: number | null;
  notes: string;
}

export interface Lot {
  id: string;
  type: 'walk_in' | 'dutch_auction';
  good: Good;
  askingPrice: number; // Current ticking price or static offer
  patience: number; // 0-100 (For walk-ins. Drops to 0, item is pulled)
  rivalInterest: number; // 0-100 (For auctions. Rises to 100, item is sniped)
  rivalRate: number; // Increment of rival interest per clock tick
  decayRate: number; // Increment of price decay (auctions) or patience (walk-ins) per tick
  auctionStartPrice: number;
  auctionFloorPrice: number;
  isInspecting: boolean;
  inspectProgress: number; // 0-100
}

export interface MarketState {
  category: Category;
  currentPriceMultiplier: number; // Standard is 1.0, drifts between 0.5 and 2.0
  suppressionDaysRemaining: number; // Days this category suffers from sales suppression
  suppressionFactor: number; // Multiplier reflecting sales pressure (e.g. 1.0 to 0.6)
  driftHistory: number[]; // Sparkline trend (last 5 days)
  volatility: 'low' | 'moderate' | 'high'; // High for Collectibles, low/moderate for others
}

export type ShopTier = 1 | 2 | 3; // 1: Alley Stall, 2: Storefront, 3: Boutique

export interface GameLog {
  id: string;
  day: number;
  type: 'buy' | 'sell' | 'loan' | 'interest' | 'upgrade' | 'system' | 'news';
  message: string;
  amount: number | null; // Cash change (can be positive, negative, or null)
  timestamp: string;
}

export interface GameState {
  day: number; // 1 to 10
  timeOfDay: number; // 0 to 100 (ticks up to 100, then day ends)
  isDayActive: boolean; // Whether the clock is ticking
  capital: number;
  debt: number;
  graceDaysRemaining: number; // Starts at 5, ticks down each day-end
  shopTier: ShopTier;
  inventory: Good[];
  lots: Lot[];
  market: Record<Category, MarketState>;
  history: GameLog[];
  runStatus: 'playing' | 'won' | 'lost';
  dailyReport: {
    day: number;
    sales: number;
    purchases: number;
    interestAccrued: number;
    interestPaid: number;
    upgradesSpent: number;
  } | null;
}
