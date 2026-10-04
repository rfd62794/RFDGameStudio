import React from 'react';
import { BookOpen, X, Boxes, FlaskConical, Radio, Layers, Bot, Sparkles, Shield } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const HelpManualModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="help-manual-dialog"
        className="w-full max-w-2xl bg-[#090e1c] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[88vh] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                VoidRift Directives & Operations Manual
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                System Guide: Sandustry Physicality • Astroneer Storage • SS13 Chemistry
              </p>
            </div>
          </div>

          <button
            id="btn-close-help-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Manual Content */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-2 text-slate-300 text-xs leading-relaxed font-sans">
          {/* Section 1: The Premise */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              1. The Black Hole & Universe Rebirth
            </h4>
            <p>
              The black hole swallowed the previous universe. The drifting rocks around your station are not random debris; they are the crushed matter of entire civilizations, biospheres, and star systems. You are not escaping — you are building forward.
            </p>
          </div>

          {/* Section 2: Sandustry Physical Layout */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              2. Sandustry Layout & Physicality
            </h4>
            <p>
              The station is a real physical structure assembled on a space grid. Conduits transfer power and compounds between adjacent modules:
            </p>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400 pt-1">
              <li><strong>Containment Pods</strong> must connect to adjacent Processing Chambers to feed their Synthesis recipes.</li>
              <li><strong>Signal Arrays</strong> require active power from connected Power Cells.</li>
              <li><strong>Gas Tanks</strong> adjacent to reactive Liquid Flasks without a <strong>Hull Plating</strong> buffer create volatile instability.</li>
              <li><strong>Ablative Hull Plating</strong> protects modules from drifting asteroid impacts.</li>
            </ul>
          </div>

          {/* Section 3: Astroneer Container Typing */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-sky-400" />
              3. Astroneer Typed Containment Model
            </h4>
            <p>
              Every compound exists in one of three physical states. Storage containers are strictly state-specific — no cross-filling:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded bg-sky-950/40 border border-sky-500/30 text-sky-300">
                <strong>Gas Tanks</strong><br />
                Pressurized tanks for volatile gases (Nitrogen Vapor, Dark Ion Mist, Chrono-Vapor).
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                <strong>Liquid Flasks</strong><br />
                Corrosion-sealed flasks for reactive fluids (Mineral Slurry, Primordial Brine, Acidic Ether).
              </div>
              <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300">
                <strong>Solid Bins</strong><br />
                Heavy-duty magnetic bins for ores (Silicate Shards, Dense Ferrite, Quark Ore).
              </div>
            </div>
          </div>

          {/* Section 4: SS13 Chemistry Multipliers */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              4. SS13 Synthesis & Global Multipliers
            </h4>
            <p>
              Synthesis is a force multiplier across every subsystem. Producing compounds feeds back into operations:
            </p>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400 pt-1">
              <li><strong>Fracture Solvent</strong> → +75% Drone laser mining speed & +50% compound yield.</li>
              <li><strong>Void Stabilizer</strong> → Eliminates container degradation & gas volatility leaks.</li>
              <li><strong>Resonance Primer</strong> → Detects Tier 2 Void-Touched Asteroids on long-range sensors.</li>
              <li><strong>Collapse Catalyst</strong> → Safely unlocks mining of Tier 3 Collapsed Fragments.</li>
              <li><strong>Hull Binder</strong> → Accelerates automatic Dust collision repair speed 2x.</li>
            </ul>
          </div>

          {/* Section 5: Signal Bottles & Cosmic Catalog */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-amber-400" />
              5. Signal Bottles & Cosmic Cascade Prestige
            </h4>
            <p>
              Tumbling glowing capsules arrive from the event horizon. Powered Signal Arrays decode them into permanent <strong>Signal Keys</strong> and poetic <strong>Lore Transmissions</strong>.
            </p>
            <p className="pt-1">
              Accumulate <strong>Biomass Matrices</strong>, <strong>Geo-Lithic Cores</strong>, and <strong>Stellar Ignition Cores</strong> to reconstruct the universe. Rekindling a Star ignites a permanent <strong>Cosmic Cascade (+25% universal speed/yield per Star)</strong>!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            id="btn-dismiss-help-manual"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-colors shadow-md"
          >
            Return to Station
          </button>
        </div>
      </div>
    </div>
  );
};
