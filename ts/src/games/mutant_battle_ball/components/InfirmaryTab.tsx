import React from 'react';
import type { MBBGameState } from '../types';

interface InfirmaryTabProps {
  state: MBBGameState;
  setState: (fn: (prev: MBBGameState) => MBBGameState) => void;
}

export default function InfirmaryTab({ state, setState }: InfirmaryTabProps) {
  return (
    <div className="infirmary-tab">
      <h2>Infirmary</h2>
      <p>Manage injured mutants.</p>
    </div>
  );
}
