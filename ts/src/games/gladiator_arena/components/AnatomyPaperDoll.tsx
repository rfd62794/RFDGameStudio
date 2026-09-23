/**
 * Gladiator Arena — Anatomy Paper Doll Component
 * Visualizes continuous 6-part anatomy state, scars, efficiency, and cyber-organic leans.
 */

import React from 'react';
import { BodySlot, Gladiator } from '../types';
import { calculatePartEfficiency } from '../../../engine/shared/anatomy';
import { Zap, Dna, Cpu, HeartCrack } from 'lucide-react';

interface AnatomyPaperDollProps {
  gladiator: Gladiator;
  selectedSlot?: BodySlot;
  onSelectSlot?: (slot: BodySlot) => void;
  compact?: boolean;
  readOnly?: boolean;
}

export const AnatomyPaperDoll: React.FC<AnatomyPaperDollProps> = ({
  gladiator,
  selectedSlot,
  onSelectSlot,
  compact = false,
  readOnly = false,
}) => {
  const parts = gladiator.parts;

  const renderSlotCard = (slot: BodySlot, label: string) => {
    const part = parts[slot];
    if (!part) return null;

    const efficiency = calculatePartEfficiency(part);
    const effPercent = Math.round(efficiency * 100);
    const isSelected = selectedSlot === slot;
    const isCrippled = part.currentHp <= 0;
    const isScarred = part.scarHpPenalty > 0;

    // Color coding based on efficiency
    let statusBg = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300';
    let barColor = 'bg-emerald-500';

    if (isCrippled) {
      statusBg = 'bg-red-950/80 border-red-600 text-red-400 animate-pulse';
      barColor = 'bg-red-600';
    } else if (effPercent < 40) {
      statusBg = 'bg-red-950/40 border-red-500/50 text-red-300';
      barColor = 'bg-red-500';
    } else if (effPercent < 75) {
      statusBg = 'bg-amber-950/40 border-amber-500/40 text-amber-300';
      barColor = 'bg-amber-500';
    }

    // Origin Badge
    const isCyber = part.cyberOrganicLean > 0.3;
    const isBio = part.cyberOrganicLean < -0.3;
    const originIcon = isCyber ? (
      <Zap className="w-3 h-3 text-cyan-400" />
    ) : isBio ? (
      <Dna className="w-3 h-3 text-emerald-400" />
    ) : (
      <Cpu className="w-3 h-3 text-amber-400" />
    );

    return (
      <button
        type="button"
        id={`anatomy-slot-${slot}`}
        onClick={() => !readOnly && onSelectSlot && onSelectSlot(slot)}
        disabled={readOnly}
        className={`relative text-left p-2.5 rounded-xl border transition-all ${statusBg} ${
          isSelected ? 'ring-2 ring-amber-400 border-amber-400 shadow-lg scale-[1.02]' : 'hover:border-stone-500'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {originIcon}
            <span className="text-xs font-bold uppercase tracking-wider text-stone-200 truncate">
              {label}
            </span>
          </div>
          <span className={`text-xs font-mono font-bold ${isCrippled ? 'text-red-400' : 'text-stone-300'}`}>
            {effPercent}% Eff
          </span>
        </div>

        {/* Part Name */}
        <div className="text-xs font-medium text-stone-100 truncate mb-1.5" title={part.name}>
          {part.name}
        </div>

        {/* Continuous HP Progress Bar */}
        <div className="w-full bg-stone-900/90 rounded-full h-2 overflow-hidden flex border border-stone-800">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.min(100, (part.currentHp / part.maxHp) * 100)}%` }}
          />
          {/* Scar penalty indicator */}
          {isScarred && (
            <div
              className="h-full bg-red-950 border-l border-red-500/80"
              style={{ width: `${(part.scarHpPenalty / part.maxHp) * 100}%` }}
              title={`Permanent Scar Penalty: -${part.scarHpPenalty} Max HP`}
            />
          )}
        </div>

        {/* HP numbers and indicators */}
        <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-stone-400">
          <span>
            {part.currentHp}/{part.maxHp} HP
          </span>
          <div className="flex items-center gap-1">
            {isScarred && (
              <span className="flex items-center text-red-400" title={`-${part.scarHpPenalty} HP Scar`}>
                <HeartCrack className="w-2.5 h-2.5 mr-0.5" />
                -{part.scarHpPenalty}
              </span>
            )}
            <span
              className={`font-semibold ${
                part.cyberOrganicLean > 0
                  ? 'text-cyan-400'
                  : part.cyberOrganicLean < 0
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {part.cyberOrganicLean > 0 ? `+${part.cyberOrganicLean.toFixed(1)}` : part.cyberOrganicLean.toFixed(1)}
            </span>
          </div>
        </div>
      </button>
    );
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {renderSlotCard('head', 'Head')}
        {renderSlotCard('torso', 'Torso')}
        {renderSlotCard('left_arm', 'L-Arm')}
        {renderSlotCard('right_arm', 'R-Arm')}
        {renderSlotCard('left_leg', 'L-Leg')}
        {renderSlotCard('right_leg', 'R-Leg')}
      </div>
    );
  }

  return (
    <div className="relative bg-stone-950/80 p-4 rounded-2xl border border-stone-800 flex flex-col gap-3">
      {/* Visual Silhouette diagram arrangement */}
      <div className="flex justify-center mb-1">
        <div className="w-full max-w-sm">{renderSlotCard('head', 'Head (Targeting / Accuracy)')}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 items-center">
        <div>{renderSlotCard('left_arm', 'Left Arm (Shield / Guard)')}</div>
        <div>{renderSlotCard('torso', 'Torso Core (Vital Chassis)')}</div>
        <div>{renderSlotCard('right_arm', 'Right Arm (Primary Weapon)')}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
        <div>{renderSlotCard('left_leg', 'Left Leg (Mobility)')}</div>
        <div>{renderSlotCard('right_leg', 'Right Leg (Traction)')}</div>
      </div>
    </div>
  );
};
