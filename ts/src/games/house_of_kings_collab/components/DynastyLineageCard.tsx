import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DescendantRecord, LegacyItem, TaskDoc } from '../types';
import { retireDescendantApi } from '../services/api';
import {
  Crown,
  Scroll,
  Sparkles,
  Award,
  ChevronRight,
  UserCheck,
  History,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Zap,
  Gem,
} from 'lucide-react';

interface DynastyLineageCardProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  task: TaskDoc | null;
  actionsRemainingToday?: number;
  onRefreshParent?: () => void;
}

export const DynastyLineageCard: React.FC<DynastyLineageCardProps> = ({
  kingdomId,
  houseId,
  userId,
  task,
  actionsRemainingToday = 20,
  onRefreshParent,
}) => {
  const [generation, setGeneration] = useState<number>(1);
  const [descendantName, setDescendantName] = useState<string>('Crown Prince Alistair');
  const [descendantTitle, setDescendantTitle] = useState<string>('Heir Apparent of the Realm');
  const [dynastyLineage, setDynastyLineage] = useState<DescendantRecord[]>([]);
  const [legacyItems, setLegacyItems] = useState<LegacyItem[]>([]);
  const [inauguralBonus, setInauguralBonus] = useState<boolean>(false);
  const [_loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    const playerRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', userId);
    const unsubscribe = onSnapshot(
      playerRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGeneration(Number(data.generation) || 1);
          setDescendantName(data.descendantName || data.displayName || 'Crown Prince Alistair');
          setDescendantTitle(data.descendantTitle || 'Heir Apparent of the Realm');
          setDynastyLineage(Array.isArray(data.dynastyLineage) ? data.dynastyLineage : []);
          setLegacyItems(Array.isArray(data.legacyItems) ? data.legacyItems : []);
          setInauguralBonus(Boolean(data.inauguralExpeditionBonus));
        }
        setLoading(false);
      },
      (err) => {
        console.warn('DynastyLineageCard snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [kingdomId, houseId, userId]);

  const handleRetire = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await retireDescendantApi(kingdomId, houseId);
      setMessage({
        type: 'success',
        text: `Succession complete! Generation ${res.newHeir?.generation} crowned under ${res.newHeir?.name}. Inaugural expedition bonus (+20% Gold) activated.`,
      });
      setShowConfirm(false);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to initiate royal succession',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isTaskActive = task?.status === 'in_progress';
  const hasNoActions = actionsRemainingToday <= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                Phase 16 Royal Dynasty
              </span>
              <span className="text-xs text-slate-400 font-mono">Generational Lineage</span>
            </div>
            <h3 className="text-xl font-bold text-amber-100 mt-1">
              Dynasty Lineage & Royal Succession
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage generational succession. Retiring the sovereign archives their reign into the royal archives, bequeaths ancestral relics, and bestows an inaugural expedition bonus upon the newly anointed heir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 self-start sm:self-center">
          <Scroll className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Reign</div>
            <div className="text-sm font-bold text-amber-300 font-mono">
              Generation {generation}
            </div>
          </div>
        </div>
      </div>

      {/* Active Sovereign Hero Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-xl p-5 sm:p-6 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/40">
                GEN {generation}
              </span>
              {inauguralBonus && (
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  +20% Inaugural Expedition Bonus Active
                </span>
              )}
            </div>
            <h4 className="text-2xl font-bold text-amber-100 tracking-tight">{descendantName}</h4>
            <p className="text-xs text-amber-300/80 font-medium">{descendantTitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Ancestral Relics</div>
              <div className="text-base font-bold text-amber-300 font-mono flex items-center justify-center gap-1 mt-0.5">
                <Gem className="w-4 h-4 text-amber-400" />
                {legacyItems.length}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Past Ancestors</div>
              <div className="text-base font-bold text-amber-200 font-mono flex items-center justify-center gap-1 mt-0.5">
                <History className="w-4 h-4 text-slate-400" />
                {dynastyLineage.length}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Succession Cost</div>
              <div className="text-base font-bold text-amber-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                <Zap className="w-4 h-4 text-amber-400" />
                1 Action
              </div>
            </div>
          </div>
        </div>

        {/* Succession Action Section */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {isTaskActive ? (
              <span className="text-rose-400 flex items-center gap-1.5 font-medium">
                <Hourglass className="w-4 h-4 shrink-0" />
                Active expedition underway. Await completion before initiating succession.
              </span>
            ) : hasNoActions ? (
              <span className="text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No daily actions remaining. Succession requires 1 action.
              </span>
            ) : (
              <span>Ready for generational succession. All heirlooms and legacy bonuses carry forward.</span>
            )}
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isTaskActive || hasNoActions || submitting}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isTaskActive || hasNoActions || submitting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Initiate Royal Succession
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRetire}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 cursor-pointer shadow-md"
              >
                {submitting ? 'Anointing Heir...' : 'Confirm Coronation (1 Action)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Dynasty Archives & Family Tree */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Dynasty Family Tree & Sovereign Archives
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {dynastyLineage.length} Ancestral Records
          </span>
        </div>

        {dynastyLineage.length === 0 ? (
          <div className="bg-slate-950/70 border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-2">
            <Crown className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">Founding Monarch Reign</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              <strong className="text-amber-300">{descendantName}</strong> is the founding monarch of this lineage (Generation I). Initiate Royal Succession when ready to pass the crown and create the dynasty family tree.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dynastyLineage
              .slice()
              .reverse()
              .map((ancestor, idx) => (
                <div
                  key={`${ancestor.generation}_${idx}`}
                  className="bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/30 rounded-xl p-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-1 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg border border-slate-800 shrink-0">
                        GEN {ancestor.generation}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-amber-200">{ancestor.name}</div>
                        <div className="text-[11px] text-slate-400">{ancestor.title}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-right">
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-center">
                        <div className="text-[10px] text-slate-400 uppercase">Expeditions</div>
                        <div className="text-xs font-bold text-amber-300 font-mono">
                          {ancestor.totalExpeditionsCompleted}
                        </div>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-center">
                        <div className="text-[10px] text-slate-400 uppercase">Relics</div>
                        <div className="text-xs font-bold text-amber-400 font-mono">
                          {ancestor.relicsBequeathed}
                        </div>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-center">
                        <div className="text-[10px] text-slate-400 uppercase">Retired</div>
                        <div className="text-[10px] font-medium text-slate-300 font-mono truncate">
                          {ancestor.retiredAt ? new Date(ancestor.retiredAt).toLocaleDateString() : 'Recorded'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
