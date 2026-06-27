import React from 'react';
import type { MBBGameState } from '../types';

interface ShopTabProps {
  state: MBBGameState;
  setState: (fn: (prev: MBBGameState) => MBBGameState) => void;
  session: unknown;
  call: (fn: string, ...args: unknown[]) => unknown;
}

export default function ShopTab({ state, setState, session, call }: ShopTabProps) {
  return (
    <div className="shop-tab">
      <h2>Shop</h2>
      <p>Buy parts with Iron.</p>
    </div>
  );
}
