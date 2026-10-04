// components/HelpModal.tsx — arcade instructions overlay.

import { HelpCircle } from 'lucide-react';

interface HelpModalProps {
  comboWindowMs: number;
  onClose: () => void;
}

export default function HelpModal({ comboWindowMs, onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/90 flex justify-center items-center z-50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-xl w-full text-left relative overflow-hidden flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400" />

        <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-cyan-400" />
          <span>ARCADE INSTRUCTIONS</span>
        </h2>

        <div className="space-y-4 text-sm text-slate-300 overflow-y-auto max-h-[400px] pr-2">
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 mb-1">🎮 Core Objective</h3>
            <p className="text-xs leading-relaxed">
              Drop heavy tokens onto the continuous sliding pusher shelf. Let them fall forward to shove existing coins off the front ledge to win score points. Clear the target score to win!
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 mb-1">🕹️ How to Drop</h3>
            <p className="text-xs leading-relaxed">
              Click/tap inside the central dropping channel of the board. Guide your mouse cursor left/right to aim with the ghost pointer guide. You have a limited queue of 15 drops.
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 mb-1">🚨 Side Gutters</h3>
            <p className="text-xs leading-relaxed">
              Avoid letting coins slide off into the caution-striped left and right gutters. Coins lost to side gutters do not score, reset combo meters, or count towards drop refills!
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 mb-1">🔥 Combo & Wheel Spin</h3>
            <p className="text-xs leading-relaxed">
              Pushing 3+ coins off the front edge within a rapid {comboWindowMs / 1000}s window triggers a combo streak! Every 3-step combo chain awards a <strong>Wheel of Fortune Spin</strong> containing Coin Birds, Coin Towers, bumpers, and gutter shields!
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-cyan-400 mb-1">💼 Pocket Coins Hand</h3>
            <p className="text-xs leading-relaxed">
              Earn a choice of robust special cards (TNT explosives, magnetic waves, double value pads, and giga steel rollers) every 15 coins pushed. Spending a card drops a free utility token without consuming your standard queue!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          id="close-help-btn"
          className="mt-6 py-2 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest text-center"
        >
          Close Guide
        </button>
      </div>
    </div>
  );
}
