# 7 Days to Fry: open the shop on Design.md's days, and add the Coffee (Day 5) and Soda (Day 6) unlocks

**Depends on:** Seven_Days_To_Fry_Tier_A_Honest_Card_And_Restart_Directive.md (edits the same `NightScreen.tsx` and `App.tsx`; merge it first). NEEDS ROBERT'S NOD: reverses three tests that say the shop opens on Day 8

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/7_days_to_fry/DIRECTION.md` (Replan item 2), `examples/7-days-to-fry/docs/Design.md` (lines 22-50, "The Real Week" and "The Coffee Exception"),
`examples/7-days-to-fry/src/nightShop.ts`, `examples/7-days-to-fry/src/economy.ts` (lines 1-40), `examples/7-days-to-fry/src/demandCurve.ts` (lines 1-30), `examples/7-days-to-fry/src/execution/stationExecution.ts` (lines 105-135).

## 1. Why this exists

7 Days to Fry's design says each night's shop unlock IS the tutorial across seven days (`examples/7-days-to-fry/docs/Design.md` v4, "The Real Week": Day 2 Fries, Days 3-4 basic upgrades, Day 5 customer Coffee, Days 6-7 Soda). Measured on origin/main `afb1cefe` (`docs/demos/7_days_to_fry/DIRECTION.md`, directive 2; Robert approved all recommendations, 2026-10-04):
- Coffee and Soda do not exist as unlocks: `examples/7-days-to-fry/src/nightShop.ts` has only buffer, stock, day-duration, brand-recovery and fries purchases. `KitchenState.coffeeSalesUnlocked` exists in `examples/7-days-to-fry/src/types.ts` but is set to `false` in `sessionLoop.ts` and never read. `grep -i soda` over `examples/7-days-to-fry/src/` finds nothing.
- **A bigger finding while reading the code.** `examples/7-days-to-fry/src/economy.ts` sets `FRIES_UNLOCK_MIN_DAY = 8` and `BASIC_UPGRADES_MIN_DAY = 8`, but the game ends in victory at the end of Day 7 (`TOTAL_DAYS = 7` in `physics.ts`; `sessionLoop.ts` sets `gamePhase = 'victory'` when Day 7 completes). A Night shows the `dayNumber` of the day it is preparing (2 to 7), so Fries and the three basic upgrades can NEVER be bought in a week, and the night screen tells the player "Unlocks Day 8" for a seven-day game. Only the Brand Recovery purchase is reachable. The Design.md week cannot be played.

**DESIGN CONFLICT, read before approving.** Three tests in `examples/7-days-to-fry/tests/lineSimulation.test.ts` (anchors 162, 164 and 166) assert the OLD behaviour: "nothing in the shop is purchasable on Days 1-7" and name Day 8 as the first purchasable day. They contradict Design.md v4. This directive follows Design.md v4 (it is the written source of truth the direction note and the roadmap cite;
nothing in `docs/state/current.md` or the ADRs records a later decision to keep the shop closed during week one) and rewrites those three tests (exact new text below). If Robert wants the shop to open only at Tier 2 (Day 8), do not dispatch this directive: Coffee and Soda would then need a Tier 2 screen that does not exist (victory is terminal today).
Anchors 163, 165, 167 and 168 stay valid unchanged (they use Day 8, which is at or after every unlock day).

What this run builds (first-pass, deliberately small, in the same shape as Fries): customer drinks are ADD-ON revenue on the order. Once Coffee (or Soda) is bought, each new order has a 50% chance to add it, and the Window pays the add-on price when the order is served. There is no new station, pipeline or map art in this pass (Design.md also describes a visual promotion of the coffee station and a Soda construction-reveal; those need the canvas and are a later directive). Prices, costs and probabilities are first-pass numbers, not balance-tested.

Facts you need (verified; do not re-derive):
- `createOrder(wantsFries?: boolean)` in `examples/7-days-to-fry/src/demandCurve.ts` is called with no argument in many tests; the new second parameter defaults to "no drinks", so those calls are unchanged.
- The example's own suite (`examples/7-days-to-fry/tests/lineSimulation.test.ts`, 4,899 lines) was run by the controller with a temporary `node_modules` junction: baseline `Tests  241 passed (241)`, and `241 passed` after these edits including the three rewritten anchors. A Devin run cannot run it, so the three rewrites below are exact text.
- A ts test that imports the example's `sessionLoop`/`nightShop` makes `cd ts && npx tsc --noEmit` type-check the example under strict `noUnusedLocals`, which flags 12 unused declarations in 8 files; step 5 removes them (no behaviour change). Baseline `tsc` prints 4 errors, all `Cannot find module '.../game-metadata.json'`.
- The Tier A directive (`Seven_Days_To_Fry_Tier_A_Honest_Card_And_Restart_Directive.md`) edits `NightScreen.tsx` and `App.tsx` (the Restart button, `onRestart` prop); this run edits the same files in other places, so merge that one first.

## 2. Scope

1. Data and state: `examples/7-days-to-fry/src/economy.ts`, `examples/7-days-to-fry/src/physics.ts`, `examples/7-days-to-fry/src/types.ts`, `examples/7-days-to-fry/src/sessionLoop.ts`.
2. Orders and revenue: `examples/7-days-to-fry/src/demandCurve.ts`, `examples/7-days-to-fry/src/execution/stationExecution.ts`.
3. Shop: `examples/7-days-to-fry/src/nightShop.ts`, `examples/7-days-to-fry/src/components/NightScreen.tsx`, `examples/7-days-to-fry/src/App.tsx`.
4. Tests: rewrite anchors 162, 164, 166 in `examples/7-days-to-fry/tests/lineSimulation.test.ts`; new `<!-- new: ts/tests/test_seven_days_shop.ts -->`.
5. Unused declarations in `customers.ts`, `examples/7-days-to-fry/src/execution/stationExecution.ts`, `nightShop.ts`, `examples/7-days-to-fry/src/scoring/taskSelection.ts`, `examples/7-days-to-fry/src/scoring/utilityScoring.ts`, `sessionLoop.ts`, `steering.ts`, `wasteEconomy.ts` (all under `examples/7-days-to-fry/src/`).

## 3. The work

All existing files are CRLF; keep their endings. New files use CRLF too. The diffs below are the exact prototype changes (apply as shown; context lines are unchanged).

**Step 1: data, state and orders.**

```diff
--- a/examples/7-days-to-fry/src/economy.ts
+++ b/examples/7-days-to-fry/src/economy.ts
@@ -11,6 +11,8 @@ export const BRAND_EQUITY_GAIN_PER_CLEAN_ORDER = 3; // Clean order completion ga
 export const CASH_PER_CLEAN_ORDER = 5; // Legacy cash earned per clean order
 export const BASE_PRICE_BURGER = 4; // Base price earned on burger completion
 export const ADDON_PRICE_FRIES = 1.5; // Addon price earned when fries are fulfilled
+export const ADDON_PRICE_COFFEE = 1.0; // Addon price earned when a customer's coffee is served (first-pass number)
+export const ADDON_PRICE_SODA = 1.25; // Addon price earned when a customer's soda is served (first-pass number)
 export const TIP_MAX_PER_ORDER = 1.5; // Max tip per order at 100% quality
 export const CORNER_CUT_VIOLATION_CATCH_CHANCE = 0.22; // 22% chance a corner-cut order gets caught
 
@@ -23,14 +25,20 @@ export const AUTO_RESTOCK_DELAY_SECONDS = 4; // 4s delay window for visible Out
 
 // Night Shop Upgrades
 export const WEEK_ONE_TIER_UP_MESSAGE = "You Survived Your First Week — Tier 2 Unlocked";
-export const FRIES_UNLOCK_MIN_DAY = 8;
-export const BASIC_UPGRADES_MIN_DAY = 8;
+// The week follows Design.md v4 "The Real Week": Night before Day 2 opens the shop with Fries; basic upgrades from Day 3;
+// customer Coffee from Day 5; Soda from Day 6. A Night shows `dayNumber` of the day it is preparing.
+export const FRIES_UNLOCK_MIN_DAY = 2;
+export const BASIC_UPGRADES_MIN_DAY = 3;
+export const COFFEE_SALES_MIN_DAY = 5;
+export const SODA_UNLOCK_MIN_DAY = 6;
 export const WAVE_INTENSITY_MULTIPLIER = 5; // Wave day peak demand tier multiplier
 export const UPGRADE_BUFFER_CAPACITY_COST = 35;
 export const UPGRADE_STOCK_CAPACITY_COST = 30;
 export const UPGRADE_DAY_DURATION_COST = 70;
 export const UPGRADE_BRAND_RECOVERY_COST = 25;
 export const UPGRADE_FRIES_UNLOCK_COST = 20;
+export const UPGRADE_COFFEE_SALES_COST = 25; // first-pass number, not balance-tested
+export const UPGRADE_SODA_UNLOCK_COST = 30; // first-pass number, not balance-tested
 export const BRAND_RECOVERY_AMOUNT = 15;
 export const BUFFER_CAPACITY_INCREASE = 2;
 export const STOCK_CAPACITY_INCREASE = 3;
```

```diff
--- a/examples/7-days-to-fry/src/physics.ts
+++ b/examples/7-days-to-fry/src/physics.ts
@@ -133,6 +133,8 @@ export const PRIMARY_STATION_OWNERSHIP_BONUS = 1.35;
 export const DEMAND_ESCALATION_MIN_SECONDS = 60;
 export const DEMAND_ESCALATION_MAX_SECONDS = 300;
 export const FRIES_DEMAND_PROBABILITY = 0.6;
+export const COFFEE_DEMAND_PROBABILITY = 0.5; // share of orders that add a coffee once coffee sales are unlocked
+export const SODA_DEMAND_PROBABILITY = 0.5; // share of orders that add a soda once soda is unlocked
 export const CUSTOMER_LINGER_SECONDS = 3.5;
 
 export const SPOILAGE_CHECK_INTERVAL_SEC = 2;
```

```diff
--- a/examples/7-days-to-fry/src/types.ts
+++ b/examples/7-days-to-fry/src/types.ts
@@ -65,6 +65,8 @@ export interface Order {
   id: string;
   customerId?: string;
   wantsFries: boolean;
+  wantsCoffee?: boolean; // customer drink add-on, only ever true once coffee sales are unlocked
+  wantsSoda?: boolean; // customer drink add-on, only ever true once soda is unlocked
   burgerComplete: boolean;
   friesComplete: boolean;
   hadViolation?: boolean;
@@ -130,6 +132,7 @@ export interface KitchenState {
   stockCapacityBonus: number;
   unlockedStations: Record<StationId, boolean>;
   coffeeSalesUnlocked: boolean;
+  sodaUnlocked?: boolean;
   brandEquity: number; // 0-100, the win/loss meter
   peerCorrCutNorm: number; // 0-1, contagion state, floor applied at read time only
   wasteBuffer: number; // accumulates automatically, discharged manually via Staff Meal
```

```diff
--- a/examples/7-days-to-fry/src/demandCurve.ts
+++ b/examples/7-days-to-fry/src/demandCurve.ts
@@ -7,18 +7,28 @@ import {
   BASE_ARRIVAL_INTERVAL_MAX,
   DEMAND_ESCALATION_MAX_SECONDS,
   DEMAND_ESCALATION_MIN_SECONDS,
+  COFFEE_DEMAND_PROBABILITY,
   FRIES_DEMAND_PROBABILITY,
+  SODA_DEMAND_PROBABILITY,
 } from './data';
 import { KitchenState, LogEvent, Order } from './types';
 
 /**
  * Creates a new Order entity with a unique ID and rolled wantsFries property.
+ * Drink add-ons are hard-suppressed (never rolled) unless the matching menu item is unlocked.
  */
-export function createOrder(wantsFries?: boolean): Order {
+export function createOrder(
+  wantsFries?: boolean,
+  unlockedDrinks: { coffee?: boolean; soda?: boolean } = {}
+): Order {
   const rollWantsFries = wantsFries ?? Math.random() < FRIES_DEMAND_PROBABILITY;
+  const rollWantsCoffee = !!unlockedDrinks.coffee && Math.random() < COFFEE_DEMAND_PROBABILITY;
+  const rollWantsSoda = !!unlockedDrinks.soda && Math.random() < SODA_DEMAND_PROBABILITY;
   return {
     id: `order_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
     wantsFries: rollWantsFries,
+    wantsCoffee: rollWantsCoffee,
+    wantsSoda: rollWantsSoda,
     burgerComplete: false,
     friesComplete: !rollWantsFries,
     quality: 1.0,
```

**Step 2: session loop and revenue** (the `sessionLoop.ts` diff also drops one unused import, step 5):

```diff
--- a/examples/7-days-to-fry/src/sessionLoop.ts
+++ b/examples/7-days-to-fry/src/sessionLoop.ts
@@ -36,7 +36,7 @@ import {
   WASTE_PER_SPOILAGE,
   WAVE_INTENSITY_MULTIPLIER,
 } from './data';
-import { createOrder, getArrivalInterval, getEscalationInterval, updateDemandCurve } from './demandCurve';
+import { createOrder, getArrivalInterval, getEscalationInterval } from './demandCurve';
 import { chooseStation } from './stationAssignment';
 import { checkAutoRestock } from './stockEconomy';
 import {
@@ -146,6 +146,7 @@ export function createInitialKitchenState(): KitchenState {
     stockCapacityBonus: 0,
     unlockedStations,
     coffeeSalesUnlocked: false,
+    sodaUnlocked: false,
     brandEquity: INITIAL_BRAND_EQUITY,
     peerCorrCutNorm: 0.0,
     wasteBuffer: 0,
@@ -325,7 +326,10 @@ export function tickKitchenState(state: KitchenState, dt: number): void {
     const queueStation = state.stations.find((s) => s.id === 'queue');
     if (queueStation) {
       if (queueStation.orders.length < queueStation.bufferCapacity) {
-        const order = createOrder(state.unlockedStations.fryer ? undefined : false);
+        const order = createOrder(state.unlockedStations.fryer ? undefined : false, {
+          coffee: state.coffeeSalesUnlocked,
+          soda: !!state.sodaUnlocked,
+        });
         queueStation.orders.push(order);
         spawnCustomerForOrder(state, order);
         if (order.wantsFries) {
```

```diff
--- a/examples/7-days-to-fry/src/execution/stationExecution.ts
+++ b/examples/7-days-to-fry/src/execution/stationExecution.ts
@@ -5,7 +5,9 @@
 
 import { activateCustomerAtWindow } from '../customers';
 import {
+  ADDON_PRICE_COFFEE,
   ADDON_PRICE_FRIES,
+  ADDON_PRICE_SODA,
   BASE_PRICE_BURGER,
   BATCH_QUALITY_GAIN_PER_PROTOCOL,
   BATCH_QUALITY_LOSS_PER_CORNER_CUT,
@@ -13,7 +15,6 @@ import {
   BATCH_QUALITY_MIN,
   BRAND_EQUITY_GAIN_PER_CLEAN_ORDER,
   BRAND_EQUITY_VIOLATION_PENALTY,
-  CASH_PER_CLEAN_ORDER,
   CORNER_CUT_VIOLATION_CATCH_CHANCE,
   EQUIPMENT_DEGRADATION_CHANCE,
   StationConfig,
@@ -119,7 +120,11 @@ export function executeStationTaskCompletion(
       station.orders.shift();
       state.stockUnits -= STOCK_UNITS_PER_ORDER;
       state.brandEquity = Math.min(100, state.brandEquity + BRAND_EQUITY_GAIN_PER_CLEAN_ORDER * order.quality);
-      const basePrice = BASE_PRICE_BURGER + (order.wantsFries ? ADDON_PRICE_FRIES : 0);
+      const basePrice =
+        BASE_PRICE_BURGER +
+        (order.wantsFries ? ADDON_PRICE_FRIES : 0) +
+        (order.wantsCoffee ? ADDON_PRICE_COFFEE : 0) +
+        (order.wantsSoda ? ADDON_PRICE_SODA : 0);
       const tip = TIP_MAX_PER_ORDER * order.quality;
       const earned = basePrice + tip;
       state.cash += earned;
```

**Step 3: the shop.**

```diff
--- a/examples/7-days-to-fry/src/nightShop.ts
+++ b/examples/7-days-to-fry/src/nightShop.ts
@@ -7,17 +7,21 @@ import {
   BASIC_UPGRADES_MIN_DAY,
   BRAND_RECOVERY_AMOUNT,
   BUFFER_CAPACITY_INCREASE,
+  COFFEE_SALES_MIN_DAY,
   DAY_DURATION_INCREASE_SECONDS,
   FRIES_UNLOCK_MIN_DAY,
+  SODA_UNLOCK_MIN_DAY,
   STOCK_CAPACITY_INCREASE,
   STOCK_UNITS_CAPACITY,
   UPGRADE_BRAND_RECOVERY_COST,
   UPGRADE_BUFFER_CAPACITY_COST,
+  UPGRADE_COFFEE_SALES_COST,
   UPGRADE_DAY_DURATION_COST,
   UPGRADE_FRIES_UNLOCK_COST,
+  UPGRADE_SODA_UNLOCK_COST,
   UPGRADE_STOCK_CAPACITY_COST,
 } from './data';
-import { KitchenState, StationId } from './types';
+import { KitchenState } from './types';
 
 export function purchaseBufferCapacity(state: KitchenState): boolean {
   if (state.dayNumber < BASIC_UPGRADES_MIN_DAY) return false;
@@ -77,3 +81,25 @@ export function purchaseFriesUnlock(state: KitchenState): boolean {
   state.unlockedStations = { ...state.unlockedStations, fryer: true };
   return true;
 }
+
+/** Customer coffee sales (Design.md: Day 5). Staff coffee is unchanged; this only lets customers order a coffee add-on. */
+export function purchaseCoffeeSales(state: KitchenState): boolean {
+  if (state.dayNumber < COFFEE_SALES_MIN_DAY) return false;
+  if (state.coffeeSalesUnlocked) return false;
+  if (state.cash < UPGRADE_COFFEE_SALES_COST) return false;
+
+  state.cash -= UPGRADE_COFFEE_SALES_COST;
+  state.coffeeSalesUnlocked = true;
+  return true;
+}
+
+/** Soda (Design.md: Days 6-7). Lets customers order a soda add-on. */
+export function purchaseSodaUnlock(state: KitchenState): boolean {
+  if (state.dayNumber < SODA_UNLOCK_MIN_DAY) return false;
+  if (state.sodaUnlocked) return false;
+  if (state.cash < UPGRADE_SODA_UNLOCK_COST) return false;
+
+  state.cash -= UPGRADE_SODA_UNLOCK_COST;
+  state.sodaUnlocked = true;
+  return true;
+}
```

```diff
--- a/examples/7-days-to-fry/src/components/NightScreen.tsx
+++ b/examples/7-days-to-fry/src/components/NightScreen.tsx
@@ -13,6 +13,10 @@ import {
   UPGRADE_DAY_DURATION_COST,
   UPGRADE_BRAND_RECOVERY_COST,
   UPGRADE_FRIES_UNLOCK_COST,
+  UPGRADE_COFFEE_SALES_COST,
+  UPGRADE_SODA_UNLOCK_COST,
+  COFFEE_SALES_MIN_DAY,
+  SODA_UNLOCK_MIN_DAY,
   BRAND_RECOVERY_AMOUNT,
   BUFFER_CAPACITY_INCREASE,
   STOCK_CAPACITY_INCREASE,
@@ -26,6 +30,8 @@ import {
   purchaseBufferCapacity,
   purchaseDayDuration,
   purchaseFriesUnlock,
+  purchaseCoffeeSales,
+  purchaseSodaUnlock,
   purchaseStockCapacity,
 } from '../nightShop';
 import { RestartButton } from './RestartButton';
@@ -46,12 +52,21 @@ export function isNewThisNight(
   return !wasSeenBefore;
 }
 
+export type ShopUpgradeType =
+  | 'buffer_capacity'
+  | 'stock_capacity'
+  | 'day_duration'
+  | 'brand_recovery'
+  | 'fries_unlock'
+  | 'coffee_sales'
+  | 'soda_unlock';
+
 interface NightScreenProps {
   state: KitchenState;
   onUpdatePolicy: (policy: number) => void;
   onStartNextDay: () => void;
   onRestart?: () => void;
-  onPurchaseUpgrade?: (upgradeType: 'buffer_capacity' | 'stock_capacity' | 'day_duration' | 'brand_recovery' | 'fries_unlock') => void;
+  onPurchaseUpgrade?: (upgradeType: ShopUpgradeType) => void;
 }
 
 export const NightScreen: React.FC<NightScreenProps> = ({
@@ -70,12 +85,16 @@ export const NightScreen: React.FC<NightScreenProps> = ({
   const stockAvailable = !state.purchasedUpgrades?.stock_capacity && state.dayNumber >= BASIC_UPGRADES_MIN_DAY;
   const durationAvailable = !state.purchasedUpgrades?.day_duration && state.dayNumber >= BASIC_UPGRADES_MIN_DAY;
   const brandAvailable = state.brandEquity < 100;
+  const coffeeAvailable = !state.coffeeSalesUnlocked && state.dayNumber >= COFFEE_SALES_MIN_DAY;
+  const sodaAvailable = !state.sodaUnlocked && state.dayNumber >= SODA_UNLOCK_MIN_DAY;
 
   const isFriesNew = isNewThisNight(shopItemsEverAvailable, 'fries_unlock', friesAvailable);
   const isBufferNew = isNewThisNight(shopItemsEverAvailable, 'buffer_capacity', bufferAvailable);
   const isStockNew = isNewThisNight(shopItemsEverAvailable, 'stock_capacity', stockAvailable);
   const isDurationNew = isNewThisNight(shopItemsEverAvailable, 'day_duration', durationAvailable);
   const isBrandNew = isNewThisNight(shopItemsEverAvailable, 'brand_recovery', brandAvailable);
+  const isCoffeeNew = isNewThisNight(shopItemsEverAvailable, 'coffee_sales', coffeeAvailable);
+  const isSodaNew = isNewThisNight(shopItemsEverAvailable, 'soda_unlock', sodaAvailable);
 
   React.useEffect(() => {
     if (!state.shopItemsEverAvailable) {
@@ -86,9 +105,11 @@ export const NightScreen: React.FC<NightScreenProps> = ({
     if (stockAvailable) state.shopItemsEverAvailable['stock_capacity'] = true;
     if (durationAvailable) state.shopItemsEverAvailable['day_duration'] = true;
     if (brandAvailable) state.shopItemsEverAvailable['brand_recovery'] = true;
-  }, [friesAvailable, bufferAvailable, stockAvailable, durationAvailable, brandAvailable, state]);
+    if (coffeeAvailable) state.shopItemsEverAvailable['coffee_sales'] = true;
+    if (sodaAvailable) state.shopItemsEverAvailable['soda_unlock'] = true;
+  }, [friesAvailable, bufferAvailable, stockAvailable, durationAvailable, brandAvailable, coffeeAvailable, sodaAvailable, state]);
 
-  const handlePurchase = (type: 'buffer_capacity' | 'stock_capacity' | 'day_duration' | 'brand_recovery' | 'fries_unlock') => {
+  const handlePurchase = (type: ShopUpgradeType) => {
     if (onPurchaseUpgrade) {
       onPurchaseUpgrade(type);
     } else {
@@ -97,6 +118,8 @@ export const NightScreen: React.FC<NightScreenProps> = ({
       else if (type === 'day_duration') purchaseDayDuration(state);
       else if (type === 'brand_recovery') purchaseBrandRecovery(state);
       else if (type === 'fries_unlock') purchaseFriesUnlock(state);
+      else if (type === 'coffee_sales') purchaseCoffeeSales(state);
+      else if (type === 'soda_unlock') purchaseSodaUnlock(state);
     }
   };
 
@@ -314,6 +337,76 @@ export const NightScreen: React.FC<NightScreenProps> = ({
               )}
             </div>
 
+            {/* Menu Expansion: customer Coffee (Day 5) */}
+            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between col-span-1 sm:col-span-2">
+              <div>
+                <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
+                  Menu Expansion • Tier 2
+                  {isCoffeeNew && (
+                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
+                      NEW
+                    </span>
+                  )}
+                </div>
+                <div className="text-sm font-bold text-slate-100">Sell Coffee to Customers</div>
+                <div className="text-[11px] text-slate-400">
+                  Customers can add a coffee to their order on future shifts. Your crew keeps using the same coffee station.
+                </div>
+              </div>
+              {state.coffeeSalesUnlocked ? (
+                <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-800/60">
+                  Unlocked
+                </span>
+              ) : state.dayNumber < COFFEE_SALES_MIN_DAY ? (
+                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
+                  Unlocks Day {COFFEE_SALES_MIN_DAY}
+                </span>
+              ) : (
+                <button
+                  onClick={() => handlePurchase('coffee_sales')}
+                  disabled={state.cash < UPGRADE_COFFEE_SALES_COST}
+                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs rounded-lg transition cursor-pointer disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
+                >
+                  ${UPGRADE_COFFEE_SALES_COST}
+                </button>
+              )}
+            </div>
+
+            {/* Menu Expansion: Soda (Days 6-7) */}
+            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between col-span-1 sm:col-span-2">
+              <div>
+                <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
+                  Menu Expansion • Tier 3
+                  {isSodaNew && (
+                    <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
+                      NEW
+                    </span>
+                  )}
+                </div>
+                <div className="text-sm font-bold text-slate-100">Add a Soda Fountain</div>
+                <div className="text-[11px] text-slate-400">
+                  Customers can add a soda to their order on future shifts.
+                </div>
+              </div>
+              {state.sodaUnlocked ? (
+                <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-800/60">
+                  Unlocked
+                </span>
+              ) : state.dayNumber < SODA_UNLOCK_MIN_DAY ? (
+                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
+                  Unlocks Day {SODA_UNLOCK_MIN_DAY}
+                </span>
+              ) : (
+                <button
+                  onClick={() => handlePurchase('soda_unlock')}
+                  disabled={state.cash < UPGRADE_SODA_UNLOCK_COST}
+                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-xs rounded-lg transition cursor-pointer disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
+                >
+                  ${UPGRADE_SODA_UNLOCK_COST}
+                </button>
+              )}
+            </div>
+
             {/* Upgrade 1: Buffer Capacity */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
               <div className="space-y-0.5">
```

```diff
--- a/examples/7-days-to-fry/src/App.tsx
+++ b/examples/7-days-to-fry/src/App.tsx
@@ -11,7 +11,7 @@ import { GameOverScreen } from './components/GameOverScreen';
 import { IntroScreen } from './components/IntroScreen';
 import { KitchenCanvas } from './components/KitchenCanvas';
 import { NewGameScreen } from './components/NewGameScreen';
-import { NightScreen } from './components/NightScreen';
+import { NightScreen, type ShopUpgradeType } from './components/NightScreen';
 import { SituationPanel } from './components/SituationPanel';
 import { StaffRoster } from './components/StaffRoster';
 import { VictoryScreen } from './components/VictoryScreen';
@@ -21,7 +21,7 @@ import { createInitialKitchenState, startNextDay, tickKitchenState } from './ses
 import { KitchenState } from './types';
 import { dischargeStaffMeal } from './wasteEconomy';
 import { unloadTruck } from './stockEconomy';
-import { purchaseBrandRecovery, purchaseBufferCapacity, purchaseDayDuration, purchaseFriesUnlock, purchaseStockCapacity } from './nightShop';
+import { purchaseBrandRecovery, purchaseBufferCapacity, purchaseCoffeeSales, purchaseDayDuration, purchaseFriesUnlock, purchaseSodaUnlock, purchaseStockCapacity } from './nightShop';
 import { Award, Clock, DollarSign, Info, Shield, ShoppingBag, Trash2, Zap } from 'lucide-react';
 
 export default function App() {
@@ -122,7 +122,7 @@ export default function App() {
     });
   };
 
-  const handlePurchaseUpgrade = (upgradeType: 'buffer_capacity' | 'stock_capacity' | 'day_duration' | 'brand_recovery' | 'fries_unlock') => {
+  const handlePurchaseUpgrade = (upgradeType: ShopUpgradeType) => {
     setKitchenState((prev) => {
       if (!prev) return null;
       const next: KitchenState = {
@@ -137,6 +137,8 @@ export default function App() {
       else if (upgradeType === 'day_duration') purchaseDayDuration(next);
       else if (upgradeType === 'brand_recovery') purchaseBrandRecovery(next);
       else if (upgradeType === 'fries_unlock') purchaseFriesUnlock(next);
+      else if (upgradeType === 'coffee_sales') purchaseCoffeeSales(next);
+      else if (upgradeType === 'soda_unlock') purchaseSodaUnlock(next);
       return next;
     });
   };
```

**Step 4: tests.** First the three rewritten anchors in `examples/7-days-to-fry/tests/lineSimulation.test.ts` (apply this diff; the file is CRLF and has very long lines elsewhere, so edit only these hunks):

```diff
--- a/examples/7-days-to-fry/tests/lineSimulation.test.ts
+++ b/examples/7-days-to-fry/tests/lineSimulation.test.ts
@@ -3080,8 +3080,8 @@ describe('The Line — Directive Test Anchors (§3)', () => {
   });
 
-  // Anchor 162: purchaseFriesUnlock returns false and deducts no cash when dayNumber === 7 (Wave Day itself, one day short)
-  it('162. purchaseFriesUnlock returns false and deducts no cash when dayNumber === 7, even with sufficient cash', () => {
+  // Anchor 162: purchaseFriesUnlock returns false and deducts no cash on Day 1 (one day before the shop opens, Design.md v4)
+  it('162. purchaseFriesUnlock returns false and deducts no cash when dayNumber === 1, even with sufficient cash', () => {
     const k = createInitialKitchenState();
-    k.dayNumber = 7;
+    k.dayNumber = FRIES_UNLOCK_MIN_DAY - 1;
     k.cash = 100;
     const initialCash = k.cash;
@@ -3105,8 +3105,8 @@ describe('The Line — Directive Test Anchors (§3)', () => {
   });
 
-  // Anchor 164: purchaseBufferCapacity, purchaseStockCapacity, purchaseDayDuration each return false and deduct no cash when dayNumber === 7 (one day short), even with sufficient cash
-  it('164. purchaseBufferCapacity, purchaseStockCapacity, purchaseDayDuration each return false and deduct no cash when dayNumber === 7', () => {
+  // Anchor 164: purchaseBufferCapacity, purchaseStockCapacity, purchaseDayDuration each return false and deduct no cash one day before basic upgrades open (Design.md v4), even with sufficient cash
+  it('164. purchaseBufferCapacity, purchaseStockCapacity, purchaseDayDuration each return false and deduct no cash when dayNumber === 2', () => {
     const k = createInitialKitchenState();
-    k.dayNumber = 7;
+    k.dayNumber = BASIC_UPGRADES_MIN_DAY - 1;
     k.cash = 500;
     const initialCash = k.cash;
@@ -3135,26 +3135,24 @@ describe('The Line — Directive Test Anchors (§3)', () => {
   });
 
-  // Anchor 166: Real integration probe: simulate through Days 1-7 — confirm nothing in the shop is purchasable at any point during that span
-  it('166. Real integration probe: simulate through Days 1-7 — confirm nothing in shop is purchasable at any day', () => {
-    const k = createInitialKitchenState();
-    k.cash = 1000;
-
+  // Anchor 166: Real integration probe: simulate through Days 1-7 — the shop follows Design.md v4's week (Fries Day 2, basic upgrades Day 3, nothing before)
+  it('166. Real integration probe: simulate through Days 1-7 — shop items open on their Design.md days and not before', () => {
     for (let day = 1; day <= 7; day++) {
-      k.dayNumber = day;
-      expect(purchaseFriesUnlock(k)).toBe(false);
-      expect(purchaseBufferCapacity(k)).toBe(false);
-      expect(purchaseStockCapacity(k)).toBe(false);
-      expect(purchaseDayDuration(k)).toBe(false);
-
-      const friesAvail = !k.unlockedStations?.fryer && k.dayNumber >= FRIES_UNLOCK_MIN_DAY;
-      const bufferAvail = !k.purchasedUpgrades?.buffer_capacity && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;
-      const stockAvail = !k.purchasedUpgrades?.stock_capacity && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;
-      const durationAvail = !k.purchasedUpgrades?.day_duration && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;
-
-      expect(friesAvail).toBe(false);
-      expect(bufferAvail).toBe(false);
-      expect(stockAvail).toBe(false);
-      expect(durationAvail).toBe(false);
+      const friesOpen = day >= FRIES_UNLOCK_MIN_DAY;
+      const upgradesOpen = day >= BASIC_UPGRADES_MIN_DAY;
+
+      const fries = createInitialKitchenState();
+      fries.cash = 1000;
+      fries.dayNumber = day;
+      expect(purchaseFriesUnlock(fries)).toBe(friesOpen);
+
+      const upgrades = createInitialKitchenState();
+      upgrades.cash = 1000;
+      upgrades.dayNumber = day;
+      expect(purchaseBufferCapacity(upgrades)).toBe(upgradesOpen);
+      expect(purchaseStockCapacity(upgrades)).toBe(upgradesOpen);
+      expect(purchaseDayDuration(upgrades)).toBe(upgradesOpen);
     }
+    expect(FRIES_UNLOCK_MIN_DAY).toBe(2);
+    expect(BASIC_UPGRADES_MIN_DAY).toBe(3);
   });
 
```

Then create `ts/tests/test_seven_days_shop.ts` with exactly:

```ts
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
```

**Step 5: remove the 12 unused declarations (no behaviour change).**

```diff
--- a/examples/7-days-to-fry/src/customers.ts
+++ b/examples/7-days-to-fry/src/customers.ts
@@ -3,7 +3,7 @@
  * Manages customer entities across order lifecycle (Waiting, Receiving, Leaving).
  */
 
-import { CUSTOMER_LINGER_SECONDS, CUSTOMER_MESS_CHANCE, ENTRANCE_POS, STATION_CONFIGS } from './data';
+import { CUSTOMER_LINGER_SECONDS, CUSTOMER_MESS_CHANCE, ENTRANCE_POS } from './data';
 import { Customer, KitchenState, Order } from './types';
 
 /**
@@ -34,7 +34,6 @@ export function spawnCustomerForOrder(state: KitchenState, order: Order): Custom
  * Transitions the paired customer to 'receiving' at the Pickup Window when order completes.
  */
 export function activateCustomerAtWindow(state: KitchenState, orderId: string, orderQuality?: number): void {
-  const windowConfig = STATION_CONFIGS.window;
   let customer = state.customers?.find((c) => c.orderId === orderId);
   if (!customer) {
     // Defensive fallback
```

```diff
--- a/examples/7-days-to-fry/src/scoring/taskSelection.ts
+++ b/examples/7-days-to-fry/src/scoring/taskSelection.ts
@@ -34,7 +34,7 @@ import {
   scoreUseBathroom,
 } from './utilityScoring';
 
-export interface Action<TAgent> {
+export interface Action<_TAgent> {
   name: string;
   score: number;
 }
```

```diff
--- a/examples/7-days-to-fry/src/scoring/utilityScoring.ts
+++ b/examples/7-days-to-fry/src/scoring/utilityScoring.ts
@@ -5,8 +5,6 @@
 
 import {
   BATHROOM_CLEAN_URGENCY_RISE_PER_SECOND,
-  BATHROOM_WEAR_CHANCE,
-  BLADDER_RISE_PER_MEAL_UNIT,
   BLADDER_URGENCY_MAX_SCORE,
   BLADDER_URGENCY_THRESHOLD,
   CLEAN_BATHROOM_BASE_SCORE,
@@ -157,7 +155,7 @@ export function scoreEatMeal(w: Worker, k: KitchenState): number {
 /**
  * Utility score for Drinking Water (Thirst).
  */
-export function scoreThirst(w: Worker, k: KitchenState): number {
+export function scoreThirst(w: Worker, _k: KitchenState): number {
   const thirst = w.thirst ?? 1.0;
   const urgency = Math.max(0, THIRST_URGENCY_THRESHOLD - thirst) / THIRST_URGENCY_THRESHOLD;
   return Math.pow(urgency, 2) * THIRST_URGENCY_MAX_SCORE;
@@ -215,7 +213,7 @@ export function scoreCleanMess(agent: { x: number; y: number; type?: WorkerType
 /**
  * Utility score for Discharging Waste Buffer to Staff Meals.
  */
-export function scoreDischargeMeal(w: Worker, k: KitchenState): number {
+export function scoreDischargeMeal(_w: Worker, k: KitchenState): number {
   if (k.wasteBuffer < MEAL_UNIT_COST) return 0;
   const lowMealBonus = k.mealUnits <= 5 ? 2.0 : 1.0;
   return Math.min(8.0, (1.5 + Math.min(3.0, k.wasteBuffer)) * lowMealBonus);
```

```diff
--- a/examples/7-days-to-fry/src/steering.ts
+++ b/examples/7-days-to-fry/src/steering.ts
@@ -12,10 +12,8 @@ import {
   AVOID_WORKERS_DIST,
   AVOID_WORKERS_WEIGHT,
   BATHROOM_QUEUE_WAYPOINTS,
-  CUSTOMER_MAX_FORCE,
   CUSTOMER_MAX_SPEED,
   CUSTOMER_RADIUS,
-  ENTRANCE_POS,
   EXIT_POS,
   KITCHEN_HEIGHT,
   KITCHEN_WIDTH,
```

```diff
--- a/examples/7-days-to-fry/src/wasteEconomy.ts
+++ b/examples/7-days-to-fry/src/wasteEconomy.ts
@@ -3,7 +3,6 @@
  * Manages spoilage accumulation into the waste buffer and manual Staff Meal discharge.
  */
 
-import { MAX_STAFF_MEAL_MORALE_BOOST, MORALE_PER_WASTE_UNIT } from './data';
 import { KitchenState, LogEvent } from './types';
 
 /**
```

(The `nightShop.ts`, `sessionLoop.ts` and `stationExecution.ts` removals are already inside the Step 2 and 3 diffs: `StationId`, `updateDemandCurve` and `CASH_PER_CLEAN_ORDER`.) Underscore-prefixed names (`_TAgent`, `_k`, `_w`) are how this codebase's TypeScript config marks intentionally unused parameters.

## 4. What NOT to do

- Do not change the sim (steering, utility scoring, station tasks, stock, waste, demand curve numbers), the worker AI, `KitchenCanvas`, or the pre-existing type error at `App.tsx` `KitchenCanvas` props. No new station, canvas art or map change; no Tier 2 / Day 8 continuation (victory stays terminal).
- Do not change Fries behaviour beyond the two unlock-day constants; do not touch `CASH_PER_CLEAN_ORDER`'s value or any price other than the new add-ons.
- Do not edit anchors other than 162, 164 and 166. Do not run the example's own test runner (a worktree has no `node_modules` for it).
- No saving (a separate directive), no Lua, no engine changes, no deploys or rebuilds, no protected repos, no player layer or cloud saves. Do not touch `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_seven_days_shop.ts
```
Real tail from the prototype of exactly these edits: `Test Files  1 passed (1)` / `Tests  6 passed (6)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; nothing mentions `7-days-to-fry` (without step 5 the same command printed 12 more errors).
Source checks (Grep tool): `examples/7-days-to-fry/src/nightShop.ts` contains `purchaseCoffeeSales` and `purchaseSodaUnlock`; Grep for `FRIES_UNLOCK_MIN_DAY = ` in `examples/7-days-to-fry/src/economy.ts` shows `= 2;`.

Controller step, not this run: the example's own suite with a temporary `node_modules` junction. Real result on the prototype: `Test Files  1 passed (1)` / `Tests  241 passed (241)` (baseline was also 241). Also the example's own type check (baseline and prototype both print exactly the one pre-existing `KitchenCanvas` error), a rebuild, and a play-through: Night before Day 2 offers Fries, Day 5 Coffee, Day 6 Soda.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts [<bare-filename>.ts]` (and `uv run pytest ...` where named below). Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use bare test filenames as filters (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index`, any `npm run build:*`, `vite-node`, or `git merge origin/main` (the sandbox refuses them).
- Match each file's existing line endings (the Edit tool preserves them); do not convert.
- `examples/` folders are AI Studio exports (untrusted code). New logic goes in small new modules; no file over 600 lines unless it already is (then do not grow it by more than the lines named here).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] All Step 1-3 diffs and the Step 5 removals are applied; the shop constants read 2, 3, 5, 6; `purchaseCoffeeSales` and `purchaseSodaUnlock` exist; orders never roll a drink while it is locked.
- [ ] Anchors 162, 164 and 166 are rewritten exactly as shown and no other anchor changed.
- [ ] `ts/tests/test_seven_days_shop.ts` exists with the exact content above; `cd ts && npx vitest run test_seven_days_shop.ts` passes: 6 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry that says the shop-day conflict (Design.md v4 against anchors 162/164/166) was resolved in favour of Design.md v4.

## Sandbox needs

none

## 8. Report

Findings first: files changed, whether any quoted line or context differed from the file, and a plain statement of the design conflict (the old tests said the shop opens on Day 8, which a seven-day game never reaches; this run followed Design.md v4). Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then say plainly what was not run (the example's own suite, its type check, a play-through) for the controller, and list what is NOT in this pass: the coffee-station visual promotion, the Soda construction-reveal, balance testing of the add-on prices.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-seven-days-to-fry-coffee-and-soda-768575 |
| Base branch | - |
| Base commit | 94413da2bc3a9b692ab3e6558190764fdb5269c7 |
| Head commit | eb5a50d7e6280e7ff5a49c758f04b94f0e0bd528 |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 14:36 · robert-claude-laptop · none → Queued
- 2026-10-08 04:12 · robert-claude-laptop · Queued → Approved
- 2026-10-08 04:13 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-seven-days-to-fry-coffee-and-soda-768575; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4D965HVJMQY6SYRKNSGHCHB
- 2026-10-08 04:13 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-seven-days-to-fry-coffee-and-soda-768575; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-08 04:31 · devin · In progress → Blocked — Work complete and verified (vitest test_seven_days_shop.ts 6/6, tsc --noEmit clean, committed eb5a50d7; shop-day conflict resolved in favour of Design.md v4) but git push refused by repo pre-push hook: unrelated pre-existing failure in ts/tests/test_gladiator_arena_tier_a.ts (tierClearRates[1]=65 < 70; test last touched in 6f421876, nothing in this diff touches gladiator_arena). Branch exists locally only until gate is green.
- 2026-10-08 05:03 · robert-claude-laptop · Blocked → Review — pushed after gates passed; PR 233
- 2026-10-08 05:04 · robert-claude-laptop · Review → Done — note: merged via RFDGameStudio PR #233 (merge commit); gates 2730 tests; example suite, play-through and deploy left to Robert
<!-- queue:end -->
