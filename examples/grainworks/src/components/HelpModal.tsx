import React from 'react';
import { MATERIAL_DEFS, MATERIAL_REACTIONS, MaterialType } from '../types';
import { X, BookOpen, Layers, Zap, Workflow, HelpCircle, Keyboard } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1322] border border-[#232f48] rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-300">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1f293d] flex items-center justify-between bg-[#0b0f19]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-slate-100 text-base">
              VoidRift Field Manual & Reaction Codex
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
          {/* Introduction */}
          <div className="bg-[#131a2e] p-3.5 rounded-xl border border-cyan-500/20">
            <h3 className="text-sm font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              Core Concept & Simulation Engine
            </h3>
            <p className="text-slate-300 leading-relaxed">
              VoidRift is a physical cellular automata sandbox and automation factory running on a{' '}
              <strong className="text-white">320 × 200 grid</strong> (64,000 active cells). Physical
              materials fall from cosmic asteroids at the top. You construct automated processing loops
              using <strong className="text-cyan-300">Collectors</strong>,{' '}
              <strong className="text-purple-300">Containers</strong>,{' '}
              <strong className="text-slate-300">Pipes</strong>, and{' '}
              <strong className="text-amber-300">Processors</strong> to synthesize advanced materials
              and fulfill the cosmic <strong className="text-amber-400">Reconstruction</strong>.
            </p>
          </div>

          {/* Reaction Codex Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              Material Reaction Matrix
            </h3>
            <div className="border border-[#222d46] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0b0f19] text-slate-400 border-b border-[#1f293d]">
                    <th className="p-2.5 font-semibold">Input A</th>
                    <th className="p-2.5 font-semibold">Input B</th>
                    <th className="p-2.5 font-semibold">Reaction Output</th>
                    <th className="p-2.5 font-semibold">Probability</th>
                    <th className="p-2.5 font-semibold">Behavior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182136] bg-[#0d1220]">
                  {MATERIAL_REACTIONS.map((r, idx) => {
                    const defA = MATERIAL_DEFS[r.inputA];
                    const defB = MATERIAL_DEFS[r.inputB];
                    const defOut = MATERIAL_DEFS[r.output];
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: defA.color }} />
                            {defA.name}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: defB.color }} />
                            {defB.name}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: defOut.color }} />
                            {defOut.name}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-400">{Math.round(r.probability * 100)}% / tick</td>
                        <td className="p-2.5 text-slate-400">{r.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Construction Machine Rules */}
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-1.5">
              <Workflow className="w-4 h-4 text-cyan-400" />
              Machinery & State Enforcement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#121829] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-300">Collectors (2×2)</div>
                <p className="text-slate-400">
                  Placed in the asteroid impact zone or main area. Captures falling particles into a 200-unit internal buffer and feeds them downward into pipes.
                </p>
              </div>
              <div className="bg-[#121829] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-purple-300">Containers (2×3) & State Enforcement</div>
                <p className="text-slate-400">
                  Stores 500 units. <strong className="text-rose-400">Critical Rule:</strong> If an incompatible material arrives (e.g. Liquid in a Gas Tank), the container immediately rejects and spills it as a free particle!
                </p>
              </div>
              <div className="bg-[#121829] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-slate-300">Pipes & Conduits (1-cell)</div>
                <p className="text-slate-400">
                  Moves materials at 5 units/sec. If destination backs up, pipes buffer up to 100 units before spilling free particles at the source exit.
                </p>
              </div>
              <div className="bg-[#121829] p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300">Processors (3×3)</div>
                <p className="text-slate-400">
                  Converts inputs into refined materials on specific cooldowns. Compressor (Dust → Solid), Condenser (Gas → Condensate), Separator (Slurry → Dust + Liquid), Plasma Forge, Catalyst Chamber.
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              Keyboard Shortcuts & Controls
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-[#0b0f19] p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Pause / Resume:</span>
                <span className="text-cyan-300 font-bold">Space</span>
              </div>
              <div className="bg-[#0b0f19] p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Sim Speeds:</span>
                <span className="text-cyan-300 font-bold">1, 2, 5</span>
              </div>
              <div className="bg-[#0b0f19] p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Build Tool:</span>
                <span className="text-cyan-300 font-bold">B</span>
              </div>
              <div className="bg-[#0b0f19] p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Material Brush:</span>
                <span className="text-cyan-300 font-bold">M</span>
              </div>
              <div className="bg-[#0b0f19] p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Demolish Mode:</span>
                <span className="text-cyan-300 font-bold">D / R-Click</span>
              </div>
              <div className="bg-[#0b0f19] p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Pan & Zoom:</span>
                <span className="text-cyan-300 font-bold">Drag / Scroll</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#1f293d] bg-[#0b0f19] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition"
          >
            Return to Void
          </button>
        </div>
      </div>
    </div>
  );
};
