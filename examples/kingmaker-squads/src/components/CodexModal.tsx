/**
 * Comprehensive Codex & Rules Modal for KingMaker Squads
 */

import React from 'react';
import { ChessIcon } from './ChessIcon';
import { ARCHETYPES } from '../data/archetypes';
import { X, Shield, Crown, Swords, Lock, Zap, BookOpen } from 'lucide-react';

interface CodexModalProps {
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-amber-600/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-5 relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-amber-200 font-serif uppercase tracking-wider">
              Rebellion Codex & Strategy Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Squad & War Command Section */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 font-serif flex items-center gap-2 border-b border-zinc-800 pb-1">
            <Shield className="w-4 h-4 text-amber-400" /> Multi-Squad Structure & Transfer Caps
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-300">
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-amber-300 block mb-1">Forward Force vs. District Cells:</strong>
              Your Cell Command controls 1 Forward Vanguard Squad (hotkey [1]) for offensive operations and stationary District Cells stationed in liberated quarters (hotkeys [2-9]).
            </li>
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-rose-300 block mb-1">Outflow Cap (1 Unit/Turn):</strong>
              To prevent instant global redeployment, each squad has a strict transfer outflow cap of <strong>1 unit per turn</strong>. Units can be moved to another squad or the reserve bench.
            </li>
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-blue-300 block mb-1">Leader Binding & Settling:</strong>
              The Cell Leader is permanently bound to the Forward Vanguard Squad or the Rebel HQ. When settled in a new district, the cell remains exposed without defense shields for 1-2 turns.
            </li>
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-emerald-300 block mb-1">Chess Movement Combat:</strong>
              Battles are fought on an 8×8 grid. Rooks slide orthogonally, Bishops slide diagonally, Queens slide all rays, Knights jump in L-shapes, and Pawns advance straight.
            </li>
          </ul>
        </section>
        <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-4 text-xs text-amber-200/90 leading-relaxed">
          <h3 className="text-sm font-bold text-amber-300 font-serif mb-1">Vision</h3>
          <p>
            "You don't win by being strongest. You win by deciding who leads the uprising, and living with what it costs to raise or lose a cell leader."
          </p>
        </div>

        {/* The King System */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 font-serif flex items-center gap-2 border-b border-zinc-800 pb-1">
            <Crown className="w-4 h-4 fill-current text-amber-400" /> The Cell Leader Mechanics
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-300">
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-amber-300 block mb-1">Mandatory Leadership:</strong>
              Your Cell Leader is always your highest-ranked unit. If a Cell Leader falls or is ousted, your highest-ranked survivor immediately steps up as the new Cell Leader.
            </li>
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-rose-300 block mb-1">Settling Vulnerability:</strong>
              After taking leadership, the new Cell Leader's district is unshielded and fully visible to opposing forces for 1-2 turns.
            </li>
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-blue-300 block mb-1">Knight Escort:</strong>
              Assigning a Knight as an Escort to the Leader's squad allows the Leader to escape fatal combat. The Leader escapes ousted with 1 HP.
            </li>
            <li className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              <strong className="text-rose-400 block mb-1">Honor Scars:</strong>
              Ousted leaders gain a permanent Honor Scar. They carry -10% base HP but gain +30% attack when reclaiming former headquarters!
            </li>
          </ul>
        </section>

        {/* Permanence & Rank */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 font-serif flex items-center gap-2 border-b border-zinc-800 pb-1">
            <Lock className="w-4 h-4 text-amber-400" /> Survival Rank & Permanence
          </h3>
          <p className="text-xs text-zinc-400">
            Units gain Rank XP purely by surviving battles (win or lose). A fresh unit is disposable fodder—until it survives enough fights to become a <strong>Veteran</strong> or <strong>Elite</strong>. Once ranked up, it becomes <strong>PERMANENT</strong>: it can no longer be sold or rerolled away!
          </p>
        </section>

        {/* Archetypes */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 font-serif flex items-center gap-2 border-b border-zinc-800 pb-1">
            <Swords className="w-4 h-4 text-amber-400" /> Chess Archetypes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {Object.values(ARCHETYPES).map((a) => (
              <div key={a.type} className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                  <ChessIcon type={a.type} className="w-4 h-4" />
                  <span>{a.name} ({a.cost}g)</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight">{a.description}</p>
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition"
        >
          Close Codex
        </button>
      </div>
    </div>
  );
};
