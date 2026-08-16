import React, { useState, useEffect } from 'react';
import { TaskDoc, TaskTier } from '../types';
import { assignTaskApi, collectTaskApi, resetTaskApi } from '../services/api';
import { EconomyPanel } from './EconomyPanel';
import { KingdomStatusCard } from './KingdomStatusCard';
import { WorkerView } from './WorkerView';
import { CathedralView } from './CathedralView';
import { ChapelView } from './ChapelView';
import { ForgeView } from './ForgeView';
import { FestivalView } from './FestivalView';
import { SpecializationCard } from './SpecializationCard';
import { LegacyItemsCard } from './LegacyItemsCard';
import { DynastyLineageCard } from './DynastyLineageCard';
import { EventBanner } from './EventBanner';
import {
  Shield,
  Clock,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Coins,
  RefreshCw,
  Play,
  Award,
  Zap,
  TrendingUp,
  Flame,
  RotateCcw,
} from 'lucide-react';

import { isPersonalWarningActive } from '../lib/actionsAllocation';

interface TaskViewProps {
  kingdomId: string;
  houseId: string;
  houseName: string;
  userId: string;
  task: TaskDoc | null;
  gold: number;
  rewardMultiplierLevel: number;
  actionsRemainingToday?: number;
  actionsAllowanceToday?: number;
  onRefreshTask: () => void;
  clockOffsetSec: number;
  setClockOffsetSec: React.Dispatch<React.SetStateAction<number>>;
  recordServerCall: () => void;
}

const DURATION_TIERS: Array<{
  id: TaskTier;
  title: string;
  seconds: number;
  kc: number;
  baseGold: number;
  desc: string;
}> = [
  {
    id: 'quick',
    title: 'Quick Venture',
    seconds: 90,
    kc: 5,
    baseGold: 10,
    desc: 'Light patrol around border posts. Fast commitment.',
  },
  {
    id: 'standard',
    title: 'Standard Expedition',
    seconds: 240,
    kc: 15,
    baseGold: 30,
    desc: 'Thorough survey of realm provinces. Balanced yield.',
  },
  {
    id: 'extended',
    title: 'Extended Campaign',
    seconds: 480,
    kc: 35,
    baseGold: 75,
    desc: 'Deep wilderness expedition into ancient ruins. High yield.',
  },
];

export const TaskView: React.FC<TaskViewProps> = ({
  kingdomId,
  houseId,
  houseName,
  userId,
  task,
  gold,
  rewardMultiplierLevel,
  actionsRemainingToday = 20,
  actionsAllowanceToday = 20,
  onRefreshTask,
  clockOffsetSec,
  setClockOffsetSec,
  recordServerCall,
}) => {
  const [selectedTier, setSelectedTier] = useState<TaskTier>('quick');
  const [selectedSpecialTask, setSelectedSpecialTask] = useState<'establish_wood' | 'establish_stone' | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Client-computed remaining time in seconds
  const [clientRemainingSec, setClientRemainingSec] = useState<number>(0);

  // Compute cosmetic countdown locally every second
  useEffect(() => {
    if (!task || task.status !== 'in_progress' || !task.startTime) {
      setClientRemainingSec(0);
      return;
    }

    const updateCountdown = () => {
      const effectiveClientNowMs = Date.now() + clockOffsetSec * 1000;
      const endTimeMs = task.startTime! + task.duration * 1000;
      const remainingMs = Math.max(0, endTimeMs - effectiveClientNowMs);
      setClientRemainingSec(Math.ceil(remainingMs / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [task, clockOffsetSec]);

  // Handle Assigning Task with Selected Tier
  const handleAssign = async () => {
    setAssigning(true);
    setMessage(null);
    try {
      recordServerCall();
      const res = await assignTaskApi(
        kingdomId,
        houseId,
        selectedTier,
        false,
        !!selectedSpecialTask,
        selectedSpecialTask || undefined
      );
      if (typeof res.serverOffsetSec === 'number' && setClockOffsetSec) {
        setClockOffsetSec(res.serverOffsetSec);
      }
      setMessage({
        type: 'success',
        text: `Expedition assigned by server timestamp! Tier: ${res.tier.toUpperCase()} (${res.duration}s)${
          selectedSpecialTask ? ` [SPECIAL TASK: ${selectedSpecialTask === 'establish_stone' ? 'Establish Quarrying' : 'Establish Woodcutting'}]` : ''
        }`,
      });
      onRefreshTask();
    } catch (err: any) {
      console.error('Assign error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to assign task' });
    } finally {
      setAssigning(false);
    }
  };

  // Handle Collecting Task
  const handleCollect = async () => {
    setCollecting(true);
    setMessage(null);
    try {
      recordServerCall();
      const res = await collectTaskApi(kingdomId, houseId);
      setMessage({
        type: 'success',
        text: `Collected! +${res.goldEarned} Gold & +${res.kingdomContribution} Kingdom Contribution. Server verified ${res.serverElapsedSeconds}s elapsed.`,
      });
      onRefreshTask();
    } catch (err: any) {
      console.error('Collect error:', err);
      const serverData = err.data;
      if (serverData && typeof serverData.remainingSeconds === 'number') {
        const remaining = serverData.remainingSeconds;
        setClientRemainingSec(remaining);
        setMessage({
          type: 'error',
          text: `Task incomplete on server clock (${remaining}s remaining). Client timer synced!`,
        });
      } else {
        setMessage({
          type: 'error',
          text: err.message || 'Server rejected collection (task duration not completed on server clock).',
        });
      }
    } finally {
      setCollecting(false);
    }
  };

  const handleReset = async () => {
    setMessage(null);
    try {
      recordServerCall();
      const res = await resetTaskApi(kingdomId, houseId);
      setMessage({
        type: 'success',
        text: res.message || 'Task state reset to idle.',
      });
      onRefreshTask();
    } catch (err: any) {
      console.error('Reset error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to reset task' });
    }
  };

  const isTaskInProgress = task?.status === 'in_progress';
  const duration = task?.duration || 90;
  const progressPercent = isTaskInProgress
    ? Math.min(100, Math.max(0, ((duration - clientRemainingSec) / duration) * 100))
    : 0;

  const currentAllowance = actionsAllowanceToday || 20;
  const remainingActions = typeof actionsRemainingToday === 'number' ? actionsRemainingToday : currentAllowance;
  const personalWarning = isPersonalWarningActive(remainingActions, currentAllowance);
  const currentMultiplier = 1 + rewardMultiplierLevel * 0.1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Active Realm Event Banner */}
      <EventBanner serverOffsetMs={clockOffsetSec * 1000} />

      {/* Personal Low Actions Warning Banner */}
      {personalWarning && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3 text-amber-200 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-amber-300 uppercase tracking-wider">
              ⚠️ Personal Actions Depleting
            </div>
            <div>
              You have <strong>{remainingActions} / {currentAllowance}</strong> actions remaining in your 24h allowance window (≤20% threshold).
            </div>
          </div>
        </div>
      )}

      {/* House Domain Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-widest text-amber-400/80 font-bold">
                Noble House Domain
              </span>
            </div>
            <h2 className="text-2xl font-bold text-amber-100 mt-1">{houseName}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Lord ID: <code className="text-amber-300 font-mono">{userId}</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-slate-400">Daily Actions</div>
                <div className="text-amber-200 font-semibold font-mono">
                  {remainingActions} / {currentAllowance} Left
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <Crown className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-slate-400">Descendant Roster</div>
                <div className="text-amber-200 font-semibold">1 / 1 Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kingdom Level & Daily Recovery Clock Status */}
      <KingdomStatusCard kingdomId={kingdomId} />

      {/* Economy Treasury & Multiplier Panel */}
      <EconomyPanel
        kingdomId={kingdomId}
        houseId={houseId}
        gold={gold}
        rewardMultiplierLevel={rewardMultiplierLevel}
        onRefreshPlayer={onRefreshTask}
        recordServerCall={recordServerCall}
      />

      {/* Worker Pool & Economy Panel */}
      <WorkerView
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        onRefreshParent={onRefreshTask}
      />

      {/* Grand Cathedral Building Panel */}
      <CathedralView
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        onRefreshParent={onRefreshTask}
      />

      {/* House Chapel Building Panel */}
      <ChapelView
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        onRefreshParent={onRefreshTask}
      />

      {/* House Forge Building Panel (Phase 15) */}
      <ForgeView
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        onRefreshParent={onRefreshTask}
      />

      {/* House Reputation & Fertility Festival Panel */}
      <FestivalView
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        onRefresh={onRefreshTask}
      />

      {/* House Specialization Guild Panel */}
      <SpecializationCard
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        onRefreshParent={onRefreshTask}
      />

      {/* Ancestral Legacy Relics & Heirlooms Panel (Phase 14) */}
      <LegacyItemsCard
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        onRefreshParent={onRefreshTask}
      />

      {/* Dynasty Lineage & Royal Succession Panel (Phase 16) */}
      <DynastyLineageCard
        kingdomId={kingdomId}
        houseId={houseId}
        userId={userId}
        task={task}
        actionsRemainingToday={remainingActions}
        onRefreshParent={onRefreshTask}
      />

      {/* Task Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                  Descendant Task
                </span>
                <span className="text-xs text-slate-400 font-mono">Server-Authoritative</span>
              </div>
              <h3 className="text-xl font-bold text-amber-100 mt-1">
                Expedition of the Realm
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                Dispatch Crown Prince Alistair on an expedition. Produces Kingdom Contribution and Gold.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={onRefreshTask}
              className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors border border-slate-800 flex items-center gap-1.5 text-xs cursor-pointer"
              title="Refresh Task State"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync State
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors border border-amber-500/30 flex items-center gap-1.5 text-xs cursor-pointer"
              title="Reset Stale Task to Idle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Stale Task
            </button>
          </div>
        </div>

        {/* Duration Tier Selector & Special Task (Shown when task is idle) */}
        {!isTaskInProgress && (
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Select Duration Commitment Tier:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DURATION_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id && !selectedSpecialTask;
                const estGold = Math.floor(tier.baseGold * currentMultiplier);

                return (
                  <div
                    key={tier.id}
                    onClick={() => {
                      setSelectedTier(tier.id);
                      setSelectedSpecialTask(null);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-100">{tier.title}</span>
                        <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-amber-300">
                          {tier.seconds}s
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tier.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Kingdom Contribution:</span>
                        <span className="font-bold text-amber-300">+{tier.kc} KC</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Est. Gold Yield:</span>
                        <span className="font-bold text-amber-400 font-mono">+{estGold} Gold</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extended Special Task Options */}
            <div className="space-y-2">
              <div
                onClick={() => {
                  setSelectedTier('extended');
                  setSelectedSpecialTask(selectedSpecialTask === 'establish_wood' ? null : 'establish_wood');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  selectedSpecialTask === 'establish_wood'
                    ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-300">SPECIAL TASK: Establish Woodcutting</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Extended Tier (480s)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Unlocks Kingdom-wide Woodcutting for all players upon collection (+35 KC, +75 Gold)!
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono ${
                    selectedSpecialTask === 'establish_wood' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedSpecialTask === 'establish_wood' ? 'Special Task Selected' : 'Select Task'}
                  </span>
                </div>
              </div>

              <div
                onClick={() => {
                  setSelectedTier('extended');
                  setSelectedSpecialTask(selectedSpecialTask === 'establish_stone' ? null : 'establish_stone');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  selectedSpecialTask === 'establish_stone'
                    ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-300">SPECIAL TASK: Establish Stone Quarrying</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Extended Tier (480s)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Unlocks Kingdom-wide Stone Quarrying for all players upon collection (+35 KC, +75 Gold)!
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono ${
                    selectedSpecialTask === 'establish_stone' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedSpecialTask === 'establish_stone' ? 'Special Task Selected' : 'Select Task'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Unit Info */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-sm">
              👑
            </div>
            <div>
              <div className="text-xs text-slate-400">Assigned Descendant</div>
              <div className="text-sm font-semibold text-slate-200">Crown Prince Alistair</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Current Status</div>
            <div className="text-xs font-semibold mt-0.5">
              {isTaskInProgress ? (
                <span className="text-amber-400 flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress ({task.tier?.toUpperCase() || 'QUICK'})
                </span>
              ) : task?.result ? (
                <span className="text-emerald-400 flex items-center gap-1 justify-end">
                  <Award className="w-3.5 h-3.5" /> Last Collected
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Idle
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Task Progress & Countdown */}
        {isTaskInProgress ? (
          <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 font-medium flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Client Computed Countdown:
              </span>
              <span className="text-amber-400 font-bold text-base">
                {clientRemainingSec > 0 ? `${clientRemainingSec}s remaining` : 'Ready to collect!'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500 shadow-lg shadow-amber-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400/80 shrink-0" />
              Cosmetic client countdown running locally. No server requests are sent during the
              timer.
            </p>
          </div>
        ) : (
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
            Select a tier above and click &quot;Assign Task&quot; to initiate your expedition.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {!isTaskInProgress ? (
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {assigning ? 'Assigning via Server...' : `Assign ${selectedTier.toUpperCase()} Task (${DURATION_TIERS.find(t=>t.id===selectedTier)?.seconds}s)`}
            </button>
          ) : (
            <div className="w-full sm:flex-1 space-y-2">
              <button
                onClick={handleCollect}
                disabled={collecting || clientRemainingSec > 0}
                className={`w-full font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm ${
                  clientRemainingSec <= 0
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                } disabled:opacity-60`}
              >
                <Coins className="w-4 h-4" />
                {collecting
                  ? 'Verifying with Server...'
                  : clientRemainingSec <= 0
                  ? 'Collect Task Reward'
                  : `Task In Progress (${clientRemainingSec}s remaining)`}
              </button>

              {clientRemainingSec > 0 && (
                <div className="text-right">
                  <button
                    onClick={handleCollect}
                    disabled={collecting}
                    className="text-[11px] text-amber-400/70 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Test premature collect (triggers server time check)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold block mb-0.5">
                {message.type === 'success' ? 'Server Authority Confirmed' : 'Server Rejection'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Last Result Box */}
        {task?.result && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Award className="w-4 h-4" />
                Last Server-Authoritative Task Output
              </div>
              <span className="text-[11px] text-amber-400/60 font-mono">
                {task.result.completedAt ? new Date(task.result.completedAt).toLocaleTimeString() : 'Verified'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Kingdom Contribution</div>
                <div className="text-sm font-bold text-amber-300">+{task.result.kingdomContribution} KC</div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Gold Earned</div>
                <div className="text-sm font-bold text-amber-400 font-mono">+{task.result.goldEarned} Gold</div>
              </div>
            </div>
          </div>
        )}

        {/* Client Clock Offset Simulator */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Client Clock Offset Simulator
            </span>
            <span className="text-xs font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Offset: +{clockOffsetSec}s
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Artificially advance client display clock to test if client manipulation can bypass
            server duration verification.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setClockOffsetSec(0)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                clockOffsetSec === 0
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Real Client Clock (0s)
            </button>
            <button
              onClick={() => setClockOffsetSec(60)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                clockOffsetSec === 60
                  ? 'bg-rose-500 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Simulate Fast Clock (+60s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
