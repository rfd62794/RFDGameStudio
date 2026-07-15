// @ts-nocheck
import React from 'react';
import { X, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { Slime } from '../types';
import { SpecimenListItem } from './SpecimenListItem';

interface SpecimenPickerProps {
  isOpen: boolean;
  onClose: () => void;
  slimes: Slime[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  maxSelection?: number;
  title?: string;
  subtitle?: string;
  allowedRole?: 'dispatch' | 'mediation' | 'worker' | 'exploration';
}

export function SpecimenPicker({
  isOpen,
  onClose,
  slimes,
  selectedIds,
  onToggleSelect,
  maxSelection = 3,
  title = "Select Specimens",
  subtitle = "Draft biological cores into the active pod.",
  allowedRole
}: SpecimenPickerProps) {
  if (!isOpen) return null;

  // Filter for idle slimes only and check for lockedRole conflict
  const availableSlimes = slimes.filter(s => {
    if (s.role !== 'idle') return false;
    if (allowedRole && s.lockedRole && s.lockedRole !== allowedRole) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div 
        className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0c1220] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/30 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono tracking-widest text-cyan-400 uppercase flex items-center">
              <UserCheck className="w-4 h-4 mr-2 text-cyan-400" />
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {availableSlimes.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-yellow-500/80 mx-auto" />
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Zero Compatible Specimens Available
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                All containment cell occupants are currently busy on missions or contracted. Complete active cycles to free them up.
              </p>
            </div>
          ) : (
            availableSlimes.map((slime) => {
              const isSelected = selectedIds.includes(slime.id);
              const isDisabled = !isSelected && selectedIds.length >= maxSelection;

              return (
                <div 
                  key={slime.id} 
                  className={`transition-opacity ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <SpecimenListItem
                    slime={slime}
                    isSelected={isSelected}
                    onClick={() => {
                      if (isSelected || selectedIds.length < maxSelection) {
                        onToggleSelect(slime.id);
                      }
                    }}
                    showChevron={false}
                    action={
                      <div className="flex items-center justify-center pl-2">
                        <div 
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'border-cyan-500 bg-cyan-950/50 text-cyan-400' 
                              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-900/10 p-4 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            DRAFTED:{' '}
            <span className="font-bold text-white">
              {selectedIds.length} / {maxSelection}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900 hover:text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
          >
            Confirm Pod Setup
          </button>
        </div>
      </div>
    </div>
  );
}
