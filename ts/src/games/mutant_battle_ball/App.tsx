import { useState, useCallback, useEffect, useRef } from 'react';
import { GameShell, TabManager } from '../../components';
import { Badge, MoreGamesByMe } from '../../ui/components';
import { TitleScreen } from '../../ui/components/TitleScreen';
import { useGameState } from '../../hooks';
import { navigateTo } from '../../arcade/routing';
import { STANDALONE_BUILD_GAMES } from '../../games/registry';
import type { GameRendererProps } from '../../engine/types';
import type { MBBGameState, MatchState, MutantParts, Part } from './types';
import type { BrandId, QualityTier } from '../../engine/shared/partSlots';
import { createMbbSimulation } from './simulation/mbbSimulation';
import type { MbbSimulation } from './simulation/mbbSimulation';
import { sfx } from '../../engine/shared/sfx';
import RosterTab     from './components/RosterTab';
import WorkshopTab   from './components/WorkshopTab';
import ShopTab       from './components/ShopTab';
import { TABS } from './tabs';
import MatchCanvas   from './components/MatchCanvas';
import { loadMbbSave, writeMbbSave, clearMbbSave } from './persist';
import './styles.css';

function buildFreshState(session: unknown): MBBGameState {
  const data = (session as { files: { data: Record<string, unknown> } }).files.data;
  const starters = data['starter_mutants'] as Array<Record<string, unknown>>;
  const startingIron = data['starting_iron'] as number ?? 120;
  const startingParts = data['starting_parts'] as string[] ?? [];
  const partsData = data['parts'] as Array<Record<string, unknown>>;

  const partsMap: Record<string, unknown> = {};
  for (const p of (partsData ?? [])) {
    partsMap[p['id'] as string] = {
      ...p,
      brand: p['brand'] as BrandId | undefined,
      qualityTier: p['qualityTier'] as QualityTier | undefined,
      cyberOrganicLean: p['cyberOrganicLean'] as number | undefined,
    };
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

// Resume the saved game when there is one; otherwise start fresh from the data file.
function buildInitialState(session: unknown): MBBGameState {
  return loadMbbSave() ?? buildFreshState(session);
}

export default function App({ session }: GameRendererProps) {
  const { state, setState, isInitialized } = useGameState(session, buildInitialState);
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [showTitle, setShowTitle] = useState(true);
  const [hasSave] = useState<boolean>(() => loadMbbSave() !== null);
  const [activeTab, setActiveTab] = useState('roster');

  const [inMatch, setInMatch] = useState(false);
  const currentOpponentMutantsRef = useRef<Array<Record<string, unknown>>>([]);

  // Progress is saved after every change once the player is past the title screen.
  useEffect(() => {
    if (state && !showTitle) writeMbbSave(state);
  }, [state, showTitle]);

  // Shared SFX: muted until the first user gesture (autoplay-safe).
  useEffect(() => { sfx.autoUnlock(); }, []);

  // TS-native simulation — replaces the fengari Lua executor call path
  // for init_match/tick_match/resume_match/call_timeout. The Lua source
  // files remain in games/mutant_battle_ball/*.lua as reference, per
  // studio precedent (CorpWorld, KingMaker Squads, Shoal).
  const simRef = useRef<MbbSimulation>(createMbbSimulation());

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
    currentOpponentMutantsRef.current = opponentMutants;

    // Resolve opponent parts from string IDs to real Part objects.
    // The raw YAML has parts as { head: 'head_basic', ... } (string IDs),
    // but makeAgent → calculateStats → getEffectivePartStats expects Part
    // objects with numeric stat fields. Passing strings produces NaN
    // stats → NaN speed → NaN positions → agents stuck at CSS fallback
    // (top-left corner). This was the root cause of the corner-stuck bug.
    const partsData = data['parts'] as Array<Record<string, unknown>> ?? [];
    const partsMap: Record<string, unknown> = {};
    for (const p of partsData) {
      partsMap[p['id'] as string] = p;
    }
    const resolvedOpponentMutants = opponentMutants.map(m => {
      const rawParts = m['parts'] as Record<string, string> | undefined;
      if (!rawParts) return m;
      return {
        ...m,
        parts: {
          head:      rawParts['head']      ? partsMap[rawParts['head']]      ?? null : null,
          chest:     rawParts['chest']     ? partsMap[rawParts['chest']]     ?? null : null,
          left_arm:  rawParts['left_arm']  ? partsMap[rawParts['left_arm']]  ?? null : null,
          right_arm: rawParts['right_arm'] ? partsMap[rawParts['right_arm']] ?? null : null,
          left_leg:  rawParts['left_leg']  ? partsMap[rawParts['left_leg']]  ?? null : null,
          right_leg: rawParts['right_leg'] ? partsMap[rawParts['right_leg']] ?? null : null,
        },
      };
    });

    simRef.current.initMatch(
      squadMutants as unknown as Parameters<MbbSimulation['initMatch']>[0],
      resolvedOpponentMutants as unknown as Parameters<MbbSimulation['initMatch']>[1],
      data as unknown as Parameters<MbbSimulation['initMatch']>[2],
    );
    setInMatch(true);
    setActiveTab('match');
    sfx.play('cheer');
  }, [state, session]);

  const handleMatchEnd = useCallback((finalState: MatchState) => {
    if (!state) return;
    const data = session.files.data as Record<string, unknown>;
    const opponents = data['opponents'] as Array<Record<string, unknown>>;
    const won = finalState.scorePlayer > finalState.scoreOpponent;
    sfx.play(won ? 'win' : 'lose');
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
  }, [state, setState]);

  // Adapter: useGameState returns Dispatch<SetStateAction<MBBGameState | null>>,
  // but child tabs expect (fn: (prev: MBBGameState) => MBBGameState) => void.
  // This wrapper narrows the null away (state is guaranteed non-null when
  // tabs are rendered, but the hook itself must be called unconditionally).
  const setGameState = useCallback((fn: (prev: MBBGameState) => MBBGameState) => {
    setState(prev => (prev ? fn(prev) : prev));
  }, [setState]);

  if (showTitle) {
    return (
      <GameShell
        gameLabel="MUTANT BATTLE BALL"
        gameId="mutant_battle_ball"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        footer={
          <MoreGamesByMe
            mode={mode}
            currentGameId="mutant_battle_ball"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        }
      >
        <TitleScreen
          title="Mutant Battle Ball"
          tagline="Assemble. Squad up. Reach the end zone."
          pitch="Assemble mutants from parts. Field a 2v2 squad. Reach the end zone. Salvage the fallen."
          menuItems={[
            ...(hasSave ? [{ id: 'continue', label: 'Continue', variant: 'primary' as const, onClick: () => setShowTitle(false) }] : []),
            {
              id: 'new-game',
              label: hasSave ? 'New Game (replaces saved game)' : 'New Game',
              variant: hasSave ? 'secondary' as const : 'primary' as const,
              onClick: () => { clearMbbSave(); setState(buildFreshState(session)); setShowTitle(false); },
            },
          ]}
        />
      </GameShell>
    );
  }

  if (!isInitialized || !state) return (
    <GameShell
      gameLabel="MUTANT BATTLE BALL"
      gameId="mutant_battle_ball"
      mode={mode}
      arcadeBaseUrl={arcadeBaseUrl}
      footer={
        <MoreGamesByMe
          mode={mode}
          currentGameId="mutant_battle_ball"
          games={STANDALONE_BUILD_GAMES}
          onSelectGame={navigateTo}
          arcadeBaseUrl={arcadeBaseUrl}
        />
      }
    >
      <div className="mbb-loading">Loading Mutant Battle Ball…</div>
    </GameShell>
  );

  const opponent = (() => {
    const data = session.files.data as Record<string, unknown>;
    const opponents = data['opponents'] as Array<Record<string, unknown>>;
    return opponents?.[state.currentOpponentIdx] ?? opponents?.[0];
  })();

  // No-op stub for tabs that still accept a `call` prop but never invoke it
  // (RosterTab, WorkshopTab, ShopTab). MatchCanvas receives the simulation
  // directly instead.
  const noopCall = (_fn: string, ..._args: unknown[]): unknown => undefined;

  return (
    <GameShell
      gameLabel="MUTANT BATTLE BALL"
      gameId="mutant_battle_ball"
      statusArea={
        <div className="mbb-header">
          <Badge label={`⚙ ${state.iron} IRON`} variant="accent" />
        </div>
      }
      footer={
        <MoreGamesByMe
          mode={mode}
          currentGameId="mutant_battle_ball"
          games={STANDALONE_BUILD_GAMES}
          onSelectGame={navigateTo}
          arcadeBaseUrl={arcadeBaseUrl}
        />
      }
    >
      <TabManager tabs={[...TABS]} active={activeTab} onChange={(id) => { setActiveTab(id); sfx.play('click'); }}>
        {activeTab === 'roster' && (
          <RosterTab state={state} setState={setGameState}
                     session={session} call={noopCall}
                     opponent={opponent}
                     onStartMatch={handleStartMatch} />
        )}
        {activeTab === 'workshop' && (
          <WorkshopTab state={state} setState={setGameState}
                       session={session} />
        )}
        {activeTab === 'match' && (
          <MatchCanvas
            session={session}
            sim={simRef.current}
            isActive={inMatch}
            onMatchEnd={handleMatchEnd}
            playerRoster={state.roster}
            opponentMutants={currentOpponentMutantsRef.current}
          />
        )}
        {activeTab === 'shop' && (
          <ShopTab state={state} setState={setGameState}
                   session={session} />
        )}
      </TabManager>
    </GameShell>
  );
}
