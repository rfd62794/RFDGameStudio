import React, { useState } from 'react';
import { HRPolicy } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  money: number;
  totalAgents: number;
  currentPolicy: HRPolicy;
  onUpdatePolicy: (newPolicy: HRPolicy) => void;
}

export const WageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  money,
  totalAgents,
  currentPolicy,
  onUpdatePolicy,
}) => {
  const [policy, setPolicy] = useState<HRPolicy>({ ...currentPolicy });

  if (!isOpen) return null;

  // Calculate estimated monthly payroll
  const avgBase = 26000 * policy.basePayMultiplier;
  const nightDiffAmount = avgBase * (policy.nightDiffPercent / 100) * 0.35; // ~35% on graveyard
  const hmoCostPerAgent = policy.hmoPlan === 'PLATINUM' ? 3500 : (policy.hmoPlan === 'SILVER' ? 1800 : (policy.hmoPlan === 'BASIC' ? 900 : 0));
  const perksCost = (policy.freeCoffeeEnabled ? 400 : 0) + (policy.freeMealsEnabled ? 2200 : 0);

  const totalPerAgent = avgBase + nightDiffAmount + hmoCostPerAgent + perksCost;
  const totalMonthlyPayroll = totalPerAgent * Math.max(totalAgents, 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">₱</span>
            <div>
              <h2 className="font-bold text-lg text-amber-400 tracking-wide uppercase font-pixel text-xs">
                WAGE & COMPENSATION MANAGEMENT
              </h2>
              <p className="text-xs text-slate-400">Manage base salaries, night differential, 13th month pay & HMO</p>
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
          
          {/* Payroll Overview Card */}
          <div className="bg-slate-950 border border-amber-900/60 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Total Active Staff</span>
              <span className="text-lg font-bold text-slate-100">{totalAgents} Employees</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Est. Avg Pay per Agent</span>
              <span className="text-lg font-bold text-amber-300">₱ {Math.round(totalPerAgent).toLocaleString()} /mo</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Est. Monthly Total Payroll</span>
              <span className="text-lg font-bold text-amber-400">₱ {Math.round(totalMonthlyPayroll).toLocaleString()}</span>
            </div>
          </div>

          {/* 1. Base Pay Multiplier */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Base Salary Competitiveness
              </label>
              <span className="text-xs font-bold text-sky-400 font-mono">
                {Math.round(policy.basePayMultiplier * 100)}% of Market Average
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={policy.basePayMultiplier}
              onChange={(e) => setPolicy({ ...policy, basePayMultiplier: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>80% (Low retention, high attrition)</span>
              <span>100% (Industry Standard)</span>
              <span>150% (Attracts elite talent, low turnover)</span>
            </div>
          </div>

          {/* 2. Night Differential Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Graveyard Night Differential Premium (10 PM - 6 AM)
              </label>
              <span className="text-xs font-bold text-amber-400 font-mono">
                +{policy.nightDiffPercent}% Night Diff
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="25"
              step="1"
              value={policy.nightDiffPercent}
              onChange={(e) => setPolicy({ ...policy, nightDiffPercent: parseInt(e.target.value) })}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>10% (Legal minimum under DOLE)</span>
              <span>15% (Competitive BPO standard)</span>
              <span>25% (High satisfaction for night owls)</span>
            </div>
          </div>

          {/* 3. HMO Health Card Provider */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              3. HMO Health Card Tier (Maxicare / Intellicare)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'NONE', name: 'No HMO', cost: '₱0', desc: 'Saves money, but agents resign when sick' },
                { id: 'BASIC', name: 'Basic (MBL ₱80k)', cost: '₱900/mo', desc: 'Emergency inpatient coverage only' },
                { id: 'SILVER', name: 'Silver (MBL ₱150k)', cost: '₱1,800/mo', desc: 'Outpatient + dental + clinic consultation' },
                { id: 'PLATINUM', name: 'Platinum + Dependents', cost: '₱3,500/mo', desc: 'Covers parents/kids, massive loyalty' },
              ].map(plan => (
                <button
                  key={plan.id}
                  onClick={() => {
                    sounds.playClick();
                    setPolicy({ ...policy, hmoPlan: plan.id as any });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    policy.hmoPlan === plan.id
                      ? 'bg-amber-950/80 border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold text-xs text-amber-300 block">{plan.name}</span>
                  <span className="text-[10px] text-sky-400 font-semibold block mb-1">{plan.cost}</span>
                  <p className="text-[10px] text-slate-400 leading-tight">{plan.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Perks & Allowances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-200 block">Free Unlimited Coffee & Milo</span>
                <span className="text-[10px] text-slate-400">₱400/mo per agent · Boosts floor energy</span>
              </div>
              <input
                type="checkbox"
                checked={policy.freeCoffeeEnabled}
                onChange={(e) => setPolicy({ ...policy, freeCoffeeEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-200 block">Subsidized Meal / Rice Allowance</span>
                <span className="text-[10px] text-slate-400">₱2,200/mo per agent · Lowers tardiness</span>
              </div>
              <input
                type="checkbox"
                checked={policy.freeMealsEnabled}
                onChange={(e) => setPolicy({ ...policy, freeMealsEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* 13th Month Pay Accrual Information */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <div>
                <span className="font-bold text-slate-200">13th Month Pay Statutory Reserve</span>
                <p className="text-[11px] text-slate-400">Accrues 1/12th of annual payroll automatically. Distributed every December.</p>
              </div>
            </div>
            <span className="font-bold text-emerald-400 font-mono">
              Accrued: ₱ {policy.monthly13thAccrued.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              sounds.playCash();
              onUpdatePolicy(policy);
              onClose();
            }}
            className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
          >
            Save Wage Policy
          </button>
        </div>
      </div>
    </div>
  );
};
