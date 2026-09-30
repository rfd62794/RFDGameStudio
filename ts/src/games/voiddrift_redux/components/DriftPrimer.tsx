import { Radar, MousePointerClick, Flame, Anchor, Cpu } from 'lucide-react';

/**
 * VoidDrift Redux — First-Run Drift Primer
 * One-screen onboarding card fired through the shared OnboardingGate
 * (boolean mode) the first time the simulation is started, and again on
 * demand from the title screen's How to Play entry. Covers the real
 * loop: scout detection, tap-to-dispatch, Ring 1 mining, Ring 2 gas
 * drilling and fragment/hauler retrieval, and the smelter.
 */

interface DriftPrimerProps {
  onBegin: () => void;
}

const PRIMER_LINES: { icon: React.ComponentType<{ size?: number | string; className?: string }>; text: string }[] = [
  {
    icon: Radar,
    text: 'The Scout sweeps both rings — detected asteroids join the target queue on the radar panel.',
  },
  {
    icon: MousePointerClick,
    text: 'Tap any detected asteroid to dispatch. Ring 1 rocks send a Mk I Miner out and back with ore — or flip Auto Dispatch and the fleet picks its own targets.',
  },
  {
    icon: Flame,
    text: 'Pink gas cores in Ring 2 need the Breaker Mk II — it drills in place, banks H3 Gas, and bursts the rock into ore fragments.',
  },
  {
    icon: Anchor,
    text: 'Non-gas Ring 2 mediums and loose fragments belong to Tug Haulers — latched, towed inward, and released as Ring 1 targets.',
  },
  {
    icon: Cpu,
    text: 'The Smelter refines Raw Aluminum — 10 MT in, 5 MT Refined Aluminum out.',
  },
];

export default function DriftPrimer({ onBegin }: DriftPrimerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      data-testid="voiddrift-drift-primer"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-800/60 rounded-2xl shadow-2xl p-6 md:p-8">
        <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300 border border-cyan-800 rounded-full px-3 py-1 bg-cyan-950/60">
          First Deployment Briefing
        </span>
        <h2 className="text-xl font-bold text-slate-100 font-mono tracking-wide mt-3">
          How to Play
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          You direct the fleet — the drift runs itself.
        </p>
        <ul className="mt-5 flex flex-col gap-3">
          {PRIMER_LINES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-slate-300">
              <Icon size={16} className="text-cyan-400 mt-0.5 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <button
          id="voiddrift-primer-begin"
          data-testid="voiddrift-primer-begin"
          onClick={onBegin}
          className="mt-6 w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-sm transition"
        >
          Take Command
        </button>
      </div>
    </div>
  );
}
