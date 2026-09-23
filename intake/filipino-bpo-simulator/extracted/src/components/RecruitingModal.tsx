import React, { useState } from 'react';
import { Agent, AgentRole, ShiftType } from '../types';
import { getRandomName } from '../utils/names';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  money: number;
  availableDesksCount: number;
  onHireAgent: (candidate: Omit<Agent, 'id' | 'deskId' | 'gridX' | 'gridY'>) => void;
}

interface Candidate {
  id: string;
  name: string;
  gender: 'M' | 'F';
  role: AgentRole;
  shift: ShiftType;
  experienceYears: number;
  askingSalary: number; // monthly PHP
  englishSkill: number;
  empathySkill: number;
  techSkill: number;
  speed: number;
  bio: string;
}

export const RecruitingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  money,
  availableDesksCount,
  onHireAgent,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>(() => generateInitialCandidates());

  function generateInitialCandidates(): Candidate[] {
    const roles: AgentRole[] = ['CSR', 'TSR', 'SALES', 'TL', 'QA', 'IT'];
    const shifts: ShiftType[] = ['MORNING', 'MID', 'GRAVEYARD'];

    const bios: Record<AgentRole, string[]> = {
      CSR: [
        '3 years voice account experience at Sykes/Convergys. Excellent customer rapport.',
        'Fresh Mass Comm graduate from UST. Fluent American English, high stamina.',
        'Former retail service rep transitioning to international BPO. Very polite.'
      ],
      TSR: [
        'Former ISP Tier 2 tech. Solves modem and DNS issues in under 180 seconds.',
        'CompSci graduate, adept at software diagnostics and CRM navigation.'
      ],
      SALES: [
        'Aggressive outbound telemarketer with top commission records in telecom campaigns.',
        'High charm and persuasive negotiation skills for upselling warranties.'
      ],
      TL: [
        'Former Team Lead with 6 years experience running 25-seat pods. High team morale.',
        'Strict on AHT adherence and attendance, passionate mentor.'
      ],
      QA: [
        'Meticulous QA auditor with 98% score calibration accuracy.',
        'Specializes in accent coaching, empathy statements, and compliance audits.'
      ],
      IT: [
        'Certified Cisco CCNA network admin. Keeps server racks cool and cables organized.',
        'Fast hardware troubleshooter, fixes blue screens and VoIP lag in minutes.'
      ],
      WFM: [
        'Workforce scheduling expert. Minimizes queue abandonment.'
      ]
    };

    return Array.from({ length: 6 }).map((_, i) => {
      const { name, gender } = getRandomName();
      const role = roles[i % roles.length];
      const shift = shifts[Math.floor(Math.random() * shifts.length)];
      const exp = Math.floor(Math.random() * 5) + 1;
      const baseSal = role === 'TL' ? 38000 : (role === 'IT' || role === 'QA' ? 32000 : (role === 'TSR' ? 28000 : 22000));
      const bioPool = bios[role] || bios.CSR;

      return {
        id: `cand_${Date.now()}_${i}`,
        name,
        gender,
        role,
        shift,
        experienceYears: exp,
        askingSalary: baseSal + exp * 1500,
        englishSkill: 65 + Math.floor(Math.random() * 30),
        empathySkill: 60 + Math.floor(Math.random() * 35),
        techSkill: role === 'TSR' || role === 'IT' ? 85 + Math.floor(Math.random() * 12) : 50 + Math.floor(Math.random() * 35),
        speed: 65 + Math.floor(Math.random() * 30),
        bio: bioPool[Math.floor(Math.random() * bioPool.length)],
      };
    });
  }

  const handleRefreshCandidates = () => {
    sounds.playClick();
    setCandidates(generateInitialCandidates());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-sky-500 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👨‍💼</span>
            <div>
              <h2 className="font-bold text-lg text-sky-400 tracking-wide uppercase font-pixel text-xs">
                RECRUITING & TALENT ACQUISITION
              </h2>
              <p className="text-xs text-slate-400">
                Vacant Desk Capacity: <strong className="text-emerald-400">{availableDesksCount} open seats</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshCandidates}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>🔄</span> Refresh Pool (JobStreet/LinkedIn)
            </button>
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
        </div>

        {/* Warning if no desks available */}
        {availableDesksCount <= 0 && (
          <div className="bg-amber-950/70 border-b border-amber-800 text-amber-300 px-6 py-2.5 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>All cubicles are occupied! Go to <strong>BUILD</strong> to place more cubicle desks before hiring floor agents.</span>
          </div>
        )}

        {/* Candidate List */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((cand) => {
            const signingBonus = Math.floor(cand.askingSalary * 0.2);
            const canAfford = money >= signingBonus;
            const hasDeskSpace = availableDesksCount > 0 || cand.role === 'TL' || cand.role === 'IT' || cand.role === 'QA';

            return (
              <div
                key={cand.id}
                className="bg-slate-800/80 border border-slate-700 hover:border-sky-400 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-xl shadow-inner font-bold text-sky-400">
                        {cand.gender === 'M' ? '👨' : '👩'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{cand.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold uppercase">
                            {cand.role}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                            {cand.shift} SHIFT
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-300">
                        ₱ {cand.askingSalary.toLocaleString()}/mo
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Sign bonus: ₱ {signingBonus.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic mb-3">"{cand.bio}"</p>

                  {/* Skills bars */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>English Fluency</span>
                        <span className="text-sky-300 font-bold">{cand.englishSkill}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-400 h-full rounded-full" style={{ width: `${cand.englishSkill}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Empathy / De-escalate</span>
                        <span className="text-emerald-300 font-bold">{cand.empathySkill}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${cand.empathySkill}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Technical Skill</span>
                        <span className="text-purple-300 font-bold">{cand.techSkill}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full rounded-full" style={{ width: `${cand.techSkill}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>Typing & Speed</span>
                        <span className="text-amber-300 font-bold">{cand.speed}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${cand.speed}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canAfford || !hasDeskSpace}
                  onClick={() => {
                    sounds.playCash();
                    onHireAgent({
                      name: cand.name,
                      avatarSeed: Math.floor(Math.random() * 1000),
                      gender: cand.gender,
                      role: cand.role,
                      shift: cand.shift,
                      state: 'IDLE',
                      energy: 100,
                      stress: 10,
                      morale: 88,
                      englishSkill: cand.englishSkill,
                      empathySkill: cand.empathySkill,
                      techSkill: cand.techSkill,
                      speed: cand.speed,
                      callsHandledToday: 0,
                      totalCallsHandled: 0,
                      csat: 85,
                      avgHandleTime: 240,
                      salary: cand.askingSalary,
                      bonusEarned: 0,
                      activeCallDuration: 0,
                    });
                    setCandidates(prev => prev.filter(c => c.id !== cand.id));
                  }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canAfford && hasDeskSpace
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>📝</span>
                  <span>
                    {!hasDeskSpace
                      ? 'No Desk Available'
                      : !canAfford
                      ? 'Cannot Afford Bonus'
                      : `Hire (${cand.role})`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
