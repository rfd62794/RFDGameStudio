import React from 'react';
import {
  ShieldCheck,
  Compass,
  Lock,
  Crosshair,
  Bomb,
  Zap,
  Flame,
  Radio,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { HideoutState, SectorId, WeaponId } from '../../types';

interface DeploymentBayPanelProps {
  hideout: HideoutState;
  equippedWeapon: WeaponId;
  setEquippedWeaponState: (weapon: WeaponId) => void;
  equippedCharges: number;
  setEquippedCharges: React.Dispatch<React.SetStateAction<number>>;
  equippedEmp: number;
  setEquippedEmp: React.Dispatch<React.SetStateAction<number>>;
  equippedFlares: number;
  setEquippedFlares: React.Dispatch<React.SetStateAction<number>>;
  equippedLures: number;
  setEquippedLures: React.Dispatch<React.SetStateAction<number>>;
  setSelectedSector: (sector: SectorId) => void;
  isSectorUnlocked: (sector: SectorId) => boolean;
  onDeploy: () => void;
}

export const DeploymentBayPanel: React.FC<DeploymentBayPanelProps> = ({
  hideout,
  equippedWeapon,
  setEquippedWeaponState,
  equippedCharges,
  setEquippedCharges,
  equippedEmp,
  setEquippedEmp,
  equippedFlares,
  setEquippedFlares,
  equippedLures,
  setEquippedLures,
  setSelectedSector,
  isSectorUnlocked,
  onDeploy,
}) => {
  return (
    <section className="lg:col-span-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col justify-between font-mono">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#34d399]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">TACTICAL ARMORY &amp; LOADOUT</h2>
              <span className="text-[10px] text-[#64748b]">ADR 006: SECTOR ROUTING &amp; RELIC GATE NETWORK</span>
            </div>
          </div>
          <span className="text-[10px] text-[#34d399] font-bold">READY FOR INSERTION</span>
        </div>

        {/* ADR 006: SECTOR ROUTING MATRIX (Core Keeper Biome Gate) */}
        <div className="bg-[#0b0e14] border border-[#1e293b] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#38bdf8]" />
              SECTOR ROUTING NETWORK
            </span>
            <span className="text-[10px] text-[#94a3b8]">
              CURRENT ROUTE:{' '}
              <span className="text-[#38bdf8] font-bold">
                {hideout.selectedSector === 'sector_02' ? 'SECTOR 02' : 'SECTOR 01'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* SECTOR 01 */}
            <div
              onClick={() => setSelectedSector('sector_01')}
              className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                (hideout.selectedSector || 'sector_01') === 'sector_01'
                  ? 'bg-[#0369a1]/20 border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                  : 'bg-[#141d2b] border-[#1e293b] hover:border-[#334155]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">SECTOR 01: LOGISTICS</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                    ALPHA TIER
                  </span>
                </div>
                <p className="text-[10px] text-[#94a3b8] leading-tight mb-2">
                  Perimeter warehouse &amp; server matrix. Primary tags: [Volatile], [Conductive], Scrap.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#1e293b]">
                <span className="text-[#64748b]">Atmosphere: Normal</span>
                <span
                  className={`font-bold ${
                    (hideout.selectedSector || 'sector_01') === 'sector_01'
                      ? 'text-[#38bdf8]'
                      : 'text-[#94a3b8]'
                  }`}
                >
                  {(hideout.selectedSector || 'sector_01') === 'sector_01' ? '● SELECTED' : 'SELECT'}
                </span>
              </div>
            </div>

            {/* SECTOR 02 */}
            {isSectorUnlocked('sector_02') ? (
              <div
                onClick={() => setSelectedSector('sector_02')}
                className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                  hideout.selectedSector === 'sector_02'
                    ? 'bg-[#083344]/40 border-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-[#141d2b] border-[#1e293b] hover:border-[#334155]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#cffafe]">SECTOR 02: SUB-CORE</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#06b6d4]/20 text-[#22d3ee] border border-[#06b6d4]/30 animate-pulse">
                      OMEGA TIER
                    </span>
                  </div>
                  <p className="text-[10px] text-[#94a3b8] leading-tight mb-2">
                    High-density crystalline memory partitions. Tags: [Sub-Space], [Anomalous], [Tachyon].
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#1e293b]">
                  <span
                    className={
                      hideout.hasHazmatRig ? 'text-[#34d399]' : 'text-[#f87171] font-bold animate-pulse'
                    }
                  >
                    {hideout.hasHazmatRig ? '🛡️ Rig Active' : '⚠️ Toxic Rad'}
                  </span>
                  <span
                    className={`font-bold ${
                      hideout.selectedSector === 'sector_02' ? 'text-[#06b6d4]' : 'text-[#94a3b8]'
                    }`}
                  >
                    {hideout.selectedSector === 'sector_02' ? '● SELECTED' : 'SELECT'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#334155]/60 bg-[#090d13]/80 flex flex-col justify-between opacity-80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#94a3b8] flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#ef4444]" />
                      SEC-02: SUB-CORE
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#fca5a5] border border-[#ef4444]/30">
                      LOCKED
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748b] leading-tight mb-2">
                    Gated by Relic Protocol. Requires extracting 1x Relic Ontological Core from The Apex Echo in
                    Sector 01.
                  </p>
                </div>
                <div className="text-[9px] text-[#f87171] font-mono pt-1.5 border-t border-[#1e293b] flex items-center gap-1">
                  <span>Apex Relic Required</span>
                </div>
              </div>
            )}
          </div>

          {/* Hazmat Rig Indicator for Sector 02 */}
          <div className="text-[10px] px-2.5 py-1 rounded bg-[#141d2b] border border-[#1e293b] flex items-center justify-between text-[#94a3b8]">
            <span>QUARANTINE HAZMAT SUIT RIG:</span>
            {hideout.hasHazmatRig ? (
              <span className="text-[#34d399] font-bold">INSTALLED (RAD IMMUNITY)</span>
            ) : (
              <span className="text-[#f59e0b]">NOT INSTALLED (CRAFT VIA RESEARCH WORKBENCH)</span>
            )}
          </div>
        </div>

        {/* ADR 007: AUTONOMOUS HARDPOINT MATRIX SELECTION */}
        <div className="bg-[#0b0e14] border border-[#1e293b] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-[#fbbf24]" />
              RIG HARDPOINT WEAPON MATRIX (ADR 007)
            </span>
            <span className="text-[10px] text-[#fbbf24] font-bold">
              AUTO-ENGAGE 360° LOS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Kinetic Scattergun */}
            <div
              onClick={() => setEquippedWeaponState('kinetic_scattergun')}
              className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                equippedWeapon === 'kinetic_scattergun'
                  ? 'bg-[#854d0e]/25 border-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                  : 'bg-[#141d2b] border-[#1e293b] hover:border-[#334155]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#fef08a]">KINETIC SCATTERGUN</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/30">
                    ANTI-ORGANIC
                  </span>
                </div>
                <p className="text-[10px] text-[#94a3b8] leading-tight mb-2">
                  Rapid tungsten buckshot. 1.6x damage + knockback push vs Resonance Crawlers &amp; Hive Blobs.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#1e293b]">
                <span className="text-[#64748b]">28 DMG // 3.4/s</span>
                <span
                  className={`font-bold ${
                    equippedWeapon === 'kinetic_scattergun' ? 'text-[#fbbf24]' : 'text-[#94a3b8]'
                  }`}
                >
                  {equippedWeapon === 'kinetic_scattergun' ? '● MOUNTED' : 'MOUNT'}
                </span>
              </div>
            </div>

            {/* Plasma Pulse Array */}
            {hideout.unlockedWeapons?.includes('plasma_pulse_array') ? (
              <div
                onClick={() => setEquippedWeaponState('plasma_pulse_array')}
                className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                  equippedWeapon === 'plasma_pulse_array'
                    ? 'bg-[#083344]/50 border-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : 'bg-[#141d2b] border-[#1e293b] hover:border-[#334155]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#cffafe]">PLASMA PULSE ARRAY</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#06b6d4]/20 text-[#22d3ee] border border-[#06b6d4]/30">
                      ANTI-ARMOR
                    </span>
                  </div>
                  <p className="text-[10px] text-[#94a3b8] leading-tight mb-2">
                    Ionized thermal beam. Penetrates targets; 1.8x-2.0x damage vs Echo Guards &amp; The Apex Echo.
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#1e293b]">
                  <span className="text-[#64748b]">38 DMG // Piercing</span>
                  <span
                    className={`font-bold ${
                      equippedWeapon === 'plasma_pulse_array' ? 'text-[#22d3ee]' : 'text-[#94a3b8]'
                    }`}
                  >
                    {equippedWeapon === 'plasma_pulse_array' ? '● MOUNTED' : 'MOUNT'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#334155]/60 bg-[#090d13]/80 flex flex-col justify-between opacity-80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#94a3b8] flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#ef4444]" />
                      PLASMA PULSE ARRAY
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#fca5a5] border border-[#ef4444]/30">
                      CRAFTABLE
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748b] leading-tight mb-2">
                    Schematic locked or uncrafted. Craft via Research Workbench with [Conductive] &amp; [Sub-Space] Salvage.
                  </p>
                </div>
                <div className="text-[9px] text-[#38bdf8] font-mono pt-1.5 border-t border-[#1e293b]">
                  <span>Workbench Blueprint T1</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Munitions Loadout Selection */}
        <div className="bg-[#141d2b] border border-[#1e293b] rounded-xl p-4 space-y-3">
          {/* Breaching Charges */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#94a3b8] flex items-center gap-2">
              <Bomb className="w-4 h-4 text-[#ef4444]" />
              C4 Breaching Charges (Stash: {hideout.breachingChargesInStash}):
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEquippedCharges((prev) => Math.max(0, prev - 1))}
                className="w-6 h-6 rounded bg-[#1e293b] hover:bg-[#334155] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-white">{equippedCharges}</span>
              <button
                onClick={() =>
                  setEquippedCharges((prev) =>
                    Math.min(hideout.breachingChargesInStash, prev + 1)
                  )
                }
                disabled={equippedCharges >= hideout.breachingChargesInStash}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold ${
                  equippedCharges < hideout.breachingChargesInStash
                    ? 'bg-[#1e293b] hover:bg-[#334155] text-white cursor-pointer'
                    : 'bg-[#141d2b] text-[#475569] cursor-not-allowed'
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* EMP Grenades */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
            <span className="text-xs text-[#94a3b8] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#38bdf8]" />
              Scrap EMP Disrupters (Stash: {hideout.empGrenadesInStash}):
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEquippedEmp((prev) => Math.max(0, prev - 1))}
                className="w-6 h-6 rounded bg-[#1e293b] hover:bg-[#334155] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-white">{equippedEmp}</span>
              <button
                onClick={() =>
                  setEquippedEmp((prev) =>
                    Math.min(hideout.empGrenadesInStash, prev + 1)
                  )
                }
                disabled={equippedEmp >= hideout.empGrenadesInStash}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold ${
                  equippedEmp < hideout.empGrenadesInStash
                    ? 'bg-[#1e293b] hover:bg-[#334155] text-white cursor-pointer'
                    : 'bg-[#141d2b] text-[#475569] cursor-not-allowed'
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* Thermite Flares */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
            <span className="text-xs text-[#94a3b8] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#fb923c]" />
              Thermite Combat Flares (Stash: {hideout.thermiteFlaresInStash}):
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEquippedFlares((prev) => Math.max(0, prev - 1))}
                className="w-6 h-6 rounded bg-[#1e293b] hover:bg-[#334155] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-white">{equippedFlares}</span>
              <button
                onClick={() =>
                  setEquippedFlares((prev) =>
                    Math.min(hideout.thermiteFlaresInStash, prev + 1)
                  )
                }
                disabled={equippedFlares >= hideout.thermiteFlaresInStash}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold ${
                  equippedFlares < hideout.thermiteFlaresInStash
                    ? 'bg-[#1e293b] hover:bg-[#334155] text-white cursor-pointer'
                    : 'bg-[#141d2b] text-[#475569] cursor-not-allowed'
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* Dimensional Lures (ADR 006: Tachyon Summon Beacon) */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
            <div>
              <span className="text-xs text-[#94a3b8] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#06b6d4]" />
                Dimensional Lures (Stash: {hideout.dimensionalLuresInStash}):
              </span>
              <span className="text-[9px] text-[#64748b] ml-6 block">
                Summons Apex Echo instantly in-raid
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEquippedLures((prev) => Math.max(0, prev - 1))}
                className="w-6 h-6 rounded bg-[#1e293b] hover:bg-[#334155] text-white flex items-center justify-center font-bold cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-white">{equippedLures}</span>
              <button
                onClick={() =>
                  setEquippedLures((prev) =>
                    Math.min(hideout.dimensionalLuresInStash, prev + 1)
                  )
                }
                disabled={equippedLures >= hideout.dimensionalLuresInStash}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold ${
                  equippedLures < hideout.dimensionalLuresInStash
                    ? 'bg-[#1e293b] hover:bg-[#334155] text-white cursor-pointer'
                    : 'bg-[#141d2b] text-[#475569] cursor-not-allowed'
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* Emergency Medkit */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs">
            <span className="text-[#94a3b8] flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#10b981]" />
              Emergency Field Medkit:
            </span>
            <span className="font-bold text-white">1 Standard Issue</span>
          </div>
        </div>

        {/* Tactical Sector Intel */}
        <div className="bg-[#0b0e14] border border-[#1e293b] rounded-xl p-3.5 space-y-2 text-xs text-[#94a3b8]">
          <div className="text-white font-bold flex items-center justify-between">
            <span>
              {hideout.selectedSector === 'sector_02'
                ? 'SECTOR 02: SUB-CORE INTEL'
                : 'SECTOR 01: LOGISTICS INTEL'}
            </span>
            <span
              className={
                hideout.selectedSector === 'sector_02' ? 'text-[#06b6d4]' : 'text-[#ef4444]'
              }
            >
              {hideout.selectedSector === 'sector_02' ? 'OMEGA LEVEL' : 'ALPHA LEVEL'}
            </span>
          </div>
          {hideout.selectedSector === 'sector_02' ? (
            <ul className="space-y-1 text-[11px] list-disc list-inside text-[#cbd5e1]">
              <li>Crystalline partitions require heavy explosive breaches or Overclock</li>
              <li>Guaranteed [Sub-Space] &amp; [Tachyon] tech components in central core</li>
              <li>
                {hideout.hasHazmatRig
                  ? 'Lead-Shielded Rig active: Atmospheric radiation negated'
                  : '⚠️ WARNING: -3 HP/2s corrosive damage without Hazmat Rig'}
              </li>
              <li>Apex Echo spawns in sub-space overdrive mode</li>
            </ul>
          ) : (
            <ul className="space-y-1 text-[11px] list-disc list-inside text-[#cbd5e1]">
              <li>Central Security Vault contains Encrypted Server Drives</li>
              <li>East Generator Labs contain Volatile Solvent Canisters</li>
              <li>Apex Echo manifests upon Reality Collapse (3:00) or via Lure [T]</li>
              <li>Hold extraction pads for 5.0 seconds to secure all loot and relics</li>
            </ul>
          )}
        </div>
      </div>

      {/* DEPLOY BUTTON */}
      <div className="pt-4 border-t border-[#1e293b]">
        <button
          id="btn-deploy-raid"
          onClick={onDeploy}
          className="w-full py-3.5 px-4 rounded-xl font-mono text-sm font-bold bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white shadow-xl hover:shadow-[#10b981]/20 transition flex items-center justify-center gap-2 tracking-wider cursor-pointer"
        >
          <span>
            DEPLOY TO {hideout.selectedSector === 'sector_02' ? 'SECTOR 02 (SUB-CORE)' : 'SECTOR 01 (LOGISTICS)'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
