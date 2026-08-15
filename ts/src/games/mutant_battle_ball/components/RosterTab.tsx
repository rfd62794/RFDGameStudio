import React from 'react';
import { Button, Card } from '../../../ui/components';
import { PaperDoll } from '../../../engine/paperDoll';
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
          <Card key={mutant.id} className="mutant-card">
            <PaperDoll
              parts={mutant.parts}
              color={mutant.color}
              size={64}
              seed={mutant.id.charCodeAt(0)}
            />
            <div className="mutant-info">
              <div className="mutant-name" style={{ color: mutant.color }}>{mutant.name}</div>
              <div className="mutant-status">{mutant.status}</div>
            </div>
          </Card>
        ))}
      </div>
      <Button id="mbb-start-match" label="Start Match" onClick={onStartMatch} variant="primary" />
    </div>
  );
}
