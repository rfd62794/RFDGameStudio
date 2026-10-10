// @vitest-environment node
// new: ts/tests/test_seven_days_shop.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ADDON_PRICE_COFFEE, ADDON_PRICE_SODA, BASIC_UPGRADES_MIN_DAY, COFFEE_SALES_MIN_DAY, FRIES_UNLOCK_MIN_DAY,
  SODA_UNLOCK_MIN_DAY, STATION_CONFIGS, TOTAL_DAYS, UPGRADE_COFFEE_SALES_COST, UPGRADE_SODA_UNLOCK_COST,
} from '../../examples/7-days-to-fry/src/data';
import { createInitialKitchenState } from '../../examples/7-days-to-fry/src/sessionLoop';
import { createOrder } from '../../examples/7-days-to-fry/src/demandCurve';
import { purchaseCoffeeSales, purchaseSodaUnlock } from '../../examples/7-days-to-fry/src/nightShop';
import { executeStationTaskCompletion } from '../../examples/7-days-to-fry/src/taskExecution';
import type { Order } from '../../examples/7-days-to-fry/src/types';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('test_seven_days_shop', () => {
  it('the shop opens on the Design.md week: Fries Day 2, basic upgrades Day 3, Coffee Day 5, Soda Day 6', () => {
    expect([FRIES_UNLOCK_MIN_DAY, BASIC_UPGRADES_MIN_DAY, COFFEE_SALES_MIN_DAY, SODA_UNLOCK_MIN_DAY]).toEqual([2, 3, 5, 6]);
    expect(SODA_UNLOCK_MIN_DAY).toBeLessThanOrEqual(TOTAL_DAYS);
  });

  it('coffee sales cannot be bought before Day 5, without cash, or twice', () => {
    const early = createInitialKitchenState();
    early.cash = 500;
    early.dayNumber = COFFEE_SALES_MIN_DAY - 1;
    expect(purchaseCoffeeSales(early)).toBe(false);
    expect(early.cash).toBe(500);
    expect(early.coffeeSalesUnlocked).toBe(false);

    const poor = createInitialKitchenState();
    poor.cash = UPGRADE_COFFEE_SALES_COST - 1;
    poor.dayNumber = COFFEE_SALES_MIN_DAY;
    expect(purchaseCoffeeSales(poor)).toBe(false);

    const k = createInitialKitchenState();
    k.cash = 100;
    k.dayNumber = COFFEE_SALES_MIN_DAY;
    expect(purchaseCoffeeSales(k)).toBe(true);
    expect(k.cash).toBe(100 - UPGRADE_COFFEE_SALES_COST);
    expect(k.coffeeSalesUnlocked).toBe(true);
    expect(purchaseCoffeeSales(k)).toBe(false);
    expect(k.cash).toBe(100 - UPGRADE_COFFEE_SALES_COST);
  });

  it('soda cannot be bought before Day 6, without cash, or twice', () => {
    const early = createInitialKitchenState();
    early.cash = 500;
    early.dayNumber = SODA_UNLOCK_MIN_DAY - 1;
    expect(purchaseSodaUnlock(early)).toBe(false);
    expect(early.sodaUnlocked).toBe(false);

    const poor = createInitialKitchenState();
    poor.cash = UPGRADE_SODA_UNLOCK_COST - 1;
    poor.dayNumber = SODA_UNLOCK_MIN_DAY;
    expect(purchaseSodaUnlock(poor)).toBe(false);

    const k = createInitialKitchenState();
    k.cash = 100;
    k.dayNumber = SODA_UNLOCK_MIN_DAY;
    expect(purchaseSodaUnlock(k)).toBe(true);
    expect(k.cash).toBe(100 - UPGRADE_SODA_UNLOCK_COST);
    expect(k.sodaUnlocked).toBe(true);
    expect(purchaseSodaUnlock(k)).toBe(false);
  });

  it('orders never ask for a drink until it is unlocked, and some do once it is', () => {
    const locked = Array.from({ length: 300 }, () => createOrder());
    expect(locked.some((o) => o.wantsCoffee || o.wantsSoda)).toBe(false);

    const coffeeOnly = Array.from({ length: 300 }, () => createOrder(undefined, { coffee: true }));
    expect(coffeeOnly.some((o) => o.wantsCoffee)).toBe(true);
    expect(coffeeOnly.some((o) => o.wantsSoda)).toBe(false);

    const both = Array.from({ length: 300 }, () => createOrder(undefined, { coffee: true, soda: true }));
    expect(both.some((o) => o.wantsSoda)).toBe(true);
    expect(both.some((o) => !o.wantsCoffee)).toBe(true);
  });

  it('a new game starts with both drinks locked', () => {
    const k = createInitialKitchenState();
    expect(k.coffeeSalesUnlocked).toBe(false);
    expect(k.sodaUnlocked).toBe(false);
  });

  it('a served order pays the drink add-ons on top of the burger', () => {
    const earned = (extra: Partial<Order>): number => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      const k = createInitialKitchenState();
      const windowStation = k.stations.find((s) => s.id === 'window')!;
      windowStation.orders = [{ ...createOrder(false), burgerComplete: true, friesComplete: true, ...extra }];
      k.cash = 0;
      executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS.window);
      vi.restoreAllMocks();
      return k.cash;
    };
    const plain = earned({});
    expect(plain).toBeGreaterThan(0);
    expect(earned({ wantsCoffee: true }) - plain).toBeCloseTo(ADDON_PRICE_COFFEE, 5);
    expect(earned({ wantsSoda: true }) - plain).toBeCloseTo(ADDON_PRICE_SODA, 5);
    expect(earned({ wantsCoffee: true, wantsSoda: true }) - plain).toBeCloseTo(ADDON_PRICE_COFFEE + ADDON_PRICE_SODA, 5);
  });
});
