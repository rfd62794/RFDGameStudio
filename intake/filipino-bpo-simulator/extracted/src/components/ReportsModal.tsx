import React from 'react';
import { GameStats, ClientCampaign } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  campaigns: ClientCampaign[];
  totalStaff: number;
}

export const ReportsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  stats,
  campaigns,
  totalStaff,
}) => {
  if (!isOpen) return null;

  // Estimated daily financial projection
  const avgPayout = 190;
  const callsToday = stats.totalAnsweredToday || 384;
  const dailyRevenue = callsToday * avgPayout;
  const dailyPayroll = Math.round((totalStaff * 26000 * 1.15) / 30);
  const dailyFacility = 4500;
  const dailyInternet = 1500;
  const dailyProfit = dailyRevenue - (dailyPayroll + dailyFacility + dailyInternet);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="font-bold text-lg text-emerald-400 tracking-wide uppercase font-pixel text-xs">
                OPERATIONAL KPI & EXECUTIVE REPORTS
              </h2>
              <p className="text-xs text-slate-400">Day {stats.day} performance metrics, SLA adherence, and financial P&L</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white px-2 py-1 text-xl font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                SLA Compliance (80/20)
              </span>
              <span className={`text-2xl font-bold font-mono ${stats.slaPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stats.slaPercent}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Industry Target: 80.0%</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Average CSAT Score
              </span>
              <span className="text-2xl font-bold font-mono text-sky-400">
                88.4% ⭐
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Client Minimum: 85%</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Average Handle Time (AHT)
              </span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                236 sec
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Target: &lt;240s</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                First Call Resolution (FCR)
              </span>
              <span className="text-2xl font-bold font-mono text-purple-400">
                79.2%
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Low repeat call rate</span>
            </div>
          </div>

          {/* Active Campaigns Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Active Client Campaigns & Call Volume
            </h3>
            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-100">{camp.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-sky-300 font-mono">
                        {camp.clientCountry}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Service: {camp.serviceType} · Target AHT: {camp.targetAHT}s · Target CSAT: {camp.targetCSAT}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Calls Handled</span>
                      <span className="font-bold text-slate-100">{camp.totalCallsHandled.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Rate / Call</span>
                      <span className="font-bold text-amber-300">₱ {camp.payoutPerCall}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial P&L Statement */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Daily Profit & Loss (P&L) Statement
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Gross Call Revenue ({callsToday} calls resolved)</span>
                <span className="font-bold text-emerald-400 font-mono">+ ₱ {dailyRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Staff Payroll & Night Differential ({totalStaff} agents)</span>
                <span className="text-rose-400 font-mono">- ₱ {dailyPayroll.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Facility Rent, Power & Air Conditioning</span>
                <span className="text-rose-400 font-mono">- ₱ {dailyFacility.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Telecom Leased Lines & Bandwidth</span>
                <span className="text-rose-400 font-mono">- ₱ {dailyInternet.toLocaleString()}</span>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold">
                <span className="text-slate-200">Estimated Net Daily Profit</span>
                <span className={`font-mono ${dailyProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {dailyProfit >= 0 ? `+ ₱ ${dailyProfit.toLocaleString()}` : `- ₱ ${Math.abs(dailyProfit).toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase transition-all"
          >
            Done Viewing
          </button>
        </div>
      </div>
    </div>
  );
};
