import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { OnboardingTipContent } from '../content/onboardingTips';

interface OnboardingTipProps {
  tip: OnboardingTipContent;
  onDismiss: () => void;
}

// Dismiss-only overlay — no auto-fade timer. Per ADR-005, this is the
// one lesson from Time Served's Phase 11 tip system explicitly worth
// keeping: a tutorial beat that vanishes on its own undercuts itself.
export const OnboardingTip: React.FC<OnboardingTipProps> = ({ tip, onDismiss }) => {
  return (
    <div
      id="onboarding-tip-overlay"
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-fade-in"
    >
      <div className="bg-stone-900 border border-amber-600/70 rounded-2xl shadow-2xl shadow-black/50 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-600/70 flex items-center justify-center text-amber-400 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-stone-100 text-sm">{tip.title}</h3>
          </div>
          <button
            id="onboarding-tip-dismiss-button"
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss tip"
            className="text-stone-500 hover:text-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {tip.body.map((paragraph, idx) => (
            <p key={idx} className="text-xs text-stone-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <button
          id="onboarding-tip-got-it-button"
          type="button"
          onClick={onDismiss}
          className="w-full py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
