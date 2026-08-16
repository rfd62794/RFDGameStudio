import { useState, useEffect, useCallback } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { TaskDoc, resolveActionsState } from './types';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { TaskView } from './components/TaskView';
import { VerificationPanel } from './components/VerificationPanel';
import { AdminPanel } from './components/AdminPanel';
import { Shield, Sparkles } from 'lucide-react';

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
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
      setPlayerData({ gold: 0, rewardMultiplierLevel: 0 });
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

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 animate-pulse">
            <Shield className="w-8 h-8" />
          </div>
          <span className="text-xs text-amber-300 font-mono">Initializing Kingdom Auth...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200">
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
        houseName={houseName}
      />

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

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500/60" />
        <span>House of Kings: Collab — Phase 1 First Real Content (August 2026)</span>
      </footer>
    </div>
  );
}
