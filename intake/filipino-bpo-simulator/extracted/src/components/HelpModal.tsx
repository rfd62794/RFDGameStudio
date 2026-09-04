import React from 'react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-sky-500 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❓</span>
            <div>
              <h2 className="font-bold text-base text-sky-400 font-pixel text-xs">
                HOW TO PLAY & PHILIPPINE BPO GUIDE
              </h2>
              <p className="text-xs text-slate-400">Mastering floor operations, call queues, and agent morale</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white px-2 py-1 text-xl font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sky-300 text-sm mb-1">🎯 Primary Objective</h3>
            <p>
              Grow your Philippine Business Process Outsourcing (BPO) call center into an enterprise powerhouse!
              Take inbound customer service and tech support calls from international clients (US, UK, Australia),
              maintain a high Service Level Agreement (80/20 SLA) and CSAT, and keep your agents happy and energized.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-amber-300 flex items-center gap-2">
                <span>1. 📞 Calls & Queues</span>
              </h4>
              <p className="text-slate-400 mt-0.5">
                Calls arrive continuously in the queue. Floor agents take calls automatically when available.
                If the queue builds up past 20 calls, abandonment rate increases and hurts your SLA!
                Hire more agents or speed up scripts via <strong>Create New Script</strong>.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-amber-300 flex items-center gap-2">
                <span>2. ☕ Energy, Stress & Kopiko 3-in-1</span>
              </h4>
              <p className="text-slate-400 mt-0.5">
                Agents working long shifts (especially the Graveyard 10 PM - 7 AM shift) lose energy and gain stress.
                Place coffee makers, water dispensers, and sleeping cots in the office using the <strong>BUILD</strong> menu.
                Order Jollibee or Friday Videoke through <strong>HR</strong> to boost happiness!
              </p>
            </div>

            <div>
              <h4 className="font-bold text-amber-300 flex items-center gap-2">
                <span>3. 🌐 IT & Telecom Reliability</span>
              </h4>
              <p className="text-slate-400 mt-0.5">
                Upgrade from basic PLDT fiber to Dual-Fiber Failover or Starlink to prevent submarine fiber outages.
                Equip noise-cancelling Plantronics headsets to eliminate background rooster/traffic noises.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-amber-300 flex items-center gap-2">
                <span>4. 🏢 Expanding to BGC & Ortigas</span>
              </h4>
              <p className="text-slate-400 mt-0.5">
                Once you accumulate profits in <strong>₱ (PHP)</strong>, expand from Eastwood City to Ortigas Center
                and Bonifacio Global City (BGC) to take on premium multi-million Fortune 500 contracts!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase"
          >
            Got It! Let's Take Calls
          </button>
        </div>
      </div>
    </div>
  );
};
