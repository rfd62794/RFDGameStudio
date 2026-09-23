/**
 * @file src/economy.ts
 * Pricing, upgrade costs, stock, waste, financial and brand equity metrics.
 */

// Brand Equity & Cash
export const INITIAL_BRAND_EQUITY = 100;
export const BRAND_EQUITY_VIOLATION_PENALTY = 15; // Caught food safety violation penalty
export const BRAND_EQUITY_ABANDONED_ORDER_PENALTY = 10; // Customer left queue due to overflow
export const BRAND_EQUITY_GAIN_PER_CLEAN_ORDER = 3; // Clean order completion gain
export const CASH_PER_CLEAN_ORDER = 5; // Legacy cash earned per clean order
export const BASE_PRICE_BURGER = 4; // Base price earned on burger completion
export const ADDON_PRICE_FRIES = 1.5; // Addon price earned when fries are fulfilled
export const TIP_MAX_PER_ORDER = 1.5; // Max tip per order at 100% quality
export const CORNER_CUT_VIOLATION_CATCH_CHANCE = 0.22; // 22% chance a corner-cut order gets caught

// Stock Units economy
export const STOCK_UNITS_CAPACITY = 3;
export const STOCK_UNITS_PER_ORDER = 1;
export const UNLOAD_TRUCK_COST = 8;
export const UNLOAD_TRUCK_REFILL_AMOUNT = 3;
export const AUTO_RESTOCK_DELAY_SECONDS = 4; // 4s delay window for visible Out of Stock state

// Night Shop Upgrades
export const WEEK_ONE_TIER_UP_MESSAGE = "You Survived Your First Week — Tier 2 Unlocked";
export const FRIES_UNLOCK_MIN_DAY = 8;
export const BASIC_UPGRADES_MIN_DAY = 8;
export const WAVE_INTENSITY_MULTIPLIER = 5; // Wave day peak demand tier multiplier
export const UPGRADE_BUFFER_CAPACITY_COST = 35;
export const UPGRADE_STOCK_CAPACITY_COST = 30;
export const UPGRADE_DAY_DURATION_COST = 70;
export const UPGRADE_BRAND_RECOVERY_COST = 25;
export const UPGRADE_FRIES_UNLOCK_COST = 20;
export const BRAND_RECOVERY_AMOUNT = 15;
export const BUFFER_CAPACITY_INCREASE = 2;
export const STOCK_CAPACITY_INCREASE = 3;
export const DAY_DURATION_INCREASE_SECONDS = 15;

// Spoilage & Waste Economy
export const WASTE_PER_SPOILAGE = 1.0;
export const WASTE_PER_ABANDONED_ORDER = 1.5;
export const MEAL_UNIT_COST = 1.5;
export const GAME_OVER_BRAND_EQUITY_THRESHOLD = 0;
