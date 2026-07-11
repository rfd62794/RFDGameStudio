import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Compass, Flame, Skull, Check } from 'lucide-react';
import type { RunNode } from '../types';

interface MapProgressProps {
  nodes: RunNode[];
  currentNodeId: number;
}

export default function MapProgress({ nodes, currentNodeId }: MapProgressProps) {
  const getNodeIcon = (node: RunNode) => {
    if (node.id === 9) return <Skull className="w-4 h-4 text-rose-500" />;

    switch (node.type) {
      case 'fight':
        return <Swords className="w-4 h-4" />;
      case 'forage':
        return <Compass className="w-4 h-4" />;
      case 'rest':
        return <Flame className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full bg-stone-900 border-b border-stone-800 p-4 sticky top-0 z-20 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-amber-500 font-mono font-bold">
          CURRENT LEVEL
        </span>
        <h2 className="text-sm font-semibold text-stone-100 font-serif">
          Depth {currentNodeId}/9: {nodes.find((n) => n.id === currentNodeId)?.name || 'Descending...'}
        </h2>
      </div>

      <div className="flex items-center w-full max-w-2xl justify-between overflow-x-auto py-2 px-1 scrollbar-none gap-2">
        {nodes.map((node, index) => {
          const isActive = node.id === currentNodeId;
          const isCompleted = node.id < currentNodeId;

          return (
            <React.Fragment key={node.id}>
              <div className="flex flex-col items-center relative group min-w-[44px]">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10
                    ${
                      isActive
                        ? 'bg-amber-950 border-amber-400 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : isCompleted
                          ? 'bg-stone-850 border-emerald-600 text-emerald-500'
                          : 'bg-stone-950 border-stone-800 text-stone-500'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : getNodeIcon(node)}

                  {isActive && (
                    <span className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-60 scale-105 pointer-events-none" />
                  )}
                </motion.div>

                <div className="absolute top-11 scale-0 group-hover:scale-100 transition-transform origin-top z-30 w-48 p-2 rounded-lg bg-stone-950 border border-stone-800 text-center text-[10px] shadow-xl pointer-events-none">
                  <p className="font-bold text-amber-500 mb-0.5">{node.name}</p>
                  <p className="text-stone-400 leading-normal">{node.description}</p>
                </div>

                <span
                  className={`text-[9px] mt-1.5 font-mono tracking-tighter ${
                    isActive
                      ? 'text-amber-400 font-bold'
                      : isCompleted
                        ? 'text-stone-400'
                        : 'text-stone-600'
                  }`}
                >
                  {node.id === 9 ? 'BOSS' : node.type.toUpperCase()}
                </span>
              </div>

              {index < nodes.length - 1 && (
                <div className="flex-1 min-w-[12px] h-[2px] -mt-4 relative bg-stone-800">
                  <div
                    className={`absolute inset-0 transition-all duration-500 ${isCompleted ? 'bg-emerald-600/60' : 'bg-transparent'}`}
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
