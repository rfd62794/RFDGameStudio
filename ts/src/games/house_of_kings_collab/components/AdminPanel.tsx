import React, { useState, useEffect } from 'react';
import {
  Crown,
  Shield,
  Zap,
  RotateCcw,
  Coins,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  adminResetTaskApi,
  adminCompleteTaskApi,
  adminSetPlayerStateApi,
  adminGetPlayersApi,
  adminEvaluateKingdomApi,
  adminGetQuotaUsageApi,
} from '../services/api';
import {
  Activity,
  Database,
  Gauge,
  HardDrive,
  BarChart3,
  Globe,
} from 'lucide-react';

interface AdminPanelProps {
  kingdomId: string;
  houseId: string;
  userId: string;
  userEmail: string | null;
  onRefreshTask: () => void;
}

interface PlayerRecord {
  id: string;
  displayName?: string;
  gold?: number;
  rewardMultiplierLevel?: number;
  joinedAt?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  kingdomId,
  houseId,
  userId,
  userEmail,
  onRefreshTask,
}) => {
  const [targetUserId, setTargetUserId] = useState<string>(userId);
  const [customGoldAmount, setCustomGoldAmount] = useState<number>(1000);
  const [_customLevel, _setCustomLevel] = useState<number>(5);

  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [quotaData, setQuotaData] = useState<any>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [loadingQuota, setLoadingQuota] = useState<boolean>(false);

  const loadQuotaUsage = async () => {
    setLoadingQuota(true);
    setQuotaError(null);
    try {
      const res = await adminGetQuotaUsageApi();
      setQuotaData(res);
    } catch (err: any) {
      console.error('Error fetching quota usage:', err);
      setQuotaError(err.message || 'Failed to connect to Cloud Monitoring API');
    } finally {
      setLoadingQuota(false);
    }
  };

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const res = await adminGetPlayersApi(kingdomId, houseId);
      setPlayers(res.players || []);
    } catch (err: any) {
      console.error('Error fetching players:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  useEffect(() => {
    loadPlayers();
    loadQuotaUsage();
  }, [kingdomId, houseId]);

  const handleGMResetTask = async (targetId?: string) => {
    const tid = targetId || targetUserId || userId;
    setExecuting(true);
    setMessage(null);
    try {
      const res = await adminResetTaskApi(tid, kingdomId, houseId);
      setMessage({
        type: 'success',
        text: res.message || `Reset task for ${tid}`,
      });
      onRefreshTask();
      loadPlayers();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to reset task',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleGMCompleteTask = async (targetId?: string) => {
    const tid = targetId || targetUserId || userId;
    setExecuting(true);
    setMessage(null);
    try {
      const res = await adminCompleteTaskApi(tid, kingdomId, houseId);
      setMessage({
        type: 'success',
        text: res.message || `Completed task timer for ${tid}`,
      });
      onRefreshTask();
      loadPlayers();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to complete task timer',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleGMAddGold = async (amount: number, targetId?: string) => {
    const tid = targetId || targetUserId || userId;
    setExecuting(true);
    setMessage(null);
    try {
      const res = await adminSetPlayerStateApi({
        targetUserId: tid,
        addGold: amount,
        kingdomId,
        houseId,
      });
      setMessage({
        type: 'success',
        text: res.message || `Added +${amount} gold to ${tid}`,
      });
      onRefreshTask();
      loadPlayers();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to adjust gold',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleGMSetLevel = async (level: number, targetId?: string) => {
    const tid = targetId || targetUserId || userId;
    setExecuting(true);
    setMessage(null);
    try {
      const res = await adminSetPlayerStateApi({
        targetUserId: tid,
        rewardMultiplierLevel: level,
        kingdomId,
        houseId,
      });
      setMessage({
        type: 'success',
        text: res.message || `Set multiplier level to ${level} for ${tid}`,
      });
      onRefreshTask();
      loadPlayers();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to set multiplier level',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleGMEvaluateKingdom = async () => {
    setExecuting(true);
    setMessage(null);
    try {
      const res = await adminEvaluateKingdomApi(kingdomId);
      const { newLevel, success, contributionAchieved, thresholdRequired } = res.result;
      setMessage({
        type: 'success',
        text: `Daily Evaluation Executed! Outcome: ${success ? 'SUCCESS (+1 Level)' : 'SETBACK (-1 Level, Floor 1)'}. Contribution: ${contributionAchieved}/${thresholdRequired}. New Level: ${newLevel}.`,
      });
      onRefreshTask();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to evaluate Kingdom daily clock',
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Game Master Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-500/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 bg-amber-500/20 rounded border border-amber-500/30">
                Game Master Control Console
              </span>
            </div>
            <h2 className="text-2xl font-bold text-amber-100 mt-2">Kingdom Admin Suite</h2>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 font-mono">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Authorized GM Email: <span className="text-amber-300 font-bold">{userEmail || 'cheater2478@gmail.com'}</span>
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 text-xs space-y-1">
            <div className="text-slate-400">Server Authorization Status</div>
            <div className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Admin SDK Direct Bypass
            </div>
          </div>
        </div>
      </div>

      {/* GM Feedback Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 transition-all shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block mb-0.5">
              {message.type === 'success' ? 'GM Action Executed' : 'GM Action Failed'}
            </span>
            {message.text}
          </div>
        </div>
      )}

      {/* Infrastructure Quota Visibility (Cloud Monitoring) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-amber-100">
                Firestore Quota & Infrastructure Visibility (Spark Tier)
              </h3>
              <p className="text-xs text-slate-400">
                Live metrics from Google Cloud Monitoring API (<span className="font-mono text-amber-300/80">MetricServiceClient</span>)
              </p>
            </div>
          </div>

          <button
            onClick={loadQuotaUsage}
            disabled={loadingQuota}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingQuota ? 'animate-spin' : ''}`} />
            Refresh Monitoring
          </button>
        </div>

        {quotaError ? (
          <div className="bg-rose-500/10 border border-rose-500/40 p-4 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-rose-300">Cloud Monitoring Call Error</span>
              <p className="text-rose-200/90 font-mono mt-0.5">{quotaError}</p>
            </div>
          </div>
        ) : !quotaData ? (
          <div className="text-center text-xs text-slate-400 py-6">
            Connecting to Cloud Monitoring API...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Document Reads */}
              {(() => {
                const reads = quotaData.usage?.readsToday || 0;
                const limit = quotaData.limits?.readsPerDay || 50000;
                const pct = Math.min(100, Math.round((reads / limit) * 1000) / 10);
                return (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <Database className="w-3.5 h-3.5 text-indigo-400" /> Reads Today
                      </span>
                      <span className="text-amber-300 font-mono font-bold">{pct}%</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 font-mono">
                      {reads.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {limit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Document Writes */}
              {(() => {
                const writes = quotaData.usage?.writesToday || 0;
                const limit = quotaData.limits?.writesPerDay || 20000;
                const pct = Math.min(100, Math.round((writes / limit) * 1000) / 10);
                return (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Writes Today
                      </span>
                      <span className="text-emerald-300 font-mono font-bold">{pct}%</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 font-mono">
                      {writes.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {limit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Document Deletes */}
              {(() => {
                const deletes = quotaData.usage?.deletesToday || 0;
                const limit = quotaData.limits?.deletesPerDay || 20000;
                const pct = Math.min(100, Math.round((deletes / limit) * 1000) / 10);
                return (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" /> Deletes Today
                      </span>
                      <span className="text-amber-300 font-mono font-bold">{pct}%</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 font-mono">
                      {deletes.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {limit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Storage */}
              {(() => {
                const bytes = quotaData.usage?.storageBytes || 0;
                const limitGiB = quotaData.limits?.storageGiB || 1;
                const limitBytes = limitGiB * 1024 * 1024 * 1024;
                const pct = Math.min(100, Math.round((bytes / limitBytes) * 10000) / 100);
                const mb = (bytes / (1024 * 1024)).toFixed(2);
                return (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Storage
                      </span>
                      <span className="text-purple-300 font-mono font-bold">{pct}%</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 font-mono">
                      {mb} MB <span className="text-xs text-slate-500 font-normal">/ 1,024 MB</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${Math.max(1, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Spark Tier Supplemental Limits:</strong> Monthly Egress: <span className="text-slate-200 font-mono">10 GiB / Mo</span> | Monthly Active Users: <span className="text-slate-200 font-mono">50,000 MAU</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono shrink-0">
                Last Query: {quotaData.usage?.timestamp ? new Date(quotaData.usage.timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Self-Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-amber-100">Quick Game Master Actions (For Your Account)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleGMResetTask(userId)}
            disabled={executing}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-200 rounded-xl transition-all text-left space-y-1.5 cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Reset My Task
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Clear stuck or stale task doc and restore status to IDLE instantly.
            </p>
          </button>

          <button
            onClick={() => handleGMCompleteTask(userId)}
            disabled={executing}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-200 rounded-xl transition-all text-left space-y-1.5 cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Instant Finish Timer
              </span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Fast-forward active task timer so it becomes ready to collect.
            </p>
          </button>

          <button
            onClick={handleGMEvaluateKingdom}
            disabled={executing}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-200 rounded-xl transition-all text-left space-y-1.5 cursor-pointer disabled:opacity-50 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-center justify-between text-indigo-400 font-bold text-xs">
              <span className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Trigger Daily Recovery Clock
              </span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Run 24h Kingdom evaluation immediately. Evaluates threshold (500), adjusts Kingdom Level (floor at 1), and resets contribution to 0.
            </p>
          </button>

          <button
            onClick={() => handleGMAddGold(1000, userId)}
            disabled={executing}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-200 rounded-xl transition-all text-left space-y-1.5 cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> +1,000 Gold
              </span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Grant +1,000 Gold directly to your treasury via Admin SDK.
            </p>
          </button>

          <button
            onClick={() => handleGMSetLevel(10, userId)}
            disabled={executing}
            className="p-4 bg-slate-950 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-500/60 text-purple-200 rounded-xl transition-all text-left space-y-1.5 cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-purple-400 font-bold text-xs">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Set Level to 10
              </span>
              <Crown className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Instantly upgrade reward multiplier level to 10 (2.0x Gold).
            </p>
          </button>
        </div>
      </div>

      {/* Target Player Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Terminal className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-amber-100">Target Player Management Console</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Target User ID (UID):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter player UID..."
                className="bg-slate-950 border border-slate-700 text-amber-200 px-3 py-2 rounded-xl font-mono text-xs flex-1 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setTargetUserId(userId)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium"
              >
                Set to Self
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-300 block">Reset Task Document</span>
              <p className="text-[11px] text-slate-400">Resets target task status to idle.</p>
              <button
                onClick={() => handleGMResetTask(targetUserId)}
                disabled={executing || !targetUserId}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50"
              >
                Force Reset Task
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-300 block">Complete Active Timer</span>
              <p className="text-[11px] text-slate-400">Bypasses task countdown timer.</p>
              <button
                onClick={() => handleGMCompleteTask(targetUserId)}
                disabled={executing || !targetUserId}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50"
              >
                Complete Task Timer
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400 block">Add Custom Gold</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customGoldAmount}
                  onChange={(e) => setCustomGoldAmount(Number(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 text-amber-200 px-2 py-1 rounded font-mono text-xs"
                />
                <button
                  onClick={() => handleGMAddGold(customGoldAmount, targetUserId)}
                  disabled={executing || !targetUserId}
                  className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold py-1 rounded text-xs cursor-pointer disabled:opacity-50"
                >
                  Grant Gold
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* House Player Roster & Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-amber-100">House Player Roster ({players.length})</h3>
          </div>
          <button
            onClick={loadPlayers}
            disabled={loadingPlayers}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPlayers ? 'animate-spin' : ''}`} />
            Refresh Roster
          </button>
        </div>

        {loadingPlayers ? (
          <div className="text-center text-xs text-slate-400 py-6">Loading players...</div>
        ) : players.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-6">No players registered in house yet.</div>
        ) : (
          <div className="space-y-3">
            {players.map((p) => {
              const isSelf = p.id === userId;
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isSelf
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-amber-200">
                      <span>{p.displayName || 'Noble Lord'}</span>
                      {isSelf && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      UID: {p.id}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-300 font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">Gold</span>
                      <span className="text-amber-400 font-bold">{p.gold ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-sans">Multiplier</span>
                      <span className="text-purple-300 font-bold">Lvl {p.rewardMultiplierLevel ?? 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
                    <button
                      onClick={() => handleGMResetTask(p.id)}
                      disabled={executing}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded font-semibold text-[11px]"
                    >
                      Reset Task
                    </button>
                    <button
                      onClick={() => handleGMAddGold(500, p.id)}
                      disabled={executing}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded font-semibold text-[11px]"
                    >
                      +500 Gold
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
