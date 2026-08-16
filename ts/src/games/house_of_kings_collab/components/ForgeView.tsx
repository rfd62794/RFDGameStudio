import React, { useState, useEffect, useCallback } from 'react';
import { Hammer, Sparkles, Users, RefreshCw, CheckCircle2, AlertCircle, Lock, Apple, TreePine, Pickaxe } from 'lucide-react';
import { FORGE_MAX_LEVEL, forgeUpgradeCost, ResourcesMap, specializationDiscount, HouseSpecialization } from '../types';
import { upgradeForgeApi, getWorkersApi } from '../services/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ForgeViewProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  onRefreshParent?: () => void;
}

export const ForgeView: React.FC<ForgeViewProps> = ({
  kingdomId,
  houseId,
  userId,
  onRefreshParent,
}) => {
  const [forgeLevel, setForgeLevel] = useState<number>(0);
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
          setForgeLevel(Number(data.forge?.level) || 0);
          setSpecialization((data.specialization as HouseSpecialization) || 'none');
        }
      },
      (err) => console.warn('Forge listener error:', err)
    );
    return () => unsubscribe();
  }, [kingdomId, houseId]);

  // Fetch current player resources
  const fetchResources = useCallback(async () => {
    try {
      const data = await getWorkersApi(kingdomId, houseId);
      if (data.resources && typeof data.resources === 'object') {
        setResources({
          food: Number(data.resources.food) || 0,
          wood: Number(data.resources.wood) || 0,
          stone: Number(data.resources.stone) || 0,
        });
      } else if (typeof data.resources === 'number') {
        setResources({ food: data.resources, wood: 0, stone: 0 });
      }
    } catch (err) {
      console.warn('Error fetching player resources for Forge view:', err);
    }
  }, [kingdomId, houseId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const isMaxLevel = forgeLevel >= FORGE_MAX_LEVEL;
  const baseCost = forgeUpgradeCost(forgeLevel);
  const nextCost = specializationDiscount(specialization, baseCost);
  const currentSlotsBonus = forgeLevel * 2;
  const nextSlotsBonus = (forgeLevel + 1) * 2;

  const hasEnoughResources =
    resources.food >= nextCost.food &&
    resources.wood >= nextCost.wood &&
    resources.stone >= nextCost.stone;

  const handleUpgrade = async () => {
    if (isMaxLevel) return;
    setUpgrading(true);
    setMessage(null);
    try {
      const res = await upgradeForgeApi(kingdomId, houseId);
      setMessage({
        type: 'success',
        text: `House Forge upgraded to Level ${res.newLevel}! Worker pool capacity expanded by +2 slots.`,
      });
      await fetchResources();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.data?.error || err.message || 'Failed to upgrade Forge.',
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
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">House Forge</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                House Building
              </span>
            </div>
            <p className="text-xs text-slate-400">
              House-scoped smithy powered by Stone & Wood. Permanently expands House Worker Pool capacity (+2 slots/level).
            </p>
          </div>
        </div>

        {/* Current Active Pool Expansion Badge */}
        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Worker Pool Expansion</div>
          <div className="text-base font-bold text-amber-400 font-mono flex items-center justify-end gap-1">
            <Users className="w-4 h-4 text-amber-400" />
            +{currentSlotsBonus} Slots
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
          const isCurrent = forgeLevel === level;
          const isUnlocked = forgeLevel >= level;
          const slotBonus = level * 2;

          return (
            <div
              key={level}
              className={`p-4 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                  : isUnlocked
                  ? 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                  : 'bg-slate-950/40 border-slate-800/50 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase">Forge Level {level}</span>
                {isUnlocked ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    {isCurrent ? 'Active Level' : 'Unlocked'}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-amber-300 mt-2 font-mono">
                +{slotBonus} Worker Slots
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {level === 1 && 'Basic anvil & hearth. Expands total worker deployment capacity by +2 slots.'}
                {level === 2 && 'Reinforced furnace. Expands worker deployment capacity by +4 total slots.'}
                {level === 3 && 'Master Armory & Smithy. Maximum +6 total slots expansion for all House workers.'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Upgrade Action Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isMaxLevel ? 'House Forge At Maximum Level' : `Upgrade Forge to Level ${forgeLevel + 1}`}
          </span>
          <div className="flex items-center gap-2">
            {specialization === 'builders' && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30 font-semibold">
                Builders: 15% Discount Applied
              </span>
            )}
            <span className="text-xs font-mono text-slate-400">
              {isMaxLevel ? 'Cap: Level 3' : `Pool Expansion: +${nextSlotsBonus} Slots`}
            </span>
          </div>
        </div>

        {!isMaxLevel && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Apple className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 font-medium">Food:</span>
              </div>
              <span className={`text-xs font-mono font-bold ${resources.food >= nextCost.food ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resources.food} / {nextCost.food}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <TreePine className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">Wood:</span>
              </div>
              <span className={`text-xs font-mono font-bold ${resources.wood >= nextCost.wood ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resources.wood} / {nextCost.wood}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Pickaxe className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-medium">Stone:</span>
              </div>
              <span className={`text-xs font-mono font-bold ${resources.stone >= nextCost.stone ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resources.stone} / {nextCost.stone}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={upgrading || isMaxLevel || !hasEnoughResources}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isMaxLevel
              ? 'bg-slate-800 text-amber-300/60 border border-slate-700/50 cursor-not-allowed'
              : !hasEnoughResources
              ? 'bg-slate-800/80 text-rose-400 border border-rose-500/30 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 active:scale-[0.99]'
          }`}
        >
          {upgrading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isMaxLevel ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Forge Fully Upgraded (Level 3 Cap Reached)</span>
            </>
          ) : !hasEnoughResources ? (
            <>
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Insufficient Resources (Gather Food, Wood & Stone with Workers)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Upgrade Forge to Level {forgeLevel + 1} (Pay {nextCost.food} Food, {nextCost.wood} Wood, {nextCost.stone} Stone)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
