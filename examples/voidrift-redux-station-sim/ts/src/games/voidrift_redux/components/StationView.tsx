import React, { useRef, useState, useEffect } from 'react';
import { GameState } from '../types';
import { MODULE_BLUEPRINTS } from '../data/recipes';
import { MaterialCanvas } from './MaterialCanvas';
import { Zap, Bot, FlaskConical, Wind, Droplets, Boxes, Layers, Radio, Shield, Rocket } from 'lucide-react';

interface Props {
  gameState: GameState;
  gameStateRef: React.MutableRefObject<GameState>;
  onSelectModule: (moduleId: string | null) => void;
}

export const StationView: React.FC<Props> = ({ gameState, gameStateRef, onSelectModule }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      setDimensions({
        width: el.clientWidth || 800,
        height: el.clientHeight || 600,
      });
    };

    updateDimensions();

    const ro = new ResizeObserver(() => {
      updateDimensions();
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'drone_bay': return <Bot className="w-5 h-5 text-cyan-400" />;
      case 'processing_chamber': return <FlaskConical className="w-5 h-5 text-purple-400" />;
      case 'containment_gas': return <Wind className="w-5 h-5 text-sky-400" />;
      case 'containment_liquid': return <Droplets className="w-5 h-5 text-emerald-400" />;
      case 'containment_solid': return <Boxes className="w-5 h-5 text-amber-400" />;
      case 'containment_dust': return <Layers className="w-5 h-5 text-slate-300" />;
      case 'power_cell': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'signal_array': return <Radio className="w-5 h-5 text-blue-400" />;
      case 'hull_plating': return <Shield className="w-5 h-5 text-slate-400" />;
      case 'ship_hangar': return <Rocket className="w-5 h-5 text-pink-400" />;
      default: return <Zap className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="station-grid-container flex flex-col gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800 relative overflow-hidden"
    >
      <div className="flex items-center justify-between z-0">
        <h2 className="text-sm font-semibold text-slate-200">Station Grid Layout (Sandustry Physicality)</h2>
        <span className="text-xs font-mono text-slate-400">{gameState.modules.length} Connected Modules</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 z-0">
        {gameState.modules.map((mod) => {
          const bp = MODULE_BLUEPRINTS[mod.type];
          const isSelected = gameState.selectedModuleId === mod.id;
          const healthPct = Math.round((mod.health / mod.maxHealth) * 100);

          return (
            <div
              key={mod.id}
              data-module-id={mod.id}
              onClick={() => onSelectModule(isSelected ? null : mod.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative z-0 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {getIcon(mod.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">{bp?.name || mod.type}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Grid ({mod.x}, {mod.y})
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    mod.isPowered ? 'bg-cyan-950 text-cyan-400' : 'bg-red-950 text-red-400'
                  }`}
                >
                  {mod.isPowered ? 'Powered' : 'Unpowered'}
                </span>
              </div>

              {/* Health integrity */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Integrity:</span>
                  <span className={healthPct < 50 ? 'text-red-400' : 'text-emerald-400'}>{healthPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${healthPct < 40 ? 'bg-red-500' : healthPct < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${healthPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MaterialCanvas
        gameStateRef={gameStateRef}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};
