import React, { useState } from 'react';
import {
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  Shield,
  Zap,
  Coins,
  ShieldCheck,
  Crown,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onSignedIn?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(
        err.message || 'Google Sign-In was interrupted or blocked in this browser frame. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6 px-4">
      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              House of Kings: Collab
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Server-Authoritative Engine
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-amber-100 tracking-tight leading-tight">
            Command Your House & Claim Kingdom Treasury Gold
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Welcome to <span className="text-amber-300 font-bold">House of Kings</span>. Embark on timed expeditions, earn gold verified strictly by server-side atomic transactions, and invest in exponential reward multipliers.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Authentication Note</span>
                {error}
              </div>
            </div>
          )}

          {/* Action CTA — Google sign-in only */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50 text-sm sm:text-base"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In with Google</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              A Google account is required. Progress persists to Firebase Firestore.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Architecture Grid */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-100">
            Kingdom Core Mechanics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Built with zero-trust server validation to ensure fair competition across all noble houses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-amber-200">Server-Validated Timers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expedition task countdowns are calculated server-side against absolute server timestamps (`startTime + duration`). Client clock manipulation cannot bypass task completion gates.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 90s, 300s & 900s Tiers
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-emerald-200">Exponential Treasury</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Collect gold rewards and reinvest in reward multipliers. Multipliers follow an exponential cost curve (`50 * 1.15^level`) calculated atomically in server transactions.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Atomic Firestore Locks
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl hover:border-amber-500/30 transition-all">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-purple-200">Verification Suite</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Includes an interactive automated verification harness to execute live test scenarios testing timing gates, clock skew tolerance, and state isolation.
            </p>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-purple-400 font-mono flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Live Integration Testing
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-bold text-amber-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Kingdom Gameplay Loop
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-xs">
              1
            </div>
            <span className="font-bold text-slate-200 block">Select Expedition Tier</span>
            <p className="text-slate-400">
              Choose Quick (100g), Standard (350g), or Epic (1,200g) tasks based on your time availability.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-xs">
              2
            </div>
            <span className="font-bold text-slate-200 block">Server-Gated Timer</span>
            <p className="text-slate-400">
              Track real-time countdown progress. The server verifies full elapsed duration before unlocking rewards.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-xs">
              3
            </div>
            <span className="font-bold text-slate-200 block">Collect Gold & Level Up</span>
            <p className="text-slate-400">
              Claim gold and purchase House Multiplier upgrades to boost future reward yields across the Kingdom.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

