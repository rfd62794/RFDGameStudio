import React from 'react';
import type { QuotaState, DialerConfig, LeadList, DayVerdict } from '../types';

interface Props {
  money: number;
  day: number;
  quota: QuotaState;
  dialerConfig: DialerConfig;
  activeList: LeadList;
  upgradeCost: number;
  lastVerdict: DayVerdict | null;
  onUpgradeDialer: () => void;
  onRequestNewList: () => void;
  onStartNextDay: () => void;
}

function verdictText(verdict: DayVerdict | null): string {
  switch (verdict) {
    case 'met':
      return 'Quota met — full payout awarded.';
    case 'partial':
      return 'Quota partially met — prorated payout.';
    case 'missed':
      return 'Quota missed — no payout for today.';
    default:
      return 'Day end — review results below.';
  }
}

function verdictColor(verdict: DayVerdict | null): string {
  switch (verdict) {
    case 'met':
      return 'text-emerald-400';
    case 'partial':
      return 'text-amber-400';
    case 'missed':
      return 'text-rose-400';
    default:
      return 'text-slate-400';
  }
}

export const AfterHoursView: React.FC<Props> = ({
  money,
  day,
  quota,
  dialerConfig,
  activeList,
  upgradeCost,
  lastVerdict,
  onUpgradeDialer,
  onRequestNewList,
  onStartNextDay,
}) => {
  const canAffordUpgrade = money >= upgradeCost;

  return (
    <div className="w-full h-full p-5 overflow-y-auto bg-slate-900 text-slate-100">
      <h1 className="text-xl font-bold text-amber-400 mb-4">After-Hours</h1>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
        <div className="text-sm font-semibold text-slate-200 mb-2">
          Day {day} Result
        </div>
        <div className={`text-lg font-bold ${verdictColor(lastVerdict)}`}>
          {verdictText(lastVerdict)}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Completed {quota.progress} / {quota.target} calls at ₱{quota.payoutPerCall} per call
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-200 mb-2">
            Dialer Upgrade
          </div>
          <div className="text-xs text-slate-400 mb-2">
            Current tier: {dialerConfig.tier}
          </div>
          <button
            onClick={onUpgradeDialer}
            disabled={!canAffordUpgrade}
            className={`w-full py-2 rounded text-sm font-semibold ${
              canAffordUpgrade
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Upgrade for ₱{upgradeCost.toLocaleString()}
          </button>
          {!canAffordUpgrade && (
            <div className="text-xs text-rose-400 mt-2">
              Insufficient funds (₱{money.toLocaleString()} available)
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-200 mb-2">
            Request New List
          </div>
          <div className="text-xs text-slate-400 mb-2">
            Active list: {activeList.id} — {activeList.volume} remaining
          </div>
          <button
            onClick={onRequestNewList}
            className="w-full py-2 rounded text-sm font-semibold bg-sky-700 hover:bg-sky-600 text-white"
          >
            Request New ACBS List
          </button>
        </div>
      </div>

      <button
        onClick={onStartNextDay}
        className="w-full py-3 rounded text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white"
      >
        Start Day {day}
      </button>
    </div>
  );
};
