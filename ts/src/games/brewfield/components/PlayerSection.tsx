import { motion } from 'framer-motion';
import { Heart, Shield, Zap, Layers, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import type { ElementType, ComponentType, PlayerState } from '../types';
import { getElementColor, getComponentColor } from '../gameLogic';

interface PlayerSectionProps {
  player: PlayerState;
  hand: ElementType[];
  selectedElements: (number | null)[];
  activeComponent: ComponentType | null;
  drawPileSize: number;
  discardPileSize: number;
  onSelectElement: (cardIndex: number) => void;
  onSelectComponent: (component: ComponentType) => void;
}

export default function PlayerSection({
  player,
  hand,
  selectedElements,
  activeComponent,
  drawPileSize,
  discardPileSize,
  onSelectElement,
  onSelectComponent,
}: PlayerSectionProps) {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

  const renderElementCard = (element: ElementType, index: number) => {
    const isSelected = selectedElements.includes(index);
    const color = getElementColor(element);

    return (
      <motion.button
        key={index}
        whileHover={{ y: -6, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onSelectElement(index)}
        className={`w-28 h-40 rounded-xl border-2 p-3 flex flex-col justify-between cursor-pointer text-left transition-all duration-200 select-none relative shadow-md
          ${
            isSelected
              ? 'opacity-35 cursor-default translate-y-3 border-dashed border-stone-800 bg-stone-900/30'
              : 'bg-stone-900 hover:bg-stone-850'
          }
        `}
        style={!isSelected ? { borderColor: color } : {}}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-stone-500">
            Element
          </span>
          {!isSelected && (
            <div
              className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: color, color }}
            />
          )}
        </div>

        <div className="my-auto text-center flex flex-col items-center">
          <span
            className="text-3xl font-extrabold capitalize select-none font-serif"
            style={!isSelected ? { color } : { color: '#444' }}
          >
            {element[0].toUpperCase()}
          </span>
          <span className="text-[10px] font-mono tracking-tight font-semibold mt-1 text-stone-400 capitalize">
            {element}
          </span>
        </div>

        <div className="text-[8px] text-stone-500 font-mono leading-tight">
          {element === 'fire' && 'Aggressive Burn'}
          {element === 'water' && 'Healing Flow'}
          {element === 'earth' && 'Solid Guard'}
          {element === 'air' && 'Quick Evasion'}
        </div>

        {isSelected && (
          <div className="absolute inset-0 bg-stone-950/20 rounded-xl flex items-center justify-center">
            <span className="text-[8px] font-mono font-extrabold uppercase tracking-widest bg-stone-900 px-2 py-1 rounded border border-stone-800 text-stone-500 shadow-sm">
              In Pot
            </span>
          </div>
        )}
      </motion.button>
    );
  };

  const getComponentDesc = (comp: ComponentType) => {
    switch (comp) {
      case 'strike':
        return 'Focuses pure energy into an offensive wave (Damage).';
      case 'ward':
        return 'Hardens alchemical aura to absorb strikes (Shield).';
      case 'mend':
        return 'Rejuvenates raw physical tissue (Healing).';
      case 'blight':
        return 'Decays core structure over multiple turns (Damage-over-Time).';
    }
  };

  return (
    <div className="w-full flex flex-col gap-6" id="player-section">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-stone-900/40 border border-stone-900/60 p-4 rounded-xl">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Alchemist Status
            </span>
            <div className="flex items-center gap-2">
              {player.shield > 0 && (
                <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded text-[10px] font-mono font-extrabold shadow-sm">
                  <Shield className="w-3 h-3 fill-blue-400" />
                  {player.shield} SHIELD
                </span>
              )}
              {player.dodgeCharges > 0 && (
                <span className="inline-flex items-center gap-1 bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800/40 px-2 py-0.5 rounded text-[10px] font-mono font-extrabold shadow-sm">
                  <Eye className="w-3 h-3 text-fuchsia-300" />
                  EVASIVE
                </span>
              )}
              {player.retaliateCharges > 0 && (
                <span className="inline-flex items-center gap-1 bg-rose-950/80 text-rose-300 border border-rose-800/40 px-2 py-0.5 rounded text-[10px] font-mono font-extrabold shadow-sm">
                  <AlertCircle className="w-3 h-3 text-rose-300" />
                  RETALIATORY
                </span>
              )}
            </div>
          </div>

          <div className="w-full h-3.5 bg-stone-950 rounded-full overflow-hidden border border-stone-850 flex items-center relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-extrabold text-stone-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              <Heart className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500 mr-1 inline" />
              {player.hp} / {player.maxHp} HP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-stone-850 pt-3 md:pt-0 md:pl-5 font-mono text-xs text-stone-400 select-none">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-stone-500 font-bold uppercase mb-0.5">DRAW PILE</span>
            <span className="flex items-center gap-1 bg-stone-950/80 px-3 py-1 rounded border border-stone-850 text-stone-300 font-extrabold">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              {drawPileSize} Elements
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-stone-500 font-bold uppercase mb-0.5">DISCARDED</span>
            <span className="flex items-center gap-1 bg-stone-950/80 px-3 py-1 rounded border border-stone-850 text-stone-400 font-semibold">
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              {discardPileSize}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 border-b border-stone-900 pb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold">
            YOUR HAND (SELECT 1 OR 2 ELEMENTS)
          </span>
          <span className="text-[9px] font-mono text-stone-500">DISCARD PILE RECYCLES ON EXHAUSTION</span>
        </div>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {hand.map((element, index) => renderElementCard(element, index))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 border-b border-stone-900 pb-1.5">
          <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold">
            SELECT POTION CATALYST COMPONENT (ALWAYS AVAILABLE)
          </span>
          <span className="text-[9px] font-mono text-stone-500">DETERMINES EFFECT SHAPE</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(['strike', 'ward', 'mend', 'blight'] as ComponentType[]).map((comp) => {
            const isCompSelected = activeComponent === comp;
            const color = getComponentColor(comp);

            return (
              <motion.button
                key={comp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectComponent(comp)}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer select-none h-20 flex flex-col justify-between
                  ${
                    isCompSelected
                      ? 'bg-stone-900 shadow-md'
                      : 'bg-stone-950/60 border-stone-850 text-stone-400 hover:border-stone-800'
                  }
                `}
                style={isCompSelected ? { borderColor: color } : {}}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-stone-500">
                    Catalyst
                  </span>
                  {isCompSelected && (
                    <span
                      className="text-[8px] font-mono font-extrabold px-1 py-0.2 rounded bg-stone-950 border border-current uppercase"
                      style={{ color }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex flex-col mt-0.5">
                  <span
                    className="text-xs font-serif font-extrabold uppercase tracking-wide capitalize"
                    style={isCompSelected ? { color } : {}}
                  >
                    {comp}
                  </span>
                  <span className="text-[9px] text-stone-500 leading-normal font-mono truncate">
                    {getComponentDesc(comp)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
