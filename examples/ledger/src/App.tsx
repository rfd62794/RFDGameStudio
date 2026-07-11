/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LotsPanel } from './components/LotsPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { MarketPanel } from './components/MarketPanel';
import { ShopUpgrades } from './components/ShopUpgrades';
import { IntroDialog, DaySummaryDialog, VictoryDialog, DefeatDialog } from './components/GameDialogs';
import { Category, Good, Lot, MarketState, GameLog, ShopTier } from './types';
import { 
  generateId, 
  generateLot, 
  generateInitialMarket, 
  calculateMarketDrift, 
  calculateSellValue, 
  generateNewsFlash,
  formatCurrency
} from './utils';
import { FileText, Award, AlertTriangle, ShieldCheck, HelpCircle, Landmark } from 'lucide-react';

export default function App() {
  // --- Game Engine State ---
  const [day, setDay] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState<number>(0); // 0 to 100
  const [isDayActive, setIsDayActive] = useState<boolean>(false);
  const [capital, setCapital] = useState<number>(1000);
  const [debt, setDebt] = useState<number>(2500);
  const [graceDaysRemaining, setGraceDaysRemaining] = useState<number>(5);
  const [shopTier, setShopTier] = useState<ShopTier>(1);
  const [inventory, setInventory] = useState<Good[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [market, setMarket] = useState<Record<Category, MarketState>>(generateInitialMarket());
  const [history, setHistory] = useState<GameLog[]>([]);
  const [runStatus, setRunStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [defeatReason, setDefeatReason] = useState<'bankrupt' | 'unpaid'>('unpaid');

  // Lockout / Payment Tracking
  const [repaidToday, setRepaidToday] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Daily Statistics for report
  const [salesToday, setSalesToday] = useState<number>(0);
  const [purchasesToday, setPurchasesToday] = useState<number>(0);
  const [upgradesSpentToday, setUpgradesSpentToday] = useState<number>(0);

  // Dialog / Overlay Visibility
  const [showTutorial, setShowTutorial] = useState<boolean>(true);
  const [showDayEndSummary, setShowDayEndSummary] = useState<boolean>(false);
  
  // Active Daily News Flash
  const [activeNews, setActiveNews] = useState<{
    message: string;
    category: Category | null;
    trend: 'boom' | 'bust' | null;
  } | null>(null);

  // Spawning controls
  const [spawnedMidday1, setSpawnedMidday1] = useState<boolean>(false);
  const [spawnedMidday2, setSpawnedMidday2] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Initial Setup (Start of game) ---
  useEffect(() => {
    // Generate initial atmospheric log
    const initialLog: GameLog = {
      id: generateId(),
      day: 1,
      type: 'system',
      message: "Stall acquired in the Alley Lane. Received $1,000 baseline capital and $2,500 debt ledger. Grace period is active.",
      amount: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setHistory([initialLog]);

    // Generate initial lots for Day 1
    // We guarantee 1 walk-in and 1 Dutch auction on the board immediately
    const startWalkIn = generateLot(1, 1, 'walk_in');
    const startAuction = generateLot(1, 1, 'dutch_auction');
    setLots([startWalkIn, startAuction]);
  }, []);

  // --- Helper logger ---
  const addLog = (
    type: GameLog['type'],
    message: string,
    amount: number | null = null,
    dayOverride?: number
  ) => {
    const newLog: GameLog = {
      id: generateId(),
      day: dayOverride || day,
      type,
      message,
      amount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setHistory((prev) => [newLog, ...prev]);
  };

  // Capacity calculations based on Shop Tier
  const getShopCapacity = (tier: ShopTier): number => {
    if (tier === 1) return 4;
    if (tier === 2) return 8;
    if (tier === 3) return 12;
    return 4;
  };

  // Active Appraisal duration speed
  const getAppraiseDurationTicks = (tier: ShopTier): number => {
    // Expert hire halving time
    return tier === 3 ? 2 : 4; 
  };

  // --- Real-time Day Ticker Interval ---
  useEffect(() => {
    if (isDayActive && runStatus === 'playing') {
      timerRef.current = setInterval(() => {
        
        // 1. Advance Day Time
        setTimeOfDay((prevTime) => {
          const nextTime = prevTime + 2; // Increments by 2% per tick (50 ticks total)
          if (nextTime >= 100) {
            handleDayEndTransition();
            return 100;
          }
          return nextTime;
        });

        // 2. Spawn Mid-day items
        // At 30% and 60% time, spawn new lots if capacity permits on the acquisition board
        setTimeOfDay((currentVal) => {
          // Check limits
          const maxLots = shopTier === 1 ? 2 : shopTier === 2 ? 3 : 4;
          
          if (currentVal >= 35 && currentVal < 40 && !spawnedMidday1) {
            setSpawnedMidday1(true);
            setLots((prevLots) => {
              if (prevLots.length < maxLots) {
                const newLot = generateLot(day, shopTier);
                addLog('system', `A new ${newLot.type === 'walk_in' ? 'walk-in seller' : 'Dutch auction lot'} has entered the board.`);
                return [...prevLots, newLot];
              }
              return prevLots;
            });
          }

          if (currentVal >= 65 && currentVal < 70 && !spawnedMidday2) {
            setSpawnedMidday2(true);
            setLots((prevLots) => {
              if (prevLots.length < maxLots && shopTier > 1) {
                const newLot = generateLot(day, shopTier);
                addLog('system', `A second afternoon ${newLot.type === 'walk_in' ? 'seller' : 'auction lot'} has arrived.`);
                return [...prevLots, newLot];
              }
              return prevLots;
            });
          }

          return currentVal;
        });

        // 3. Process each Lot's real-time ticking mechanics
        setLots((prevLots) => {
          const updatedLots: Lot[] = [];

          for (const lot of prevLots) {
            // Is this specific lot undergoing active appraisal?
            if (lot.isInspecting) {
              const appraiseTicks = getAppraiseDurationTicks(shopTier);
              const progressIncrement = 100 / appraiseTicks;
              const nextProgress = lot.inspectProgress + progressIncrement;

              if (nextProgress >= 100) {
                // Appraisal finished!
                const updatedGood: Good = {
                  ...lot.good,
                  isInspected: true,
                };

                addLog('system', `Appraisal finished for "${lot.good.name}". High resolution diagnostic scans compiled.`);

                // Auction keeps dropping and rivals interest ticks even on finished appraisals
                let nextPrice = lot.askingPrice;
                let nextRivalInterest = lot.rivalInterest;

                if (lot.type === 'dutch_auction') {
                  nextPrice = Math.max(lot.auctionFloorPrice, lot.askingPrice - lot.decayRate);
                  nextRivalInterest = lot.rivalInterest + lot.rivalRate;
                }

                updatedLots.push({
                  ...lot,
                  good: updatedGood,
                  isInspecting: false,
                  inspectProgress: 100,
                  askingPrice: nextPrice,
                  rivalInterest: nextRivalInterest,
                });
              } else {
                // Appraisal ongoing.
                // If auction, price drops and rival interest grows while looking under the glass!
                let nextPrice = lot.askingPrice;
                let nextRivalInterest = lot.rivalInterest;

                if (lot.type === 'dutch_auction') {
                  nextPrice = Math.max(lot.auctionFloorPrice, lot.askingPrice - lot.decayRate);
                  nextRivalInterest = lot.rivalInterest + lot.rivalRate;
                }

                // If walk-in, seller patience decays slightly while appraising
                let nextPatience = lot.patience;
                if (lot.type === 'walk_in') {
                  nextPatience = Math.max(0, lot.patience - (lot.decayRate * 0.5)); // patience drops half as fast while client watches you appraise
                }

                // Checks:
                if (lot.type === 'dutch_auction' && nextRivalInterest >= 100) {
                  addLog('news', `A rival bidder sniped "${lot.good.name}" for ${formatCurrency(lot.askingPrice)} while you were busy appraising it!`);
                  continue; // Removed from board
                }

                if (lot.type === 'walk_in' && nextPatience <= 0) {
                  addLog('system', `The walk-in seller of "${lot.good.name}" got offended by the appraisal wait and left.`);
                  continue; // Removed from board
                }

                updatedLots.push({
                  ...lot,
                  inspectProgress: nextProgress,
                  askingPrice: nextPrice,
                  rivalInterest: nextRivalInterest,
                  patience: nextPatience,
                });
              }
            } else {
              // Not inspecting: standard decays
              if (lot.type === 'walk_in') {
                const nextPatience = lot.patience - lot.decayRate;
                if (nextPatience <= 0) {
                  addLog('system', `The walk-in client carrying "${lot.good.name}" lost patience and departed.`);
                  continue; // Removed from board
                }
                updatedLots.push({
                  ...lot,
                  patience: nextPatience,
                });
              } else {
                // Dutch Auction
                const nextPrice = Math.max(lot.auctionFloorPrice, lot.askingPrice - lot.decayRate);
                const nextRivalInterest = lot.rivalInterest + lot.rivalRate;

                if (nextRivalInterest >= 100) {
                  addLog('news', `A rival bidder sniped "${lot.good.name}" for ${formatCurrency(lot.askingPrice)}.`);
                  continue; // Removed from board
                }

                updatedLots.push({
                  ...lot,
                  askingPrice: nextPrice,
                  rivalInterest: nextRivalInterest,
                });
              }
            }
          }

          return updatedLots;
        });

      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isDayActive, runStatus, spawnedMidday1, spawnedMidday2, shopTier, day]);

  // --- Check Bankruptcy Insolvency ---
  useEffect(() => {
    if (runStatus === 'playing') {
      const isBankrupt = capital === 0 && inventory.length === 0 && debt > 0;
      if (isBankrupt) {
        setIsDayActive(false);
        setDefeatReason('bankrupt');
        setRunStatus('lost');
      }
    }
  }, [capital, inventory, debt, runStatus]);

  // --- Day End Transition Core Logic ---
  const handleDayEndTransition = () => {
    setIsDayActive(false);

    // Calculate daily compound interest past grace period
    let interestAccrued = 0;
    if (graceDaysRemaining === 0 && debt > 0) {
      interestAccrued = Math.round(debt * 0.10);
    }

    // Set daily report
    setDailyReport({
      day,
      sales: salesToday,
      purchases: purchasesToday,
      interestAccrued,
      interestPaid: 0, // calculated from repayments
      upgradesSpent: upgradesSpentToday,
    });

    // Apply compound interest to debt
    if (interestAccrued > 0) {
      setDebt((prevDebt) => prevDebt + interestAccrued);
      addLog('interest', `Lender compounding interest of +${formatCurrency(interestAccrued)} accrued on Day ${day} outstanding balance.`, -interestAccrued);
    }

    // Process Grace period count
    if (graceDaysRemaining > 0) {
      setGraceDaysRemaining((prev) => prev - 1);
    }

    // Apply Lender lockout constraint
    // Lockout if: grace period ended, still have debt, and repaid less than $100 today
    const pastGrace = graceDaysRemaining === 0;
    const remainsInDebt = debt > 0;
    const isUnderpaid = repaidToday < 100;

    if (pastGrace && remainsInDebt && isUnderpaid) {
      setIsLockedOut(true);
      addLog('news', "The Lender has locked out your acquisition board due to default/insufficient daily principal payments.");
    }

    // Show End Day dialog summary sheet
    setShowDayEndSummary(true);
  };

  // --- Proceeding to Next Day ---
  const handleNextDayBegin = () => {
    setShowDayEndSummary(false);

    // Check final victory or defeat constraints at the conclusion of Day 10
    if (day === 10) {
      if (debt === 0) {
        setRunStatus('won');
      } else {
        setDefeatReason('unpaid');
        setRunStatus('lost');
      }
      return;
    }

    // Increment day and reset time
    const nextDayNum = day + 1;
    setDay(nextDayNum);
    setTimeOfDay(0);

    // Reset daily transaction limits
    setRepaidToday(0);
    setSalesToday(0);
    setPurchasesToday(0);
    setUpgradesSpentToday(0);
    setSpawnedMidday1(false);
    setSpawnedMidday2(false);

    // Trigger daily macroeconomic news flash
    const newsFlash = generateNewsFlash(nextDayNum);
    setActiveNews(newsFlash);
    if (newsFlash.category) {
      addLog('news', `MARKET FLASH: ${newsFlash.message}`, null, nextDayNum);
    }

    // Re-calculate environmental drift for markets
    setMarket((prevMarket) => calculateMarketDrift(prevMarket, newsFlash.category, newsFlash.trend));

    // Refill acquisitionboard
    const activeLotCount = shopTier === 1 ? 1 : 2;
    const freshLots: Lot[] = [];
    for (let i = 0; i < activeLotCount; i++) {
      // Alternate starting lot channels on day opens
      const forcedType = i % 2 === 0 ? 'walk_in' : 'dutch_auction';
      freshLots.push(generateLot(nextDayNum, shopTier, forcedType));
    }
    setLots(freshLots);

    addLog('system', `Day ${nextDayNum} opens. Trade lanes activated.`, null, nextDayNum);
  };

  // --- State for daily report ---
  const [dailyReport, setDailyReport] = useState<{
    day: number;
    sales: number;
    purchases: number;
    interestAccrued: number;
    interestPaid: number;
    upgradesSpent: number;
  } | null>(null);

  // --- UI Action Handlers ---

  const handleTogglePause = () => {
    // Cannot resume trading if locked out by the Lender
    if (isLockedOut && !isDayActive) {
      addLog('system', "LENDER LOCKOUT ACTIVE: Repay at least $100 of debt to resume trading.");
      return;
    }
    setIsDayActive(!isDayActive);
  };

  const handleAdvanceDayEarly = () => {
    if (window.confirm("Are you sure you want to shut down operations and end the day early? Remaining lots will depart.")) {
      handleDayEndTransition();
    }
  };

  // 1. Acquire Lot (Buy)
  const handleBuyLot = (lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    if (capital < lot.askingPrice) {
      addLog('system', "Insolvent for this lot. Clear debt, borrow money, or liquidate assets first.");
      return;
    }

    const currentCap = getShopCapacity(shopTier);
    if (inventory.length >= currentCap) {
      addLog('system', `Storage shelves packed. Upgrading your shop increases shelf slots (Current capacity: ${currentCap}).`);
      return;
    }

    // Purchase is valid!
    setCapital((prev) => prev - lot.askingPrice);
    setPurchasesToday((prev) => prev + lot.askingPrice);

    const acquiredItem: Good = {
      ...lot.good,
      acquiredPrice: lot.askingPrice,
      acquiredDay: day,
    };

    setInventory((prev) => [...prev, acquiredItem]);
    setLots((prev) => prev.filter((l) => l.id !== lotId));

    addLog('buy', `Acquired "${lot.good.name}" (${lot.good.quality} quality) for ${formatCurrency(lot.askingPrice)}.`, -lot.askingPrice);
  };

  // 2. Decline Lot
  const handleDeclineLot = (lotId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    if (!lot) return;

    setLots((prev) => prev.filter((l) => l.id !== lotId));
    addLog('system', `Turned away client carrying "${lot.good.name}".`);
  };

  // 3. Inspect / Appraise Lot
  const handleInspectLot = (lotId: string) => {
    if (!isDayActive) {
      addLog('system', "The day clock must be running ('Trade' active) for inspections to proceed.");
      return;
    }

    setLots((prevLots) =>
      prevLots.map((l) => {
        if (l.id === lotId) {
          // Set active inspection
          return {
            ...l,
            isInspecting: true,
            inspectProgress: 0,
          };
        } else {
          // Pause other inspections
          return {
            ...l,
            isInspecting: false,
          };
        }
      })
    );

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addLog('system', `Placed "${lot.good.name}" under microscope. Evaluating material layers...`);
    }
  };

  // 4. Sell Item into Market
  const handleSellItem = (goodId: string) => {
    const item = inventory.find((i) => i.id === goodId);
    if (!item) return;

    const marketState = market[item.category];
    const { value: payout, isFakeRevealed } = calculateSellValue(item, marketState);

    // Liquidate cash
    setCapital((prev) => prev + payout);
    setSalesToday((prev) => prev + payout);

    // Remove from inventory
    setInventory((prev) => prev.filter((i) => i.id !== goodId));

    // Log the event with precise atmospheric summaries
    const profitMargin = payout - item.acquiredPrice;
    const isProfit = profitMargin >= 0;

    if (isFakeRevealed) {
      addLog(
        'sell',
        `⚠️ FORGERY DISCOVERED! Sold "${item.name}" for scrap value of ${formatCurrency(payout)}. Paid ${formatCurrency(item.acquiredPrice)} (Net loss of -${formatCurrency(Math.abs(profitMargin))}).`,
        payout
      );
    } else {
      addLog(
        'sell',
        `Sold "${item.name}" for ${formatCurrency(payout)}. Paid ${formatCurrency(item.acquiredPrice)} (Net profit of +${formatCurrency(profitMargin)}).`,
        payout
      );
    }

    // Trigger Sales Pressure price suppression on this specific category!
    // Decreases category current multiplier temporarily and locks it for 2 days.
    setMarket((prevMarket) => {
      const updatedMarket = { ...prevMarket };
      const catState = { ...updatedMarket[item.category] };
      
      // Accumulate price suppression (caps at 40% maximum suppression)
      catState.suppressionDaysRemaining = 3; // active today + next 2 days
      catState.suppressionFactor = Math.max(0.60, catState.suppressionFactor - 0.18); // drops value by 18% per liquidation

      updatedMarket[item.category] = catState;
      return updatedMarket;
    });

    addLog('system', `Sales pressure applied on ${item.category}. Resale market values suppressed by 18% temporarily.`);
  };

  // 5. Upgrade Shop Tier
  const handleUpgradeShop = () => {
    const nextUpgradeCosts: Record<number, number> = { 1: 1500, 2: 3500 };
    const cost = nextUpgradeCosts[shopTier];

    if (!cost) return;

    if (capital < cost) {
      addLog('system', `Insufficient funds. Shop upgrade requires ${formatCurrency(cost)} capital.`);
      return;
    }

    setCapital((prev) => prev - cost);
    setUpgradesSpentToday((prev) => prev + cost);

    const nextTier = (shopTier + 1) as ShopTier;
    setShopTier(nextTier);

    addLog(
      'upgrade',
      `Funded shop capital upgrade to Tier ${nextTier} (${nextTier === 2 ? 'Storefront' : 'Boutique'}) for ${formatCurrency(cost)}.`,
      -cost
    );
  };

  // 6. Manage Loans (Take emergency financing)
  const handleTakeLoan = (amount: number) => {
    if (isLockedOut) {
      addLog('system', "LENDER ACCESS SUSPENDED: Pay down outstanding default balances to resume borrowing.");
      return;
    }

    if (debt + amount > 6000) {
      addLog('system', "Credit limit reached. The Lender refuses to extend more than $6,000 of maximum liability.");
      return;
    }

    setCapital((prev) => prev + amount);
    setDebt((prev) => prev + amount);

    addLog('loan', `Secured emergency funding of +${formatCurrency(amount)} capital. Debt liabilities increased.`, amount);
  };

  // 7. Repay Debt Principal
  const handleRepayDebt = (amount: number) => {
    const activeRepayment = Math.min(capital, debt, amount);
    if (activeRepayment <= 0) return;

    setCapital((prev) => prev - activeRepayment);
    setDebt((prev) => prev - activeRepayment);
    
    // Accumulate repayments made today
    const updatedRepaidToday = repaidToday + activeRepayment;
    setRepaidToday(updatedRepaidToday);

    addLog('loan', `Paid down ${formatCurrency(activeRepayment)} of outstanding Lender debt principal.`, -activeRepayment);

    // If player pays off their debt OR repays at least $100 total, clear lockout standing
    const currentDebtRemaining = debt - activeRepayment;
    if (currentDebtRemaining === 0 || updatedRepaidToday >= 100) {
      if (isLockedOut) {
        setIsLockedOut(false);
        addLog('system', "Good standing resumed with Lender. Lockout cleared. Trade lanes reactivated.");
      }
    }
  };

  // 8. Restart a new run
  const handleRestartRun = () => {
    setDay(1);
    setTimeOfDay(0);
    setIsDayActive(false);
    setCapital(1000);
    setDebt(2500);
    setGraceDaysRemaining(5);
    setShopTier(1);
    setInventory([]);
    setLots([generateLot(1, 1, 'walk_in'), generateLot(1, 1, 'dutch_auction')]);
    setMarket(generateInitialMarket());
    setRunStatus('playing');
    setRepaidToday(0);
    setIsLockedOut(false);
    setSalesToday(0);
    setPurchasesToday(0);
    setUpgradesSpentToday(0);
    setSpawnedMidday1(false);
    setSpawnedMidday2(false);
    setActiveNews(null);

    const freshLog: GameLog = {
      id: generateId(),
      day: 1,
      type: 'system',
      message: "Reset ledger sheets. Commenced fresh 10-day Appraiser contract. Capital set to $1,000.",
      amount: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setHistory([freshLog]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-indigo-100 font-sans" id="app-root">
      
      {/* Top Ledger Header */}
      <Header
        day={day}
        timeOfDay={timeOfDay}
        capital={capital}
        debt={debt}
        graceDaysRemaining={graceDaysRemaining}
        isDayActive={isDayActive}
        shopTier={shopTier}
        onTogglePause={handleTogglePause}
        onAdvanceDay={handleAdvanceDayEarly}
        onOpenTutorial={() => setShowTutorial(true)}
      />

      {/* Main Grid Work-surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left column (8/12 space): Trade opportunities and Shop Storage */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Section: Walk-ins and Auctions */}
          <LotsPanel
            lots={lots}
            capital={capital}
            isDayActive={isDayActive}
            isInventoryFull={inventory.length >= getShopCapacity(shopTier)}
            onBuyLot={handleBuyLot}
            onDeclineLot={handleDeclineLot}
            onInspectLot={handleInspectLot}
          />

          {/* Section: Storage Shelves Grid */}
          <InventoryPanel
            inventory={inventory}
            market={market}
            shopCapacity={getShopCapacity(shopTier)}
            onSellItem={handleSellItem}
          />
        </div>

        {/* Right column (4/12 space): Resale Markets, Lender terminal, and Upgrades */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Section: Market index tickers and sparklines */}
          <MarketPanel market={market} news={activeNews} />

          {/* Section: Financial terminals and shop tiers */}
          <ShopUpgrades
            capital={capital}
            debt={debt}
            shopTier={shopTier}
            isLockedOut={isLockedOut}
            graceDaysRemaining={graceDaysRemaining}
            onUpgradeShop={handleUpgradeShop}
            onRepayDebt={handleRepayDebt}
            onTakeLoan={handleTakeLoan}
          />

          {/* Core game manual checklist / live logs terminal */}
          <div className="bg-white border-2 border-slate-800 rounded-xl p-4 shadow-sm flex-1 min-h-[220px] flex flex-col" id="logs-terminal">
            <h3 className="font-display text-sm font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-slate-700" />
              <span>Audit Trail Logs</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[250px] lg:max-h-none">
              {history.map((log) => {
                let badgeColor = "text-slate-400";
                if (log.type === 'buy') badgeColor = "text-rose-500 font-bold";
                if (log.type === 'sell') badgeColor = "text-emerald-500 font-bold";
                if (log.type === 'loan') badgeColor = "text-rose-500 font-semibold";
                if (log.type === 'upgrade') badgeColor = "text-indigo-500 font-semibold";
                if (log.type === 'news') badgeColor = "text-amber-500 font-bold";

                return (
                  <div key={log.id} className="text-[11px] font-mono leading-relaxed border-b border-slate-100 pb-1">
                    <span className="text-slate-400">[{log.timestamp}]</span>{' '}
                    <span className="text-slate-500">[Day {log.day}]</span>{' '}
                    <span className={badgeColor}>{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* Overlays / Dialogs Modals */}
      <IntroDialog isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      
      <DaySummaryDialog
        isOpen={showDayEndSummary}
        day={day}
        report={dailyReport}
        news={activeNews}
        logs={history}
        onNextDay={handleNextDayBegin}
      />

      <VictoryDialog
        isOpen={runStatus === 'won'}
        capital={capital}
        shopTier={shopTier}
        logs={history}
        onRestart={handleRestartRun}
      />

      <DefeatDialog
        isOpen={runStatus === 'lost'}
        reason={defeatReason}
        capital={capital}
        debt={debt}
        onRestart={handleRestartRun}
      />

      {/* Simple Footer */}
      <footer className="border-t border-slate-200 py-3 text-center bg-slate-50 text-[10px] font-mono text-slate-400">
        LEDGER SHEET &copy; 2026. Bounded 10-Day Run Trading Simulator. Session-bound.
      </footer>

    </div>
  );
}
