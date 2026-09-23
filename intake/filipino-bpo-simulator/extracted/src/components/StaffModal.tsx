import React, { useState } from 'react';
import { Agent, AgentRole, ShiftType } from '../types';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onSendBreak: (agentId: string) => void;
  onGiveBonus: (agentId: string, amount: number) => void;
}

export const StaffModal: React.FC<Props> = ({
  isOpen,
  onClose,
  agents,
  onSelectAgent,
  onSendBreak,
  onGiveBonus,
}) => {
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredAgents = agents.filter((agent) => {
    const matchesRole = filterRole === 'ALL' || agent.role === filterRole;
    const matchesShift = filterShift === 'ALL' || agent.shift === filterShift;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesShift && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-teal-500 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="font-bold text-lg text-teal-400 tracking-wide uppercase font-pixel text-xs">
                EMPLOYEE DIRECTORY & ROSTER
              </h2>
              <p className="text-xs text-slate-400">Total Staff: {agents.length} active personnel</p>
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

        {/* Filters */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400 min-w-[200px]"
          />

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
          >
            <option value="ALL">All Roles</option>
            <option value="CSR">CSR (Customer Service)</option>
            <option value="TSR">TSR (Tech Support)</option>
            <option value="SALES">Outbound Sales</option>
            <option value="TL">Team Leaders (TL)</option>
            <option value="QA">Quality Assurance (QA)</option>
            <option value="IT">IT Support</option>
          </select>

          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
          >
            <option value="ALL">All Shifts</option>
            <option value="MORNING">Morning Shift (6am-3pm)</option>
            <option value="MID">Mid Shift (2pm-11pm)</option>
            <option value="GRAVEYARD">Graveyard Shift (10pm-7am)</option>
          </select>
        </div>

        {/* Table List */}
        <div className="p-6 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Employee</th>
                  <th className="pb-3 px-3">Role & Shift</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Energy</th>
                  <th className="pb-3 px-3">CSAT</th>
                  <th className="pb-3 px-3">Calls</th>
                  <th className="pb-3 px-3">Salary</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAgents.map((agent) => {
                  const isLowEnergy = agent.energy < 30;

                  return (
                    <tr
                      key={agent.id}
                      className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectAgent(agent)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{agent.gender === 'M' ? '👨' : '👩'}</span>
                          <div>
                            <span className="font-bold text-slate-100 block group-hover:text-teal-400 transition-colors">
                              {agent.name}
                            </span>
                            <span className="text-[10px] text-slate-500">ID: {agent.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block">{agent.role}</span>
                        <span className="text-[10px] text-slate-400">{agent.shift}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          agent.state === 'ON_CALL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          agent.state === 'BREAK' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          agent.state === 'ACW' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {agent.state.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isLowEnergy ? 'bg-rose-500' : 'bg-emerald-400'}`}
                              style={{ width: `${agent.energy}%` }}
                            />
                          </div>
                          <span className={`font-mono text-[11px] ${isLowEnergy ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {agent.energy}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-sky-300">
                        {agent.csat}%
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        {agent.callsHandledToday}
                      </td>

                      <td className="py-3 px-3 font-mono text-amber-300">
                        ₱{agent.salary.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              sounds.playClick();
                              onSendBreak(agent.id);
                            }}
                            className="px-2 py-1 bg-amber-950/80 hover:bg-amber-800 border border-amber-700 text-amber-300 rounded text-[10px] font-bold"
                            title="Send on Coffee Break"
                          >
                            ☕ Break
                          </button>
                          <button
                            onClick={() => {
                              sounds.playCash();
                              onGiveBonus(agent.id, 1000);
                            }}
                            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-300 rounded text-[10px] font-bold"
                            title="Give ₱1,000 Spot Bonus"
                          >
                            💰 Bonus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
