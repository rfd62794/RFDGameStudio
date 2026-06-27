import React from 'react';
import type { MBBGameState } from '../types';

interface WorkshopTabProps {
  state: MBBGameState;
  setState: (fn: (prev: MBBGameState) => MBBGameState) => void;
  session: unknown;
  call: (fn: string, ...args: unknown[]) => unknown;
}

export default function WorkshopTab({ state, setState, session, call }: WorkshopTabProps) {
  return (
    <div className="workshop-tab">
      <h2>Workshop</h2>
      <p>Assemble mutants from parts.</p>
    </div>
  );
}
