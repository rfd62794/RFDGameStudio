import React from 'react';
import { GameState } from '../services/simulation';
import { MODULE_BLUEPRINTS } from '../data/recipes';
import { ModuleType } from '../types';
import {
  Bot,
  FlaskConical,
  Wind,
  Droplets,
  Boxes,
  Layers,
  Zap,
  Radio,
  Shield,
  Rocket,
  Lock,
  Plus,
  Wrench,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { soundEngine } from '../services/audio';

interface Props {
  gameState: GameState;
  onSelectBuildType: (type: ModuleType | null) => void;
  onSelectModule: (moduleId: string | null) => void;
  onDismantleModule: (moduleId: string) => void;
  onRepairModule: (moduleId: string) => void;
}

export const ConstructionPallet: React.FC<Props> = ({
  gameState,
  onSelectBuildType,
  onSelectModule,
  onDismantleModule,
  onRepairModule,
}) => {
  const selectedMod = gameState.modules.find((m) => m.id === gameState.selectedModuleId);
  const selectedBp = selectedMod ? MODULE_BLUEPRINTS[selectedMod.type] : null;

  const getModuleIcon = (type: ModuleType) => {
    switch (type) {
      case 'drone_bay':
        return <Bot className="w-5 h-5 text-cyan-400" />;
      case 'processing_chamber':
        return <FlaskConical className="w-5 h-5 text-purple-400" />;
      case 'containment_gas':
        return <Wind className="w-5 h-5 text-sky-400" />;
      case 'containment_liquid':
        return <Droplets className="w-5 h-5 text-emerald-400" />;
      case 'containment_solid':
        return <Boxes className="w-5 h-5 text-amber-400" />;
      case 'containment_dust':
        return <Layers className="w-5 h-5 text-slate-300" />;
      case 'power_cell':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'signal_array':
        return <Radio className="w-5 h-5 text-blue-400" />;
      case 'hull_plating':
        return <Shield className="w-5 h-5 text-slate-400" />;
      case 'ship_hangar':
        return <Rocket className="w-5 h-5 text-pink-400" />;
    }
  };

  return (
    <div id="construction-pallet-drawer" className="p-4 flex flex-col gap-6 select-none">
      {/* Selected Module Detail Panel (if any module on canvas is selected) */}
      {selectedMod && selectedBp && (
        <div
          id={`selected-module-inspector-${selectedMod.id}`}
          className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 flex flex-col gap-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center">
                {getModuleIcon(selectedMod.type)}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{selectedBp.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Coordinates: ({selectedMod.x}, {selectedMod.y}) • Level {selectedMod.level}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectModule(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
            >
              Deselect
            </button>
          </div>

          <p className="text-xs text-slate-300">{selectedBp.description}</p>

          {/* Module Health & Power Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">INTEGRITY:</span>
              <span
                className={
                  selectedMod.health < selectedMod.maxHealth ? 'text-red-400' : 'text-emerald-400'
                }
              >
                {Math.round(selectedMod.health)} / {selectedMod.maxHealth} HP
              </span>
            </div>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">POWER DEMAND:</span>
              <span className={selectedBp.powerCost < 0 ? 'text-amber-300' : 'text-slate-200'}>
                {selectedBp.powerCost < 0
                  ? `+${Math.abs(selectedBp.powerCost)} kW (Gen)`
                  : `${selectedBp.powerCost} kW (Draw)`}
              </span>
            </div>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">STATUS:</span>
              <span className={selectedMod.isPowered ? 'text-cyan-400' : 'text-amber-400'}>
                {selectedMod.isPowered ? 'Operational' : 'Unpowered'}
              </span>
            </div>
          </div>

          {/* Warning Message if any */}
          {selectedMod.warning && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{selectedMod.warning}</span>
            </div>
          )}

          {/* Action Buttons: Repair / Dismantle */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            {selectedMod.health < selectedMod.maxHealth && (
              <button
                id="btn-repair-module"
                onClick={() => {
                  onRepairModule(selectedMod.id);
                  soundEngine.playBuildClink();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-mono transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Instant Repair (Dust: {Math.round((selectedMod.maxHealth - selectedMod.health) * 0.25)})</span>
              </button>
            )}

            <button
              id="btn-dismantle-module"
              onClick={() => {
                onDismantleModule(selectedMod.id);
                soundEngine.playContainerHiss();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/40 text-xs font-mono transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dismantle (+{Math.round(selectedBp.dustCost * 0.6)} Dust refund)</span>
            </button>
          </div>
        </div>
      )}

      {/* Blueprint Catalog for Construction */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Station Construction Blueprints (Sandustry Physical Layout)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a structure blueprint and click an empty grid coordinate in the viewport to assemble.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(MODULE_BLUEPRINTS) as ModuleType[]).map((type) => {
            const bp = MODULE_BLUEPRINTS[type];
            const isUnlocked =
              bp.unlockedByDefault ||
              gameState.signalKeys.find((k) => k.id === bp.requiredKeyId)?.unlocked;
            const keyReq = gameState.signalKeys.find((k) => k.id === bp.requiredKeyId);
            const canAfford = gameState.dust >= bp.dustCost;
            const isSelectedToPlace = gameState.buildingTypeToPlace === type;

            return (
              <div
                key={type}
                id={`blueprint-card-${type}`}
                onClick={() => {
                  if (isUnlocked && canAfford) {
                    onSelectBuildType(isSelectedToPlace ? null : type);
                    soundEngine.playBuildClink();
                  }
                }}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    : isSelectedToPlace
                    ? 'bg-cyan-950/30 border-cyan-400 shadow-lg cursor-pointer ring-1 ring-cyan-400'
                    : canAfford
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer hover:bg-slate-900'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-75 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                        {getModuleIcon(type)}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200">{bp.name}</h3>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {bp.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className={canAfford ? 'text-slate-200 font-bold' : 'text-red-400 font-bold'}>
                        {bp.dustCost}
                      </span>
                      <span className="text-[10px] text-slate-400">Dust</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">{bp.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">
                    {bp.powerCost < 0
                      ? `+${Math.abs(bp.powerCost)} kW Power`
                      : bp.powerCost > 0
                      ? `-${bp.powerCost} kW Power`
                      : '0 kW Power'}
                  </span>

                  {isUnlocked ? (
                    <span
                      className={`px-2 py-0.5 rounded font-medium ${
                        isSelectedToPlace
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : canAfford
                          ? 'bg-slate-800 text-cyan-300'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {isSelectedToPlace ? 'PLACING...' : canAfford ? 'SELECT TO PLACE' : 'NEED DUST'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Lock className="w-3 h-3" />
                      <span>{keyReq?.name || 'Locked'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sandustry Layout Mechanics Reminder */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex flex-col gap-1.5 font-mono">
        <span className="text-slate-300 font-semibold uppercase text-[10px]">
          ★ Sandustry Layout Rules:
        </span>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
          <li>Containment Pods connect to adjacent Processing Chambers to feed synthesis recipes.</li>
          <li>Signal Arrays require station power from Power Cells to decode incoming bottles.</li>
          <li>
            Gas Tanks adjacent to reactive liquid Flasks without Hull Plating buffer create volatility!
          </li>
          <li>Hull Plating deflects incoming asteroid collisions and protects adjacent pods.</li>
        </ul>
      </div>
    </div>
  );
};
