import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Sparkles, TrendingUp, RefreshCw, CheckCircle2, AlertCircle, Lock, Apple, TreePine } from 'lucide-react';
import { CHAPEL_MAX_LEVEL, chapelUpgradeCost, chapelReputationMultiplier, ResourcesMap, specializationDiscount, HouseSpecialization } from '../types';
import { upgradeChapelApi, getHouseApi, getWorkersApi } from '../services/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ChapelViewProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  onRefreshParent?: () => void;
}

export const ChapelView: React.FC<ChapelViewProps> = ({
  kingdomId,
  houseId,
  userId,
  onRefreshParent,
}) => {
  const [chapelLevel, setChapelLevel] = useState<number>(0);
  const [specialization, setSpecialization] = useState<HouseSpecialization>('none');
  const [resources, setResources] = useState<ResourcesMap>({ food: 0, wood: 0, stone: 0 });
  const [upgrading, setUpgrading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe to real-time House document changes
  useEffect(() => {
    const houseRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId);
    const unsubscribe = onSnapshot(
      houseRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setChapelLevel(Number(data.chapel?.level) || 0);
          setSpecialization((data.specialization as HouseSpecialization) || 'none');
        }
      },
      (err) => console.warn('Chapel listener error:', err)
    );
    return () => unsubscribe();
  }, [kingdomId, houseId]);

  // Fetch current player resources
  const fetchResources = useCallback(async () => {
    try {
      const data = await getWorkersApi(kingdomId, houseId);
      if (data.resources && typeof data.resources === 'object') {
        setResources(data.resources);
      } else if (typeof data.resources === 'number') {
        setResources({ food: data.resources, wood: 0, stone: 0 });
      }
    } catch (err) {
      console.warn('Error fetching player resources for Chapel view:', err);
    }
  }, [kingdomId, houseId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const isMaxLevel = chapelLevel >= CHAPEL_MAX_LEVEL;
  const baseCost = chapelUpgradeCost(chapelLevel);
  const nextCost = specializationDiscount(specialization, baseCost);
  const currentMultiplier = chapelReputationMultiplier(chapelLevel);
  const nextMultiplier = chapelReputationMultiplier(chapelLevel + 1);

  const hasEnoughResources = resources.food >= nextCost.food && resources.wood >= nextCost.wood;

  const handleUpgrade = async () => {
    if (isMaxLevel) return;
    setUpgrading(true);
    setMessage(null);
    try {
      const res = await upgradeChapelApi(kingdomId, houseId);
      setMessage({
        type: 'success',
        text: `House Chapel upgraded to Level ${res.newLevel}! Reputation Score multiplier is now +${Math.round((res.chapelMultiplier - 1) * 100)}%.`,
      });
      await fetchResources();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.data?.error || err.message || 'Failed to upgrade Chapel.',
      });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">House Chapel</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
                House Building
              </span>
            </div>
            <p className="text-xs text-slate-400">
              House-scoped sanctuary funded by member resources. Boosts Reputation Score earned in Fertility Festivals.
            </p>
          </div>
        </div>

        {/* Current Active Boost Badge */}
        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Festival Rep Boost</div>
          <div className="text-base font-bold text-rose-400 font-mono flex items-center justify-end gap-1">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            +{Math.round((currentMultiplier - 1) * 100)}%
          </div>
        </div>
      </div>

      {/* Message Box */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Building Level Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((level) => {
          const isCurrent = chapelLevel === level;
          const isUnlocked = chapelLevel >= level;
          const boostPct = Math.round((chapelReputationMultiplier(level) - 1) * 100);

          return (
            <div
              key={level}
              className={`p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30'
                  : isUnlocked
                  ? 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                  : 'bg-slate-950/40 border-slate-800/50 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase">Chapel Level {level}</span>
                {isUnlocked ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                    {isCurrent ? 'Active Level' : 'Unlocked'}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-rose-300 mt-2 font-mono">
                +{boostPct}% Rep Boost
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {level === 1 && 'Sacred shrine. Increases daily festival reputation yield by +10%.'}
                {level === 2 && 'Venerated altar. Increases daily festival reputation yield by +20%.'}
                {level === 3 && 'Grand Sanctuary. Maximum +30% boost to House Reputation yield.'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Upgrade Action Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            {isMaxLevel ? 'House Chapel At Maximum Level' : `Upgrade Chapel to Level ${chapelLevel + 1}`}
          </span>
          <div className="flex items-center gap-2">
            {specialization === 'builders' && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30 font-semibold">
                Builders: 15% Discount Applied
              </span>
            )}
            <span className="text-xs font-mono text-slate-400">
              {isMaxLevel ? 'Cap: Level 3' : `Boost: +${Math.round((nextMultiplier - 1) * 100)}% Rep`}
            </span>
          </div>
        </div>

        {!isMaxLevel && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Apple className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-medium">Food Required:</span>
              </div>
              <span className={`text-xs font-mono font-bold ${resources.food >= nextCost.food ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resources.food} / {nextCost.food}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <TreePine className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">Wood Required:</span>
              </div>
              <span className={`text-xs font-mono font-bold ${resources.wood >= nextCost.wood ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resources.wood} / {nextCost.wood}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={upgrading || isMaxLevel || !hasEnoughResources}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
            isMaxLevel
              ? 'bg-slate-800 text-rose-300/60 border border-slate-700/50 cursor-not-allowed'
              : !hasEnoughResources
              ? 'bg-slate-800/80 text-rose-400 border border-rose-500/30 cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 active:scale-[0.99]'
          }`}
        >
          {upgrading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isMaxLevel ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-rose-400" />
              <span>Chapel Fully Consecrated (Level 3 Cap Reached)</span>
            </>
          ) : !hasEnoughResources ? (
            <>
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Insufficient Resources (Gather Food & Wood with Workers)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Upgrade Chapel to Level {chapelLevel + 1} (Pay {nextCost.food} Food, {nextCost.wood} Wood)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
