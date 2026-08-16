import React, { useState } from 'react';
import {
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  Shield,
  Sparkles,
  Zap,
  Coins,
  ShieldCheck,
  Crown,
  LogIn,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Lock,
  Mail,
  KeyRound,
  UserPlus,
} from 'lucide-react';

interface LandingPageProps {
  onSignedIn?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(
        err.message || 'Google Sign-In was interrupted or blocked in this browser frame. Use Guest or Email Sign-In below.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error('Guest sign in error:', err);
      if (
        err.code === 'auth/admin-restricted-operation' ||
        err.message?.includes('admin-restricted-operation')
      ) {
        setError(
          'Anonymous guest sign-in is restricted in Firebase Console. Please use Email Sign-In below.'
        );
        setShowEmailForm(true);
      } else {
        setError(err.message || 'Guest Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Account not found or password incorrect. You can switch to "Create New Account" below.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Switching to Sign In.');
        setIsRegistering(false);
      } else {
        setError(err.message || 'Authentication failed.');
      }
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

          {/* Action CTAs & Email Form */}
          {!showEmailForm ? (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={handleGuestSignIn}
                  disabled={loading}
                  className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50 text-sm sm:text-base"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Enter Kingdom as Guest Lord</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-sm sm:text-base"
                >
                  <LogIn className="w-5 h-5 text-amber-400" />
                  <span>Sign In with Google</span>
                </button>

                <button
                  onClick={() => setShowEmailForm(true)}
                  className="px-5 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Email Account</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Instant access available. Progress persists to Firebase Firestore.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  {isRegistering ? 'Register New Lord Account' : 'Lord Sign In'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="lord@houseofkings.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{isRegistering ? 'Create Lord Account' : 'Sign In as Lord'}</span>
                </button>

                <div className="text-center pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register Here'}
                  </button>
                </div>
              </div>
            </form>
          )}
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

