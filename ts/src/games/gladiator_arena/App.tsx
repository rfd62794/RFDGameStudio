/**
 * Gladiator Arena — Main Application Component
 * Manager-driven turn-based tactical gladiator combat simulation.
 *
 * Adapted for the RFDGameStudio arcade: accepts GameRendererProps (session)
 * per the studio contract. The game is TS-native and self-contained — the
 * session is destructured per contract but not used.
 */

import React, { useState } from 'react';
import type { GameRendererProps } from '../../engine/types';
import { GameShell } from '../../components';
import { GameProvider, useGame, STORAGE_KEY } from './context/GameContext';
import { RosterView } from './components/RosterView';
import { ShopView } from './components/ShopView';
import { MedbayView } from './components/MedbayView';
import { LadderView } from './components/LadderView';
import { ArenaCombatView } from './components/ArenaCombatView';
import { BalanceReportView } from './components/BalanceReportView';
import { ManagerPrimer } from './components/ManagerPrimer';
import { NewGameButton } from './components/NewGameButton';
import { ARENA_TIERS } from './simulation/championLadder';
import { sound } from './utils/soundEffects';
import { useArmedConfirm } from './utils/useArmedConfirm';
import { TitleScreen } from '../../ui/components/TitleScreen';
import { useOnboardingGate } from '../../ui/components/OnboardingGate';
import { MoreGamesByMe } from '../../ui/components';
import { STANDALONE_BUILD_GAMES } from '../registry';
import { navigateTo } from '../../arcade/routing';
import { loadSave } from '../../engine/shared/persistence';
import {
  ShoppingBag,
  HeartPulse,
  Trophy,
  Coins,
  Users,
  Volume2,
  VolumeX,
  RotateCcw,
  Swords,
  Activity,
  ScrollText
} from 'lucide-react';

type ArenaTab = 'roster' | 'forge' | 'medbay' | 'ladder' | 'balance';

const GladiatorArenaApp: React.FC = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
  const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
  const [currentTab, setCurrentTab] = useState<ArenaTab>('roster');
  const { activeBout, gold, roster, currentTierId, wins, losses, resetGame } = useGame();
  const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Title menu: shown at launch to orient the manager (stable, funds,
  // record) before the first match. First-run primer is gated to a
  // genuinely new stable via the shared OnboardingGate (boolean mode).
  const [hasSave] = useState<boolean>(() => loadSave<Record<string, unknown>>(STORAGE_KEY) !== null);
  const [showTitleScreen, setShowTitleScreen] = useState<boolean>(true);
  const { shouldShow: showPrimer, handleComplete: completePrimer, trigger: triggerPrimer } =
    useOnboardingGate({ mode: 'boolean', initialShow: false });
  const titleNewGame = useArmedConfirm(() => {
    resetGame();
    setShowTitleScreen(false);
    triggerPrimer();
  });

  const currentTier = ARENA_TIERS.find(t => t.id === currentTierId) || ARENA_TIERS[0];

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setEnabled(!next);
  };

  const handleEnterArena = () => {
    setShowTitleScreen(false);
    if (!hasSave) triggerPrimer();
  };

  const handleShowPrimer = () => {
    setShowTitleScreen(false);
    triggerPrimer();
  };

  const tabCls = (tab: ArenaTab, activeCls: string, idleCls: string) =>
    `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
      currentTab === tab ? activeCls : idleCls
    }`;

  if (showTitleScreen) {
    return (
      <GameShell
        gameLabel="Gladiator Arena"
        gameId="gladiator_arena"
        phase="v1.0"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        className="bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950"
        footer={
          <MoreGamesByMe
            mode={mode}
            currentGameId="gladiator_arena"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        }
      >
        <TitleScreen
          title="Gladiator Arena"
          tagline="Manager-driven arena combat"
          pitch="Recruit Frames, bolt anatomy on in The Forge, and field them on the champion ladder. Bouts are turn-based and auto-resolved — you never swing the sword, you decide what it's attached to."
          quote="You don't swing the sword. You decide what it's attached to."
          menuItems={[
            {
              id: 'ga-enter-arena',
              label: hasSave ? 'Return to the Stable' : 'Enter the Arena',
              icon: <Swords className="w-4 h-4" />,
              variant: 'primary',
              onClick: handleEnterArena,
            },
            {
              id: 'ga-primer',
              label: "Manager's Primer",
              icon: <ScrollText className="w-4 h-4" />,
              variant: 'secondary',
              onClick: handleShowPrimer,
            },
            ...(hasSave
              ? [
                  {
                    id: 'ga-new-game',
                    label: titleNewGame.armed ? 'Confirm: wipe stable?' : 'New Game',
                    icon: <RotateCcw className="w-4 h-4" />,
                    variant: 'secondary' as const,
                    onClick: titleNewGame.trigger,
                  },
                ]
              : []),
          ]}
        >
          <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-xs text-stone-300">
            <span className="px-2.5 py-1 rounded-lg bg-stone-950/80 border border-stone-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              {roster.length} Frame{roster.length === 1 ? '' : 's'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-950/80 border border-stone-800 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              {gold}g
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-950/80 border border-stone-800 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              {currentTier.name} • {wins}W-{losses}L
            </span>
          </div>
        </TitleScreen>
      </GameShell>
    );
  }

  if (showPrimer) {
    return (
      <GameShell
        gameLabel="Gladiator Arena"
        gameId="gladiator_arena"
        phase="v1.0"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        className="bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950"
        footer={
          <MoreGamesByMe
            mode={mode}
            currentGameId="gladiator_arena"
            games={STANDALONE_BUILD_GAMES}
            onSelectGame={navigateTo}
            arcadeBaseUrl={arcadeBaseUrl}
          />
        }
      >
        <ManagerPrimer onComplete={completePrimer} />
      </GameShell>
    );
  }

  return (
    <>
      <GameShell
        gameLabel="Gladiator Arena"
        gameId="gladiator_arena"
        phase="v1.0"
        mode={mode}
        arcadeBaseUrl={arcadeBaseUrl}
        className="bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950"
        mainClassName="game-shell-main--scrollable"
        headerExtra={
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <nav className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800 text-sm font-medium overflow-x-auto min-w-0 max-w-full">
              <button
                id="tab-roster-btn"
                onClick={() => setCurrentTab('roster')}
                aria-label={`Frames (${roster.length})`}
                title={`Frames (${roster.length})`}
                className={tabCls('roster', 'bg-amber-600 text-stone-950 font-semibold shadow', 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60')}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Frames ({roster.length})</span>
                <span className="sm:hidden -ml-1 px-1 rounded bg-stone-800 text-[10px] font-bold leading-tight">{roster.length}</span>
              </button>

              <button
                id="tab-forge-btn"
                onClick={() => setCurrentTab('forge')}
                aria-label="The Forge"
                title="The Forge"
                className={tabCls('forge', 'bg-amber-600 text-stone-950 font-semibold shadow', 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60')}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">The Forge</span>
              </button>

              <button
                id="tab-medbay-btn"
                onClick={() => setCurrentTab('medbay')}
                aria-label="Medbay Clinic"
                title="Medbay Clinic"
                className={tabCls('medbay', 'bg-amber-600 text-stone-950 font-semibold shadow', 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60')}
              >
                <HeartPulse className="w-4 h-4" />
                <span className="hidden sm:inline">Medbay Clinic</span>
              </button>

              <button
                id="tab-ladder-btn"
                onClick={() => setCurrentTab('ladder')}
                aria-label="Arena Bouts"
                title="Arena Bouts"
                className={tabCls('ladder', 'bg-red-600 text-white font-semibold shadow shadow-red-950/50 animate-pulse', 'text-stone-400 hover:text-red-300 hover:bg-red-950/20')}
              >
                <Swords className="w-4 h-4" />
                <span className="hidden sm:inline">Arena Bouts</span>
              </button>

              <button
                id="tab-balance-btn"
                onClick={() => setCurrentTab('balance')}
                aria-label="Balance Lab"
                title="Balance Lab"
                className={tabCls('balance', 'bg-emerald-600 text-stone-950 font-bold shadow', 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-950/30')}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Balance Lab</span>
              </button>

              <span className="text-xs text-amber-400/90 flex items-center gap-1 font-medium whitespace-nowrap px-2">
                <Trophy className="w-3 h-3 text-amber-400" />
                {currentTier.name} • {wins}W - {losses}L
              </span>
            </nav>

            {/* Quick Gold Counter on Mobile */}
            <div className="md:hidden flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/40 border border-amber-600/30 text-amber-300 font-mono font-bold text-sm shrink-0">
              <Coins className="w-4 h-4 text-amber-400" />
              {gold}g
              <NewGameButton onConfirm={resetGame} />
            </div>
          </div>
        }
        statusArea={
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 font-mono font-bold text-sm shadow-inner">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{gold} Gold</span>
            </div>

            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="reset-game-btn"
              onClick={() => {
                if (showResetConfirm) {
                  resetGame();
                  setShowResetConfirm(false);
                } else {
                  setShowResetConfirm(true);
                  setTimeout(() => setShowResetConfirm(false), 3000);
                }
              }}
              title="Reset Game State"
              className={`p-2 rounded-lg transition text-xs flex items-center gap-1 ${
                showResetConfirm
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {showResetConfirm && <span>Confirm?</span>}
            </button>

            <NewGameButton onConfirm={resetGame} />
          </div>
        }
        footer={
          <div className="border-t border-stone-900 bg-stone-950 py-4 px-4 text-center text-xs text-stone-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Gladiator Arena Simulation Engine • Studio Anatomy & Forge Architecture</span>
              <span className="font-mono text-stone-600">
                "You don't swing the sword. You decide what it's attached to."
              </span>
            </div>
            <div className="max-w-7xl mx-auto mt-3">
              <MoreGamesByMe
                mode={mode}
                currentGameId="gladiator_arena"
                games={STANDALONE_BUILD_GAMES}
                onSelectGame={navigateTo}
                arcadeBaseUrl={arcadeBaseUrl}
              />
            </div>
          </div>
        }
      >
        {/* Active Tab View Content */}
        <main className="flex-1 pb-16">
          {currentTab === 'roster' && <RosterView />}
          {currentTab === 'forge' && <ShopView />}
          {currentTab === 'medbay' && <MedbayView />}
          {currentTab === 'ladder' && <LadderView />}
          {currentTab === 'balance' && (
            <div className="max-w-7xl mx-auto px-4 py-6">
              <BalanceReportView />
            </div>
          )}
        </main>
      </GameShell>

      {/* Live Fullscreen Arena Battle Modal */}
      {activeBout && <ArenaCombatView />}
    </>
  );
};

export default function App({ session }: GameRendererProps) {
  void session; // destructured per contract; game is self-contained
  return (
    <GameProvider>
      <GladiatorArenaApp />
    </GameProvider>
  );
}
