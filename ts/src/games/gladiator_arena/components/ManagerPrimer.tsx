/**
 * Gladiator Arena — First-Run Manager Primer
 * One-screen onboarding card for genuinely new stables, fired through the
 * shared OnboardingGate (boolean mode) the first time the arena is entered.
 * Covers the real loop: recruit, equip, fight, anatomy consequences, repair.
 */

import React from 'react';
import { Users, ShoppingBag, Swords, HeartPulse, Coins } from 'lucide-react';

interface ManagerPrimerProps {
  onComplete: () => void;
}

const PRIMER_LINES: { icon: React.ComponentType<{ className?: string }>; text: string }[] = [
  {
    icon: Users,
    text: 'Recruit Frames — your stable starts with a single gladiator chassis; buy more from the Frames tab as funds allow.',
  },
  {
    icon: ShoppingBag,
    text: 'Equip at The Forge — buy parts and bolt them onto six anatomy slots: head, torso, both arms, both legs.',
  },
  {
    icon: Swords,
    text: 'Field bouts from Arena Bouts — pick an opponent on the champion ladder; combat is turn-based and auto-resolves while each Frame\u2019s personality drives its choices.',
  },
  {
    icon: HeartPulse,
    text: 'Damage is anatomical — limbs break independently, heavy trauma leaves permanent scars that cut max HP, and a wrecked torso or head ends the fight.',
  },
  {
    icon: Coins,
    text: 'Recover in the Medbay Clinic — gold patches wounds and regenerates scars; bout purses and crowd favor pay for it all.',
  },
];

export const ManagerPrimer: React.FC<ManagerPrimerProps> = ({ onComplete }) => {
  return (
    <div
      className="flex-1 flex items-center justify-center p-6"
      data-testid="ga-manager-primer"
    >
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Swords className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-stone-100 uppercase tracking-wide">
            Manager&rsquo;s Primer
          </h2>
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">
            Your stable, your calls
          </span>
        </div>

        <ul className="flex flex-col gap-3 text-sm text-stone-300">
          {PRIMER_LINES.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 bg-stone-950/70 border border-stone-800 rounded-xl px-3.5 py-2.5"
            >
              <Icon className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>

        <button
          id="ga-primer-complete-btn"
          data-testid="ga-primer-complete"
          onClick={onComplete}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold text-sm uppercase tracking-wider transition cursor-pointer"
        >
          Take the Stable
        </button>
      </div>
    </div>
  );
};
