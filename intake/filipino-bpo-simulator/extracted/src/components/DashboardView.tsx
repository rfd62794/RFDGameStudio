import React from 'react';
import type { QuotaState, LeadList, DialerConfig } from '../types';

interface Props {
  quota: QuotaState;
  activeList: LeadList;
  dialerConfig: DialerConfig;
  callsQueue: number;
  totalAnsweredToday: number;
  productivity: number;
  happiness: number;
  money: number;
  day: number;
  gameTime: string;
  onPaceChange: (pace: number) => void;
  onGoToFloor: () => void;
}

function healthColor(value: number): string {
  if (value >= 70) return 'bg-emerald-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function Bar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = max === 0 ? 0 : (clamped / max) * 100;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-300 mb-1">
        <span>{label}</span>
        <span>{Math.round(clamped)} / {max}</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${healthColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export const DashboardView: React.FC<Props> = ({
  quota,
  activeList,
  dialerConfig,
  callsQueue,
  totalAnsweredToday,
  productivity,
  happiness,
  money,
  day,
  gameTime,
  onPaceChange,
  onGoToFloor,
}) => {
  const quotaPct = Math.min(100, Math.round((quota.progress / Math.max(1, quota.target)) * 100));

  return (
    <div className="w-full h-full p-5 overflow-y-auto bg-slate-900/95 text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-sky-400">Dashboard</h1>
        <button
          onClick={onGoToFloor}
          className="px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-xs font-semibold"
        >
          View Floor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quota */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-200 mb-2">LedgerRate Daily Quota</div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold text-emerald-400">{quota.progress}</span>
            <span className="text-xs text-slate-400">/ {quota.target} calls</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
          <div className="text-right text-xs text-slate-400 mt-1">{quotaPct}%</div>
        </div>

        {/* List health */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-200 mb-2">
            Active List: {activeList.id}
            <span className="ml-2 text-xs text-slate-400">({activeList.source})</span>
          </div>
          <Bar label="Purity" value={activeList.purity} max={100} />
          <Bar label="Freshness" value={activeList.freshness} max={100} />
          <div className="flex justify-between text-xs text-slate-300 mt-2">
            <span>Remaining Volume</span>
            <span>{activeList.volume}</span>
          </div>
          {activeList.freshness < 20 && (
            <div className="mt-2 text-xs text-rose-400 font-semibold">List is getting stale — consider a swap</div>
          )}
        </div>

        {/* Dialer pace */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-200 mb-2">
            Dialer Pace (Tier {dialerConfig.tier})
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={20}
              value={dialerConfig.pace}
              onChange={e => onPaceChange(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-lg font-mono font-bold text-sky-400 w-8 text-right">
              {dialerConfig.pace}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Calls pushed to the floor per tick. Exceeding safe pace degrades outcomes.
          </p>
        </div>

        {/* Floor readouts */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-200 mb-2">Floor Readouts</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-400">Day</div>
            <div className="text-right font-mono text-slate-200">{day}</div>
            <div className="text-slate-400">Time</div>
            <div className="text-right font-mono text-slate-200">{gameTime}</div>
            <div className="text-slate-400">Calls Queue</div>
            <div className="text-right font-mono text-slate-200">{callsQueue}</div>
            <div className="text-slate-400">Answered Today</div>
            <div className="text-right font-mono text-slate-200">{totalAnsweredToday}</div>
            <div className="text-slate-400">Productivity</div>
            <div className="text-right font-mono text-emerald-400">{productivity}%</div>
            <div className="text-slate-400">Happiness</div>
            <div className="text-right font-mono text-amber-400">{happiness}%</div>
            <div className="text-slate-400">Money</div>
            <div className="text-right font-mono text-amber-300">₱ {money.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
