import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface RaidHelpModalProps {
  showHelp: boolean;
  onClose: () => void;
}

export const RaidHelpModal: React.FC<RaidHelpModalProps> = ({ showHelp, onClose }) => {
  if (!showHelp) return null;

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-[#334155] rounded-xl max-w-md w-full p-6 shadow-2xl font-mono text-sm space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#334155] pb-3">
          <span className="font-bold text-[#38bdf8] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            TACTICAL RULES &amp; CONTROLS
          </span>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-white px-2 py-1 bg-[#1e293b] rounded cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#cbd5e1]">
          <p>
            <strong className="text-white">Anomalous Environmental Physics:</strong>
            <br />• <strong>Biomass Partitions:</strong> Flammable reality-warping resin. Incinerates when exposed to fire (-10 HP/s).
            <br />• <strong>Fire Spread:</strong> Expands to adjacent flammable objects at approx 1 tile per second.
            <br />• <strong>Volatile Gas (ADR 003):</strong> Spreads 2x faster than fire. Toxic inhalation damage (-15 HP/s). Dissipates if unsupplied.
            <br />• <strong>CASCADING REACTION:</strong> If Fire touches Gas, it triggers an instant 1-tile AoE explosion, erasing Biomass Partitions and cascading flame waves!
          </p>
          <p>
            <strong className="text-white">Spacial Disruptors:</strong>
            <br />• 2.5s resonance fuse. Erases matter and biomass partitions in a 2-tile radius (50 AoE damage).
          </p>
          <p>
            <strong className="text-white">Echo Patrols &amp; Kinetic Melee:</strong>
            <br />• Time-looped security guards repeating patrol paths from 198X.
            <br />• <strong>Kinetic Melee Strike:</strong> Moving directly into an adjacent guard's tile executes an instantaneous melee punch (25 DMG + Overclock bonus), dealing damage without clipping through.
          </p>
          <p>
            <strong className="text-[#22d3ee]">Hive Nodes, Crawlers &amp; Overclock Scaling (ADR 005):</strong>
            <br />• <strong>Hive Blobs:</strong> Bioluminescent spawners that hatch twitching Crawlers when breached. Destroying them drops Anomalous Biomass Clusters and Resonance Sparks.
            <br />• <strong>Resonance Sparks:</strong> Collecting cyan sparks grants +1 Overclock stack (up to 10), adding +10 kinetic melee punch DMG per stack for 12 seconds.
          </p>
          <p>
            <strong className="text-white">Tether Points (Extraction):</strong>
            <br />• Stand on green dimensional anchor pads for 5 seconds to evacuate secured Ontological Salvage and Inert Matter back to the Faraday bunker.
          </p>
          <p>
            <strong className="text-[#fbbf24]">ADR 007 Autonomous Ballistics (DIVERT Engine):</strong>
            <br />• <strong>Automatic 360° Targeting:</strong> The Lead-Shielded Rig automatically scans line-of-sight and unleashes ballistics at nearest hostiles within firing cone (no manual mouse aiming required).
            <br />• <strong>Switch Hardpoint [X]:</strong> Toggle between the <em>Kinetic Scattergun</em> (28 DMG, 3.4/s, anti-organic knockback vs Crawlers/Blobs) and the <em>Plasma Pulse Array</em> (38 DMG, anti-armor penetrating beam vs Echo Guards &amp; The Apex Echo).
            <br />• <strong>Elemental Vulnerabilities:</strong> Crawlers take 1.6x from Kinetic buckshot; Armor-plated Echo Guards take 1.8x from Plasma bolts.
          </p>
          <p>
            <strong className="text-[#f87171]">Reality Collapse &amp; The Apex Echo (ADR 005):</strong>
            <br />• Containment decays over 180s (3:00). At 0% stability, a Reality Collapse occurs!
            <br />• Creeping perimeter Volatile Gas floods inward from sector boundaries (x=0,49 / y=0,49).
            <br />• <strong>THE APEX ECHO SPAWNS:</strong> A 1500 HP reality-warping singularity boss deploys at sector center. Slaying the Apex drops the ultra-rare <em>Apex Ontological Core</em> and 8 Resonance Sparks!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded font-bold transition cursor-pointer"
        >
          RESUME RAID
        </button>
      </div>
    </div>
  );
};
