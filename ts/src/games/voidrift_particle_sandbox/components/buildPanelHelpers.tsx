import React from 'react';
import { BuildingCategory, BuildingDef, ContainerType, MaterialType, MATERIAL_DEFS } from '../types';
import { ArrowRight } from 'lucide-react';

// Goal calculation for top goal bar
export const getGoalData = (currentTier: number, storedCounts: Record<number, number>) => {
  if (currentTier === 1) {
    const current = storedCounts[MaterialType.STRUCTURAL_SOLID] || 0;
    const target = 100;
    const pct = Math.min(100, Math.floor((current / target) * 100));
    return {
      tierLabel: 'TIER 1 GOAL',
      materialName: 'Structural Solid',
      current,
      target,
      pct,
      color: '#9ab09a',
    };
  } else if (currentTier === 2) {
    const current = storedCounts[MaterialType.VOID_CRYSTAL] || 0;
    const target = 80;
    const pct = Math.min(100, Math.floor((current / target) * 100));
    return {
      tierLabel: 'TIER 2 GOAL',
      materialName: 'Void Crystal',
      current,
      target,
      pct,
      color: '#b8a0ff',
    };
  } else if (currentTier === 3) {
    const current = storedCounts[MaterialType.LUMINITE] || 0;
    const target = 20;
    const pct = Math.min(100, Math.floor((current / target) * 100));
    return {
      tierLabel: 'TIER 3 GOAL',
      materialName: 'Luminite',
      current,
      target,
      pct,
      color: '#ffe080',
    };
  } else {
    return {
      tierLabel: 'TIER 4 GOAL',
      materialName: 'Reconstruction Active',
      current: 5,
      target: 5,
      pct: 100,
      color: '#f59e0b',
    };
  }
};

// Helper for rendering preview graphics inside 130x80 cards
export const renderCardGraphic = (def: BuildingDef) => {
  if (def.category === BuildingCategory.COLLECTOR) {
    const color =
      def.id === 'collector_universal'
        ? '#9c88ff'
        : def.acceptedMaterials
        ? MATERIAL_DEFS[def.acceptedMaterials[0]]?.color || '#38bdf8'
        : '#38bdf8';
    return (
      <div className="w-full h-8 flex items-center justify-center relative">
        <div className="w-10 h-7 bg-[#141b2c] border border-cyan-500/40 rounded flex flex-col items-center justify-between p-1">
          <div
            className="w-7 h-2 rounded-t-sm"
            style={{ backgroundColor: color }}
          />
          <div className="w-2.5 h-1.5 bg-amber-500 rounded-b-sm" />
        </div>
      </div>
    );
  }

  if (def.category === BuildingCategory.CONTAINER) {
    const matColor =
      def.containerType === ContainerType.GAS_TANK
        ? '#7ab8d4'
        : def.containerType === ContainerType.LIQUID_FLASK
        ? '#3a7abf'
        : def.containerType === ContainerType.SOLID_BIN
        ? '#9ab09a'
        : '#c8b89a';
    return (
      <div className="w-full h-8 flex items-center justify-center">
        <div className="w-8 h-7 bg-[#141b2c] border border-purple-500/40 rounded flex flex-col items-center justify-between p-0.5 relative overflow-hidden">
          <div className="w-3 h-1 bg-emerald-500 rounded-t-sm" />
          <div
            className="w-full h-3 rounded-sm opacity-80"
            style={{ backgroundColor: matColor }}
          />
          <div className="w-3 h-1 bg-amber-500 rounded-b-sm" />
        </div>
      </div>
    );
  }

  if (def.category === BuildingCategory.PROCESSOR) {
    const pColor =
      def.processorType === 'COMPRESSOR'
        ? '#c8b89a'
        : def.processorType === 'CONDENSER'
        ? '#88aacc'
        : def.processorType === 'SEPARATOR'
        ? '#c8a04a'
        : def.processorType === 'PLASMA_FORGE'
        ? '#ff6a00'
        : '#ffe080';
    return (
      <div className="w-full h-8 flex items-center justify-center">
        <div className="w-9 h-7 bg-[#141b2c] border border-amber-500/40 rounded flex items-center justify-center relative">
          <div
            className="w-4 h-4 rounded-full border border-black/40 animate-pulse"
            style={{ backgroundColor: pColor }}
          />
        </div>
      </div>
    );
  }

  if (def.category === BuildingCategory.PIPE) {
    return (
      <div className="w-full h-8 flex items-center justify-center">
        <div className="w-8 h-6 bg-[#161d2d] border border-slate-600 rounded flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-cyan-300" />
        </div>
      </div>
    );
  }

  // Structural wall
  return (
    <div className="w-full h-8 flex items-center justify-center">
      <div className="w-7 h-6 bg-[#9ab09a]/80 border border-[#9ab09a] rounded shadow-inner" />
    </div>
  );
};
