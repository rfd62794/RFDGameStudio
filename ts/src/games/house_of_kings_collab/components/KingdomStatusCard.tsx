import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KingdomDoc, RESERVED_DAILY_BUDGET } from '../types';
import { isAggregateWarningActive, computePlayerActionsAllowance } from '../lib/actionsAllocation';
import { Shield, Award, TrendingUp, CheckCircle2, AlertTriangle, RotateCcw, Users, Zap } from 'lucide-react';

interface KingdomStatusCardProps {
  kingdomId: string;
}

export const KingdomStatusCard: React.FC<KingdomStatusCardProps> = ({ kingdomId }) => {
  const [kingdomDoc, setKingdomDoc] = useState<KingdomDoc>({
    level: 1,
    cumulativeContribution: 0,
    lastEvaluation: null,
    totalPlayerCount: 1,
    dailyActionsConsumed: 0,
  });
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const kingdomRef = doc(db, 'kingdoms', kingdomId);
    const unsubscribe = onSnapshot(
      kingdomRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setKingdomDoc({
            level: Number(data.level) || 1,
            cumulativeContribution: Number(data.cumulativeContribution) || 0,
            lastEvaluatedAt: data.lastEvaluatedAt || null,
            lastEvaluation: data.lastEvaluation || null,
            totalPlayerCount: Math.max(1, Number(data.totalPlayerCount) || 1),
            dailyActionsConsumed: Math.max(0, Number(data.dailyActionsConsumed) || 0),
          });
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Kingdom status listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [kingdomId]);

  const THRESHOLD = 500;
  const progressPercent = Math.min(100, Math.max(0, (kingdomDoc.cumulativeContribution / THRESHOLD) * 100));

  const totalPlayers = kingdomDoc.totalPlayerCount || 1;
  const consumed = kingdomDoc.dailyActionsConsumed || 0;
  const currentPerPlayerAllowance = computePlayerActionsAllowance(totalPlayers);
  const aggregateWarning = isAggregateWarningActive(consumed);
  const aggregateUsagePercent = Math.min(100, Math.round((consumed / RESERVED_DAILY_BUDGET) * 100));

  return (
    <div className="space-y-3">
      {/* Kingdom-Wide Aggregate Quota Warning Banner */}
      {aggregateWarning && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3 text-rose-200 animate-pulse shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-rose-300 uppercase tracking-wider">
              🚨 Kingdom-Wide Action Quota Alert
            </div>
            <div>
              High realm action volume! <strong>{consumed.toLocaleString()} / {RESERVED_DAILY_BUDGET.toLocaleString()}</strong> reserved daily actions consumed ({aggregateUsagePercent}% of 10,000 budget used).
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Kingdom Level Badge */}
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shadow-inner flex-shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  Realm Dominance
                </span>
                <span className="text-xs text-slate-400 font-mono">24h Recovery Clock</span>
              </div>
              <h2 className="text-2xl font-extrabold text-amber-100 mt-1 flex items-center gap-2">
                Kingdom Level {kingdomDoc.level}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cumulative contribution cleared across all lords determines realm level after each 24h cycle.
              </p>
            </div>
          </div>

          {/* Daily Threshold Progress Bar */}
          <div className="w-full md:w-80 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                24h Contribution Goal
              </span>
              <span className="font-mono font-bold text-amber-300">
                {kingdomDoc.cumulativeContribution} / {THRESHOLD}
              </span>
            </div>

            {/* Progress bar line */}
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-amber-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 text-right">
              {progressPercent >= 100
                ? '✨ Daily threshold cleared! Level will advance at next evaluation.'
                : `${Math.ceil(THRESHOLD - kingdomDoc.cumulativeContribution)} contribution needed to maintain/level up.`}
            </p>
          </div>
        </div>

        {/* Phase 10 Kingdom-Wide Actions Budget Stats Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Lords Count</div>
              <div className="font-mono font-bold text-slate-200">{totalPlayers} Lord{totalPlayers > 1 ? 's' : ''}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Per-Player Allowance</div>
              <div className="font-mono font-bold text-amber-300">{currentPerPlayerAllowance} Actions / Day</div>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Kingdom Daily Actions Used</div>
              <div className="font-mono font-bold text-amber-200">
                {consumed.toLocaleString()} / {RESERVED_DAILY_BUDGET.toLocaleString()} ({aggregateUsagePercent}%)
              </div>
            </div>
          </div>
        </div>

        {/* Last Evaluation Result Box */}
        {kingdomDoc.lastEvaluation && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              {kingdomDoc.lastEvaluation.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <RotateCcw className="w-4 h-4 text-amber-400" />
              )}
              <span>
                Last Evaluation Result:{' '}
                <strong className={kingdomDoc.lastEvaluation.success ? 'text-emerald-300' : 'text-amber-300'}>
                  {kingdomDoc.lastEvaluation.success
                    ? `Success (+1 Level) -> Advanced to Level ${kingdomDoc.lastEvaluation.newLevel}`
                    : `Threshold missed -> Setback to Level ${kingdomDoc.lastEvaluation.newLevel} (Floored at 1)`}
                </strong>
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
              Achieved: {kingdomDoc.lastEvaluation.contributionAchieved}/{kingdomDoc.lastEvaluation.thresholdRequired}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
