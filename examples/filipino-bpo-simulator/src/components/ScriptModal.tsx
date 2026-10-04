import React, { useState } from 'react';
import { CallScriptConfig } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentScript: CallScriptConfig;
  onSaveScript: (newScript: CallScriptConfig) => void;
}

export const ScriptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentScript,
  onSaveScript,
}) => {
  const [script, setScript] = useState<CallScriptConfig>({ ...currentScript });

  if (!isOpen) return null;

  // Calculate estimated script impact
  let ahtImpact = 0;
  let csatImpact = 0;
  let escalationRisk = 'Low';

  if (script.greeting === 'friendly') {
    csatImpact += 8;
    ahtImpact += 15;
  } else if (script.greeting === 'speedy') {
    csatImpact -= 6;
    ahtImpact -= 25;
  }

  if (script.empathyLevel === 'high') {
    csatImpact += 12;
    ahtImpact += 20;
    escalationRisk = 'Very Low';
  } else if (script.empathyLevel === 'low') {
    csatImpact -= 10;
    ahtImpact -= 30;
    escalationRisk = 'High';
  }

  if (script.objectionStrategy === 'credit_voucher') {
    csatImpact += 10;
    escalationRisk = 'Minimal';
  } else if (script.objectionStrategy === 'strict_policy') {
    csatImpact -= 8;
    escalationRisk = 'Severe';
  }

  if (script.surveyPrompt === 'enthusiastic') {
    csatImpact += 6;
    ahtImpact += 10;
  }

  if (script.upsellAttempt) {
    ahtImpact += 20;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="font-bold text-lg text-indigo-400 tracking-wide uppercase font-pixel text-xs">
                CALL SCRIPT & OBJECTION FLOW
              </h2>
              <p className="text-xs text-slate-400">Configure standard operating procedures (SOP) for floor agents</p>
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
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Live Impact Preview */}
          <div className="bg-slate-950 border border-indigo-900/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Estimated AHT Impact</span>
              <span className={`text-base font-bold ${ahtImpact > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {ahtImpact > 0 ? `+${ahtImpact}s (Longer Calls)` : `${ahtImpact}s (Faster Calls)`}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Estimated CSAT Rating</span>
              <span className={`text-base font-bold ${csatImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {csatImpact >= 0 ? `+${csatImpact}% Higher CSAT` : `${csatImpact}% Lower CSAT`}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Supervisor Escalation Risk</span>
              <span className={`text-base font-bold ${
                escalationRisk === 'Severe' || escalationRisk === 'High' ? 'text-rose-400' : 'text-sky-400'
              }`}>
                {escalationRisk}
              </span>
            </div>
          </div>

          {/* 1. Opening Greeting */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              1. Opening Greeting Style
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'friendly', title: 'Warm Pinoy Hospitality', desc: '"Mabuhay! Thank you for calling, my name is Mark! How can I make your day great?"', tag: '+CSAT, +AHT' },
                { id: 'formal', title: 'Standard Corporate', desc: '"Thank you for contacting Customer Support. My name is Mark, how may I assist you?"', tag: 'Balanced' },
                { id: 'speedy', title: 'Express Direct', desc: '"Support line, please state your account number and reason for calling."', tag: '-AHT, -CSAT' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sounds.playClick();
                    setScript({ ...script, greeting: opt.id as any });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    script.greeting === opt.id
                      ? 'bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-indigo-300">{opt.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">{opt.tag}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Empathy & De-escalation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              2. Empathy & Caller Validation
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'high', title: 'Deep Ownership & Apology', desc: '"I completely understand how frustrating this is, and I will personally ensure this is resolved."', tag: '+CSAT, Calms Karens' },
                { id: 'balanced', title: 'Professional Reassurance', desc: '"Don\'t worry, I have your records here and we will troubleshoot this step-by-step."', tag: 'Standard' },
                { id: 'low', title: 'Company Terms Defense', desc: '"Please refer to Terms of Service clause 3. We cannot alter billing rules."', tag: 'High Escalation' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sounds.playClick();
                    setScript({ ...script, empathyLevel: opt.id as any });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    script.empathyLevel === opt.id
                      ? 'bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-indigo-300">{opt.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">{opt.tag}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Objection Handling */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              3. Objection & Dispute Resolution Strategy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'credit_voucher', title: 'Empower ₱250 Courtesy Credit', desc: 'Authorize agents to issue small goodwill fee waivers to settle disputes.', tag: '+CSAT, -₱ Margins' },
                { id: 'active_listening', title: 'Diagnostic Root Cause', desc: 'Patiently ask probing questions without granting instant credits.', tag: 'Cost Effective' },
                { id: 'strict_policy', title: 'Zero Compromise Policy', desc: 'Strictly deny fee waivers and credits. Fast wrap-up time.', tag: 'Risk Chargebacks' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sounds.playClick();
                    setScript({ ...script, objectionStrategy: opt.id as any });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    script.objectionStrategy === opt.id
                      ? 'bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-indigo-300">{opt.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">{opt.tag}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Post Call Survey & Upsell */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                4. Post-Call Survey Push
              </label>
              <select
                value={script.surveyPrompt}
                onChange={(e) => setScript({ ...script, surveyPrompt: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
              >
                <option value="enthusiastic">Enthusiastic ("Please rate 5 stars if I helped!") (+25% survey volume)</option>
                <option value="polite">Polite Neutral ("Stay on the line for survey")</option>
                <option value="none">No Survey Prompt (Fastest call wrap)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                5. Cross-sell / Upsell Warranty
              </label>
              <div className="flex items-center justify-between p-2.5 bg-slate-800 border border-slate-700 rounded-lg">
                <span className="text-xs text-slate-300">Attempt Warranty Upsell (+₱45 bonus/call, +20s AHT)</span>
                <input
                  type="checkbox"
                  checked={script.upsellAttempt}
                  onChange={(e) => setScript({ ...script, upsellAttempt: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              sounds.playCash();
              onSaveScript(script);
              onClose();
            }}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
          >
            Deploy Script to Floor
          </button>
        </div>
      </div>
    </div>
  );
};
