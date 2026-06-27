import React from 'react';
import type { MBBGameState } from '../types';

interface RosterTabProps {
  state: MBBGameState;
  setState: (fn: (prev: MBBGameState) => MBBGameState) => void;
  session: unknown;
  call: (fn: string, ...args: unknown[]) => unknown;
  opponent: unknown;
  onStartMatch: () => void;
}

export default function RosterTab({ state, setState, session, call, opponent, onStartMatch }: RosterTabProps) {
  return (
    <div className="roster-tab">
      <h2>Roster</h2>
      <div className="mutant-list">
        {state.roster.map(mutant => (
          <div key={mutant.id} className="mutant-card">
            <div className="mutant-name" style={{ color: mutant.color }}>{mutant.name}</div>
            <div className="mutant-status">{mutant.status}</div>
          </div>
        ))}
      </div>
      <button className="start-match-btn" onClick={onStartMatch}>Start Match</button>
    </div>
  );
}
