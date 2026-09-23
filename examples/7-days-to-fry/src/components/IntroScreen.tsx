/**
 * @file src/components/IntroScreen.tsx
 * Minimal structural intro screen establishing ownership and shift setup context.
 */

import React from 'react';
import { ArrowRight, Sparkles, Building2 } from 'lucide-react';

interface IntroScreenProps {
  onContinue: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl">
          <Building2 className="w-7 h-7" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Welcome to 7 Days to Fry</h2>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Welcome to 7 Days to Fry. You own <strong className="text-amber-400">the Burger Stand</strong>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Before your first shift, you'll set up in tonight's Night phase — review your restaurant, then start Day 1 when you're ready.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 text-left space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Sparkles className="w-4 h-4" /> Shift Guidance
          </div>
          <p>
            Adjust your Policy Dial during Night setup to establish policy expectations.
            High throughput targets encourage workers to cut corners under heavy customer queues.
          </p>
          <p className="mt-2">
            New equipment and menu options unlock in the shop as the week goes on.
            Day 7 brings a real test of everything you've built — survive it, and you'll
            open your doors to a bigger, busier tier.
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Continue to Night Setup</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
