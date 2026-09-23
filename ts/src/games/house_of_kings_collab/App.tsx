import { useState, useEffect, useCallback } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { TaskDoc, resolveActionsState } from './types';
import { GameShell } from '../../components';
import { AuthModal } from './components/AuthModal';
import { TaskView } from './components/TaskView';
import { VerificationPanel } from './components/VerificationPanel';
import { AdminPanel } from './components/AdminPanel';
import { Shield, Sparkles, User as UserIcon, LogOut, CheckCircle2, ShieldCheck, Crown } from 'lucide-react';

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'task' | 'verification' | 'admin'>('task');

  // Kingdom and House state per §2.5 schema
  const kingdomId = 'kingdom-mvp-0';
  const houseId = 'house-of-kings-default';
  const houseName = 'House of Kings';

  const [taskDoc, setTaskDoc] = useState<TaskDoc | null>(null);
  const [playerData, setPlayerData] = useState<{ gold: number; rewardMultiplierLevel: number; actionsRemainingToday: number; actionsAllowanceToday?: number }>({
    gold: 0,
    rewardMultiplierLevel: 0,
    actionsRemainingToday: 20,
    actionsAllowanceToday: 20,
  });
  const [clockOffsetSec, setClockOffsetSec] = useState<number>(0);
  const [serverCallCount, setServerCallCount] = useState<number>(0);

  const recordServerCall = () => setServerCallCount((prev) => prev + 1);

  // Initialize Auth & Ensure Player document exists in Firestore
  useEffect(() => {
    // Safety fallback timer: Ensure loadingAuth unblocks after 2.5s even if Firebase listener is slow
    const timer = setTimeout(() => {
      setLoadingAuth(false);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      setLoadingAuth(false);

      if (currentUser) {
        try {
          // Ensure Player document exists
          const playerRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', currentUser.uid);
          const playerSnap = await getDoc(playerRef);
          if (!playerSnap.exists()) {
            await setDoc(playerRef, {
              displayName: currentUser.displayName || 'Noble Lord',
              joinedAt: new Date().toISOString(),
              gold: 0,
              rewardMultiplierLevel: 0,
            });
          }
        } catch (e) {
          console.warn('Error setting up initial Firestore docs:', e);
        }
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [kingdomId, houseId]);

  // Subscribe to player document for real-time gold and multiplier updates
  useEffect(() => {
    if (!user) {
      setPlayerData({ gold: 0, rewardMultiplierLevel: 0, actionsRemainingToday: 0 });
      return;
    }

    const playerRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', user.uid);
    const unsubscribePlayer = onSnapshot(
      playerRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const { remaining, allowance } = resolveActionsState(data);
          setPlayerData({
            gold: Number(data.gold) || 0,
            rewardMultiplierLevel: Number(data.rewardMultiplierLevel) || 0,
            actionsRemainingToday: remaining,
            actionsAllowanceToday: allowance,
          });
        }
      },
      (err) => {
        console.warn('Player doc snapshot listener:', err);
      }
    );

    return () => unsubscribePlayer();
  }, [user, kingdomId, houseId]);

  // Subscribe to task document updates for real-time sync
  useEffect(() => {
    if (!user) {
      setTaskDoc(null);
      return;
    }

    const taskRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', user.uid, 'task', 'current');
    const unsubscribeDoc = onSnapshot(
      taskRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTaskDoc({
            status: data.status || 'idle',
            startTime: data.startTime || null,
            duration: data.duration || 90,
            tier: data.tier || 'quick',
            result: data.result || null,
          });
        } else {
          setTaskDoc({
            status: 'idle',
            startTime: null,
            duration: 90,
            tier: 'quick',
            result: null,
          });
        }
      },
      (err) => {
        console.warn('Task doc snapshot listener:', err);
      }
    );

    return () => unsubscribeDoc();
  }, [user, kingdomId, houseId]);

  const refreshTask = useCallback(async () => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', user.uid, 'task', 'current');
      const docSnap = await getDoc(taskRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTaskDoc({
          status: data.status || 'idle',
          startTime: data.startTime || null,
          duration: data.duration || 90,
          tier: data.tier || 'quick',
          result: data.result || null,
        });
      }

      const playerRef = doc(db, 'kingdoms', kingdomId, 'houses', houseId, 'players', user.uid);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        const data = playerSnap.data();
        const { remaining } = resolveActionsState(data);
        setPlayerData({
          gold: Number(data.gold) || 0,
          rewardMultiplierLevel: Number(data.rewardMultiplierLevel) || 0,
          actionsRemainingToday: remaining,
        });
      }
    } catch (e) {
      console.warn('Refresh task error:', e);
    }
  }, [user, kingdomId, houseId]);

  const handleSignOut = () => {
    signOut(auth);
  };

  const adminEmail = env.VITE_ADMIN_EMAIL || 'cheater2478@gmail.com';
  const showAdminTab = !!user?.email && user.email.toLowerCase() === adminEmail.toLowerCase();

  const tabBtnCls = (tab: 'task' | 'verification' | 'admin', activeCls: string, idleCls: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
      activeTab === tab ? activeCls : idleCls
    }`;

  if (loadingAuth) {
    return (
      <GameShell
        gameLabel="House of Kings: Collab"
        gameId="house_of_kings_collab"
        phase="Phase 2"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        className="bg-slate-950 text-slate-100 font-sans antialiased"
      >
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 animate-pulse">
              <Shield className="w-8 h-8" />
            </div>
            <span className="text-xs text-amber-300 font-mono">Initializing Kingdom Auth...</span>
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell
      gameLabel="House of Kings: Collab"
      gameId="house_of_kings_collab"
      phase="Phase 2"
      mode={mode}
      arcadeBaseUrl={arcadeBaseUrl}
      className="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200"
      mainClassName="game-shell-main--scrollable"
      headerExtra={
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 text-amber-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          {user && (
            <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('task')}
                className={tabBtnCls('task', 'bg-amber-500 text-slate-950 font-semibold shadow-sm', 'text-slate-400 hover:text-slate-200')}
              >
                <Shield className="w-3.5 h-3.5" />
                Special Task
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={tabBtnCls('verification', 'bg-amber-500 text-slate-950 font-semibold shadow-sm', 'text-slate-400 hover:text-slate-200')}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verification Suite
              </button>
              {showAdminTab && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Game Master Panel
                </button>
              )}
            </nav>
          )}
          {user ? (
            <div className="flex items-center space-x-3 shrink-0">
              <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200 truncate max-w-[120px]">
                  {user.displayName || user.email || 'Noble Lord'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sign In Required
            </div>
          )}
        </div>
      }
      statusArea={
        <span className="text-xs text-slate-400 hidden sm:block whitespace-nowrap">
          {houseName ? `House: ${houseName}` : 'Server-Authoritative Task Engine'}
        </span>
      }
      footer={
        <div className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500/60" />
          <span>House of Kings: Collab — Phase 1 First Real Content (August 2026)</span>
        </div>
      }
    >
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {!user ? (
          <AuthModal />
        ) : (
          <div>
            {activeTab === 'task' ? (
              <TaskView
                kingdomId={kingdomId}
                houseId={houseId}
                houseName={houseName}
                userId={user.uid}
                task={taskDoc}
                gold={playerData.gold}
                rewardMultiplierLevel={playerData.rewardMultiplierLevel}
                actionsRemainingToday={playerData.actionsRemainingToday}
                actionsAllowanceToday={playerData.actionsAllowanceToday}
                onRefreshTask={refreshTask}
                clockOffsetSec={clockOffsetSec}
                setClockOffsetSec={setClockOffsetSec}
                recordServerCall={recordServerCall}
              />
            ) : activeTab === 'verification' ? (
              <VerificationPanel
                kingdomId={kingdomId}
                houseId={houseId}
                userId={user.uid}
                task={taskDoc}
                gold={playerData.gold}
                rewardMultiplierLevel={playerData.rewardMultiplierLevel}
                onRefreshTask={refreshTask}
                serverCallCount={serverCallCount}
              />
            ) : (
              <AdminPanel
                kingdomId={kingdomId}
                houseId={houseId}
                userId={user.uid}
                userEmail={user.email}
                onRefreshTask={refreshTask}
              />
            )}
          </div>
        )}
      </main>
    </GameShell>
  );
}
