import React, { useState } from 'react';
import { Menu, Play, RotateCcw, HelpCircle, Settings, LogOut, X, AlertTriangle } from 'lucide-react';
import { RunState } from '../types';
import InstructionsModal from './InstructionsModal';

interface PersistentMenuProps {
  currentPhase: string;
  runState: RunState | null;
  onReturnToTitle: () => void;
  onOpenCodex?: () => void;
}

export default function PersistentMenu({
  currentPhase,
  runState,
  onReturnToTitle,
  onOpenCodex
}: PersistentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'main' | 'instructions' | 'settings' | 'confirmTitle'>('none');

  const handleOpenMainMenu = () => {
    setIsOpen(false);
    setActiveModal('main');
  };

  const handleOpenInstructions = () => {
    setIsOpen(false);
    setActiveModal('instructions');
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    setActiveModal('settings');
  };

  const handleConfirmReturnTitle = () => {
    if (runState) {
      // Mid-run confirmation needed
      setActiveModal('confirmTitle');
    } else {
      setActiveModal('none');
      onReturnToTitle();
    }
  };

  const handleExecuteReturnTitle = () => {
    setActiveModal('none');
    onReturnToTitle();
  };

  return (
    <>
      {/* PERSISTENT TOP-RIGHT MENU BUTTON */}
      <div className="fixed top-3 right-3 md:top-4 md:right-4 z-40" id="persistent-menu-container">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-750/80 hover:border-amber-500/50 text-slate-200 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-mono backdrop-blur-md transition-all cursor-pointer"
          id="persistent-menu-btn"
          aria-label="Open Station Menu"
        >
          <Menu className="w-4 h-4 text-amber-400" />
          <span className="font-bold tracking-wider text-[11px] uppercase">Menu</span>
        </button>

        {/* DROPDOWN OPTIONS */}
        {isOpen && (
          <div 
            className="absolute right-0 mt-2 w-48 bg-slate-900/95 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col gap-1 z-50 animate-fade-in"
            id="persistent-menu-dropdown"
          >
            <button
              onClick={handleOpenMainMenu}
              className="w-full text-left px-3 py-2 text-xs font-mono text-slate-200 hover:text-amber-400 hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
              id="persistent-option-main-menu"
            >
              <Menu className="w-3.5 h-3.5 text-amber-400" />
              <span>Main Menu</span>
            </button>

            <button
              onClick={handleOpenInstructions}
              className="w-full text-left px-3 py-2 text-xs font-mono text-slate-200 hover:text-sky-400 hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
              id="persistent-option-instructions"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Instructions</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. MAIN MENU OVERLAY MODAL */}
      {activeModal === 'main' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="main-menu-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-sm w-full flex flex-col gap-5 text-center shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-display font-bold text-slate-100 text-sm flex items-center gap-2">
                <Menu className="w-4 h-4 text-amber-400" />
                Station Navigation Menu
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 my-1">
              {/* Resume */}
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-display uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
                id="main-menu-resume-btn"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Resume Sequence
              </button>

              {/* Settings */}
              <button
                onClick={handleOpenSettings}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700/60 rounded-xl text-xs font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="main-menu-settings-btn"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Calibrations & Settings
              </button>

              {/* Instructions */}
              <button
                onClick={handleOpenInstructions}
                className="w-full py-3 px-4 bg-slate-850 hover:bg-slate-800 text-sky-300 hover:text-sky-200 font-bold border border-slate-750 rounded-xl text-xs font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="main-menu-instructions-btn"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                Station Directives
              </button>

              {/* Return to Title */}
              <button
                onClick={handleConfirmReturnTitle}
                className="w-full py-3 px-4 bg-slate-950/80 hover:bg-rose-950/40 text-rose-400 font-bold border border-rose-900/30 hover:border-rose-500/40 rounded-xl text-xs font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
                id="main-menu-title-btn"
              >
                <LogOut className="w-4 h-4" />
                Return to Title
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. INSTRUCTIONS MODAL */}
      {activeModal === 'instructions' && (
        <InstructionsModal onClose={() => setActiveModal('none')} />
      )}

      {/* 3. SETTINGS MODAL */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="settings-modal-overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 text-left shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-display font-bold text-slate-200 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Station Calibrations
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400 font-mono flex flex-col gap-2">
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span>Audio Synthesis</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span>Fast Combat Animations</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span>Display Resolution</span>
                <span className="text-sky-400 font-bold">Adaptive</span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal('none')}
              className="mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. CONFIRM RETURN TO TITLE (MID-RUN WARNING) */}
      {activeModal === 'confirmTitle' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="confirm-title-overlay">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 text-center shadow-2xl">
            <div className="p-3 bg-rose-950/50 border border-rose-500/30 rounded-2xl w-fit mx-auto text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-display font-bold text-slate-100 text-lg">
                Abandon Active Run?
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Returning to Title mid-sequence will abandon your current run. All unspent <span className="text-emerald-400 font-bold">Run Essence ({runState?.essence || 0} ESS)</span> will be lost!
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleExecuteReturnTitle}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded-xl text-xs font-display uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                id="confirm-abandon-run-btn"
              >
                Abandon Run & Return to Title
              </button>

              <button
                onClick={() => setActiveModal('main')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs font-display uppercase tracking-wider transition-all cursor-pointer"
                id="cancel-abandon-run-btn"
              >
                Cancel (Resume Sequence)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
