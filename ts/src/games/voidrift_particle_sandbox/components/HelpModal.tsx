import React, { useEffect, useRef } from 'react';
import { X, MousePointer, Keyboard } from 'lucide-react';
import { MATERIAL_REACTIONS, ReactionCondition } from '../types';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const conditionLabel = (c: ReactionCondition): string => {
    switch (c) {
      case 'adjacent': return 'Adjacent cells';
      case 'above': return 'Target above';
      case 'below': return 'Target below';
      case 'saturated': return 'Surrounded';
      default: return c;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-[640px] max-h-[80vh] bg-[#0b0f19] border border-[#26314d] rounded-xl shadow-2xl flex flex-col font-mono text-xs text-slate-300 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141b2d] border-b border-[#26314d]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4.5 h-4.5 text-cyan-400" />
            <span className="font-bold text-slate-100 text-sm tracking-widest uppercase">
              Voidrift Field Guide
            </span>
          </div>
          <button
            id="btn-close-help-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Introduction */}
          <div className="space-y-2">
            <h3 className="text-[#8fb4d4] font-bold text-xs uppercase tracking-wider">
              Sandbox Doctrine
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The grid is a cellular automata particle field. Cosmic dust and gases settle via gravity.
              Build <span className="text-cyan-300">Collectors</span>, <span className="text-cyan-300">Containers</span>,{' '}
              <span className="text-cyan-300">Processors</span>, and connect them with <span className="text-slate-100">Pipes</span> to
              establish automated extraction and conversion loops. Materials react when adjacent or inside
              reactors. Upgrade your Tier by meeting material quotas.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-2.5">
            <h3 className="text-[#8fb4d4] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5" /> Controls
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-slate-400 bg-[#101625] p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between">
                <span>Place Building</span>
                <span className="text-slate-100 font-bold">Left Click</span>
              </div>
              <div className="flex justify-between">
                <span>Rotate Pipe</span>
                <span className="text-slate-100 font-bold">R</span>
              </div>
              <div className="flex justify-between">
                <span>Cycle Pipe Route</span>
                <span className="text-slate-100 font-bold">Q / E</span>
              </div>
              <div className="flex justify-between">
                <span>Zoom</span>
                <span className="text-slate-100 font-bold">Mouse Wheel</span>
              </div>
              <div className="flex justify-between">
                <span>Pan View</span>
                <span className="text-slate-100 font-bold">Middle Click Drag</span>
              </div>
              <div className="flex justify-between">
                <span>Demolish Node</span>
                <span className="text-slate-100 font-bold">Right Click</span>
              </div>
              <div className="flex justify-between">
                <span>Pause Simulation</span>
                <span className="text-slate-100 font-bold">Spacebar</span>
              </div>
              <div className="flex justify-between">
                <span>Inspect Node</span>
                <span className="text-slate-100 font-bold">Ctrl + Click</span>
              </div>
              <div className="flex justify-between">
                <span>Clear Simulation</span>
                <span className="text-slate-100 font-bold">Delete</span>
              </div>
              <div className="flex justify-between">
                <span>Fast-Forward</span>
                <span className="text-slate-100 font-bold">F (Hold)</span>
              </div>
            </div>
          </div>

          {/* Material Reaction Codex */}
          <div className="space-y-2.5">
            <h3 className="text-[#8fb4d4] font-bold text-xs uppercase tracking-wider">
              Reaction Codex
            </h3>
            <div className="space-y-1.5">
              {MATERIAL_REACTIONS.map((rxn, idx) => {
                const inA = rxn.inputs[0];
                const inB = rxn.inputs[1];
                return (
                  <div
                    key={idx}
                    className="p-2 rounded bg-[#121829] border border-slate-800 flex items-center justify-between text-[10px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-bold">{inA.name}</span>
                      <span className="text-slate-600">+</span>
                      <span className="text-slate-300 font-bold">{inB.name}</span>
                      <span className="text-slate-500 text-[9px] bg-[#1d263d] px-1.5 py-0.5 rounded ml-1">
                        {conditionLabel(rxn.condition)}
                      </span>
                    </div>
                    <div className="text-cyan-300 font-mono font-bold">
                      → {rxn.outputs.join(' + ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
