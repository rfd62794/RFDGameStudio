import React from 'react';
import {
  Compass,
  Bomb,
  Flame,
  FlaskConical,
  PlusCircle,
  Radio,
  Crosshair,
} from 'lucide-react';
import { WeaponId } from '../../types';

interface RaidHotbarProps {
  selectedTool: 'move' | 'breach' | 'flare' | 'gas';
  setSelectedTool: (tool: 'move' | 'breach' | 'flare' | 'gas') => void;
  chargesLeft: number;
  flaresLeft: number;
  gasVialsLeft: number;
  medkitsLeft: number;
  luresLeft: number;
  realityCollapseActive: boolean;
  activeWeapon: WeaponId;
  currentMapType?: string;
  onPlantCharge: () => void;
  onIgniteFlare: () => void;
  onDeployGas: () => void;
  onUseMedkit: () => void;
  onDeployLure: () => void;
  onToggleWeapon: () => void;
}

export const RaidHotbar: React.FC<RaidHotbarProps> = ({
  selectedTool,
  setSelectedTool,
  chargesLeft,
  flaresLeft,
  gasVialsLeft,
  medkitsLeft,
  luresLeft,
  realityCollapseActive,
  activeWeapon,
  currentMapType,
  onPlantCharge,
  onIgniteFlare,
  onDeployGas,
  onUseMedkit,
  onDeployLure,
  onToggleWeapon,
}) => {
  return (
    <div
      id="raid-hotbar"
      className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 bg-[#0f172a]/95 backdrop-blur border border-[#334155] p-1.5 sm:p-2 rounded-xl shadow-2xl z-20 max-w-[96vw] overflow-x-auto"
    >
      <button
        id="btn-action-move"
        onClick={() => setSelectedTool('move')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
          selectedTool === 'move'
            ? 'bg-[#3b82f6] text-white shadow-md'
            : 'bg-[#1e293b] text-[#94a3b8] hover:text-white'
        }`}
      >
        <Compass className="w-4 h-4" />
        <span>[WASD] MOVE</span>
      </button>

      <button
        id="btn-action-breach"
        onClick={() => {
          setSelectedTool('breach');
          onPlantCharge();
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
          selectedTool === 'breach'
            ? 'bg-[#ef4444] text-white shadow-md'
            : 'bg-[#1e293b] text-[#94a3b8] hover:text-white'
        } ${chargesLeft === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={chargesLeft === 0}
      >
        <Bomb className="w-4 h-4 text-red-300" />
        <span>[SPACE] DISRUPTOR ({chargesLeft})</span>
      </button>

      <button
        id="btn-action-flare"
        onClick={() => {
          setSelectedTool('flare');
          onIgniteFlare();
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
          selectedTool === 'flare'
            ? 'bg-[#f97316] text-white shadow-md'
            : 'bg-[#1e293b] text-[#94a3b8] hover:text-white'
        } ${flaresLeft === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={flaresLeft === 0}
      >
        <Flame className="w-4 h-4 text-orange-300" />
        <span>[F] THERMAL FLARE ({flaresLeft})</span>
      </button>

      <button
        id="btn-action-gas"
        onClick={() => {
          setSelectedTool('gas');
          onDeployGas();
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
          selectedTool === 'gas'
            ? 'bg-[#84cc16] text-white shadow-md'
            : 'bg-[#1e293b] text-[#94a3b8] hover:text-white'
        } ${gasVialsLeft === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={gasVialsLeft === 0}
      >
        <FlaskConical className="w-4 h-4 text-lime-400" />
        <span>[G] VOLATILE GAS ({gasVialsLeft})</span>
      </button>

      <button
        id="btn-action-medkit"
        onClick={onUseMedkit}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition bg-[#1e293b] text-[#94a3b8] hover:text-white cursor-pointer ${
          medkitsLeft === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={medkitsLeft === 0}
      >
        <PlusCircle className="w-4 h-4 text-emerald-400" />
        <span>[E] TRAUMA PATCH ({medkitsLeft})</span>
      </button>

      <button
        id="btn-action-lure"
        onClick={onDeployLure}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition bg-[#1e293b] text-[#94a3b8] hover:text-white cursor-pointer ${
          luresLeft === 0 || realityCollapseActive || currentMapType === 'overworld'
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:border-[#06b6d4] text-[#a5f3fc] border border-[#0891b2]/40'
        }`}
        disabled={luresLeft === 0 || realityCollapseActive || currentMapType === 'overworld'}
        title={
          currentMapType === 'overworld'
            ? 'Sanctuary Safe Zone Protected: Dimensional Lures can only be deployed in hostile Dungeons'
            : 'Engage Tachyon Resonant Beacon to rupture reality early and summon the Apex Echo'
        }
      >
        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span>[T] LURE ({luresLeft})</span>
      </button>

      {/* Hardpoint Weapon Toggle Button */}
      <button
        id="btn-action-weapon-toggle"
        onClick={onToggleWeapon}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
          activeWeapon === 'plasma_pulse_array'
            ? 'bg-[#083344] border border-[#22d3ee] text-[#22d3ee] shadow-sm'
            : 'bg-[#854d0e]/40 border border-[#fbbf24] text-[#fbbf24] shadow-sm'
        }`}
        title="Switch Rig Hardpoint Weapon Matrix [X]"
      >
        <Crosshair className="w-4 h-4" />
        <span>[X] {activeWeapon === 'plasma_pulse_array' ? 'PLASMA' : 'KINETIC'}</span>
      </button>
    </div>
  );
};
