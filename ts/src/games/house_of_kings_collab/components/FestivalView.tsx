import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { House, REPUTATION_THRESHOLDS, reputationLevelForScore, ResourcesMap } from '../types';
import { contributeFestivalApi } from '../services/api';
import { Sparkles, Flame, Award, HeartHandshake, Wheat, Trees, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface FestivalViewProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  onRefresh?: () => void;
}

export const FestivalView: React.FC<FestivalViewProps> = ({
  kingdomId,
  houseId,
  userId,
  onRefresh,
}) => {
  const [resources, setResources] = useState<ResourcesMap>({ food: 0, wood: 0, stone: 0 });
  const [houseData, setHouseData] = useState<House>({
    id: houseId,
    name: 'House of Kings',
    createdAt: Date.now(),
    reputationScore: 0,
    reputationLevel: 0,
    festivalContributionToday: 0,
  });

  const [foodInput, setFoodInput] = useState<number>(0);
  const [woodInput, setWoodInput] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscribe to real-time updates for Player doc (for resources)
  useEffect(() => {
    const playerRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', userId);
    const unsubscribePlayer = onSnapshot(
      playerRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          let food = 0;
          let wood = 0;
          let stone = 0;
          if (data.resources && typeof data.resources === 'object') {
            food = Number(data.resources.food) || 0;
            wood = Number(data.resources.wood) || 0;
            stone = Number(data.resources.stone) || 0;
          } else if (typeof data.resources === 'number') {
            food = Number(data.resources) || 0;
          }
          if (typeof data['resources.food'] === 'number') food = Number(data['resources.food']) || 0;
          if (typeof data['resources.wood'] === 'number') wood = Number(data['resources.wood']) || 0;
          if (typeof data['resources.stone'] === 'number') stone = Number(data['resources.stone']) || 0;
          setResources({ food, wood, stone });
        }
      },
      (err) => {
        console.warn('Player doc snapshot error in FestivalView:', err);
      }
    );

    return () => unsubscribePlayer();
  }, [kingdomId, houseId, userId]);

  // Subscribe to real-time updates for /kingdoms/{kingdomId}/houses/{houseId}
  useEffect(() => {
    const houseRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId);
    const unsubscribe = onSnapshot(
      houseRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const score = Number(data.reputationScore) || 0;
          setHouseData({
            id: houseId,
            name: data.name || 'House of Kings',
            createdAt: data.createdAt || Date.now(),
            reputationScore: score,
            reputationLevel: Number(data.reputationLevel) ?? reputationLevelForScore(score),
            specialization: data.specialization || 'none',
            festivalContributionToday: Number(data.festivalContributionToday) || 0,
            festivalLastResolvedAt: data.festivalLastResolvedAt || null,
            lastResolution: data.lastResolution || null,
          });
        }
      },
      (err) => {
        console.warn('House snapshot listener error:', err);
      }
    );

    return () => unsubscribe();
  }, [kingdomId, houseId]);

  const score = houseData.reputationScore || 0;
  const level = houseData.reputationLevel || 0;
  const currentThreshold = REPUTATION_THRESHOLDS[level] || 0;
  const nextThreshold = REPUTATION_THRESHOLDS[level + 1] ?? null;

  let progressPercent = 100;
  if (nextThreshold !== null) {
    const totalNeeded = nextThreshold - currentThreshold;
    const currentProgress = score - currentThreshold;
    progressPercent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (foodInput <= 0 && woodInput <= 0) {
      setMessage({ type: 'error', text: 'Enter a positive amount of Food or Wood to contribute.' });
      return;
    }

    if (foodInput > resources.food || woodInput > resources.wood) {
      setMessage({ type: 'error', text: 'Insufficient resources available in your inventory.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await contributeFestivalApi(foodInput, woodInput, kingdomId, houseId);
      setMessage({ type: 'success', text: res.message || 'Contribution received for the Fertility Festival!' });
      if (typeof res.remainingFood === 'number' && typeof res.remainingWood === 'number') {
        setResources((prev) => ({
          food: res.remainingFood,
          wood: res.remainingWood,
          stone: typeof res.remainingStone === 'number' ? res.remainingStone : (prev.stone || 0),
        }));
      } else {
        setResources((prev) => ({
          food: Math.max(0, prev.food - foodInput),
          wood: Math.max(0, prev.wood - woodInput),
          stone: prev.stone || 0,
        }));
      }
      setFoodInput(0);
      setWoodInput(0);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to contribute to festival.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 shadow-inner">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                House Event
              </span>
              <span className="text-xs text-slate-400 font-mono">Daily Resolution</span>
            </div>
            <h2 className="text-2xl font-extrabold text-rose-100 mt-1 flex items-center gap-2">
              The Fertility Festival
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Offer Food & Wood to elevate {houseData.name}'s permanent Reputation Score.
            </p>
          </div>
        </div>

        {/* House Reputation Score Badge */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {houseData.name} Reputation
            </div>
            <div className="text-xl font-black text-amber-300 flex items-center gap-2">
              Level {level}
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({score} Score)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Reputation Tier Progress
          </span>
          <span className="font-mono font-bold text-rose-300">
            {nextThreshold !== null ? `${score} / ${nextThreshold} Score` : `${score} (MAX TIER)`}
          </span>
        </div>

        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="bg-gradient-to-r from-rose-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-rose-500/30"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 text-right">
          {nextThreshold !== null
            ? `${nextThreshold - score} score needed for Level ${level + 1}`
            : 'Highest reputation tier reached!'}
        </p>
      </div>

      {/* Active Festival Offering Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Offering Stats */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
                <HeartHandshake className="w-4 h-4" />
                <span>Today's Accumulated Offerings</span>
              </div>
              {houseData.specialization === 'diplomats' && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30 font-semibold">
                  Diplomats: +15% Boost Active
                </span>
              )}
            </div>
            <div className="mt-3 text-3xl font-black text-rose-100 font-mono">
              +{houseData.festivalContributionToday || 0}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Every unit of Food and Wood offered is converted into pending House Score{houseData.specialization === 'diplomats' ? ' (+15% Diplomats Guild bonus)' : ''}. Upon daily resolution, this score is added permanently to {houseData.name}'s Reputation.
            </p>
          </div>

          {houseData.lastResolution && (
            <div className="mt-4 pt-4 border-t border-slate-900 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Last Daily Resolution</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Added +{houseData.lastResolution.addedScore} Score &rarr; Total: {houseData.lastResolution.newScore} (Level {houseData.lastResolution.newLevel})
              </p>
            </div>
          )}
        </div>

        {/* Right: Contribution Form */}
        <form onSubmit={handleContribute} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            Offer Resources to Festival
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Food Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Wheat className="w-3.5 h-3.5 text-amber-400" />
                Food (Available: {resources.food})
              </label>
              <input
                type="number"
                min="0"
                max={resources.food}
                value={foodInput}
                onChange={(e) => setFoodInput(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Wood Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                Wood (Available: {resources.wood})
              </label>
              <input
                type="number"
                min="0"
                max={resources.wood}
                value={woodInput}
                onChange={(e) => setWoodInput(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || (foodInput <= 0 && woodInput <= 0)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50"
          >
            {submitting ? (
              <span>Submitting Offering...</span>
            ) : (
              <>
                <span>Offer Resources ({foodInput + woodInput} Value)</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>

          {message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
