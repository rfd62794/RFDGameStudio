/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, ShieldCheck, Landmark, Sparkles, Award, Play, AlertOctagon, HelpCircle, FileText, ChevronRight, BookOpen, Coins } from 'lucide-react';
import { GameLog, Category } from '../types';
import { formatCurrency } from '../utils';

// Overlay Background Wrapper
interface OverlayProps {
  children: React.ReactNode;
}
const Overlay: React.FC<OverlayProps> = ({ children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="w-full max-w-xl bg-white border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
      {children}
    </div>
  </div>
);

// 1. Introduction Tutorial Dialog
interface IntroProps {
  isOpen: boolean;
  onClose: () => void;
}
export const IntroDialog: React.FC<IntroProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <div className="bg-slate-800 text-white p-4 flex items-center gap-2 border-b border-slate-700">
        <BookOpen size={20} className="text-amber-400" />
        <h2 className="font-display font-bold text-lg tracking-tight uppercase">APPRAISER'S OPERATIONS GUIDE</h2>
      </div>
      
      <div className="p-5 font-sans text-slate-700 text-xs md:text-sm space-y-4 max-h-[70vh] overflow-y-auto">
        <p className="leading-relaxed">
          Welcome to <strong className="text-slate-900 font-bold">LEDGER</strong>. You have taken over a small curio trade stall, but starting out you are underwater on a high-stakes loan from the Lender. Your objective is simple: <strong className="text-slate-900 font-bold">Fully repay your debt before Day 10 ends.</strong>
        </p>

        <div className="border-l-4 border-amber-500 pl-3 py-1 bg-amber-50 rounded">
          <strong className="text-amber-800 uppercase text-xs block mb-0.5 font-bold">The Lender's Rules:</strong>
          You start with <strong className="text-slate-900 font-bold">$1,000 cash</strong> and <strong className="text-slate-900 font-bold">$2,500 debt</strong>. You have a <strong className="text-slate-900 font-bold">5-day grace period</strong>. Starting Day 6, interest accrues at <strong className="text-rose-700 font-bold">10% per day, compounded</strong>. If you miss a day without paying down at least $100, the Lender locks you out of new lots!
        </div>

        <div>
          <h3 className="font-display font-bold text-slate-900 text-sm border-b border-slate-200 pb-1 mb-2">
            Core Operations Loop:
          </h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 bg-slate-100 text-slate-800 font-mono font-bold text-xs flex items-center justify-center rounded border border-slate-300 shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-slate-800 block">Review and Acquire Lots</strong>
                You receive Walk-In offers and Dutch Auctions. Bidding starts high and drops in real time, but rival interest builds. Claim auctions before rivals snipe!
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 bg-slate-100 text-slate-800 font-mono font-bold text-xs flex items-center justify-center rounded border border-slate-300 shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-slate-800 block">Appraise Wisely (Inspect Action)</strong>
                Walk-in items have a **18% forgery rate**. You can hit "Appraise" while trading to run microscopic diagnostics. This takes time—allowing sellers to walk or auctions to tick—but lowers fake risk to 5%.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 bg-slate-100 text-slate-800 font-mono font-bold text-xs flex items-center justify-center rounded border border-slate-300 shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-slate-800 block">Liquidate and Watch the Market</strong>
                Liquidating items earns capital. But selling triggers **Sales Pressure** on that category, suppressing prices by 15-20% temporarily. Diversify your sales to clear debt efficiently!
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 bg-slate-100 text-slate-800 font-mono font-bold text-xs flex items-center justify-center rounded border border-slate-300 shrink-0 mt-0.5">4</span>
              <div>
                <strong className="text-slate-800 block">Upgrade Shop Capacity</strong>
                Expand your shop (Alley Stall → Storefront → Boutique) to hold more stock, draw additional lots, and hire an Expert who appraises items in half the time!
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded p-3 text-xs leading-relaxed">
          <strong className="block mb-0.5 font-bold uppercase text-[10px]">💡 PRO APPRAISER'S TIP:</strong>
          Collectibles (volatility outlier) have massive, erratic price swings. If they trend upwards during a **Boom News Event**, you can make thousands on a single item. But beware of fakes—uninspected fakes trigger catastrophic losses upon sale!
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-950 text-white font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow transition-colors"
          id="btn-close-tutorial"
        >
          <span>Open Shop & Trade</span>
          <Play size={12} fill="currentColor" />
        </button>
      </div>
    </Overlay>
  );
};

// 2. Day Summary Audit Overlay
interface DaySummaryProps {
  isOpen: boolean;
  day: number;
  report: {
    day: number;
    sales: number;
    purchases: number;
    interestAccrued: number;
    interestPaid: number;
    upgradesSpent: number;
  } | null;
  news: { message: string; category: Category | null; trend: 'boom' | 'bust' | null } | null;
  logs: GameLog[];
  onNextDay: () => void;
}
export const DaySummaryDialog: React.FC<DaySummaryProps> = ({
  isOpen,
  day,
  report,
  news,
  logs,
  onNextDay,
}) => {
  if (!isOpen) return null;

  // Filter logs for today
  const todayLogs = logs.filter((log) => log.day === day);

  return (
    <Overlay>
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-indigo-400" />
          <h2 className="font-display font-bold text-base tracking-tight uppercase">END OF DAY {day} AUDIT</h2>
        </div>
        <span className="font-mono text-xs text-slate-400">LEDGER SHEET</span>
      </div>

      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-slate-700">
        
        {/* News & Environmental Drift */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Market Environment Shift</span>
          {news ? (
            <p className="text-xs italic leading-normal text-slate-700">
              "{news.message}"
            </p>
          ) : (
            <p className="text-xs text-slate-500 font-mono">Normal trading volume reports; standard price drift applies.</p>
          )}
        </div>

        {/* Statistical Ledger Sheet */}
        {report && (
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-2">Financial Accounting</span>
            <div className="border border-slate-300 rounded-lg overflow-hidden font-mono text-xs">
              
              {/* Row: Sales */}
              <div className="flex justify-between p-2.5 bg-slate-50 border-b border-slate-200">
                <span className="text-slate-500 font-medium">(+) Liquidated Payouts:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(report.sales)}</span>
              </div>

              {/* Row: Purchases */}
              <div className="flex justify-between p-2.5 bg-white border-b border-slate-200">
                <span className="text-slate-500 font-medium">(-) Lot Acquisition Expenses:</span>
                <span className="font-bold text-rose-700">-{formatCurrency(report.purchases)}</span>
              </div>

              {/* Row: Upgrades */}
              {report.upgradesSpent > 0 && (
                <div className="flex justify-between p-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">(-) Shop Capital Upgrades:</span>
                  <span className="font-bold text-indigo-700">-{formatCurrency(report.upgradesSpent)}</span>
                </div>
              )}

              {/* Row: Interest accrued */}
              <div className="flex justify-between p-2.5 bg-white border-b border-slate-200">
                <span className="text-slate-500 font-medium">
                  {day <= 5 ? 'Grace Period (0% Interest)' : '(-) Lender Compounding Interest:'}
                </span>
                <span className={`font-bold ${report.interestAccrued > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                  {report.interestAccrued > 0 ? `-${formatCurrency(report.interestAccrued)}` : '$0'}
                </span>
              </div>

              {/* Net flow */}
              {(() => {
                const net = report.sales - report.purchases - report.upgradesSpent - report.interestAccrued;
                return (
                  <div className="flex justify-between p-2.5 bg-slate-100 font-bold text-slate-900">
                    <span className="uppercase text-[10px] font-bold">Net Daily Change:</span>
                    <span className={net >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {net >= 0 ? '+' : '-'}{formatCurrency(Math.abs(net))}
                    </span>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* Transaction Records Scroll */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">Daily Transaction Records</span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
            {todayLogs.length === 0 ? (
              <p className="text-center py-4 text-xs font-mono text-slate-400">No trading activity recorded today.</p>
            ) : (
              todayLogs.map((log) => (
                <div key={log.id} className="text-[11px] font-mono flex items-start gap-1 justify-between border-b border-slate-100 pb-1">
                  <div className="flex-1 text-slate-600">
                    <span className="text-slate-400">[{log.timestamp}]</span> {log.message}
                  </div>
                  {log.amount !== null && (
                    <span className={`font-bold shrink-0 ${log.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {log.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(log.amount))}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button
          onClick={onNextDay}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow transition-colors"
          id="btn-day-continue"
        >
          <span>Begin Day {day + 1}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </Overlay>
  );
};

// 3. Victory Dialog Overlay
interface VictoryProps {
  isOpen: boolean;
  capital: number;
  shopTier: number;
  logs: GameLog[];
  onRestart: () => void;
}
export const VictoryDialog: React.FC<VictoryProps> = ({
  isOpen,
  capital,
  shopTier,
  logs,
  onRestart,
}) => {
  if (!isOpen) return null;

  const totalSales = logs
    .filter((log) => log.type === 'sell')
    .reduce((sum, log) => sum + (log.amount || 0), 0);

  return (
    <Overlay>
      <div className="bg-emerald-700 text-white p-6 text-center border-b border-emerald-800">
        <Award size={48} className="mx-auto text-yellow-300 animate-bounce mb-3" />
        <h2 className="font-display font-black text-2xl tracking-tight uppercase">DEBT REPAID — VICTORY</h2>
        <p className="font-mono text-xs text-emerald-100 uppercase tracking-widest mt-1">Ledger Clear of Liability</p>
      </div>

      <div className="p-6 space-y-4 font-sans text-slate-700 text-center">
        <p className="text-sm leading-relaxed max-w-sm mx-auto">
          Congratulations! You completed the bounded 10-day loop. Your compounding debt is paid off down to <strong className="text-slate-900 font-bold">$0</strong>, and your name is cleared of the Lender's ledger!
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto border border-slate-200 rounded-lg p-3 bg-slate-50 text-left font-mono text-xs">
          <div>
            <span className="text-slate-400 uppercase text-[9px] block">Final Capital:</span>
            <span className="font-bold text-slate-800 text-base">{formatCurrency(capital)}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase text-[9px] block">Total Liquidations:</span>
            <span className="font-bold text-emerald-700 text-base">{formatCurrency(totalSales)}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-200">
            <span className="text-slate-400 uppercase text-[9px] block">Final Shop Standing:</span>
            <span className="font-bold text-slate-800 text-sm">
              Tier {shopTier} ({shopTier === 3 ? 'Boutique' : shopTier === 2 ? 'Storefront' : 'Alley Stall'})
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic">
          "The signature of a master appraiser. Buy low, appraise with caution, sell high, and manage the interest leverage."
        </p>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
        <button
          onClick={onRestart}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow transition-colors"
          id="btn-victory-restart"
        >
          <Sparkles size={14} />
          <span>Embark on a New Run</span>
        </button>
      </div>
    </Overlay>
  );
};

// 4. Defeat Dialog Overlay
interface DefeatProps {
  isOpen: boolean;
  reason: 'bankrupt' | 'unpaid';
  capital: number;
  debt: number;
  onRestart: () => void;
}
export const DefeatDialog: React.FC<DefeatProps> = ({
  isOpen,
  reason,
  capital,
  debt,
  onRestart,
}) => {
  if (!isOpen) return null;

  return (
    <Overlay>
      <div className="bg-rose-800 text-white p-6 text-center border-b border-rose-950">
        <AlertOctagon size={48} className="mx-auto text-rose-300 animate-pulse mb-3" />
        <h2 className="font-display font-black text-2xl tracking-tight uppercase">
          {reason === 'bankrupt' ? 'BANKRUPT — DEFEAT' : 'TIME ELAPSED — DEFEAT'}
        </h2>
        <p className="font-mono text-xs text-rose-100 uppercase tracking-widest mt-1">Lender Liability Breach</p>
      </div>

      <div className="p-6 space-y-4 font-sans text-slate-700 text-center">
        {reason === 'bankrupt' ? (
          <p className="text-sm leading-relaxed max-w-sm mx-auto">
            Your shop cash assets have depleted to <strong className="text-slate-900 font-bold">$0</strong>, your storage shelves are bare, and you still owe the Lender <strong className="text-rose-700 font-bold">{formatCurrency(debt)}</strong>. With no stock to liquidate and no cash to acquire lots, you are declared insolvent.
          </p>
        ) : (
          <p className="text-sm leading-relaxed max-w-sm mx-auto">
            Day 10 has drawn to a close, and the Lender demands full settlement of your outstanding liabilities. You failed to clear your ledger, leaving <strong className="text-rose-700 font-bold">{formatCurrency(debt)}</strong> in unpaid compounding debt.
          </p>
        )}

        <div className="border border-slate-200 rounded-lg p-3 bg-rose-50 text-left font-mono text-xs max-w-xs mx-auto text-rose-800">
          <div className="flex justify-between border-b border-rose-200 pb-1 mb-1">
            <span>Cash Assets:</span>
            <span className="font-bold">{formatCurrency(capital)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <span>Remaining Unpaid Debt:</span>
            <span>{formatCurrency(debt)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic">
          "The Lender locks up your shop storefront without violence or seizure. Your licenses are revoked, and your ledger is closed permanently."
        </p>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center">
        <button
          onClick={onRestart}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow transition-colors"
          id="btn-defeat-restart"
        >
          <Coins size={14} />
          <span>Accept Loss & Try Again</span>
        </button>
      </div>
    </Overlay>
  );
};
