import { useState, useEffect, useCallback } from 'react';
import { Pickaxe, CheckCircle, AlertCircle, Plus, RefreshCw, Lock, TreePine, Apple } from 'lucide-react';
import { WorkerTask, ResourcesMap, parseUnlockedTaskTypes, TaskType } from '../types';
import { getWorkersApi, assignWorkerApi, collectWorkerApi } from '../services/api';

interface WorkerViewProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  onRefreshParent?: () => void;
}

export function WorkerView({ kingdomId, houseId, userId, onRefreshParent }: WorkerViewProps) {
  const [workers, setWorkers] = useState<WorkerTask[]>([]);
  const [poolSize, setPoolSize] = useState<number>(5);
  const [kingdomLevel, setKingdomLevel] = useState<number>(1);
  const [forgeLevel, setForgeLevel] = useState<number>(0);
  const [resources, setResources] = useState<ResourcesMap>({ food: 0, wood: 0, stone: 0 });
  const [unlockedTaskTypes, setUnlockedTaskTypes] = useState<string[]>(['food']);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(300); // Default 5 min
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType>('food');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWorkerData = useCallback(async () => {
    try {
      const data = await getWorkersApi(kingdomId, houseId);
      if (data.success) {
        setWorkers(data.workers || []);
        setPoolSize(data.poolSize || 5);
        setKingdomLevel(data.kingdomLevel || 1);
        setForgeLevel(data.forgeLevel || 0);
        if (data.resources && typeof data.resources === 'object') {
          setResources({
            food: Number(data.resources.food) || 0,
            wood: Number(data.resources.wood) || 0,
            stone: Number(data.resources.stone) || 0,
          });
        } else if (typeof data.resources === 'number') {
          setResources({ food: data.resources, wood: 0, stone: 0 });
        }
        setUnlockedTaskTypes(parseUnlockedTaskTypes(data.unlockedTaskTypes));
        setActiveCount(data.activeCount || 0);
      }
    } catch (err: any) {
      console.warn('Error fetching worker data:', err);
    } finally {
      setLoading(false);
    }
  }, [kingdomId, houseId]);

  useEffect(() => {
    fetchWorkerData();
    const interval = setInterval(fetchWorkerData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [fetchWorkerData]);

  const handleAssignWorker = async () => {
    if (!unlockedTaskTypes.includes(selectedTaskType)) {
      setMessage({
        type: 'error',
        text: `Task Type '${selectedTaskType.toUpperCase()}' is locked! Complete the Descendant Special Task to establish this sector first.`,
      });
      return;
    }

    setAssigning(true);
    setMessage(null);
    try {
      await assignWorkerApi(kingdomId, houseId, selectedDuration, selectedTaskType);
      setMessage({
        type: 'success',
        text: `Worker deployed for ${selectedTaskType.toUpperCase()}! Duration: ${Math.round(selectedDuration / 60)} minutes.`,
      });
      await fetchWorkerData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Assign worker error:', err);
      const serverData = err.data;
      if (serverData && serverData.error === 'Worker Pool at capacity') {
        setMessage({
          type: 'error',
          text: `Worker Pool at capacity (${serverData.active}/${serverData.poolSize}). Level up Kingdom or upgrade Forge to expand pool!`,
        });
      } else {
        setMessage({
          type: 'error',
          text: err.message || 'Failed to assign worker.',
        });
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleCollectWorker = async (workerId: string) => {
    if (collectingId) return;
    setCollectingId(workerId);
    setMessage(null);
    try {
      const res = await collectWorkerApi(workerId, kingdomId, houseId);
      setMessage({
        type: 'success',
        text: `Worker collected! Earned +${res.resourcesEarned} ${(res.taskType || 'food').toUpperCase()}.`,
      });
      // Optimistically clear completed worker from local active list
      setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, status: 'idle' } : w)));
      setActiveCount((prev) => Math.max(0, prev - 1));
      await fetchWorkerData();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      console.error('Collect worker error:', err);
      const serverData = err.data;
      if (serverData && typeof serverData.remainingSeconds === 'number') {
        setMessage({
          type: 'error',
          text: `Worker incomplete on server clock (${serverData.remainingSeconds}s remaining).`,
        });
      } else if (
        err.message === 'Worker task is not currently in progress' ||
        serverData?.error === 'Worker task is not currently in progress'
      ) {
        setMessage({
          type: 'success',
          text: 'Worker task was already collected or completed.',
        });
        setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, status: 'idle' } : w)));
        setActiveCount((prev) => Math.max(0, prev - 1));
        await fetchWorkerData();
        if (onRefreshParent) onRefreshParent();
      } else {
        setMessage({
          type: 'error',
          text: err.message || 'Failed to collect worker task.',
        });
      }
    } finally {
      setCollectingId(null);
    }
  };

  const isAtCapacity = activeCount >= poolSize;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Pickaxe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Worker Pool & Typed Economy
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                Phase 15: Food, Wood & Stone
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Assign workers to gather Food, Wood, or Stone. Capacity: {poolSize} slots (Kingdom L{kingdomLevel} + Forge L{forgeLevel}).
            </p>
          </div>
        </div>

        {/* Resources & Pool Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center justify-end gap-1">
              <Apple className="w-3 h-3 text-amber-400" /> Food
            </div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {resources.food}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center justify-end gap-1">
              <TreePine className="w-3 h-3 text-emerald-400" /> Wood
            </div>
            <div className={`text-sm font-bold font-mono ${unlockedTaskTypes.includes('wood') ? 'text-emerald-400' : 'text-slate-500'}`}>
              {unlockedTaskTypes.includes('wood') ? resources.wood : 'Locked'}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono flex items-center justify-end gap-1">
              <Pickaxe className="w-3 h-3 text-cyan-400" /> Stone
            </div>
            <div className={`text-sm font-bold font-mono ${unlockedTaskTypes.includes('stone') ? 'text-cyan-400' : 'text-slate-500'}`}>
              {unlockedTaskTypes.includes('stone') ? resources.stone : 'Locked'}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Active Pool</div>
            <div className={`text-sm font-bold font-mono ${isAtCapacity ? 'text-amber-400' : 'text-blue-400'}`}>
              {activeCount} / {poolSize}
            </div>
          </div>

          <button
            onClick={fetchWorkerData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Refresh Worker Pool"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Assign Worker Section */}
      <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            1. Select Task Type
          </span>
          <span className="text-[11px] text-slate-400">
            Kingdom Unlocks: {unlockedTaskTypes.map(t => t.toUpperCase()).join(', ')}
          </span>
        </div>

        {/* Task Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setSelectedTaskType('food')}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedTaskType === 'food'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Apple className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Food Gathering</div>
                <div className="text-[10px] text-amber-400 font-mono">Default Unlocked</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Unlocked</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTaskType('wood')}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedTaskType === 'wood'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TreePine className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Woodcutting</div>
                <div className="text-[10px] font-mono text-slate-400">
                  {unlockedTaskTypes.includes('wood') ? 'Kingdom Unlocked' : 'Requires Special Task'}
                </div>
              </div>
            </div>
            {unlockedTaskTypes.includes('wood') ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Unlocked</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedTaskType('stone')}
            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedTaskType === 'stone'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 ring-1 ring-cyan-500/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Pickaxe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Quarrying Stone</div>
                <div className="text-[10px] font-mono text-slate-400">
                  {unlockedTaskTypes.includes('stone') ? 'Kingdom Unlocked' : 'Requires Special Task'}
                </div>
              </div>
            </div>
            {unlockedTaskTypes.includes('stone') ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">Unlocked</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            2. Select Task Duration
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { sec: 300, label: '5 Minutes', reward: '+10' },
            { sec: 900, label: '15 Minutes', reward: '+30' },
            { sec: 1800, label: '30 Minutes', reward: '+60' },
            { sec: 3600, label: '1 Hour', reward: '+120' },
          ].map((option) => (
            <button
              key={option.sec}
              type="button"
              onClick={() => setSelectedDuration(option.sec)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedDuration === option.sec
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-medium text-slate-200">{option.label}</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{option.reward} {selectedTaskType.toUpperCase()}</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAssignWorker}
          disabled={assigning || isAtCapacity || !unlockedTaskTypes.includes(selectedTaskType)}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
            !unlockedTaskTypes.includes(selectedTaskType)
              ? 'bg-slate-800/80 text-rose-400 border border-rose-500/30 cursor-not-allowed'
              : isAtCapacity
              ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] cursor-pointer'
          }`}
        >
          {assigning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : !unlockedTaskTypes.includes(selectedTaskType) ? (
            <>
              <Lock className="w-4 h-4 text-rose-400" />
              <span>{selectedTaskType.toUpperCase()} is Locked — Complete Descendant Special Task to Unlock</span>
            </>
          ) : isAtCapacity ? (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Worker Pool Full ({activeCount}/{poolSize}) — Level Up Kingdom or Upgrade Forge</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Deploy Worker for {selectedTaskType.toUpperCase()} ({Math.round(selectedDuration / 60)}m Task)</span>
            </>
          )}
        </button>
      </div>

      {/* Active Workers Subcollection List */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
          <span>Active Worker Tasks ({activeCount})</span>
          <span className="text-[10px] text-slate-500">Structurally isolated from Gold/Contribution</span>
        </h4>

        {workers.filter((w) => w.status === 'in_progress').length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
            No active worker tasks deployed. Select a Task Type and duration above to deploy!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workers
              .filter((w) => w.status === 'in_progress')
              .map((worker) => (
                <WorkerTaskCard
                  key={worker.id}
                  worker={worker}
                  collecting={collectingId === worker.id}
                  onCollect={() => handleCollectWorker(worker.id)}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkerTaskCard({
  worker,
  collecting,
  onCollect,
}: {
  key?: string;
  worker: WorkerTask;
  collecting: boolean;
  onCollect: () => void;
}) {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startTimeMs = Number(worker.startTime) || now;
  const durationMs = Number(worker.duration) * 1000;
  const elapsedMs = now - startTimeMs;
  const remainingSec = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
  const isReady = remainingSec === 0;

  const progressPct = Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100));
  const taskType = worker.taskType || 'food';

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {taskType === 'stone' ? (
            <Pickaxe className="w-4 h-4 text-cyan-400" />
          ) : taskType === 'wood' ? (
            <TreePine className="w-4 h-4 text-emerald-400" />
          ) : (
            <Apple className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-mono font-medium text-slate-200">
            Worker #{worker.id.slice(0, 6)} ({taskType.toUpperCase()})
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isReady
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          {isReady ? 'Ready to Collect' : `${remainingSec}s Remaining`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-300 ${
            isReady
              ? 'bg-emerald-400'
              : taskType === 'stone'
              ? 'bg-cyan-400'
              : taskType === 'wood'
              ? 'bg-emerald-500'
              : 'bg-amber-500'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[10px] text-slate-500 font-mono">
          Type: {taskType.toUpperCase()} ({Math.round(worker.duration / 60)}m)
        </span>

        <button
          onClick={onCollect}
          disabled={!isReady || collecting}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
            isReady
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
          }`}
        >
          {collecting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : isReady ? (
            `Collect +${taskType.toUpperCase()}`
          ) : (
            `${remainingSec}s`
          )}
        </button>
      </div>
    </div>
  );
}
