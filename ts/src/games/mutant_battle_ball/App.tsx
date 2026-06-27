import React, { useState, useCallback } from 'react';
import { GameShell, TabManager } from '../../components';
import { useLuaCall, useGameState } from '../../hooks';
import type { GameRendererProps } from '../../engine/types';
import type { MBBGameState, MatchState, MutantParts, Part } from './types';
import RosterTab     from './components/RosterTab';
import WorkshopTab   from './components/WorkshopTab';
import ShopTab       from './components/ShopTab';
import InfirmaryTab  from './components/InfirmaryTab';
import MatchCanvas   from './components/MatchCanvas';
import './styles.css';

const TABS = [
  { id: 'roster',    label: 'Roster',    shortcut: '1' },
  { id: 'workshop',  label: 'Workshop',  shortcut: '2' },
  { id: 'match',     label: 'Match',     shortcut: '3' },
  { id: 'shop',      label: 'Shop',      shortcut: '4' },
  { id: 'infirmary', label: 'Infirmary', shortcut: '5' },
];

function buildInitialState(session: unknown): MBBGameState {
  const data = (session as { files: { data: Record<string, unknown> } }).files.data;
  const starters = data['starter_mutants'] as Array<Record<string, unknown>>;
  const startingIron = data['starting_iron'] as number ?? 120;
  const startingParts = data['starting_parts'] as string[] ?? [];
  const partsData = data['parts'] as Array<Record<string, unknown>>;

  const partsMap: Record<string, unknown> = {};
  for (const p of (partsData ?? [])) {
    partsMap[p['id'] as string] = p;
  }

  const roster = (starters ?? []).map(m => {
    const rawParts = m['parts'] as Record<string, string>;
    const parts: MutantParts = {
      head: (rawParts['head'] ? partsMap[rawParts['head']] : null) as Part | null,
      chest: (rawParts['chest'] ? partsMap[rawParts['chest']] : null) as Part | null,
      left_arm: (rawParts['left_arm'] ? partsMap[rawParts['left_arm']] : null) as Part | null,
      right_arm: (rawParts['right_arm'] ? partsMap[rawParts['right_arm']] : null) as Part | null,
      left_leg: (rawParts['left_leg'] ? partsMap[rawParts['left_leg']] : null) as Part | null,
      right_leg: (rawParts['right_leg'] ? partsMap[rawParts['right_leg']] : null) as Part | null,
    };
    return {
      id: m['id'] as string,
      name: m['name'] as string,
      color: m['color'] as string ?? '#3b82f6',
      parts: parts,
      status: 'healthy' as const,
      matchesPlayed: 0,
    };
  });

  return {
    iron: startingIron,
    roster,
    partsInventory: startingParts,
    activeSquad: [roster[0]?.id ?? '', roster[1]?.id ?? ''],
    bench: [],
    matchHistory: [],
    currentOpponentIdx: 0,
  };
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const { call, error } = useLuaCall(session);
  const [activeTab, setActiveTab] = useState('roster');

  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [inMatch, setInMatch] = useState(false);

  const handleStartMatch = useCallback(() => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const opponents = data['opponents'] as Array<Record<string, unknown>>;
    const opponent = opponents?.[state.currentOpponentIdx] ?? opponents?.[0];
    if (!opponent) return;

    const squadMutants = state.activeSquad
      .map(id => state.roster.find(m => m.id === id))
      .filter(Boolean);
    if (squadMutants.length < 2) return;

    const opponentMutants = (opponent['mutants'] as Array<Record<string, unknown>>) ?? [];
    call('init_match', squadMutants, opponentMutants, data);
    setInMatch(true);
    setActiveTab('match');
  }, [state, session, call]);

  const handleMatchEnd = useCallback((finalState: MatchState) => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const opponents = data['opponents'] as Array<Record<string, unknown>>;
    const opponent = opponents?.[state.currentOpponentIdx];
    const won = finalState.scorePlayer > finalState.scoreOpponent;
    const scoring = data['scoring'] as Record<string, number> ?? {};
    const ironEarned = (won ? (scoring['iron_per_win'] ?? 60) : (scoring['iron_per_loss'] ?? 25))
      + finalState.scorePlayer * (scoring['iron_per_score'] ?? 10);

    setState(prev => {
      if (!prev) return prev;
      const nextOpponentIdx = (prev.currentOpponentIdx + 1) % (opponents?.length ?? 1);
      return {
        ...prev,
        iron: prev.iron + ironEarned,
        currentOpponentIdx: nextOpponentIdx,
        matchHistory: [{
          result: won ? 'win' : 'loss',
          scorePlayer: finalState.scorePlayer,
          scoreOpponent: finalState.scoreOpponent,
          ironEarned,
        }, ...prev.matchHistory],
      };
    });
    setInMatch(false);
    setMatchState(null);
  }, [state, setState]);

  if (!isInitialized || !state) return (
    <div className="mbb-loading">Loading Mutant Battle Ball…</div>
  );

  const opponent = (() => {
    const data = session.files.data as Record<string, unknown>;
    const opponents = data['opponents'] as Array<Record<string, unknown>>;
    return opponents?.[state.currentOpponentIdx] ?? opponents?.[0];
  })();

  return (
    <GameShell
      header={
        <div className="mbb-header">
          <span className="mbb-title">MUTANT BATTLE BALL</span>
          <span className="mbb-iron">⚙ {state.iron} IRON</span>
          {error && <span className="mbb-error">{error}</span>}
        </div>
      }
    >
      <TabManager tabs={TABS} active={activeTab} onChange={setActiveTab}>
        {activeTab === 'roster' && (
          <RosterTab state={state} setState={setState}
                     session={session} call={call}
                     opponent={opponent}
                     onStartMatch={handleStartMatch} />
        )}
        {activeTab === 'workshop' && (
          <WorkshopTab state={state} setState={setState}
                       session={session} call={call} />
        )}
        {activeTab === 'match' && (
          <MatchCanvas
            session={session}
            call={call}
            isActive={inMatch}
            state={state}
            setState={setState}
            onMatchEnd={handleMatchEnd}
          />
        )}
        {activeTab === 'shop' && (
          <ShopTab state={state} setState={setState}
                   session={session} call={call} />
        )}
        {activeTab === 'infirmary' && (
          <InfirmaryTab state={state} setState={setState} />
        )}
      </TabManager>
    </GameShell>
  );
}
